const { pool } = require('../../config/database');

class ChartOfAccountsController {
  // Get all accounts
  async getAllAccounts(req, res) {
    try {
      const [accounts] = await pool.execute(
        `SELECT * FROM chart_of_accounts ORDER BY code`
      );
      res.json({ success: true, data: accounts });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
    }
  }

  // Get account by ID
  async getAccountById(req, res) {
    try {
      const { id } = req.params;
      const [accounts] = await pool.execute(
        `SELECT * FROM chart_of_accounts WHERE id = ?`,
        [id]
      );
      if (accounts.length === 0) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      res.json({ success: true, data: accounts[0] });
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch account' });
    }
  }

  // Create new account
  async createAccount(req, res) {
    try {
      const { code, name, type, parent_id, is_active = true } = req.body;
      if (!code || !name || !type) {
        return res.status(400).json({ success: false, message: 'Code, name, and type are required' });
      }
      const [result] = await pool.execute(
        `INSERT INTO chart_of_accounts (code, name, type, parent_id, is_active) VALUES (?, ?, ?, ?, ?)`,
        [code, name, type, parent_id || null, is_active]
      );
      res.status(201).json({ success: true, data: { id: result.insertId, code, name, type, parent_id, is_active } });
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ success: false, message: 'Failed to create account' });
    }
  }

  // Update account
  async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const { code, name, type, parent_id, is_active } = req.body;
      const [result] = await pool.execute(
        `UPDATE chart_of_accounts SET code = ?, name = ?, type = ?, parent_id = ?, is_active = ? WHERE id = ?`,
        [code, name, type, parent_id || null, is_active, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      res.json({ success: true, message: 'Account updated successfully' });
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ success: false, message: 'Failed to update account' });
    }
  }

  // Delete account
  async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM chart_of_accounts WHERE id = ?`,
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
  }

  // Create opening balance for an account (for historical data only)
  async createOpeningBalance(req, res) {
    const conn = await pool.getConnection();
    
    try {
      const {
        account_id,
        amount,
        balance_type, // 'debit' or 'credit'
        description,
        reference,
        opening_balance_date,
        currency_id = 1 // Default to USD
      } = req.body;

      // Validate required fields
      if (!account_id || !amount || !balance_type || !description) {
        return res.status(400).json({ 
          success: false, 
          message: 'Account ID, amount, balance type, and description are required' 
        });
      }

      if (!['debit', 'credit'].includes(balance_type.toLowerCase())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Balance type must be either "debit" or "credit"' 
        });
      }

      await conn.beginTransaction();

      // 1. Get the account and verify it exists
      const [accounts] = await conn.execute(
        `SELECT id, code, name, type FROM chart_of_accounts WHERE id = ?`,
        [account_id]
      );

      if (accounts.length === 0) {
        await conn.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Account not found' 
        });
      }

      const account = accounts[0];

      // 2. Get Retained Earnings account (3998)
      const [[retainedEarnings]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = '3998' LIMIT 1`
      );

      if (!retainedEarnings) {
        await conn.rollback();
        return res.status(500).json({
          success: false,
          message: 'Retained Earnings account (3998) not found in Chart of Accounts'
        });
      }

      // 3. Create journal entry for the opening balance
      const finalReference = reference || `OB-COA-${account.code}-${Date.now()}`;
      const journalDescription = `Opening Balance: ${account.name} (${account.code}) - ${description}`;
      
      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries (journal_id, entry_date, description, reference, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          1, // General Journal
          opening_balance_date || new Date(),
          journalDescription,
          finalReference,
          req.user?.id || 1
        ]
      );
      const journalEntryId = journalResult.insertId;

      // 4. Determine debit and credit based on account type and balance type
      const amountDecimal = parseFloat(amount);
      
      // For Assets and Expenses:
      // - Debit balance means positive balance (DEBIT the account, CREDIT Retained Earnings)
      // - Credit balance means negative balance (CREDIT the account, DEBIT Retained Earnings)
      
      // For Liabilities, Equity, and Revenue:
      // - Credit balance means positive balance (CREDIT the account, DEBIT Retained Earnings)
      // - Debit balance means negative balance (DEBIT the account, CREDIT Retained Earnings)

      let accountDebit = 0;
      let accountCredit = 0;
      let retainedEarningsDebit = 0;
      let retainedEarningsCredit = 0;

      if (account.type === 'Asset' || account.type === 'Expense') {
        if (balance_type.toLowerCase() === 'debit') {
          // Positive balance for Asset/Expense: DEBIT account, CREDIT Retained Earnings
          accountDebit = amountDecimal;
          retainedEarningsCredit = amountDecimal;
        } else {
          // Negative balance for Asset/Expense: CREDIT account, DEBIT Retained Earnings
          accountCredit = amountDecimal;
          retainedEarningsDebit = amountDecimal;
        }
      } else {
        // Liability, Equity, Revenue
        if (balance_type.toLowerCase() === 'credit') {
          // Positive balance for Liability/Equity/Revenue: CREDIT account, DEBIT Retained Earnings
          accountCredit = amountDecimal;
          retainedEarningsDebit = amountDecimal;
        } else {
          // Negative balance for Liability/Equity/Revenue: DEBIT account, CREDIT Retained Earnings
          accountDebit = amountDecimal;
          retainedEarningsCredit = amountDecimal;
        }
      }

      // 5. Create journal entry lines (double-entry)
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [journalEntryId, account.id, accountDebit, accountCredit, currency_id, `Opening Balance - ${account.name} (${account.code})`]
      );

      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [journalEntryId, retainedEarnings.id, retainedEarningsDebit, retainedEarningsCredit, currency_id, `Opening Balance - Retained Earnings`]
      );

      // 6. Update account balances
      const AccountBalanceService = require('../../services/accountBalanceService');
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);

      // 7. Log audit event
      const auditLogger = require('../../utils/audit');
      await auditLogger.log({
        action: 'COA_OPENING_BALANCE_CREATED',
        entity_type: 'chart_of_accounts',
        entity_id: account_id,
        description: `Opening balance created for ${account.code} - ${account.name}: ${amount} (${balance_type})`,
        user_id: req.user?.id || 1,
        metadata: {
          journal_entry_id: journalEntryId,
          amount: amountDecimal,
          balance_type: balance_type,
          currency_id: currency_id,
          reference: finalReference
        }
      });

      await conn.commit();

      res.status(201).json({
        success: true,
        message: 'Opening balance created successfully',
        data: {
          journal_entry_id: journalEntryId,
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          amount: amountDecimal,
          balance_type: balance_type,
          reference: finalReference
        }
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating opening balance:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create opening balance: ' + error.message 
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = new ChartOfAccountsController();
