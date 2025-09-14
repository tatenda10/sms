const { pool } = require('../../config/database');

class SupplierController {
  // Get all suppliers
  async getAllSuppliers(req, res) {
    try {
      const [suppliers] = await pool.execute(
        `SELECT * FROM suppliers ORDER BY name`
      );
      res.json({ success: true, data: suppliers });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
    }
  }

  // Get supplier by ID
  async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      const [suppliers] = await pool.execute(
        `SELECT * FROM suppliers WHERE id = ?`,
        [id]
      );
      if (suppliers.length === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, data: suppliers[0] });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch supplier' });
    }
  }

  // Create new supplier
  async createSupplier(req, res) {
    try {
      const { name, contact_person, phone, email, address, is_active = true } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      const [result] = await pool.execute(
        `INSERT INTO suppliers (name, contact_person, phone, email, address, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, contact_person || null, phone || null, email || null, address || null, is_active]
      );
      res.status(201).json({ success: true, data: { id: result.insertId, name, contact_person, phone, email, address, is_active } });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to create supplier' });
    }
  }

  // Update supplier
  async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const { name, contact_person, phone, email, address, is_active } = req.body;
      const [result] = await pool.execute(
        `UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ? WHERE id = ?`,
        [name, contact_person || null, phone || null, email || null, address || null, is_active, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, message: 'Supplier updated successfully' });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to update supplier' });
    }
  }

  // Delete supplier
  async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM suppliers WHERE id = ?`,
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to delete supplier' });
    }
  }
}

module.exports = new SupplierController();
