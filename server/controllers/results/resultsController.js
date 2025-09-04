const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class ResultsController {
  // Create main result entry
  async createResult(req, res) {
    const conn = await pool.getConnection();
    try {
      const { reg_number, subject_class_id, gradelevel_class_id, academic_year, term } = req.body;
      
      if (!reg_number || !subject_class_id || !gradelevel_class_id || !academic_year || !term) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
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
      
      // Check if result already exists
      const [existing] = await conn.execute(
        `SELECT id FROM results WHERE reg_number = ? AND subject_class_id = ? AND 
         gradelevel_class_id = ? AND academic_year = ? AND term = ?`,
        [reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Result already exists for this student, subject, and term' 
        });
      }
      
      await conn.beginTransaction();
      
      // Create result entry
      const [result] = await conn.execute(
        `INSERT INTO results (reg_number, subject_class_id, gradelevel_class_id, academic_year, term, 
         total_mark, grade, points) VALUES (?, ?, ?, ?, ?, 0, NULL, 0)`,
        [reg_number, subject_class_id, gradelevel_class_id, academic_year, term]
      );
      
      const resultId = result.insertId;
      
      // Log audit event
      await AuditLogger.log({
        action: 'RESULT_CREATED',
        table: 'results',
        record_id: resultId,
        user_id: req.user.id,
        details: { reg_number, subject_class_id, gradelevel_class_id, academic_year, term },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.status(201).json({ 
        success: true, 
        data: { id: resultId },
        message: 'Result created successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating result:', error);
      res.status(500).json({ success: false, message: 'Failed to create result' });
    } finally {
      conn.release();
    }
  }

  // Add individual paper mark
  async addPaperMark(req, res) {
    const conn = await pool.getConnection();
    try {
      const { result_id, paper_id, mark } = req.body;
      
      if (!result_id || !paper_id || mark === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Result ID, paper ID, and mark are required' 
        });
      }
      
      // Validate mark range
      if (mark < 0 || mark > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mark must be between 0 and 100' 
        });
      }
      
      await conn.beginTransaction();
      
      // Check if paper mark already exists
      const [existing] = await conn.execute(
        `SELECT id FROM paper_marks WHERE result_id = ? AND paper_id = ?`,
        [result_id, paper_id]
      );
      
      if (existing.length > 0) {
        // Update existing mark
        await conn.execute(
          `UPDATE paper_marks SET mark = ?, updated_at = CURRENT_TIMESTAMP WHERE result_id = ? AND paper_id = ?`,
          [mark, result_id, paper_id]
        );
      } else {
        // Create new mark
        await conn.execute(
          `INSERT INTO paper_marks (result_id, paper_id, mark) VALUES (?, ?, ?)`,
          [result_id, paper_id, mark]
        );
      }
      
      // Recalculate total mark
      const [paperMarks] = await conn.execute(
        `SELECT mark FROM paper_marks WHERE result_id = ?`,
        [result_id]
      );
      
      // Calculate average
      const validMarks = paperMarks.filter(paper => paper.mark && parseFloat(paper.mark) > 0);
      let totalMark = 0;
      
      if (validMarks.length > 0) {
        const sum = validMarks.reduce((sum, paper) => sum + parseFloat(paper.mark || 0), 0);
        totalMark = Math.round((sum / validMarks.length) * 100) / 100; // Round to 2 decimal places
      }
      
      // Calculate grade and points
      const [criteria] = await conn.execute(
        `SELECT * FROM grading_criteria WHERE is_active = true AND ? BETWEEN min_mark AND max_mark LIMIT 1`,
        [totalMark]
      );
      
      let grade = 'F';
      let points = 0;
      
      if (criteria.length > 0) {
        grade = criteria[0].grade;
        points = criteria[0].points;
      }
      
      // Update result
      await conn.execute(
        `UPDATE results SET total_mark = ?, grade = ?, points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [totalMark, grade, points, result_id]
      );
      
      await conn.commit();
      
      res.json({ 
        success: true, 
        message: 'Paper mark added successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error adding paper mark:', error);
      res.status(500).json({ success: false, message: 'Failed to add paper mark' });
    } finally {
      conn.release();
    }
  }

  // Recalculate total mark for a result
  async recalculateTotalMark(conn, resultId) {
    try {
      // Get all paper marks for this result
      const [paperMarks] = await conn.execute(
        `SELECT mark FROM paper_marks WHERE result_id = ?`,
        [resultId]
      );
      
      // Calculate average
      const validMarks = paperMarks.filter(paper => paper.mark && parseFloat(paper.mark) > 0);
      let totalMark = 0;
      
      if (validMarks.length > 0) {
        const sum = validMarks.reduce((sum, paper) => sum + parseFloat(paper.mark || 0), 0);
        totalMark = Math.round((sum / validMarks.length) * 100) / 100; // Round to 2 decimal places
      }
      
      // Calculate grade and points
      const [criteria] = await conn.execute(
        `SELECT * FROM grading_criteria WHERE is_active = true AND ? BETWEEN min_mark AND max_mark LIMIT 1`,
        [totalMark]
      );
      
      let grade = 'F';
      let points = 0;
      
      if (criteria.length > 0) {
        grade = criteria[0].grade;
        points = criteria[0].points;
      }
      
      // Update result
      await conn.execute(
        `UPDATE results SET total_mark = ?, grade = ?, points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [totalMark, grade, points, resultId]
      );
      
      return { totalMark, grade, points };
    } catch (error) {
      console.error('Error recalculating total mark:', error);
      throw error;
    }
  }

  // Get results for a class/subject/term
  async getResults(req, res) {
    try {
      const { gradelevel_class_id, subject_class_id, term, academic_year } = req.query;
      
      if (!gradelevel_class_id || !term || !academic_year) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gradelevel class ID, term, and academic year are required' 
        });
      }
      
      let query = `
        SELECT r.*, s.Name as student_name, s.Surname as student_surname, s.RegNumber,
               sub.name as subject_name, glc.name as class_name
        FROM results r
        LEFT JOIN students s ON r.reg_number = s.RegNumber
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes glc ON r.gradelevel_class_id = glc.id
        WHERE r.gradelevel_class_id = ? AND r.term = ? AND r.academic_year = ?
      `;
      
      const params = [gradelevel_class_id, term, academic_year];
      
      if (subject_class_id) {
        query += ' AND r.subject_class_id = ?';
        params.push(subject_class_id);
      }
      
      query += ' ORDER BY s.Surname, s.Name';
      
      const [results] = await pool.execute(query, params);
      
      // Get paper marks for each result
      for (let result of results) {
        const [paperMarks] = await pool.execute(
          `SELECT pm.*, p.name as paper_name 
           FROM paper_marks pm
           LEFT JOIN papers p ON pm.paper_id = p.id
           WHERE pm.result_id = ?`,
          [result.id]
        );
        result.paper_marks = paperMarks;
      }
      
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
  }

  // Get class positions
  async getClassPositions(req, res) {
    try {
      const { gradelevel_class_id, term, academic_year } = req.query;
      
      if (!gradelevel_class_id || !term || !academic_year) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gradelevel class ID, term, and academic year are required' 
        });
      }
      
      // Get all results for the class with student info
      const [results] = await pool.execute(
        `SELECT r.*, s.Name as student_name, s.Surname as student_surname, s.RegNumber
         FROM results r
         LEFT JOIN students s ON r.reg_number = s.RegNumber
         WHERE r.gradelevel_class_id = ? AND r.term = ? AND r.academic_year = ?
         ORDER BY r.total_mark DESC, s.Surname, s.Name`,
        [gradelevel_class_id, term, academic_year]
      );
      
      // Calculate positions
      let currentPosition = 1;
      let currentMark = null;
      let tieCount = 0;
      
      const positions = results.map((result, index) => {
        if (currentMark !== result.total_mark) {
          currentPosition = index + 1;
          currentMark = result.total_mark;
          tieCount = 0;
        } else {
          tieCount++;
        }
        
        return {
          ...result,
          position: currentPosition,
          isTied: tieCount > 0
        };
      });
      
      res.json({ success: true, data: positions });
    } catch (error) {
      console.error('Error calculating class positions:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate positions' });
    }
  }

  // Get stream positions
  async getStreamPositions(req, res) {
    try {
      const { stream_id, term, academic_year } = req.query;
      
      if (!stream_id || !term || !academic_year) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stream ID, term, and academic year are required' 
        });
      }
      
      // Get all results in the stream
      const [results] = await pool.execute(
        `SELECT r.*, s.Name as student_name, s.Surname as student_surname, s.RegNumber,
               glc.name as class_name, glc.stream_id
         FROM results r
         LEFT JOIN students s ON r.reg_number = s.RegNumber
         LEFT JOIN gradelevel_classes glc ON r.gradelevel_class_id = glc.id
         WHERE glc.stream_id = ? AND r.term = ? AND r.academic_year = ?
         ORDER BY r.total_mark DESC, s.Surname, s.Name`,
        [stream_id, term, academic_year]
      );
      
      // Calculate stream positions
      let currentPosition = 1;
      let currentMark = null;
      let tieCount = 0;
      
      const positions = results.map((result, index) => {
        if (currentMark !== result.total_mark) {
          currentPosition = index + 1;
          currentMark = result.total_mark;
          tieCount = 0;
        } else {
          tieCount++;
        }
        
        return {
          ...result,
          streamPosition: currentPosition,
          isTied: tieCount > 0
        };
      });
      
      res.json({ success: true, data: positions });
    } catch (error) {
      console.error('Error calculating stream positions:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate stream positions' });
    }
  }

  // Update result
  async updateResult(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { total_mark, grade, points } = req.body;
      
      // Check if result exists
      const [existing] = await conn.execute(
        `SELECT id FROM results WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Result not found' });
      }
      
      await conn.beginTransaction();
      
      // Update result
      await conn.execute(
        `UPDATE results SET total_mark = ?, grade = ?, points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [total_mark, grade, points, id]
      );
      
      // Log audit event
      await AuditLogger.log({
        action: 'RESULT_UPDATED',
        table: 'results',
        record_id: id,
        user_id: req.user.id,
        details: { total_mark, grade, points },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.json({ 
        success: true, 
        message: 'Result updated successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating result:', error);
      res.status(500).json({ success: false, message: 'Failed to update result' });
    } finally {
      conn.release();
    }
  }

  // Delete result
  async deleteResult(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      
      // Check if result exists
      const [existing] = await conn.execute(
        `SELECT id FROM results WHERE id = ?`,
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Result not found' });
      }
      
      await conn.beginTransaction();
      
      // Delete paper marks first
      await conn.execute(
        `DELETE FROM paper_marks WHERE result_id = ?`,
        [id]
      );
      
      // Delete result
      await conn.execute(
        `DELETE FROM results WHERE id = ?`,
        [id]
      );
      
      // Log audit event
      await AuditLogger.log({
        action: 'RESULT_DELETED',
        table: 'results',
        record_id: id,
        user_id: req.user.id,
        details: { result_id: id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      await conn.commit();
      
      res.json({ 
        success: true, 
        message: 'Result deleted successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error deleting result:', error);
      res.status(500).json({ success: false, message: 'Failed to delete result' });
    } finally {
      conn.release();
    }
  }
}

module.exports = new ResultsController();
