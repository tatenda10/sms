const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const AccountBalanceService = require('../../services/accountBalanceService');

class ExpenseController {
  // Get all expenses with pagination, search, and date range filter
  async getAllExpenses(req, res) {
    try {
      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 20;
      const offset = (page - 1) * pageSize;
      // Search and filters
      const search = req.query.search ? `%${req.query.search}%` : null;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      let where = 'WHERE 1=1';
      const params = [];
      if (search) {
        where += ' AND (e.description LIKE ? OR s.name LIKE ? OR c.code LIKE ? OR e.payment_method LIKE ? OR e.payment_status LIKE ?)';
        params.push(search, search, search, search, search);
      }
      if (startDate) {
        where += ' AND e.expense_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        where += ' AND e.expense_date <= ?';
        params.push(endDate);
      }
      // Get total count
      const [[{ count }]] = await pool.execute(
        `SELECT COUNT(*) as count
         FROM expenses e
         LEFT JOIN suppliers s ON e.supplier_id = s.id
         LEFT JOIN currencies c ON e.currency_id = c.id
         ${where}`,
        params
      );
      // Get paginated results
      const limit = Number(pageSize);
      const off = Number(offset);
      console.log('Expenses pagination params:', [...params, limit, off]);
      const [expenses] = await pool.query(
        `SELECT e.*, s.name AS supplier_name, c.code AS currency_code, je.description AS journal_description
         FROM expenses e
         LEFT JOIN suppliers s ON e.supplier_id = s.id
         LEFT JOIN currencies c ON e.currency_id = c.id
         LEFT JOIN journal_entries je ON e.journal_entry_id = je.id
         ${where}
         ORDER BY e.expense_date DESC, e.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, off]
      );
      const formatted = expenses.map(e => ({
        ...e,
        expense_date: e.expense_date
      }));
      res.json({ success: true, data: formatted, total: count, page, pageSize });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
    }
  }

  // Get expense by ID
  async getExpenseById(req, res) {
    try {
      const { id } = req.params;
      const [expenses] = await pool.execute(
        `SELECT e.*, s.name AS supplier_name, c.code AS currency_code, je.description AS journal_description
         FROM expenses e
         LEFT JOIN suppliers s ON e.supplier_id = s.id
         LEFT JOIN currencies c ON e.currency_id = c.id
         LEFT JOIN journal_entries je ON e.journal_entry_id = je.id
         WHERE e.id = ?`,
        [id]
      );
      if (expenses.length === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      const e = expenses[0];
      res.json({ success: true, data: {
        ...e,
        expense_date: e.expense_date
      }});
    } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch expense' });
    }
  }

  // Create new expense (and journal entry/lines)
  async createExpense(req, res) {
    const conn = await pool.getConnection();
    try {
      const { supplier_id, amount, currency_id, expense_date, description, payment_method, payment_status, expense_account_id, amount_paid } = req.body;
      if (!amount || !currency_id || !expense_date || !payment_method || !payment_status || !expense_account_id) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
      }
      
      // Validate partial payment
      if (payment_status === 'partial') {
        if (!amount_paid || parseFloat(amount_paid) <= 0) {
          return res.status(400).json({ success: false, message: 'Amount paid is required for partial payment' });
        }
        if (parseFloat(amount_paid) >= parseFloat(amount)) {
          return res.status(400).json({ success: false, message: 'Amount paid must be less than total amount for partial payment' });
        }
      }
      
      await conn.beginTransaction();
      
      // 1. Insert into expenses (journal_entry_id will be updated after journal entry is created)
      const [expenseResult] = await conn.execute(
        `INSERT INTO expenses (supplier_id, amount, currency_id, expense_date, description, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [supplier_id || null, amount, currency_id, expense_date, description || null, payment_method, payment_status]
      );
      const expenseId = expenseResult.insertId;
      
      // 2. Create journal entry
      const journalDesc = description || 'Expense';
      let journalName;
      if (payment_method === 'cash') journalName = 'Cash Payments Journal';
      else if (payment_method === 'bank') journalName = 'Bank Payments Journal';
      else journalName = 'General Journal';
      
      // Get or create journal
      let journal_id = null;
      const [[journalRow]] = await conn.execute(`SELECT id FROM journals WHERE name = ? LIMIT 1`, [journalName]);
      if (journalRow && journalRow.id) {
        journal_id = journalRow.id;
      } else {
        // Try to find any existing journal
        const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
        if (anyJournal.length > 0) {
          journal_id = anyJournal[0].id;
        } else {
          // Create the journal if none exist
          const [journalResult] = await conn.execute(
            'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
            [journalName, `Journal for ${journalName.toLowerCase()}`, 1]
          );
          journal_id = journalResult.insertId;
        }
      }
      
      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries (journal_id, entry_date, reference, description) VALUES (?, ?, ?, ?)`,
        [journal_id, expense_date, 'expenses', journalDesc]
      );
      const journalEntryId = journalResult.insertId;
      
      // 3. Update expense with journal_entry_id
      await conn.execute(
        `UPDATE expenses SET journal_entry_id = ? WHERE id = ?`,
        [journalEntryId, expenseId]
      );
      
      // 4. Create transaction record
      const [transactionResult] = await conn.execute(
        `INSERT INTO transactions (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['expense', amount, currency_id, expense_date, payment_method, description || 'Expense', journalEntryId]
      );
      const transactionId = transactionResult.insertId;
      
      // 5. Create journal entry lines (double-entry)
      let creditAccountCode;
      if (payment_method === 'cash') creditAccountCode = 1000;  // Cash on Hand
      else if (payment_method === 'bank') creditAccountCode = 1010;  // Bank Account
      else if (payment_method === 'credit') creditAccountCode = 2000;  // Accounts Payable
      else creditAccountCode = 1000;  // Default to Cash on Hand
      if (payment_status === 'debt') creditAccountCode = 2100;  // Accrued Expenses
      
      // Use the selected expense account from the frontend
      const [[expenseAccount]] = await conn.execute(`SELECT id FROM chart_of_accounts WHERE id = ? LIMIT 1`, [expense_account_id]);
      const [[creditAccount]] = await conn.execute(`SELECT id FROM chart_of_accounts WHERE code = ? LIMIT 1`, [creditAccountCode.toString()]);
      if (!expenseAccount || !creditAccount) throw new Error('Account not found');
      
      if (payment_status === 'partial') {
        // For partial payment, create two sets of journal entry lines
        const paidAmount = parseFloat(amount_paid);
        const remainingAmount = parseFloat(amount) - paidAmount;
        
        // First entry: Amount paid (debit expense, credit cash/bank)
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, ?, 0, ?)`,
          [journalEntryId, expenseAccount.id, paidAmount, currency_id]
        );
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, 0, ?, ?)`,
          [journalEntryId, creditAccount.id, paidAmount, currency_id]
        );
        
        // Second entry: Remaining amount (debit expense, credit accounts payable)
        const [[payableAccount]] = await conn.execute(`SELECT id FROM chart_of_accounts WHERE code = '2000' LIMIT 1`);
        if (!payableAccount) throw new Error('Accounts Payable account not found');
        
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, ?, 0, ?)`,
          [journalEntryId, expenseAccount.id, remainingAmount, currency_id]
        );
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, 0, ?, ?)`,
          [journalEntryId, payableAccount.id, remainingAmount, currency_id]
        );
        
        // Create accounts payable balance for the remaining amount
        const [balanceResult] = await conn.execute(
          `INSERT INTO accounts_payable_balances (supplier_id, currency_id, original_expense_id, original_amount, paid_amount, outstanding_balance) VALUES (?, ?, ?, ?, ?, ?)`,
          [supplier_id || null, currency_id, expenseId, amount, paidAmount, remainingAmount]
        );
        
        // Log audit event for accounts payable balance creation
        await AuditLogger.log({
          action: 'ACCOUNTS_PAYABLE_BALANCE_CREATED',
          table: 'accounts_payable_balances',
          record_id: balanceResult.insertId,
          user_id: req.user.id,
          details: {
            expense_id: expenseId,
            supplier_id: supplier_id || null,
            total_amount: amount,
            amount_paid: paidAmount,
            remaining_amount: remainingAmount,
            currency_id: currency_id,
            payment_method: payment_method,
            payment_status: payment_status
          },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      } else {
        // For full payment or credit purchase, create single journal entry
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, ?, 0, ?)`,
          [journalEntryId, expenseAccount.id, amount, currency_id]
        );
        await conn.execute(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, 0, ?, ?)`,
          [journalEntryId, creditAccount.id, amount, currency_id]
        );
        
        // If this is a credit purchase, create accounts payable balance record
        if (payment_method === 'credit' || payment_status === 'debt') {
          const [balanceResult] = await conn.execute(
            `INSERT INTO accounts_payable_balances (supplier_id, currency_id, original_expense_id, original_amount, outstanding_balance) VALUES (?, ?, ?, ?, ?)`,
            [supplier_id || null, currency_id, expenseId, amount, amount]
          );
          
          // Log audit event for accounts payable balance creation
          await AuditLogger.log({
            action: 'ACCOUNTS_PAYABLE_BALANCE_CREATED',
            table: 'accounts_payable_balances',
            record_id: balanceResult.insertId,
            user_id: req.user.id,
            details: {
              expense_id: expenseId,
              supplier_id: supplier_id || null,
              amount: amount,
              currency_id: currency_id,
              payment_method: payment_method,
              payment_status: payment_status
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });
        }
      }
      
      // 6. Update account balances
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
      
      await conn.commit();
      res.status(201).json({ success: true, data: { id: expenseId, transaction_id: transactionId } });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating expense:', error);
      res.status(500).json({ success: false, message: 'Failed to create expense' });
    } finally {
      conn.release();
    }
  }

  // Update expense (and update journal entry/lines)
  async updateExpense(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { supplier_id, amount, currency_id, expense_date, description, payment_method, payment_status, expense_account_id } = req.body;
      if (!expense_account_id) {
        return res.status(400).json({ success: false, message: 'Expense account is required' });
      }
      await conn.beginTransaction();
      // 1. Update the expense
      const [result] = await conn.execute(
        `UPDATE expenses SET supplier_id = ?, amount = ?, currency_id = ?, expense_date = ?, description = ?, payment_method = ?, payment_status = ? WHERE id = ?`,
        [supplier_id || null, amount, currency_id, expense_date, description || null, payment_method, payment_status, id]
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      // 2. Get the journal_entry_id for this expense
      const [[expense]] = await conn.execute(
        'SELECT journal_entry_id FROM expenses WHERE id = ?',
        [id]
      );
      const journalEntryId = expense ? expense.journal_entry_id : null;
      if (journalEntryId) {
        // 3. Update the journal entry
        await conn.execute(
          'UPDATE journal_entries SET entry_date = ?, description = ? WHERE id = ?',
          [expense_date, description || 'Expense', journalEntryId]
        );
        // 4. Update the journal entry lines (debit and credit)
        // Find the expense and payment method account IDs
        const [[expenseAccount]] = await conn.execute(
          `SELECT id FROM chart_of_accounts WHERE id = ? LIMIT 1`,
          [expense_account_id]
        );
        let creditAccountCode;
        if (payment_method === 'cash') creditAccountCode = 1000;
        else if (payment_method === 'bank') creditAccountCode = 1010;
        else if (payment_method === 'credit') creditAccountCode = 2000;
        else creditAccountCode = 1000;
        if (payment_status === 'debt') creditAccountCode = 2100;
        const [[creditAccount]] = await conn.execute(
          `SELECT id FROM chart_of_accounts WHERE code = ? LIMIT 1`,
          [creditAccountCode.toString()]
        );
        if (!expenseAccount || !creditAccount) {
          await conn.rollback();
          return res.status(400).json({ success: false, message: 'Account not found' });
        }
        // Update debit line
        await conn.execute(
          `UPDATE journal_entry_lines SET account_id = ?, debit = ?, credit = 0, currency_id = ? WHERE journal_entry_id = ? AND debit > 0`,
          [expenseAccount.id, amount, currency_id, journalEntryId]
        );
        // Update credit line
        await conn.execute(
          `UPDATE journal_entry_lines SET account_id = ?, debit = 0, credit = ?, currency_id = ? WHERE journal_entry_id = ? AND credit > 0`,
          [creditAccount.id, amount, currency_id, journalEntryId]
        );
        
        // 5. Recalculate account balances after updating journal entries
        await AccountBalanceService.recalculateAllAccountBalances();
      }
      await conn.commit();
      res.json({ success: true, message: 'Expense and journal updated successfully' });
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('Error updating expense:', error);
      res.status(500).json({ success: false, message: 'Failed to update expense' });
    } finally {
      if (conn) conn.release();
    }
  }

  // Delete expense (does not delete journal entry/lines)
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM expenses WHERE id = ?`,
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ success: false, message: 'Failed to delete expense' });
    } 
  }
}

module.exports = new ExpenseController();
