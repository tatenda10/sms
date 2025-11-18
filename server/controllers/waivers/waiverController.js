const { pool } = require('../../config/database');
const StudentTransactionController = require('../students/studentTransactionController');
const StudentBalanceService = require('../../services/studentBalanceService');
const AccountBalanceService = require('../../services/accountBalanceService');
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
        academic_year,
        waiver_type = 'Tuition' // Default to Tuition if not specified
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
      const amount = parseFloat(waiver_amount);

      // Get base currency
      const [[currency]] = await conn.execute(
        'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const currency_id = currency ? currency.id : 1;

      // Map waiver type to account codes
      // Using 5600-5640 for waiver expenses to avoid conflict with Marketing (5500)
      const waiverAccountMap = {
        'Tuition': { expense: '5600', receivable: '1100' },
        'Boarding': { expense: '5610', receivable: '1110' },
        'Transport': { expense: '5620', receivable: '1110' },
        'Uniform': { expense: '5630', receivable: '1110' },
        'Other': { expense: '5640', receivable: '1100' }
      };

      const accounts = waiverAccountMap[waiver_type] || waiverAccountMap['Tuition'];

      // Get account IDs
      const [[expenseAccount]] = await conn.execute(
        'SELECT id, name FROM chart_of_accounts WHERE code = ?',
        [accounts.expense]
      );

      const [[receivableAccount]] = await conn.execute(
        'SELECT id, name FROM chart_of_accounts WHERE code = ?',
        [accounts.receivable]
      );

      if (!expenseAccount || !receivableAccount) {
        await conn.rollback();
        return res.status(500).json({
          success: false,
          message: 'Required accounts not found. Please ensure waiver expense accounts are set up.'
        });
      }

      // Get or create journal for waivers
      let journal_id = 1; // Try General Journal (ID: 1) first
      const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journal_id]);
      if (journalCheck.length === 0) {
        // Try to find journal by name
        const [journalByName] = await conn.execute('SELECT id FROM journals WHERE name = ? LIMIT 1', ['General Journal']);
        if (journalByName.length > 0) {
          journal_id = journalByName[0].id;
        } else {
          // Try to find any existing journal
          const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
          if (anyJournal.length > 0) {
            journal_id = anyJournal[0].id;
          } else {
            // Create General Journal if no journals exist
            const [journalResult] = await conn.execute(
              'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
              ['General Journal', 'Journal for general transactions including waivers', 1]
            );
            journal_id = journalResult.insertId;
          }
        }
      }

      // Create journal entry
      const refNumber = `WAIVER-${Date.now()}`;
      let journalDescription = `Fee Waiver - ${waiver_type} - ${category.category_name}: ${reason}`;
      if (term && academic_year) {
        journalDescription += ` - ${term} ${academic_year}`;
      }
      journalDescription += ` - ${student.Name} ${student.Surname} (${student_reg_number})`;

      const [journalResult] = await conn.execute(`
        INSERT INTO journal_entries (
          journal_id, entry_date, description, reference, created_by, created_at, updated_at
        ) VALUES (?, NOW(), ?, ?, ?, NOW(), NOW())
      `, [journal_id, journalDescription, refNumber, req.user.id]);

      const journalEntryId = journalResult.insertId;

      // Create journal entry lines
      // DEBIT: Waiver Expense (increases expense)
      await conn.execute(`
        INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, currency_id, description
        ) VALUES (?, ?, ?, 0, ?, ?)
      `, [journalEntryId, expenseAccount.id, amount, currency_id, `Waiver Expense - ${waiver_type}`]);

      // CREDIT: Accounts Receivable (reduces what student owes)
      await conn.execute(`
        INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, currency_id, description
        ) VALUES (?, ?, 0, ?, ?, ?)
      `, [journalEntryId, receivableAccount.id, amount, currency_id, `Reduce AR - ${student.Name} ${student.Surname}`]);

      // Update account balances
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);

      // Create CREDIT transaction for waiver (money credited to student)
      let transactionDescription = `Fee Waiver - ${category.category_name}: ${reason}`;
      if (term && academic_year) {
        transactionDescription += ` - ${term} - ${academic_year}`;
      }
      if (notes) {
        transactionDescription += ` | Notes: ${notes}`;
      }

      const [transactionResult] = await conn.execute(`
        INSERT INTO student_transactions (
          student_reg_number, transaction_type, amount, currency_id, description, 
          term, academic_year, created_by, transaction_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        student_reg_number, 'CREDIT', amount, currency_id,
        transactionDescription, term || null, academic_year || null, req.user.id
      ]);

      const transactionId = transactionResult.insertId;

      // Update student balance
      await StudentBalanceService.updateBalanceOnTransaction(
        student_reg_number, 'CREDIT', amount, conn
      );

      // Create waiver record
      const [waiverResult] = await conn.execute(`
        INSERT INTO waivers (
          student_reg_number, category_id, waiver_amount, currency_id,
          waiver_type, reason, notes, term, academic_year,
          journal_entry_id, student_transaction_id,
          granted_by, granted_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        student_reg_number, category_id, amount, currency_id,
        waiver_type, reason, notes || null, term || null, academic_year || null,
        journalEntryId, transactionId, req.user.id
      ]);

      // Log audit event
      try {
        await AuditLogger.log({
          userId: req.user.id,
          action: 'WAIVER_GRANTED',
          tableName: 'waivers',
          recordId: waiverResult.insertId,
          newValues: {
            student_reg_number,
            student_name: `${student.Name} ${student.Surname}`,
            waiver_amount: amount,
            waiver_type,
            category_name: category.category_name,
            reason,
            notes,
            term,
            academic_year,
            journal_entry_id: journalEntryId
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
        message: 'Waiver processed successfully with proper accounting',
        data: {
          waiver_id: waiverResult.insertId,
          transaction_id: transactionId,
          journal_entry_id: journalEntryId,
          student_reg_number,
          student_name: `${student.Name} ${student.Surname}`,
          waiver_amount: amount,
          waiver_type,
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
