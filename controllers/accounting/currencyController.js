const { pool } = require('../../config/database');

class CurrencyController {
  // Get all currencies
  async getAllCurrencies(req, res) {
    try {
      const [currencies] = await pool.execute(
        `SELECT * FROM currencies ORDER BY code`
      );
      res.json({ success: true, data: currencies });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch currencies' });
    }
  }

  // Get currency by ID
  async getCurrencyById(req, res) {
    try {
      const { id } = req.params;
      const [currencies] = await pool.execute(
        `SELECT * FROM currencies WHERE id = ?`,
        [id]
      );
      if (currencies.length === 0) {
        return res.status(404).json({ success: false, message: 'Currency not found' });
      }
      res.json({ success: true, data: currencies[0] });
    } catch (error) {
      console.error('Error fetching currency:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch currency' });
    }
  }

  // Create new currency
  async createCurrency(req, res) {
    try {
      const { code, name, symbol, is_active = true } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Code and name are required' });
      }
      const [result] = await pool.execute(
        `INSERT INTO currencies (code, name, symbol, is_active) VALUES (?, ?, ?, ?)`,
        [code, name, symbol || null, is_active]
      );
      res.status(201).json({ success: true, data: { id: result.insertId, code, name, symbol, is_active } });
    } catch (error) {
      console.error('Error creating currency:', error);
      res.status(500).json({ success: false, message: 'Failed to create currency' });
    }
  }

  // Update currency
  async updateCurrency(req, res) {
    try {
      const { id } = req.params;
      const { code, name, symbol, is_active } = req.body;
      const [result] = await pool.execute(
        `UPDATE currencies SET code = ?, name = ?, symbol = ?, is_active = ? WHERE id = ?`,
        [code, name, symbol || null, is_active, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Currency not found' });
      }
      res.json({ success: true, message: 'Currency updated successfully' });
    } catch (error) {
      console.error('Error updating currency:', error);
      res.status(500).json({ success: false, message: 'Failed to update currency' });
    }
  }

  // Delete currency
  async deleteCurrency(req, res) {
    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM currencies WHERE id = ?`,
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Currency not found' });
      }
      res.json({ success: true, message: 'Currency deleted successfully' });
    } catch (error) {
      console.error('Error deleting currency:', error);
      res.status(500).json({ success: false, message: 'Failed to delete currency' });
    }
  }
}

module.exports = new CurrencyController();
