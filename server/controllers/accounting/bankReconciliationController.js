const { pool } = require('../../config/database');

class BankReconciliationController {
  // Get all bank reconciliations
  static async getAllReconciliations(req, res) {
    try {
      const [reconciliations] = await pool.execute(`
        SELECT 
          br.*,
          coa.name as account_name,
          coa.code as account_code
        FROM bank_reconciliations br
        LEFT JOIN chart_of_accounts coa ON br.bank_account_id = coa.id
        ORDER BY br.reconciliation_date DESC
      `);

      res.json(reconciliations);
    } catch (error) {
      console.error('Error fetching bank reconciliations:', error);
      res.status(500).json({ error: 'Failed to fetch bank reconciliations' });
    }
  }

  // Get bank reconciliation by ID
  static async getReconciliationById(req, res) {
    try {
      const { id } = req.params;

      // Get reconciliation details
      const [reconciliations] = await pool.execute(`
        SELECT 
          br.*,
          coa.name as account_name,
          coa.code as account_code
        FROM bank_reconciliations br
        LEFT JOIN chart_of_accounts coa ON br.bank_account_id = coa.id
        WHERE br.id = ?
      `, [id]);

      if (reconciliations.length === 0) {
        return res.status(404).json({ error: 'Bank reconciliation not found' });
      }

      const reconciliation = reconciliations[0];

      // Get bank statement items
      const [bankStatements] = await pool.execute(`
        SELECT * FROM bank_statement_items 
        WHERE reconciliation_id = ? 
        ORDER BY transaction_date DESC
      `, [id]);

      // Get book transactions
      const [bookTransactions] = await pool.execute(`
        SELECT 
          bt.*,
          jel.debit,
          jel.credit,
          je.entry_date,
          je.description,
          je.reference
        FROM book_transactions bt
        LEFT JOIN journal_entry_lines jel ON bt.journal_entry_line_id = jel.id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE bt.reconciliation_id = ?
        ORDER BY bt.transaction_date DESC
      `, [id]);

      // Get unreconciled items
      const [unreconciledItems] = await pool.execute(`
        SELECT 
          'bank' as source,
          bsi.id,
          bsi.description,
          bsi.amount,
          bsi.transaction_date,
          bsi.reference,
          bsi.is_reconciled
        FROM bank_statement_items bsi
        WHERE bsi.reconciliation_id = ? AND bsi.is_reconciled = 0
        
        UNION ALL
        
        SELECT 
          'book' as source,
          bt.id,
          bt.description,
          CASE 
            WHEN jel.debit > 0 THEN jel.debit
            ELSE jel.credit
          END as amount,
          bt.transaction_date,
          bt.reference,
          bt.is_reconciled
        FROM book_transactions bt
        LEFT JOIN journal_entry_lines jel ON bt.journal_entry_line_id = jel.id
        WHERE bt.reconciliation_id = ? AND bt.is_reconciled = 0
        ORDER BY transaction_date DESC
      `, [id, id]);

      res.json({
        reconciliation,
        bank_statements: bankStatements,
        book_transactions: bookTransactions,
        unreconciled_items: unreconciledItems
      });
    } catch (error) {
      console.error('Error fetching bank reconciliation:', error);
      res.status(500).json({ error: 'Failed to fetch bank reconciliation' });
    }
  }

  // Create new bank reconciliation
  static async createReconciliation(req, res) {
    try {
      const {
        bank_account_id,
        reconciliation_date,
        bank_balance,
        book_balance,
        description
      } = req.body;

      // Validate required fields
      if (!bank_account_id || !reconciliation_date || bank_balance === undefined) {
        return res.status(400).json({ error: 'Bank account, reconciliation date, and bank balance are required' });
      }

      // Check if account exists and is a bank account
      const [accounts] = await pool.execute(`
        SELECT * FROM chart_of_accounts 
        WHERE id = ? AND name LIKE '%Cash%' AND type = 'Asset'
      `, [bank_account_id]);

      if (accounts.length === 0) {
        return res.status(400).json({ error: 'Invalid bank account selected' });
      }

      // Insert reconciliation
      const [result] = await pool.execute(`
        INSERT INTO bank_reconciliations (
          bank_account_id, 
          reconciliation_date, 
          bank_balance, 
          book_balance, 
          description,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, 'open', NOW())
      `, [bank_account_id, reconciliation_date, bank_balance, book_balance || 0, description || '']);

      const reconciliationId = result.insertId;

      // Get the created reconciliation
      const [created] = await pool.execute(`
        SELECT 
          br.*,
          coa.name as account_name,
          coa.code as account_code
        FROM bank_reconciliations br
        LEFT JOIN chart_of_accounts coa ON br.bank_account_id = coa.id
        WHERE br.id = ?
      `, [reconciliationId]);

      res.status(201).json(created[0]);
    } catch (error) {
      console.error('Error creating bank reconciliation:', error);
      res.status(500).json({ error: 'Failed to create bank reconciliation' });
    }
  }

  // Add bank statement item
  static async addBankStatementItem(req, res) {
    try {
      const { reconciliation_id } = req.params;
      const {
        description,
        amount,
        transaction_date,
        reference,
        transaction_type
      } = req.body;

      // Validate required fields
      if (!description || amount === undefined || !transaction_date) {
        return res.status(400).json({ error: 'Description, amount, and transaction date are required' });
      }

      // Check if reconciliation exists
      const [reconciliations] = await pool.execute(
        'SELECT * FROM bank_reconciliations WHERE id = ?',
        [reconciliation_id]
      );

      if (reconciliations.length === 0) {
        return res.status(404).json({ error: 'Bank reconciliation not found' });
      }

      // Insert bank statement item
      const [result] = await pool.execute(`
        INSERT INTO bank_statement_items (
          reconciliation_id,
          description,
          amount,
          transaction_date,
          reference,
          transaction_type,
          is_reconciled,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
      `, [reconciliation_id, description, amount, transaction_date, reference || '', transaction_type || 'other']);

      const itemId = result.insertId;

      // Get the created item
      const [created] = await pool.execute(
        'SELECT * FROM bank_statement_items WHERE id = ?',
        [itemId]
      );

      res.status(201).json(created[0]);
    } catch (error) {
      console.error('Error adding bank statement item:', error);
      res.status(500).json({ error: 'Failed to add bank statement item' });
    }
  }

  // Add book transaction
  static async addBookTransaction(req, res) {
    try {
      const { reconciliation_id } = req.params;
      const {
        description,
        amount,
        transaction_date,
        reference,
        journal_entry_line_id
      } = req.body;

      // Validate required fields
      if (!description || amount === undefined || !transaction_date) {
        return res.status(400).json({ error: 'Description, amount, and transaction date are required' });
      }

      // Check if reconciliation exists
      const [reconciliations] = await pool.execute(
        'SELECT * FROM bank_reconciliations WHERE id = ?',
        [reconciliation_id]
      );

      if (reconciliations.length === 0) {
        return res.status(404).json({ error: 'Bank reconciliation not found' });
      }

      // Insert book transaction
      const [result] = await pool.execute(`
        INSERT INTO book_transactions (
          reconciliation_id,
          description,
          amount,
          transaction_date,
          reference,
          journal_entry_line_id,
          is_reconciled,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
      `, [reconciliation_id, description, amount, transaction_date, reference || '', journal_entry_line_id || null]);

      const itemId = result.insertId;

      // Get the created item
      const [created] = await pool.execute(
        'SELECT * FROM book_transactions WHERE id = ?',
        [itemId]
      );

      res.status(201).json(created[0]);
    } catch (error) {
      console.error('Error adding book transaction:', error);
      res.status(500).json({ error: 'Failed to add book transaction' });
    }
  }

  // Match transactions
  static async matchTransactions(req, res) {
    try {
      const { reconciliation_id } = req.params;
      const { bank_item_id, book_item_id } = req.body;

      // Validate required fields
      if (!bank_item_id || !book_item_id) {
        return res.status(400).json({ error: 'Both bank item and book item IDs are required' });
      }

      // Check if both items exist and belong to the reconciliation
      const [bankItems] = await pool.execute(
        'SELECT * FROM bank_statement_items WHERE id = ? AND reconciliation_id = ?',
        [bank_item_id, reconciliation_id]
      );

      const [bookItems] = await pool.execute(
        'SELECT * FROM book_transactions WHERE id = ? AND reconciliation_id = ?',
        [book_item_id, reconciliation_id]
      );

      if (bankItems.length === 0 || bookItems.length === 0) {
        return res.status(404).json({ error: 'One or both items not found' });
      }

      // Check if items are already reconciled
      if (bankItems[0].is_reconciled || bookItems[0].is_reconciled) {
        return res.status(400).json({ error: 'One or both items are already reconciled' });
      }

      // Mark both items as reconciled
      await pool.execute(
        'UPDATE bank_statement_items SET is_reconciled = 1, reconciled_at = NOW() WHERE id = ?',
        [bank_item_id]
      );

      await pool.execute(
        'UPDATE book_transactions SET is_reconciled = 1, reconciled_at = NOW() WHERE id = ?',
        [book_item_id]
      );

      res.json({ message: 'Transactions matched successfully' });
    } catch (error) {
      console.error('Error matching transactions:', error);
      res.status(500).json({ error: 'Failed to match transactions' });
    }
  }

  // Complete reconciliation
  static async completeReconciliation(req, res) {
    try {
      const { id } = req.params;
      const { adjusted_balance, notes } = req.body;

      // Check if reconciliation exists
      const [reconciliations] = await pool.execute(
        'SELECT * FROM bank_reconciliations WHERE id = ?',
        [id]
      );

      if (reconciliations.length === 0) {
        return res.status(404).json({ error: 'Bank reconciliation not found' });
      }

      const reconciliation = reconciliations[0];

      // Check if there are unreconciled items
      const [unreconciledBank] = await pool.execute(
        'SELECT COUNT(*) as count FROM bank_statement_items WHERE reconciliation_id = ? AND is_reconciled = 0',
        [id]
      );

      const [unreconciledBook] = await pool.execute(
        'SELECT COUNT(*) as count FROM book_transactions WHERE reconciliation_id = ? AND is_reconciled = 0',
        [id]
      );

      if (unreconciledBank[0].count > 0 || unreconciledBook[0].count > 0) {
        return res.status(400).json({ 
          error: 'Cannot complete reconciliation with unreconciled items',
          unreconciled_bank: unreconciledBank[0].count,
          unreconciled_book: unreconciledBook[0].count
        });
      }

      // Update reconciliation status
      await pool.execute(`
        UPDATE bank_reconciliations 
        SET status = 'completed', 
            adjusted_balance = ?, 
            notes = ?,
            completed_at = NOW()
        WHERE id = ?
      `, [adjusted_balance, notes || '', id]);

      // Get updated reconciliation
      const [updated] = await pool.execute(`
        SELECT 
          br.*,
          coa.name as account_name,
          coa.code as account_code
        FROM bank_reconciliations br
        LEFT JOIN chart_of_accounts coa ON br.bank_account_id = coa.id
        WHERE br.id = ?
      `, [id]);

      res.json(updated[0]);
    } catch (error) {
      console.error('Error completing reconciliation:', error);
      res.status(500).json({ error: 'Failed to complete reconciliation' });
    }
  }

  // Get bank accounts for reconciliation
  static async getBankAccounts(req, res) {
    try {
      const [accounts] = await pool.execute(`
        SELECT id, code, name, type
        FROM chart_of_accounts 
        WHERE name LIKE '%Cash%' AND type = 'Asset' AND is_active = 1
        ORDER BY name
      `);

      res.json(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
  }

  // Get reconciliation summary
  static async getReconciliationSummary(req, res) {
    try {
      const { id } = req.params;

      // Get reconciliation details
      const [reconciliations] = await pool.execute(`
        SELECT 
          br.*,
          coa.name as account_name,
          coa.code as account_code
        FROM bank_reconciliations br
        LEFT JOIN chart_of_accounts coa ON br.bank_account_id = coa.id
        WHERE br.id = ?
      `, [id]);

      if (reconciliations.length === 0) {
        return res.status(404).json({ error: 'Bank reconciliation not found' });
      }

      const reconciliation = reconciliations[0];

      // Get summary statistics
      const [bankStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_items,
          SUM(CASE WHEN is_reconciled = 1 THEN 1 ELSE 0 END) as reconciled_items,
          SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END) as unreconciled_items,
          SUM(amount) as total_amount,
          SUM(CASE WHEN is_reconciled = 1 THEN amount ELSE 0 END) as reconciled_amount,
          SUM(CASE WHEN is_reconciled = 0 THEN amount ELSE 0 END) as unreconciled_amount
        FROM bank_statement_items 
        WHERE reconciliation_id = ?
      `, [id]);

      const [bookStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_items,
          SUM(CASE WHEN is_reconciled = 1 THEN 1 ELSE 0 END) as reconciled_items,
          SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END) as unreconciled_items,
          SUM(amount) as total_amount,
          SUM(CASE WHEN is_reconciled = 1 THEN amount ELSE 0 END) as reconciled_amount,
          SUM(CASE WHEN is_reconciled = 0 THEN amount ELSE 0 END) as unreconciled_amount
        FROM book_transactions 
        WHERE reconciliation_id = ?
      `, [id]);

      res.json({
        reconciliation,
        bank_summary: bankStats[0],
        book_summary: bookStats[0]
      });
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      res.status(500).json({ error: 'Failed to fetch reconciliation summary' });
    }
  }
}

module.exports = BankReconciliationController;
