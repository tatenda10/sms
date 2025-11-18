const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentTransactionController = require('../students/studentTransactionController');
const StudentBalanceService = require('../../services/studentBalanceService');
const AccountBalanceService = require('../../services/accountBalanceService');

class AdditionalFeeController {
  // ==========================================
  // FEE STRUCTURES MANAGEMENT
  // ==========================================

  // Get all fee structures
  static async getFeeStructures(req, res) {
    try {
      const { academic_year } = req.query;
      
      let query = `
        SELECT 
          afs.*,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM additional_fee_structures afs
        LEFT JOIN currencies c ON afs.currency_id = c.id
        WHERE afs.is_active = TRUE
      `;
      
      const params = [];
      
      if (academic_year) {
        query += ` AND (afs.academic_year = ? OR afs.academic_year IS NULL)`;
        params.push(academic_year);
      }
      
      query += ` ORDER BY afs.fee_name`;

      const [structures] = await pool.execute(query, params);

      res.json({
        success: true,
        data: structures
      });
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch fee structures' });
    }
  }

  // Create new fee structure
  static async createFeeStructure(req, res) {
    const conn = await pool.getConnection();
    try {
      const { fee_name, description, amount, currency_id, fee_type, academic_year } = req.body;

      // Validate required fields
      if (!fee_name || !amount || !currency_id || !fee_type) {
        return res.status(400).json({
          success: false,
          message: 'Fee name, amount, currency ID, and fee type are required'
        });
      }

      await conn.beginTransaction();

      // Check if fee structure already exists
      const [existing] = await conn.execute(
        'SELECT id FROM additional_fee_structures WHERE fee_name = ?',
        [fee_name]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure with this name already exists'
        });
      }

      // Check if currency exists
      const [currency] = await conn.execute(
        'SELECT id FROM currencies WHERE id = ?',
        [currency_id]
      );

      if (currency.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Currency not found'
        });
      }

      // Create fee structure
      // Convert undefined values to null for SQL (MySQL2 doesn't accept undefined)
      const sqlDescription = description !== undefined ? description : null;
      const sqlAcademicYear = academic_year !== undefined ? academic_year : null;
      const sqlCreatedBy = req.user?.id !== undefined ? req.user?.id : null;
      
      const [result] = await conn.execute(`
        INSERT INTO additional_fee_structures (fee_name, description, amount, currency_id, fee_type, academic_year, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [fee_name, sqlDescription, amount, currency_id, fee_type, sqlAcademicYear, sqlCreatedBy]);

      await conn.commit();

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: { id: result.insertId }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error creating fee structure:', error);
      res.status(500).json({ success: false, message: 'Failed to create fee structure' });
    } finally {
      conn.release();
    }
  }

  // Update fee structure
  static async updateFeeStructure(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { fee_name, description, amount, currency_id, fee_type, is_active } = req.body;

      await conn.beginTransaction();

      // Check if fee structure exists
      const [existing] = await conn.execute(
        'SELECT id FROM additional_fee_structures WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      // Update fee structure
      await conn.execute(`
        UPDATE additional_fee_structures 
        SET fee_name = ?, description = ?, amount = ?, currency_id = ?, fee_type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [fee_name, description, amount, currency_id, fee_type, is_active, id]);

      await conn.commit();

      res.json({
        success: true,
        message: 'Fee structure updated successfully'
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error updating fee structure:', error);
      res.status(500).json({ success: false, message: 'Failed to update fee structure' });
    } finally {
      conn.release();
    }
  }

  // ==========================================
  // STUDENT FEE ASSIGNMENTS
  // ==========================================

  // Get student fee assignments
  static async getStudentFeeAssignments(req, res) {
    try {
      const { studentRegNumber, academicYear } = req.params;

      const [assignments] = await pool.execute(`
        SELECT 
          sfa.*,
          afs.fee_name,
          afs.description as fee_description,
          afs.fee_type,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM student_fee_assignments sfa
        LEFT JOIN additional_fee_structures afs ON sfa.fee_structure_id = afs.id
        LEFT JOIN currencies c ON sfa.currency_id = c.id
        WHERE sfa.student_reg_number = ? AND sfa.academic_year = ?
        ORDER BY sfa.assigned_at DESC
      `, [studentRegNumber, academicYear]);

      res.json({
        success: true,
        data: assignments
      });

    } catch (error) {
      console.error('Error fetching student fee assignments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch student fee assignments' });
    }
  }

  // Assign fee to specific students (manual assignment)
  static async assignFeeToStudents(req, res) {
    console.log('🚀🚀🚀 assignFeeToStudents METHOD CALLED! 🚀🚀🚀');
    console.log('🚀 assignFeeToStudents called with data:', req.body);
    console.log('🚀 Request method:', req.method);
    console.log('🚀 Request URL:', req.url);
    console.log('🚀 Request headers:', req.headers);
    const conn = await pool.getConnection();
    try {
      const { 
        fee_structure_id, 
        student_reg_numbers, 
        academic_year, 
        term = null,
        due_date 
      } = req.body;
      
      console.log('📝 Parsed data:', {
        fee_structure_id,
        student_reg_numbers,
        academic_year,
        term,
        due_date
      });

      // Validate required fields
      if (!fee_structure_id || !student_reg_numbers || !academic_year) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure ID, student registration numbers, and academic year are required'
        });
      }

      await conn.beginTransaction();

      // Get fee structure details
      const [feeStructure] = await conn.execute(`
        SELECT * FROM additional_fee_structures WHERE id = ? AND is_active = TRUE
      `, [fee_structure_id]);

      if (feeStructure.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      const fee = feeStructure[0];
      let assignmentsCreated = 0;
      const assignmentIds = [];

      // Assign fee to each student
      for (const regNumber of student_reg_numbers) {
        console.log('🔍 Processing student:', regNumber);
        // Check if student exists
        const [student] = await conn.execute(
          'SELECT RegNumber, Active FROM students WHERE RegNumber = ?',
          [regNumber]
        );
        console.log('🔍 Student lookup result:', student);
        
        if (student.length === 0) {
          console.log('❌ Student not found:', regNumber);
          continue;
        }
        
        if (student[0].Active !== 'Yes') {
          console.log('❌ Student not active:', regNumber, 'Active status:', student[0].Active);
          continue;
        }

        // Check if assignment already exists
        const [existing] = await conn.execute(`
          SELECT id FROM student_fee_assignments 
          WHERE student_reg_number = ? AND fee_structure_id = ? AND academic_year = ?
        `, [regNumber, fee_structure_id, academic_year]);

        if (existing.length === 0) {
          // Handle empty due_date - convert to NULL if empty string
          const processedDueDate = due_date && due_date.trim() !== '' ? due_date : null;
          
          // Create fee assignment
          const [assignmentResult] = await conn.execute(`
            INSERT INTO student_fee_assignments 
            (student_reg_number, fee_structure_id, academic_year, term, amount, currency_id, due_date, assigned_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [regNumber, fee_structure_id, academic_year, term, fee.amount, fee.currency_id, processedDueDate, req.user?.id]);
          
          const assignmentId = assignmentResult.insertId;
          assignmentIds.push(assignmentId);

          // Create student transaction record using the same pattern as other controllers
          const transactionDescription = `${fee.fee_name} - ${fee.description || 'Additional Fee'}`;
          
          await StudentTransactionController.createTransactionHelper(
            regNumber,
            'DEBIT',
            fee.amount,
            transactionDescription,
            {
              term: term,
              academic_year: academic_year,
              class_id: null,
              hostel_id: null,
              enrollment_id: null,
              created_by: req.user?.id
            }
          );

          // Update student balance
          await StudentBalanceService.updateBalanceOnTransaction(
            regNumber, 
            'DEBIT', 
            fee.amount, 
            conn
          );

          // Create journal entries for accounting (DEBIT Accounts Receivable, CREDIT Revenue)
          await AdditionalFeeController.createFeeAssignmentJournalEntries(conn, {
            student_reg_number: regNumber,
            fee_amount: fee.amount,
            currency_id: fee.currency_id,
            fee_name: fee.fee_name,
            academic_year: academic_year,
            term: term,
            created_by: req.user?.id
          });

          assignmentsCreated++;
        }
      }

      await conn.commit();

      const response = {
        success: true,
        message: `Fee assigned to ${assignmentsCreated} students`,
        data: { 
          assignments_created: assignmentsCreated,
          assignment_ids: assignmentIds
        }
      };
      
      console.log('✅ assignFeeToStudents response:', response);
      res.json(response);

    } catch (error) {
      await conn.rollback();
      console.error('Error assigning fee to students:', error);
      res.status(500).json({ success: false, message: 'Failed to assign fee to students' });
    } finally {
      conn.release();
    }
  }

  // Generate annual fees for all students (bulk operation)
  static async generateAnnualFeesForAllStudents(req, res) {
    const conn = await pool.getConnection();
    try {
      const { fee_structure_id, academic_year, due_date } = req.body;

      // Validate required fields
      if (!fee_structure_id || !academic_year) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure ID and academic year are required'
        });
      }

      await conn.beginTransaction();

      // Get fee structure details
      const [feeStructure] = await conn.execute(`
        SELECT * FROM additional_fee_structures WHERE id = ? AND is_active = TRUE AND fee_type = 'annual'
      `, [fee_structure_id]);

      if (feeStructure.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Annual fee structure not found'
        });
      }

      const fee = feeStructure[0];

      // Get all active students
      const [students] = await conn.execute(
        'SELECT RegNumber FROM students WHERE Active = ?',
        ['Yes']
      );

      let assignmentsCreated = 0;

      // Assign fee to all students
      for (const student of students) {
        try {
          // Check if assignment already exists
          const [existing] = await conn.execute(`
            SELECT id FROM student_fee_assignments 
            WHERE student_reg_number = ? AND fee_structure_id = ? AND academic_year = ?
          `, [student.RegNumber, fee_structure_id, academic_year]);

          if (existing.length === 0) {
            // Handle empty due_date - convert to NULL if empty string
            const processedDueDate = due_date && due_date.trim() !== '' ? due_date : null;
            
            // Create fee assignment
            await conn.execute(`
              INSERT INTO student_fee_assignments 
              (student_reg_number, fee_structure_id, academic_year, amount, currency_id, due_date, assigned_by)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [student.RegNumber, fee_structure_id, academic_year, fee.amount, fee.currency_id, processedDueDate, req.user?.id]);

            // Create student transaction record using the same pattern as other controllers
            const transactionDescription = `${fee.fee_name} - ${fee.description || 'Additional Fee'}`;
            
            await StudentTransactionController.createTransactionHelper(
              student.RegNumber,
              'DEBIT',
              fee.amount,
              transactionDescription,
              {
                term: null,
                academic_year: academic_year,
                class_id: null,
                hostel_id: null,
                enrollment_id: null,
                created_by: req.user?.id
              }
            );

            // Update student balance
            await StudentBalanceService.updateBalanceOnTransaction(
              student.RegNumber, 
              'DEBIT', 
              fee.amount, 
              conn
            );

            // Create journal entries for accounting (DEBIT Accounts Receivable, CREDIT Revenue)
            await AdditionalFeeController.createFeeAssignmentJournalEntries(conn, {
              student_reg_number: student.RegNumber,
              fee_amount: fee.amount,
              currency_id: fee.currency_id,
              fee_name: fee.fee_name,
              academic_year: academic_year,
              term: null,
              created_by: req.user?.id
            });

            assignmentsCreated++;
            console.log(`Successfully processed fee assignment for student ${student.RegNumber}`);
          } else {
            console.log(`Fee assignment already exists for student ${student.RegNumber}`);
          }
        } catch (studentError) {
          console.error(`Error processing student ${student.RegNumber}:`, studentError);
          // Continue with next student instead of failing the entire operation
          continue;
        }
      }

      await conn.commit();

      res.json({
        success: true,
        message: `Annual fee generated for ${assignmentsCreated} students`,
        data: { 
          assignments_created: assignmentsCreated,
          total_students: students.length
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error generating annual fees:', error);
      res.status(500).json({ success: false, message: 'Failed to generate annual fees' });
    } finally {
      conn.release();
    }
  }

  // ==========================================
  // FEE PAYMENTS
  // ==========================================

  // Process fee payment (direct payment without assignments)
  static async processFeePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      console.log('🚀 Starting direct additional fee payment processing...');
      console.log('📝 Request data:', req.body);
      
      const {
        student_reg_number,
        fee_structure_id,
        amount,
        currency_id,
        exchange_rate = 1.0000,
        payment_method,
        reference_number,
        receipt_number,
        academic_year
      } = req.body;

      // Validate required fields
      if (!student_reg_number || !fee_structure_id || !amount || 
          !currency_id || !payment_method) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Student registration number, fee structure ID, amount, currency, and payment method are required'
        });
      }

      // Validate payment method against ENUM values
      const validPaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other'];
      if (!validPaymentMethods.includes(payment_method)) {
        console.log('❌ Invalid payment method:', payment_method);
        return res.status(400).json({
          success: false,
          message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`
        });
      }

      console.log('✅ Validation passed, starting transaction...');
      await conn.beginTransaction();

      // Check if student exists
      console.log('🔍 Checking if student exists:', student_reg_number);
      const [student] = await conn.execute(
        'SELECT RegNumber FROM students WHERE RegNumber = ? AND Active = ?',
        [student_reg_number, 'Yes']
      );

      if (student.length === 0) {
        console.log('❌ Student not found:', student_reg_number);
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      console.log('✅ Student found:', student[0].RegNumber);

      // Get fee structure details
      console.log('🔍 Getting fee structure:', fee_structure_id);
      const [feeStructure] = await conn.execute(`
        SELECT * FROM additional_fee_structures WHERE id = ? AND is_active = TRUE
      `, [fee_structure_id]);

      if (feeStructure.length === 0) {
        console.log('❌ Fee structure not found');
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      const fee = feeStructure[0];
      console.log('✅ Fee structure found:', fee);

      // Calculate base currency amount
      const base_currency_amount = amount * exchange_rate;
      console.log('💵 Base currency amount:', base_currency_amount);
      console.log('🔍 Payment method received:', payment_method, 'Type:', typeof payment_method, 'Length:', payment_method?.length);

      // Create payment record
      console.log('💳 Creating payment record...');
      
      // First, let's try to create the table if it doesn't exist or has wrong structure
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS additional_fee_payments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_reg_number VARCHAR(50) NOT NULL,
            fee_assignment_id INT NOT NULL,
            payment_amount DECIMAL(10,2) NOT NULL,
            currency_id INT NOT NULL,
            exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
            base_currency_amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other') NOT NULL,
            payment_date DATE NOT NULL,
            reference_number VARCHAR(100),
            receipt_number VARCHAR(100) UNIQUE,
            notes TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);
        console.log('✅ Table structure ensured');
      } catch (tableError) {
        console.log('⚠️ Table creation/check failed, continuing with insert:', tableError.message);
      }
      
      const [paymentResult] = await conn.execute(`
        INSERT INTO additional_fee_payments 
        (student_reg_number, fee_assignment_id, payment_amount, currency_id, exchange_rate, 
         base_currency_amount, payment_method, payment_date, reference_number, receipt_number, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
      `, [
        student_reg_number,
        fee_structure_id, // Using fee_structure_id as fee_assignment_id for direct payments
        amount,
        currency_id,
        exchange_rate,
        base_currency_amount,
        payment_method,
        reference_number,
        receipt_number,
        req.user?.id || 1
      ]);
      console.log('✅ Payment record created with ID:', paymentResult.insertId);

      // Create journal entries for accounting
      console.log('📊 Creating journal entries...');
      const journalEntryId = await AdditionalFeeController.createJournalEntries(conn, {
        student_reg_number,
        payment_amount: base_currency_amount,
        currency_id,
        payment_method,
        payment_date: new Date().toISOString().split('T')[0], // Add payment date
        reference_number,
        fee_name: fee.fee_name || 'Additional Fee'
      });
      console.log('✅ Journal entries created');

      // Update account balances
      console.log('💰 Updating account balances...');
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
      console.log('✅ Account balances updated');

      // Create student transaction record directly
      console.log('📋 Creating student transaction...');
      const transactionDescription = `Additional Fee Payment - ${fee.fee_name || 'Additional Fee'} - ${payment_method}`;

      const [transactionResult] = await conn.execute(`
        INSERT INTO student_transactions (
          student_reg_number, transaction_type, amount, description,
          term, academic_year, transaction_date, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())
      `, [
        student_reg_number,
        'CREDIT',
        base_currency_amount,
        transactionDescription,
        null, // term
        academic_year, // academic_year
        req.user?.id || 1 // created_by
      ]);

      console.log('✅ Student transaction created with ID:', transactionResult.insertId);

      // Update student balance directly
      console.log('💰 Updating student balance...');
      const [balanceResult] = await conn.execute(`
        INSERT INTO student_balances (student_reg_number, current_balance, last_updated)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        current_balance = current_balance + ?,
        last_updated = NOW()
      `, [student_reg_number, base_currency_amount, base_currency_amount]);
      console.log('✅ Student balance updated:', balanceResult);

      console.log('✅ All operations completed successfully, committing transaction...');
      await conn.commit();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment_id: paymentResult.insertId,
          transaction_id: transactionResult.insertId,
          amount: base_currency_amount
        }
      });

    } catch (error) {
      console.error('❌ Error processing payment:', error);
      await conn.rollback();
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: error.message
      });
    } finally {
      conn.release();
    }
  }

  // Get student payment history for additional fees
  static async getStudentPaymentHistory(req, res) {
    try {
      const { studentRegNumber, academicYear } = req.params;

      const [payments] = await pool.execute(`
        SELECT 
          afp.*,
          afs.fee_name,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM additional_fee_payments afp
        LEFT JOIN student_fee_assignments sfa ON afp.fee_assignment_id = sfa.id
        LEFT JOIN additional_fee_structures afs ON sfa.fee_structure_id = afs.id
        LEFT JOIN currencies c ON afp.currency_id = c.id
        WHERE afp.student_reg_number = ? AND sfa.academic_year = ?
        ORDER BY afp.payment_date DESC
      `, [studentRegNumber, academicYear]);

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
  }

  // Get fee assignment statistics
  static async getFeeAssignmentStats(req, res) {
    try {
      const { academicYear } = req.params;

      const [stats] = await pool.execute(`
        SELECT 
          afs.fee_name,
          afs.fee_type,
          COUNT(sfa.id) as total_assignments,
          SUM(sfa.amount) as total_amount,
          SUM(sfa.paid_amount) as total_paid,
          SUM(sfa.balance) as total_balance,
          COUNT(CASE WHEN sfa.status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN sfa.status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN sfa.status = 'overdue' THEN 1 END) as overdue_count
        FROM additional_fee_structures afs
        LEFT JOIN student_fee_assignments sfa ON afs.id = sfa.fee_structure_id AND sfa.academic_year = ?
        WHERE afs.is_active = TRUE
        GROUP BY afs.id, afs.fee_name, afs.fee_type
        ORDER BY afs.fee_name
      `, [academicYear]);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching fee assignment stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch fee assignment statistics' });
    }
  }

  // Get fee assignments for a specific student
  static async getStudentFeeAssignments(req, res) {
    try {
      const { studentRegNumber } = req.params;

      const [assignments] = await pool.execute(`
        SELECT 
          sfa.*,
          afs.fee_name,
          afs.description,
          afs.fee_type,
          c.symbol as currency_symbol
        FROM student_fee_assignments sfa
        LEFT JOIN additional_fee_structures afs ON sfa.fee_structure_id = afs.id
        LEFT JOIN currencies c ON sfa.currency_id = c.id
        WHERE sfa.student_reg_number = ?
        ORDER BY sfa.assigned_at DESC
      `, [studentRegNumber]);

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching student fee assignments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch student fee assignments' });
    }
  }

  // Process payment for additional fees
  static async processPayment(req, res) {
    const conn = await pool.getConnection();
    try {
      const {
        student_reg_number,
        fee_assignment_id,
        payment_amount,
        payment_method,
        payment_date,
        notes
      } = req.body;

      // Validate required fields
      if (!student_reg_number || !fee_assignment_id || !payment_amount || !payment_method || !payment_date) {
        return res.status(400).json({
          success: false,
          message: 'Student registration number, fee assignment ID, payment amount, method, and date are required'
        });
      }

      await conn.beginTransaction();

      // Get fee assignment details
      const [assignment] = await conn.execute(`
        SELECT sfa.*, afs.fee_name, afs.description
        FROM student_fee_assignments sfa
        LEFT JOIN additional_fee_structures afs ON sfa.fee_structure_id = afs.id
        WHERE sfa.id = ? AND sfa.student_reg_number = ?
      `, [fee_assignment_id, student_reg_number]);

      if (assignment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fee assignment not found'
        });
      }

      const feeAssignment = assignment[0];
      const newPaidAmount = (parseFloat(feeAssignment.paid_amount) || 0) + parseFloat(payment_amount);
      const newBalance = parseFloat(feeAssignment.amount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending');

      // Update fee assignment
      await conn.execute(`
        UPDATE student_fee_assignments 
        SET paid_amount = ?, balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newPaidAmount, newBalance, newStatus, fee_assignment_id]);

      // Create payment record
      const [paymentResult] = await conn.execute(`
        INSERT INTO additional_fee_payments 
        (student_reg_number, fee_assignment_id, payment_amount, currency_id, payment_method, payment_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [student_reg_number, fee_assignment_id, payment_amount, feeAssignment.currency_id, payment_method, payment_date, notes, req.user?.id]);

      // Create student transaction record
      const transactionDescription = `Additional Fee Payment - ${feeAssignment.fee_name} - ${payment_method}`;
      
      await StudentTransactionController.createTransactionHelper(
        student_reg_number,
        'CREDIT',
        parseFloat(payment_amount),
        transactionDescription,
        {
          term: feeAssignment.term,
          academic_year: feeAssignment.academic_year,
          class_id: null,
          hostel_id: null,
          enrollment_id: null,
          created_by: req.user?.id
        }
      );

      // Update student balance
      await StudentBalanceService.updateBalanceOnTransaction(
        student_reg_number, 
        'CREDIT', 
        parseFloat(payment_amount), 
        conn
      );

      // Create journal entries for accounting
      await AdditionalFeeController.createJournalEntries(conn, {
        student_reg_number,
        payment_amount: parseFloat(payment_amount),
        payment_method,
        payment_date,
        currency_id: feeAssignment.currency_id,
        fee_name: feeAssignment.fee_name,
        created_by: req.user?.id
      });

      await conn.commit();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment_id: paymentResult.insertId,
          new_balance: newBalance,
          new_status: newStatus
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error processing payment:', error);
      res.status(500).json({ success: false, message: 'Failed to process payment' });
    } finally {
      conn.release();
    }
  }

  // Create journal entries for double-entry bookkeeping
  static async createJournalEntries(conn, paymentData) {
    try {
      // Get student name
      const [students] = await conn.execute(
        'SELECT Name, Surname FROM students WHERE RegNumber = ?',
        [paymentData.student_reg_number]
      );

      if (students.length === 0) {
        throw new Error('Student not found');
      }

      const student_name = `${students[0].Name} ${students[0].Surname}`;

      // Determine account based on payment method
      let debitAccountCode;
      if (paymentData.payment_method === 'Cash') {
        debitAccountCode = '1000'; // Cash on Hand
      } else if (paymentData.payment_method === 'Bank Transfer' || paymentData.payment_method === 'Mobile Money') {
        debitAccountCode = '1010'; // Bank Account
      } else if (paymentData.payment_method === 'Cheque') {
        debitAccountCode = '1010'; // Bank Account (cheques go to bank)
      } else {
        debitAccountCode = '1000'; // Default to Cash on Hand
      }

      // Get Cash/Bank account
      const [debitAccounts] = await conn.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
        [debitAccountCode, 'Asset']
      );

      if (debitAccounts.length === 0) {
        throw new Error(`${debitAccountCode} account not found in chart of accounts`);
      }

      const debitAccountId = debitAccounts[0].id;

      // Get Additional Fees Revenue account (code 4400)
      const [revenueAccounts] = await conn.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
        ['4400', 'Revenue']
      );

      if (revenueAccounts.length === 0) {
        // Fallback: try to find by name
        const [fallbackRevenue] = await conn.execute(
          'SELECT id FROM chart_of_accounts WHERE type = ? AND (name LIKE ? OR name LIKE ?) LIMIT 1',
          ['Revenue', '%additional%', '%fee%']
        );
        
        if (fallbackRevenue.length === 0) {
          // Last resort: any revenue account
          const [anyRevenue] = await conn.execute(
            'SELECT id FROM chart_of_accounts WHERE type = ? LIMIT 1',
            ['Revenue']
          );
          
          if (anyRevenue.length === 0) {
            throw new Error('Additional Fees Revenue account (4400) not found in chart of accounts');
          }
          
          revenueAccounts[0] = anyRevenue[0];
        } else {
          revenueAccounts[0] = fallbackRevenue[0];
        }
      }

      const revenueAccountId = revenueAccounts[0].id;

      // Create journal entry header
      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries 
         (journal_id, entry_date, reference, description) 
         VALUES (?, ?, ?, ?)`,
        [1, paymentData.payment_date, `AF${Date.now()}`, `Additional Fee Payment - ${student_name} (${paymentData.student_reg_number}) - ${paymentData.fee_name}`]
      );

      const journalEntryId = journalResult.insertId;

      // Create journal entry lines
      const journalLines = [
        // Debit: Cash/Bank (increase asset)
        {
          journal_entry_id: journalEntryId,
          account_id: debitAccountId,
          debit_amount: paymentData.payment_amount,
          credit_amount: 0,
          description: `Additional fee payment - ${student_name} (${paymentData.student_reg_number})`
        },
        // Credit: Additional Fees Revenue (increase revenue)
        {
          journal_entry_id: journalEntryId,
          account_id: revenueAccountId,
          debit_amount: 0,
          credit_amount: paymentData.payment_amount,
          description: `Additional fee revenue - ${paymentData.fee_name} - ${student_name} (${paymentData.student_reg_number})`
        }
      ];

      for (const line of journalLines) {
        await conn.execute(
          `INSERT INTO journal_entry_lines 
           (journal_entry_id, account_id, debit, credit, description) 
           VALUES (?, ?, ?, ?, ?)`,
          [line.journal_entry_id, line.account_id, line.debit_amount, line.credit_amount, line.description]
        );
      }

      console.log(`Created journal entry ${journalEntryId} for additional fee payment ${paymentData.student_reg_number}`);
      return journalEntryId;
    } catch (error) {
      console.error('Error creating journal entries:', error);
      throw error;
    }
  }

  // Create journal entries when fee is assigned to student (not when paid)
  static async createFeeAssignmentJournalEntries(conn, assignmentData) {
    try {
      // Get student name
      const [students] = await conn.execute(
        'SELECT Name, Surname FROM students WHERE RegNumber = ?',
        [assignmentData.student_reg_number]
      );

      if (students.length === 0) {
        throw new Error('Student not found');
      }

      const student_name = `${students[0].Name} ${students[0].Surname}`;

      // Get Accounts Receivable account (code 1100)
      const [arAccounts] = await conn.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
        ['1100', 'Asset']
      );

      if (arAccounts.length === 0) {
        throw new Error('Accounts Receivable account (1100) not found in chart of accounts');
      }

      const arAccountId = arAccounts[0].id;

      // Get Additional Fees Revenue account (code 4400)
      const [revenueAccounts] = await conn.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
        ['4400', 'Revenue']
      );

      if (revenueAccounts.length === 0) {
        // Fallback: try to find by name
        const [fallbackRevenue] = await conn.execute(
          'SELECT id FROM chart_of_accounts WHERE type = ? AND (name LIKE ? OR name LIKE ?) LIMIT 1',
          ['Revenue', '%additional%', '%fee%']
        );
        
        if (fallbackRevenue.length === 0) {
          throw new Error('Additional Fees Revenue account (4400) not found in chart of accounts');
        }
        
        revenueAccounts[0] = fallbackRevenue[0];
      }

      const revenueAccountId = revenueAccounts[0].id;

      // Get or create journal for additional fees
      let journal_id = 1; // Try General Journal (ID: 1) first
      const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journal_id]);
      if (journalCheck.length === 0) {
        const [journalByName] = await conn.execute('SELECT id FROM journals WHERE name = ? LIMIT 1', ['General Journal']);
        if (journalByName.length > 0) {
          journal_id = journalByName[0].id;
        } else {
          const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
          if (anyJournal.length > 0) {
            journal_id = anyJournal[0].id;
          } else {
            const [journalResult] = await conn.execute(
              'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
              ['General Journal', 'Journal for general transactions including additional fees', 1]
            );
            journal_id = journalResult.insertId;
          }
        }
      }

      // Create journal entry header
      const reference = `AF-ASSIGN-${assignmentData.student_reg_number}-${Date.now()}`;
      const description = `Additional Fee Assignment - ${assignmentData.fee_name} - ${student_name} (${assignmentData.student_reg_number})`;
      if (assignmentData.academic_year) {
        description += ` - ${assignmentData.academic_year}`;
      }
      if (assignmentData.term) {
        description += ` - ${assignmentData.term}`;
      }

      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries 
         (journal_id, entry_date, reference, description, created_by, created_at, updated_at) 
         VALUES (?, CURDATE(), ?, ?, ?, NOW(), NOW())`,
        [journal_id, reference, description, assignmentData.created_by || 1]
      );

      const journalEntryId = journalResult.insertId;

      // Create journal entry lines
      // DEBIT: Accounts Receivable (student owes more)
      await conn.execute(
        `INSERT INTO journal_entry_lines 
         (journal_entry_id, account_id, debit, credit, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [journalEntryId, arAccountId, assignmentData.fee_amount, 0, `Additional Fee - ${assignmentData.fee_name} - ${student_name}`]
      );

      // CREDIT: Additional Fees Revenue (revenue earned)
      await conn.execute(
        `INSERT INTO journal_entry_lines 
         (journal_entry_id, account_id, debit, credit, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [journalEntryId, revenueAccountId, 0, assignmentData.fee_amount, `Additional Fee Revenue - ${assignmentData.fee_name}`]
      );

      // Update account balances
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, assignmentData.currency_id || 1);

      console.log(`Created journal entry ${journalEntryId} for additional fee assignment ${assignmentData.student_reg_number}`);
      return journalEntryId;
    } catch (error) {
      console.error('Error creating fee assignment journal entries:', error);
      throw error;
    }
  }
}

module.exports = AdditionalFeeController;
