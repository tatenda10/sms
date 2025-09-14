const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class ExpenseAccountPayablesController {
  // Get all accounts payable balances with pagination and search
  async getAllAccountsPayable(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 20;
      const offset = (page - 1) * pageSize;
      const search = req.query.search ? `%${req.query.search}%` : null;
      const status = req.query.status; // 'outstanding', 'partial', 'paid', 'overdue'
      
      let where = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        where += ' AND (s.name LIKE ? OR e.description LIKE ? OR apb.status LIKE ?)';
        params.push(search, search, search);
      }
      
      if (status) {
        where += ' AND apb.status = ?';
        params.push(status);
      }
      
      // Get total count
      const [[{ count }]] = await pool.execute(
        `SELECT COUNT(*) as count
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         ${where}`,
        params
      );
      
      // Get paginated results
      const limit = Number(pageSize);
      const off = Number(offset);
      const [payables] = await pool.query(
        `SELECT apb.*, e.description as expense_description, e.expense_date, 
                s.name as supplier_name, c.code as currency_code,
                CASE 
                  WHEN apb.supplier_id IS NULL THEN 'Non-Supplier'
                  ELSE s.name 
                END as payable_to
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         LEFT JOIN currencies c ON apb.currency_id = c.id
         ${where}
         ORDER BY apb.due_date ASC, apb.outstanding_balance DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, off]
      );
      
      res.json({ 
        success: true, 
        data: payables, 
        total: count, 
        page, 
        pageSize 
      });
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch accounts payable' });
    }
  }

  // Get accounts payable by ID
  async getAccountsPayableById(req, res) {
    try {
      const { id } = req.params;
      const [payables] = await pool.execute(
        `SELECT apb.*, e.description as expense_description, e.expense_date, e.amount as original_expense_amount,
                s.name as supplier_name, c.code as currency_code,
                CASE 
                  WHEN apb.supplier_id IS NULL THEN 'Non-Supplier'
                  ELSE s.name 
                END as payable_to
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         LEFT JOIN currencies c ON apb.currency_id = c.id
         WHERE apb.id = ?`,
        [id]
      );
      
      if (payables.length === 0) {
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }
      
      res.json({ success: true, data: payables[0] });
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch accounts payable' });
    }
  }

  // Make a payment against accounts payable
  async makePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      const { payable_id } = req.params;
      const { amount, currency_id, payment_date, payment_method, description } = req.body;
      
      if (!amount || !currency_id || !payment_date || !payment_method) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
      }
      
      await conn.beginTransaction();
      
      // 1. Get the accounts payable record
      const [[payable]] = await conn.execute(
        `SELECT * FROM accounts_payable_balances WHERE id = ?`,
        [payable_id]
      );
      
      if (!payable) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }
      
      if (payable.outstanding_balance < amount) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Payment amount exceeds outstanding balance' });
      }
      
      // 2. Create journal entry
      const journalDesc = description || `Payment for ${payable.original_expense_id}`;
      let journalName;
      if (payment_method === 'cash') journalName = 'Cash Payments Journal';
      else if (payment_method === 'bank') journalName = 'Bank Payments Journal';
      else journalName = 'General Journal';
      
      const [[journalRow]] = await conn.execute(`SELECT id FROM journals WHERE name = ? LIMIT 1`, [journalName]);
      const journal_id = journalRow ? journalRow.id : null;
      if (!journal_id) throw new Error('No journal found for ' + journalName);
      
      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries (journal_id, entry_date, reference, description) VALUES (?, ?, ?, ?)`,
        [journal_id, payment_date, 'payments', journalDesc]
      );
      const journalEntryId = journalResult.insertId;
      
      // 3. Create transaction record
      const [transactionResult] = await conn.execute(
        `INSERT INTO transactions (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['payment', amount, currency_id, payment_date, payment_method, description || 'Payment', journalEntryId]
      );
      const transactionId = transactionResult.insertId;
      
      // 4. Create accounts payable payment record
      const [paymentResult] = await conn.execute(
        `INSERT INTO accounts_payable_payments (transaction_id, original_expense_id, supplier_id, amount_paid, payment_date, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, payable.original_expense_id, payable.supplier_id, amount, payment_date, 'completed']
      );
      
      // 5. Create journal entry lines (double-entry)
      // Debit: Accounts Payable (reduce liability)
      const [[payableAccount]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = '2000' LIMIT 1`
      );
      
      // Credit: Cash/Bank (reduce asset)
      let creditAccountCode;
      if (payment_method === 'cash') creditAccountCode = 1000;  // Cash on Hand
      else if (payment_method === 'bank') creditAccountCode = 1010;  // Bank Account
      else creditAccountCode = 1000;  // Default to Cash on Hand
      
      const [[creditAccount]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = ? LIMIT 1`,
        [creditAccountCode.toString()]
      );
      
      if (!payableAccount || !creditAccount) throw new Error('Account not found');
      
      // Debit accounts payable
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, ?, 0, ?)`,
        [journalEntryId, payableAccount.id, amount, currency_id]
      );
      
      // Credit cash/bank
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, 0, ?, ?)`,
        [journalEntryId, creditAccount.id, amount, currency_id]
      );
      
      // 6. Update accounts payable balance
      const newPaidAmount = payable.paid_amount + amount;
      const newOutstandingBalance = payable.outstanding_balance - amount;
      let newStatus = 'partial';
      if (newOutstandingBalance <= 0) newStatus = 'paid';
      
      await conn.execute(
        `UPDATE accounts_payable_balances 
         SET paid_amount = ?, outstanding_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newPaidAmount, newOutstandingBalance, newStatus, payable_id]
      );
      
      await conn.commit();
      
      // 7. Log audit event
      await AuditLogger.log({
        action: 'ACCOUNTS_PAYABLE_PAYMENT_MADE',
        table: 'accounts_payable_payments',
        record_id: paymentResult.insertId,
        user_id: req.user.id,
        details: {
          payable_id: payable_id,
          amount: amount,
          currency_id: currency_id,
          payment_method: payment_method,
          new_balance: newOutstandingBalance,
          new_status: newStatus,
          transaction_id: transactionId,
          journal_entry_id: journalEntryId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json({ 
        success: true, 
        data: { 
          payment_id: paymentResult.insertId,
          transaction_id: transactionId,
          new_balance: newOutstandingBalance,
          status: newStatus
        } 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error making payment:', error);
      res.status(500).json({ success: false, message: 'Failed to make payment' });
    } finally {
      conn.release();
    }
  }

  // Get payment history for a specific accounts payable
  async getPaymentHistory(req, res) {
    try {
      const { payable_id } = req.params;
      
      const [payments] = await pool.execute(
        `SELECT app.*, t.transaction_date, t.payment_method, t.description,
                c.code as currency_code
         FROM accounts_payable_payments app
         LEFT JOIN transactions t ON app.transaction_id = t.id
         LEFT JOIN currencies c ON t.currency_id = c.id
         WHERE app.original_expense_id = (
           SELECT original_expense_id FROM accounts_payable_balances WHERE id = ?
         )
         ORDER BY app.payment_date DESC`,
        [payable_id]
      );
      
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
  }

  // Get summary statistics
  async getSummary(req, res) {
    try {
      const [summary] = await pool.execute(
        `SELECT 
           COUNT(*) as total_payables,
           SUM(outstanding_balance) as total_outstanding,
           COUNT(CASE WHEN status = 'outstanding' THEN 1 END) as outstanding_count,
           COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
           COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
           COUNT(CASE WHEN due_date < CURDATE() AND status != 'paid' THEN 1 END) as overdue_count
         FROM accounts_payable_balances`
      );
      
      res.json({ success: true, data: summary[0] });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch summary' });
    }
  }
}

module.exports = new ExpenseAccountPayablesController();
