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
}

module.exports = new ChartOfAccountsController();
