const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class GradingController {
  // Get all grading criteria
  async getGradingCriteria(req, res) {
    try {
      const [criteria] = await pool.execute(
        `SELECT * FROM grading_criteria WHERE is_active = true ORDER BY min_mark DESC`
      );
      
      res.json({ success: true, data: criteria });
    } catch (error) {
      console.error('Error fetching grading criteria:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch grading criteria' });
    }
  }

  // Get grading criteria by ID
  async getGradingCriteriaById(req, res) {
    try {
      const { id } = req.params;
      const [criteria] = await pool.execute(
        `SELECT * FROM grading_criteria WHERE id = ? AND is_active = true`,
        [id]
      );
      
      if (criteria.length === 0) {
        return res.status(404).json({ success: false, message: 'Grading criteria not found' });
      }
      
      res.json({ success: true, data: criteria[0] });
    } catch (error) {
      console.error('Error fetching grading criteria:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch grading criteria' });
    }
  }

  // Add new grading criteria
  async addGradingCriteria(req, res) {
    try {
      const { grade, min_mark, max_mark, points, description } = req.body;
      
      if (!grade || min_mark === undefined || max_mark === undefined || points === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Grade, min_mark, max_mark, and points are required' 
        });
      }
      
      // Check if grade already exists
      const [existing] = await pool.execute(
        `SELECT id FROM grading_criteria WHERE grade = ? AND is_active = true`,
        [grade]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Grade already exists' });
      }
      
      // Validate mark ranges
      if (min_mark > max_mark) {
        return res.status(400).json({ success: false, message: 'Min mark cannot be greater than max mark' });
      }
      
      // Check for overlapping ranges
      const [overlap] = await pool.execute(
        `SELECT id FROM grading_criteria WHERE is_active = true AND 
         ((min_mark <= ? AND max_mark >= ?) OR (min_mark <= ? AND max_mark >= ?) OR 
          (min_mark >= ? AND max_mark <= ?))`,
        [min_mark, min_mark, max_mark, max_mark, min_mark, max_mark]
      );
      
      if (overlap.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mark range overlaps with existing grading criteria' 
        });
      }
      
      const [result] = await pool.execute(
        `INSERT INTO grading_criteria (grade, min_mark, max_mark, points, description) VALUES (?, ?, ?, ?, ?)`,
        [grade, min_mark, max_mark, points, description || null]
      );
      
      // Log audit event
      await AuditLogger.log({
        action: 'GRADING_CRITERIA_CREATED',
        table: 'grading_criteria',
        record_id: result.insertId,
        user_id: req.user.id,
        details: { grade, min_mark, max_mark, points, description },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json({ 
        success: true, 
        data: { id: result.insertId, grade, min_mark, max_mark, points, description },
        message: 'Grading criteria created successfully' 
      });
    } catch (error) {
      console.error('Error creating grading criteria:', error);
      res.status(500).json({ success: false, message: 'Failed to create grading criteria' });
    }
  }

  // Update grading criteria
  async updateGradingCriteria(req, res) {
    try {
      const { id } = req.params;
      const { grade, min_mark, max_mark, points, description, is_active } = req.body;
      
      if (!grade || min_mark === undefined || max_mark === undefined || points === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Grade, min_mark, max_mark, and points are required' 
        });
      }
      
      // Check if criteria exists
      const [existing] = await pool.execute(
        `SELECT id FROM grading_criteria WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Grading criteria not found' });
      }
      
      // Check if grade conflicts with other criteria
      const [gradeConflict] = await pool.execute(
        `SELECT id FROM grading_criteria WHERE grade = ? AND id != ? AND is_active = true`,
        [grade, id]
      );
      
      if (gradeConflict.length > 0) {
        return res.status(400).json({ success: false, message: 'Grade already exists' });
      }
      
      // Validate mark ranges
      if (min_mark > max_mark) {
        return res.status(400).json({ success: false, message: 'Min mark cannot be greater than max mark' });
      }
      
      // Check for overlapping ranges (excluding current record)
      const [overlap] = await pool.execute(
        `SELECT id FROM grading_criteria WHERE is_active = true AND id != ? AND
         ((min_mark <= ? AND max_mark >= ?) OR (min_mark <= ? AND max_mark >= ?) OR 
          (min_mark >= ? AND max_mark <= ?))`,
        [id, min_mark, min_mark, max_mark, max_mark, min_mark, max_mark]
      );
      
      if (overlap.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mark range overlaps with existing grading criteria' 
        });
      }
      
      const [result] = await pool.execute(
        `UPDATE grading_criteria SET grade = ?, min_mark = ?, max_mark = ?, points = ?, 
         description = ?, is_active = ? WHERE id = ?`,
        [grade, min_mark, max_mark, points, description || null, 
         is_active !== undefined ? is_active : true, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Grading criteria not found' });
      }
      
      // Log audit event
      await AuditLogger.log({
        action: 'GRADING_CRITERIA_UPDATED',
        table: 'grading_criteria',
        record_id: id,
        user_id: req.user.id,
        details: { grade, min_mark, max_mark, points, description, is_active },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({ 
        success: true, 
        message: 'Grading criteria updated successfully' 
      });
    } catch (error) {
      console.error('Error updating grading criteria:', error);
      res.status(500).json({ success: false, message: 'Failed to update grading criteria' });
    }
  }

  // Delete grading criteria (soft delete)
  async deleteGradingCriteria(req, res) {
    try {
      const { id } = req.params;
      
      // Check if criteria is being used in results
      const [usage] = await pool.execute(
        `SELECT COUNT(*) as count FROM results WHERE grade IN 
         (SELECT grade FROM grading_criteria WHERE id = ?)`,
        [id]
      );
      
      if (usage[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete grading criteria as it is being used in results' 
        });
      }
      
      const [result] = await pool.execute(
        `UPDATE grading_criteria SET is_active = false WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Grading criteria not found' });
      }
      
      // Log audit event
      await AuditLogger.log({
        action: 'GRADING_CRITERIA_DELETED',
        table: 'grading_criteria',
        record_id: id,
        user_id: req.user.id,
        details: { criteria_id: id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({ 
        success: true, 
        message: 'Grading criteria deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting grading criteria:', error);
      res.status(500).json({ success: false, message: 'Failed to delete grading criteria' });
    }
  }

  // Calculate grade from mark
  async calculateGrade(req, res) {
    try {
      const { mark } = req.body;
      
      if (mark === undefined || mark === null) {
        return res.status(400).json({ success: false, message: 'Mark is required' });
      }
      
      const [criteria] = await pool.execute(
        `SELECT * FROM grading_criteria WHERE is_active = true AND ? BETWEEN min_mark AND max_mark LIMIT 1`,
        [mark]
      );
      
      if (criteria.length === 0) {
        return res.json({ 
          success: true, 
          data: { grade: 'F', points: 0, description: 'Fail' } 
        });
      }
      
      res.json({ 
        success: true, 
        data: criteria[0] 
      });
    } catch (error) {
      console.error('Error calculating grade:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate grade' });
    }
  }

  // Bulk calculate grades
  async bulkCalculateGrades(req, res) {
    try {
      const { marks } = req.body; // Array of marks
      
      if (!Array.isArray(marks)) {
        return res.status(400).json({ success: false, message: 'Marks must be an array' });
      }
      
      const grades = [];
      
      for (const mark of marks) {
        const [criteria] = await pool.execute(
          `SELECT * FROM grading_criteria WHERE is_active = true AND ? BETWEEN min_mark AND max_mark LIMIT 1`,
          [mark]
        );
        
        if (criteria.length === 0) {
          grades.push({ mark, grade: 'F', points: 0, description: 'Fail' });
        } else {
          grades.push({ mark, ...criteria[0] });
        }
      }
      
      res.json({ 
        success: true, 
        data: grades 
      });
    } catch (error) {
      console.error('Error calculating grades:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate grades' });
    }
  }
}

module.exports = new GradingController();
