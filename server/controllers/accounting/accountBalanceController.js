const { pool } = require('../../config/database');

class AccountBalanceController {
  // Get the latest balance for an account and currency
  async getBalanceByAccountId(req, res) {
    try {
      const { account_id } = req.params;
      const { currency_id } = req.query;
      if (!currency_id) {
        return res.status(400).json({ success: false, message: 'currency_id is required' });
      }
      const [rows] = await pool.execute(
        `SELECT * FROM account_balances WHERE account_id = ? AND currency_id = ? ORDER BY as_of_date DESC LIMIT 1`,
        [account_id, currency_id]
      );
      if (rows.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error fetching account balance:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch account balance' });
    }
  }

  // Update or create the balance for an account/currency (for a given date)
  async updateBalance(req, res) {
    try {
      const { account_id } = req.params;
      const { balance, as_of_date, currency_id } = req.body;
      if (typeof balance !== 'number' || !as_of_date || !currency_id) {
        return res.status(400).json({ success: false, message: 'Balance, as_of_date, and currency_id are required' });
      }
      // Check if a balance already exists for this account, currency, and date
      const [existing] = await pool.execute(
        `SELECT id FROM account_balances WHERE account_id = ? AND currency_id = ? AND as_of_date = ?`,
        [account_id, currency_id, as_of_date]
      );
      if (existing.length > 0) {
        // Update
        await pool.execute(
          `UPDATE account_balances SET balance = ? WHERE id = ?`,
          [balance, existing[0].id]
        );
        return res.json({ success: true, message: 'Balance updated' });
      } else {
        // Insert
        await pool.execute(
          `INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) VALUES (?, ?, ?, ?)`,
          [account_id, currency_id, balance, as_of_date]
        );
        return res.json({ success: true, message: 'Balance created' });
      }
    } catch (error) {
      console.error('Error updating account balance:', error);
      res.status(500).json({ success: false, message: 'Failed to update account balance' });
    }
  }
}

module.exports = new AccountBalanceController(); 