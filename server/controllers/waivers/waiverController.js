const { pool } = require('../../config/database');
const StudentTransactionController = require('../students/studentTransactionController');
const StudentBalanceService = require('../../services/studentBalanceService');
const AuditLogger = require('../../utils/audit');

class WaiverController {
  // ==========================================
  // WAIVER CATEGORIES MANAGEMENT
  // ==========================================

  // Get all waiver categories
  async getWaiverCategories(req, res) {
    try {
      const [categories] = await pool.execute(`
        SELECT id, category_name, description, is_active, created_at, updated_at
        FROM waiver_categories 
        WHERE is_active = TRUE
        ORDER BY category_name
      `);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching waiver categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waiver categories'
      });
    }
  }

  // Create new waiver category
  async createWaiverCategory(req, res) {
    try {
      const { category_name, description } = req.body;

      if (!category_name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      const [result] = await pool.execute(`
        INSERT INTO waiver_categories (category_name, description)
        VALUES (?, ?)
      `, [category_name, description]);

      res.status(201).json({
        success: true,
        message: 'Waiver category created successfully',
        data: { id: result.insertId, category_name, description }
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
      console.error('Error creating waiver category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create waiver category'
      });
    }
  }

  // Update waiver category
  async updateWaiverCategory(req, res) {
    try {
      const { id } = req.params;
      const { category_name, description, is_active } = req.body;

      const [result] = await pool.execute(`
        UPDATE waiver_categories 
        SET category_name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [category_name, description, is_active, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Waiver category not found'
        });
      }

      res.json({
        success: true,
        message: 'Waiver category updated successfully'
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
      console.error('Error updating waiver category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update waiver category'
      });
    }
  }

  // Delete waiver category (soft delete)
  async deleteWaiverCategory(req, res) {
    try {
      const { id } = req.params;

      const [result] = await pool.execute(`
        UPDATE waiver_categories 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Waiver category not found'
        });
      }

      res.json({
        success: true,
        message: 'Waiver category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting waiver category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete waiver category'
      });
    }
  }

  // ==========================================
  // WAIVER PROCESSING
  // ==========================================

  // Process waiver for student
  async processWaiver(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const {
        student_reg_number,
        waiver_amount,
        category_id,
        reason,
        notes,
        term,
        academic_year
      } = req.body;

      // Validation
      if (!student_reg_number || !waiver_amount || !category_id || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Student registration number, waiver amount, category, and reason are required'
        });
      }

      // Check if student exists
      const [students] = await conn.execute(
        'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ? AND Active = "Yes"',
        [student_reg_number]
      );

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or inactive'
        });
      }

      // Check if category exists
      const [categories] = await conn.execute(
        'SELECT id, category_name FROM waiver_categories WHERE id = ? AND is_active = TRUE',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Waiver category not found'
        });
      }

      const student = students[0];
      const category = categories[0];

      // Create CREDIT transaction for waiver (money credited to student)
      let transactionDescription = `Fee Waiver - ${category.category_name}: ${reason}`;
      
      // Add term and year to description for better readability
      if (term && academic_year) {
        transactionDescription += ` - ${term} - ${academic_year}`;
      } else if (term) {
        transactionDescription += ` - ${term}`;
      } else if (academic_year) {
        transactionDescription += ` - ${academic_year}`;
      }
      
      if (notes) {
        transactionDescription += ` | Notes: ${notes}`;
      }
      
      // Create transaction with term and academic year
      const [transactionResult] = await conn.execute(`
        INSERT INTO student_transactions (
          student_reg_number, 
          transaction_type, 
          amount, 
          description, 
          term, 
          academic_year,
          created_by, 
          transaction_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        student_reg_number,
        'CREDIT',
        parseFloat(waiver_amount),
        transactionDescription,
        term || null,
        academic_year || null,
        req.user.id
      ]);

      const transactionId = transactionResult.insertId;

      // Update student balance
      await StudentBalanceService.updateBalanceOnTransaction(
        student_reg_number, 
        'CREDIT', 
        parseFloat(waiver_amount), 
        conn
      );

      // Log audit event
      try {
        await AuditLogger.log({
          userId: req.user.id,
          action: 'WAIVER_GRANTED',
          tableName: 'student_transactions',
          recordId: transactionId,
          newValues: {
            student_reg_number,
            student_name: `${student.Name} ${student.Surname}`,
            waiver_amount,
            category_name: category.category_name,
            reason,
            notes,
            term,
            academic_year
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      await conn.commit();

      res.status(201).json({
        success: true,
        message: 'Waiver processed successfully',
        data: {
          transaction_id: transactionId,
          student_reg_number,
          student_name: `${student.Name} ${student.Surname}`,
          waiver_amount,
          category_name: category.category_name,
          reason,
          term,
          academic_year
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error processing waiver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process waiver',
        error: error.message
      });
    } finally {
      conn.release();
    }
  }

  // Get waivers for a specific student
  async getStudentWaivers(req, res) {
    try {
      const { student_reg_number } = req.params;
      const { page = 1, limit = 50, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE st.student_reg_number = ? AND st.description LIKE "%Fee Waiver%"';
      let params = [student_reg_number];

      if (start_date) {
        whereClause += ' AND DATE(st.transaction_date) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND DATE(st.transaction_date) <= ?';
        params.push(end_date);
      }

      // Get total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM student_transactions st 
        ${whereClause}
      `, params);

      const totalRecords = countResult[0].total;

      // Get waivers
      const [waivers] = await pool.execute(`
        SELECT 
          st.id,
          st.student_reg_number,
          st.amount as waiver_amount,
          st.description,
          st.term,
          st.academic_year,
          st.transaction_date,
          st.created_at,
          u.username as created_by
        FROM student_transactions st
        LEFT JOIN users u ON st.created_by = u.id
        ${whereClause}
        ORDER BY st.transaction_date DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `, params);

      res.json({
        success: true,
        data: {
          student_reg_number,
          waivers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRecords,
            totalPages: Math.ceil(totalRecords / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching student waivers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student waivers'
      });
    }
  }

  // Get waiver summary for student
  async getStudentWaiverSummary(req, res) {
    try {
      const { student_reg_number } = req.params;

      const [summary] = await pool.execute(`
        SELECT 
          COUNT(*) as total_waivers,
          SUM(amount) as total_waived_amount,
          MIN(transaction_date) as first_waiver_date,
          MAX(transaction_date) as last_waiver_date
        FROM student_transactions 
        WHERE student_reg_number = ? 
        AND description LIKE "%Fee Waiver%"
      `, [student_reg_number]);

      res.json({
        success: true,
        data: summary[0]
      });
    } catch (error) {
      console.error('Error fetching waiver summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waiver summary'
      });
    }
  }

  // Get all waivers (admin view)
  async getAllWaivers(req, res) {
    try {
      const { page = 1, limit = 50, start_date, end_date, category_id, term, academic_year, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE st.description LIKE "%Fee Waiver%"';
      let params = [];

      if (start_date) {
        whereClause += ' AND DATE(st.transaction_date) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND DATE(st.transaction_date) <= ?';
        params.push(end_date);
      }

      if (category_id) {
        whereClause += ' AND st.description LIKE ?';
        params.push(`%${category_id}%`);
      }

      if (term) {
        whereClause += ' AND st.term = ?';
        params.push(term);
      }

      if (academic_year) {
        whereClause += ' AND st.academic_year = ?';
        params.push(academic_year);
      }

      if (search) {
        whereClause += ' AND (s.Name LIKE ? OR s.Surname LIKE ? OR st.student_reg_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM student_transactions st 
        ${whereClause}
      `, params);

      const totalRecords = countResult[0].total;

      // Get waivers
      const [waivers] = await pool.execute(`
        SELECT 
          st.id,
          st.student_reg_number,
          s.Name,
          s.Surname,
          st.amount as waiver_amount,
          st.description,
          st.term,
          st.academic_year,
          st.transaction_date,
          st.created_at,
          u.username as created_by
        FROM student_transactions st
        LEFT JOIN students s ON st.student_reg_number = s.RegNumber
        LEFT JOIN users u ON st.created_by = u.id
        ${whereClause}
        ORDER BY st.transaction_date DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `, params);

      res.json({
        success: true,
        data: {
          waivers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRecords,
            totalPages: Math.ceil(totalRecords / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching all waivers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waivers'
      });
    }
  }
}

module.exports = new WaiverController();
