const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class PapersController {
  // Get all papers
  async getAllPapers(req, res) {
    try {
      const [papers] = await pool.execute(
        `SELECT * FROM papers WHERE is_active = true ORDER BY name ASC`
      );
      
      res.json({ success: true, data: papers });
    } catch (error) {
      console.error('Error fetching papers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch papers' });
    }
  }

  // Get paper by ID
  async getPaperById(req, res) {
    try {
      const { id } = req.params;
      const [papers] = await pool.execute(
        `SELECT * FROM papers WHERE id = ? AND is_active = true`,
        [id]
      );
      
      if (papers.length === 0) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }
      
      res.json({ success: true, data: papers[0] });
    } catch (error) {
      console.error('Error fetching paper:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch paper' });
    }
  }

  // Add new paper
  async addPaper(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Paper name is required' });
      }
      
      // Check if paper name already exists
      const [existing] = await pool.execute(
        `SELECT id FROM papers WHERE name = ? AND is_active = true`,
        [name]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Paper with this name already exists' });
      }
      
      const [result] = await pool.execute(
        `INSERT INTO papers (name, description) VALUES (?, ?)`,
        [name, description || null]
      );
      
      // Log audit event
      const userId = req.user?.id || req.employeeId;
      await AuditLogger.log({
        action: 'PAPER_CREATED',
        table: 'papers',
        record_id: result.insertId,
        user_id: userId,
        details: { name, description },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json({ 
        success: true, 
        data: { id: result.insertId, name, description },
        message: 'Paper created successfully' 
      });
    } catch (error) {
      console.error('Error creating paper:', error);
      res.status(500).json({ success: false, message: 'Failed to create paper' });
    }
  }

  // Update paper
  async updatePaper(req, res) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Paper name is required' });
      }
      
      // Check if paper exists
      const [existing] = await pool.execute(
        `SELECT id FROM papers WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }
      
      // Check if name conflicts with other papers
      const [nameConflict] = await pool.execute(
        `SELECT id FROM papers WHERE name = ? AND id != ? AND is_active = true`,
        [name, id]
      );
      
      if (nameConflict.length > 0) {
        return res.status(400).json({ success: false, message: 'Paper with this name already exists' });
      }
      
      const [result] = await pool.execute(
        `UPDATE papers SET name = ?, description = ?, is_active = ? WHERE id = ?`,
        [name, description || null, is_active !== undefined ? is_active : true, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }
      
      // Log audit event
      const userId = req.user?.id || req.employeeId;
      await AuditLogger.log({
        action: 'PAPER_UPDATED',
        table: 'papers',
        record_id: id,
        user_id: userId,
        details: { name, description, is_active },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({ 
        success: true, 
        message: 'Paper updated successfully' 
      });
    } catch (error) {
      console.error('Error updating paper:', error);
      res.status(500).json({ success: false, message: 'Failed to update paper' });
    }
  }

  // Delete paper (soft delete)
  async deletePaper(req, res) {
    try {
      const { id } = req.params;
      
      // Check if paper is being used in results
      const [usage] = await pool.execute(
        `SELECT COUNT(*) as count FROM paper_marks WHERE paper_id = ?`,
        [id]
      );
      
      if (usage[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete paper as it is being used in results' 
        });
      }
      
      const [result] = await pool.execute(
        `UPDATE papers SET is_active = false WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }
      
      // Log audit event
      const userId = req.user?.id || req.employeeId;
      await AuditLogger.log({
        action: 'PAPER_DELETED',
        table: 'papers',
        record_id: id,
        user_id: userId,
        details: { paper_id: id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({ 
        success: true, 
        message: 'Paper deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting paper:', error);
      res.status(500).json({ success: false, message: 'Failed to delete paper' });
    }
  }
}

module.exports = new PapersController();
