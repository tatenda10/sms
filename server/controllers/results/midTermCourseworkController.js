const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class MidTermCourseworkController {
  // Add coursework mark
  async addCoursework(req, res) {
    const conn = await pool.getConnection();
    try {
      const { reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark } = req.body;
      
      if (!reg_number || !subject_class_id || !gradelevel_class_id || !academic_year || !term || coursework_mark === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }
      
      // Validate mark range
      if (coursework_mark < 0 || coursework_mark > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coursework mark must be between 0 and 100' 
        });
      }
      
      // Check if student exists
      const [student] = await conn.execute(
        `SELECT RegNumber FROM students WHERE RegNumber = ?`,
        [reg_number]
      );
      
      if (student.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      await conn.beginTransaction();
      
      // Check if coursework already exists
      const [existing] = await conn.execute(
        `SELECT id FROM mid_term_coursework WHERE reg_number = ? AND subject_class_id = ? AND 
         gradelevel_class_id = ? AND academic_year = ? AND term = ?`,
        [reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
      );
      
      if (existing.length > 0) {
        // Update existing coursework
        await conn.execute(
          `UPDATE mid_term_coursework SET coursework_mark = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE reg_number = ? AND subject_class_id = ? AND gradelevel_class_id = ? AND 
           academic_year = ? AND term = ?`,
          [coursework_mark, reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
        );
        
        // Log audit event
        await AuditLogger.log({
          action: 'COURSEWORK_UPDATED',
          table: 'mid_term_coursework',
          record_id: existing[0].id,
          user_id: req.user.id,
          details: { reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
        
        await conn.commit();
        
        res.json({ 
          success: true, 
          message: 'Coursework updated successfully' 
        });
      } else {
        // Create new coursework
        const [result] = await conn.execute(
          `INSERT INTO mid_term_coursework (reg_number, subject_class_id, gradelevel_class_id, 
           academic_year, term, coursework_mark) VALUES (?, ?, ?, ?, ?, ?)`,
          [reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark]
        );
        
        // Log audit event
        await AuditLogger.log({
          action: 'COURSEWORK_CREATED',
          table: 'mid_term_coursework',
          record_id: result.insertId,
          user_id: req.user.id,
          details: { reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
        
        await conn.commit();
        
        res.status(201).json({ 
          success: true, 
          data: { id: result.insertId },
          message: 'Coursework added successfully' 
        });
      }
    } catch (error) {
      await conn.rollback();
      console.error('Error adding coursework:', error);
      res.status(500).json({ success: false, message: 'Failed to add coursework' });
    } finally {
      conn.release();
    }
  }

  // Get coursework marks
  async getCoursework(req, res) {
    try {
      const { gradelevel_class_id, subject_class_id, term, academic_year, reg_number } = req.query;
      
      let query = `
        SELECT mtc.*, s.Name as student_name, s.Surname as student_surname, s.RegNumber,
               sub.name as subject_name, glc.name as class_name
        FROM mid_term_coursework mtc
        LEFT JOIN students s ON mtc.reg_number = s.RegNumber
        LEFT JOIN subject_classes sc ON mtc.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes glc ON mtc.gradelevel_class_id = glc.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (gradelevel_class_id) {
        query += ' AND mtc.gradelevel_class_id = ?';
        params.push(gradelevel_class_id);
      }
      
      if (subject_class_id) {
        query += ' AND mtc.subject_class_id = ?';
        params.push(subject_class_id);
      }
      
      if (term) {
        query += ' AND mtc.term = ?';
        params.push(term);
      }
      
      if (academic_year) {
        query += ' AND mtc.academic_year = ?';
        params.push(academic_year);
      }
      
      if (reg_number) {
        query += ' AND mtc.reg_number = ?';
        params.push(reg_number);
      }
      
      query += ' ORDER BY s.Surname, s.Name';
      
      const [coursework] = await pool.execute(query, params);
      
      res.json({ success: true, data: coursework });
    } catch (error) {
      console.error('Error fetching coursework:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coursework' });
    }
  }

  // Get coursework by ID
  async getCourseworkById(req, res) {
    try {
      const { id } = req.params;
      
      const [coursework] = await pool.execute(
        `SELECT mtc.*, s.Name as student_name, s.Surname as student_surname, s.RegNumber,
                sub.name as subject_name, glc.name as class_name
         FROM mid_term_coursework mtc
         LEFT JOIN students s ON mtc.reg_number = s.RegNumber
         LEFT JOIN subject_classes sc ON mtc.subject_class_id = sc.id
         LEFT JOIN subjects sub ON sc.subject_id = sub.id
         LEFT JOIN gradelevel_classes glc ON mtc.gradelevel_class_id = glc.id
         WHERE mtc.id = ?`,
        [id]
      );
      
      if (coursework.length === 0) {
        return res.status(404).json({ success: false, message: 'Coursework not found' });
      }
      
      res.json({ success: true, data: coursework[0] });
    } catch (error) {
      console.error('Error fetching coursework:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coursework' });
    }
  }

  // Update coursework
  async updateCoursework(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { coursework_mark } = req.body;
      
      if (coursework_mark === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coursework mark is required' 
        });
      }
      
      // Validate mark range
      if (coursework_mark < 0 || coursework_mark > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coursework mark must be between 0 and 100' 
        });
      }
      
      // Check if coursework exists
      const [existing] = await conn.execute(
        `SELECT id FROM mid_term_coursework WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Coursework not found' });
      }
      
      await conn.beginTransaction();
      
      // Update coursework
      await conn.execute(
        `UPDATE mid_term_coursework SET coursework_mark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [coursework_mark, id]
      );
      
      // Log audit event
      await AuditLogger.log({
        action: 'COURSEWORK_UPDATED',
        table: 'mid_term_coursework',
        record_id: id,
        user_id: req.user.id,
        details: { coursework_mark },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.json({ 
        success: true, 
        message: 'Coursework updated successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating coursework:', error);
      res.status(500).json({ success: false, message: 'Failed to update coursework' });
    } finally {
      conn.release();
    }
  }

  // Delete coursework
  async deleteCoursework(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      
      // Check if coursework exists
      const [existing] = await conn.execute(
        `SELECT id FROM mid_term_coursework WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Coursework not found' });
      }
      
      await conn.beginTransaction();
      
      // Delete coursework
      await conn.execute(
        `DELETE FROM mid_term_coursework WHERE id = ?`,
        [id]
      );
      
      // Log audit event
      await AuditLogger.log({
        action: 'COURSEWORK_DELETED',
        table: 'mid_term_coursework',
        record_id: id,
        user_id: req.user.id,
        details: { coursework_id: id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.json({ 
        success: true, 
        message: 'Coursework deleted successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error deleting coursework:', error);
      res.status(500).json({ success: false, message: 'Failed to delete coursework' });
    } finally {
      conn.release();
    }
  }

  // Bulk add coursework
  async bulkAddCoursework(req, res) {
    const conn = await pool.getConnection();
    try {
      const { coursework_data } = req.body; // Array of coursework objects
      
      if (!Array.isArray(coursework_data) || coursework_data.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coursework data must be a non-empty array' 
        });
      }
      
      await conn.beginTransaction();
      
      const results = [];
      
      for (const coursework of coursework_data) {
        const { reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark } = coursework;
        
        // Validate required fields
        if (!reg_number || !subject_class_id || !gradelevel_class_id || !academic_year || !term || coursework_mark === undefined) {
          throw new Error(`Missing required fields for student ${reg_number}`);
        }
        
        // Validate mark range
        if (coursework_mark < 0 || coursework_mark > 100) {
          throw new Error(`Invalid mark for student ${reg_number}: ${coursework_mark}`);
        }
        
        // Check if coursework already exists
        const [existing] = await conn.execute(
          `SELECT id FROM mid_term_coursework WHERE reg_number = ? AND subject_class_id = ? AND 
           gradelevel_class_id = ? AND academic_year = ? AND term = ?`,
          [reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
        );
        
        if (existing.length > 0) {
          // Update existing
          await conn.execute(
            `UPDATE mid_term_coursework SET coursework_mark = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE reg_number = ? AND subject_class_id = ? AND gradelevel_class_id = ? AND 
             academic_year = ? AND term = ?`,
            [coursework_mark, reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
          );
          
          results.push({ 
            reg_number, 
            action: 'updated', 
            id: existing[0].id 
          });
        } else {
          // Create new
          const [result] = await conn.execute(
            `INSERT INTO mid_term_coursework (reg_number, subject_class_id, gradelevel_class_id, 
             academic_year, term, coursework_mark) VALUES (?, ?, ?, ?, ?, ?)`,
            [reg_number, subject_class_id, gradelevel_class_id, academic_year, term, coursework_mark]
          );
          
          results.push({ 
            reg_number, 
            action: 'created', 
            id: result.insertId 
          });
        }
      }
      
      // Log audit event
      await AuditLogger.log({
        action: 'COURSEWORK_BULK_ADDED',
        table: 'mid_term_coursework',
        record_id: null,
        user_id: req.user.id,
        details: { count: coursework_data.length, results },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.status(201).json({ 
        success: true, 
        data: results,
        message: `Successfully processed ${coursework_data.length} coursework entries` 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error bulk adding coursework:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to bulk add coursework' 
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = new MidTermCourseworkController();
