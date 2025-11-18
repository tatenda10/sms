const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentTransactionController = require('../students/studentTransactionController');
const StudentBalanceService = require('../../services/studentBalanceService');
const AccountBalanceService = require('../../services/accountBalanceService');

// Helper function to create journal entries for boarding enrollment
async function createBoardingEnrollmentJournalEntries(conn, student_regnumber, amount, description, term, academic_year, created_by) {
    try {
        // Get account IDs
        const [accountsReceivable] = await conn.execute(
            'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ?',
            ['1100', 'Asset'] // Accounts Receivable - Tuition
        );
        
        // Use Tuition Revenue - Boarders account (4002)
        const [boardingRevenue] = await conn.execute(
            'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ?',
            ['4002', 'Revenue'] // Tuition Revenue - Boarders
        );

        if (accountsReceivable.length === 0 || boardingRevenue.length === 0) {
            throw new Error('Required accounts not found in chart of accounts (1100 or 4002)');
        }

        const accountsReceivableId = accountsReceivable[0].id;
        const boardingRevenueId = boardingRevenue[0].id;

        // Get or create journal for boarding enrollments
        let journal_id = 6; // Try Fees Journal (ID: 6) first
        const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journal_id]);
        if (journalCheck.length === 0) {
            // Try to find journal by name
            const [journalByName] = await conn.execute('SELECT id FROM journals WHERE name = ? LIMIT 1', ['Fees Journal']);
            if (journalByName.length > 0) {
                journal_id = journalByName[0].id;
            } else {
                // Try to find any existing journal
                const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
                if (anyJournal.length > 0) {
                    journal_id = anyJournal[0].id;
                } else {
                    // Create Fees Journal if no journals exist
                    const [journalResult] = await conn.execute(
                        'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
                        ['Fees Journal', 'Journal for fee payment transactions including boarding enrollments', 1]
                    );
                    journal_id = journalResult.insertId;
                }
            }
        }

        // Create journal entry (using Fees Journal)
        const [journalEntry] = await conn.execute(
            `INSERT INTO journal_entries (journal_id, entry_date, description, reference, created_by) 
             VALUES (?, CURDATE(), ?, ?, ?)`,
            [
                journal_id,
                description,
                `BOARDING-${student_regnumber}-${Date.now()}`,
                created_by
            ]
        );

        const journalEntryId = journalEntry.insertId;

        // Create journal entry lines
        const journalLines = [
            {
                journal_entry_id: journalEntryId,
                account_id: accountsReceivableId,
                debit_amount: amount,
                credit_amount: 0,
                description: `Accounts Receivable - ${student_regnumber}`
            },
            {
                journal_entry_id: journalEntryId,
                account_id: boardingRevenueId,
                debit_amount: 0,
                credit_amount: amount,
                description: `Boarding Revenue - ${student_regnumber}`
            }
        ];

        for (const line of journalLines) {
            await conn.execute(
                `INSERT INTO journal_entry_lines 
                 (journal_entry_id, account_id, debit, credit, description) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    line.journal_entry_id,
                    line.account_id,
                    line.debit_amount,
                    line.credit_amount,
                    line.description
                ]
            );
        }

        console.log(`Created journal entry ${journalEntryId} for boarding enrollment: ${student_regnumber}, Amount: ${amount}`);
        return journalEntryId;

    } catch (error) {
        console.error('Error creating boarding enrollment journal entries:', error);
        throw error;
    }
}

class EnrollmentController {
  // Enroll student in boarding
  static async enrollStudent(req, res) {
    let conn;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        conn = await pool.getConnection();
        console.log(`Attempt ${retryCount + 1}: Starting enrollment transaction`);
        
        const { 
          student_reg_number, 
          hostel_id, 
          room_id, 
          enrollment_date, 
          term, 
          academic_year, 
          notes 
        } = req.body;
        
        console.log('Validation check:', {
          student_reg_number: !!student_reg_number,
          hostel_id: !!hostel_id,
          room_id: !!room_id,
          enrollment_date: !!enrollment_date,
          term: !!term,
          academic_year: !!academic_year
        });
        
        if (!student_reg_number || !hostel_id || !room_id || !enrollment_date || !term || !academic_year) {
          console.log('Validation failed - missing required fields');
          return res.status(400).json({ 
            success: false, 
            message: 'Student registration number, hostel ID, room ID, enrollment date, term, and academic year are required' 
          });
        }

        await conn.beginTransaction();

        // Check if student exists
        const [student] = await conn.execute(
          'SELECT RegNumber, Name, Surname, Gender FROM students WHERE RegNumber = ? AND Active = "Yes"',
          [student_reg_number]
        );

        if (student.length === 0) {
          await conn.rollback();
          return res.status(404).json({ success: false, message: 'Student not found or not active' });
        }

        console.log('Student found:', student[0]);

        // Check if hostel exists
        const [hostel] = await conn.execute(
          'SELECT id, name, gender FROM hostels WHERE id = ? AND is_active = TRUE',
          [hostel_id]
        );

        if (hostel.length === 0) {
          await conn.rollback();
          return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        console.log('Hostel found:', hostel[0]);

        // Check if room exists and belongs to the hostel
        const [room] = await conn.execute(
          'SELECT id, room_number, room_type, capacity FROM rooms WHERE id = ? AND hostel_id = ? AND is_active = TRUE',
          [room_id, hostel_id]
        );

        if (room.length === 0) {
          await conn.rollback();
          return res.status(404).json({ success: false, message: 'Room not found or does not belong to the specified hostel' });
        }

        // Check gender compatibility
        console.log('Gender check:', {
          studentGender: student[0].Gender,
          hostelGender: hostel[0].gender,
          match: hostel[0].gender === student[0].Gender || hostel[0].gender === 'Mixed'
        });
        
        if (hostel[0].gender !== 'Mixed' && hostel[0].gender !== student[0].Gender) {
          await conn.rollback();
          console.log('Gender mismatch - enrollment failed');
          return res.status(400).json({ 
            success: false, 
            message: `Student gender (${student[0].Gender}) does not match hostel gender (${hostel[0].gender})` 
          });
        }

        // Check if student is already enrolled for this term and academic year
        const [existingEnrollment] = await conn.execute(
          'SELECT id FROM boarding_enrollments WHERE student_reg_number = ? AND term = ? AND academic_year = ?',
          [student_reg_number, term, academic_year]
        );

        if (existingEnrollment.length > 0) {
          await conn.rollback();
          return res.status(400).json({ 
            success: false, 
            message: 'Student is already enrolled for this term and academic year' 
          });
        }

        // Check room capacity with FOR UPDATE to prevent race conditions
        const [currentEnrollments] = await conn.execute(
          'SELECT COUNT(*) as count FROM boarding_enrollments WHERE room_id = ? AND status IN ("enrolled", "checked_in") FOR UPDATE',
          [room_id]
        );

        if (currentEnrollments[0].count >= room[0].capacity) {
          await conn.rollback();
          return res.status(400).json({ 
            success: false, 
            message: 'Room is at full capacity' 
          });
        }

        // Format term to just the number (e.g., "Term 1" -> "1")
        let formattedTerm = term;
        if (term) {
          const termMatch = term.match(/\d+/);
          formattedTerm = termMatch ? termMatch[0] : term;
        }

        // Create enrollment
        const [result] = await conn.execute(
          `INSERT INTO boarding_enrollments 
           (student_reg_number, hostel_id, room_id, enrollment_date, term, academic_year, notes, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [student_reg_number, hostel_id, room_id, enrollment_date, formattedTerm, academic_year, notes, req.user.id]
        );

        const enrollmentId = result.insertId;

        // Get boarding fee for this hostel and term
        // Try multiple term formats to find the boarding fee
        let [boardingFee] = await conn.execute(
          'SELECT id, amount, currency_id, term FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND is_active = TRUE',
          [hostel_id, formattedTerm, academic_year]
        );

        // If not found with formatted term, try with original term
        if (boardingFee.length === 0 && term !== formattedTerm) {
          [boardingFee] = await conn.execute(
            'SELECT id, amount, currency_id, term FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND is_active = TRUE',
            [hostel_id, term, academic_year]
          );
        }

        // If still not found, try with "Term " prefix
        if (boardingFee.length === 0) {
          const termWithPrefix = `Term ${formattedTerm}`;
          [boardingFee] = await conn.execute(
            'SELECT id, amount, currency_id, term FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND is_active = TRUE',
            [hostel_id, termWithPrefix, academic_year]
          );
        }

        // If still not found, try with "Term " prefix for original term
        if (boardingFee.length === 0 && term !== formattedTerm) {
          const originalTermWithPrefix = `Term ${term}`;
          [boardingFee] = await conn.execute(
            'SELECT id, amount, currency_id, term FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND is_active = TRUE',
            [hostel_id, originalTermWithPrefix, academic_year]
          );
        }

        console.log('Boarding fee lookup:', {
          hostel_id,
          original_term: term,
          formatted_term: formattedTerm,
          academic_year,
          found: boardingFee.length > 0,
          fee: boardingFee[0] || null
        });

        // Additional debug: Check all boarding fees for this hostel
        const [allBoardingFees] = await conn.execute(
          'SELECT id, amount, term, academic_year, is_active FROM boarding_fees WHERE hostel_id = ?',
          [hostel_id]
        );
        console.log('All boarding fees for hostel:', allBoardingFees);

        if (boardingFee.length > 0) {
          console.log('Creating boarding fee balance and transaction...');
          
          // Create boarding fee balance
          await conn.execute(
            `INSERT INTO boarding_fee_balances 
             (enrollment_id, total_fee, outstanding_balance, currency_id, term, academic_year) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [enrollmentId, boardingFee[0].amount, boardingFee[0].amount, boardingFee[0].currency_id, boardingFee[0].term || formattedTerm, academic_year]
          );

          console.log('Boarding fee balance created successfully');

          // Log audit event
          await AuditLogger.log({
            action: 'BOARDING_ENROLLMENT_CREATED',
            table: 'boarding_enrollments',
            record_id: enrollmentId,
            user_id: req.user.id,
            details: { 
              student_reg_number, 
              hostel_id, 
              room_id, 
              enrollment_date, 
              term, 
              academic_year 
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });

          // Create journal entries for boarding enrollment WITHIN the transaction
          let journalEntryId = null;
          try {
            journalEntryId = await createBoardingEnrollmentJournalEntries(
              conn,
              student_reg_number,
              boardingFee[0].amount,
              `BOARDING ENROLLMENT - ${hostel[0].name} (${boardingFee[0].term || formattedTerm} ${academic_year})`,
              boardingFee[0].term || formattedTerm,
              academic_year,
              req.user.id
            );

            // Update account balances from the journal entries
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId);
            console.log('Journal entries and account balances updated successfully');
          } catch (journalError) {
            console.error('Error creating journal entries for boarding enrollment:', journalError);
            await conn.rollback();
            conn.release();
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to create journal entries for enrollment. Enrollment was not completed.' 
            });
          }

          // Create DEBIT transaction for boarding fee WITHIN the transaction and link to journal entry
          try {
            console.log('Creating DEBIT transaction with journal entry link...');
            const transactionId = await StudentTransactionController.createTransactionHelper(
              student_reg_number,
              'DEBIT',
              boardingFee[0].amount,
              `Boarding Enrollment - ${hostel[0].name} (${boardingFee[0].term || formattedTerm} ${academic_year})`,
              {
                term: boardingFee[0].term || formattedTerm,
                academic_year,
                hostel_id,
                enrollment_id: enrollmentId,
                created_by: req.user.id,
                journal_entry_id: journalEntryId // Link transaction to journal entry
              }
            );
            console.log('DEBIT transaction created successfully with ID:', transactionId);
          } catch (transactionError) {
            console.error('Error creating DEBIT transaction:', transactionError);
            await conn.rollback();
            conn.release();
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to create transaction for enrollment. Enrollment was not completed.' 
            });
          }

          await conn.commit();
          console.log(`Enrollment successful on attempt ${retryCount + 1}`);

          res.status(201).json({ 
            success: true, 
            data: { 
              id: enrollmentId, 
              student_reg_number, 
              hostel_id, 
              room_id, 
              enrollment_date, 
              term: formattedTerm, 
              academic_year 
            },
            message: 'Student enrolled successfully' 
          });
          
          // Success - break out of retry loop
          break;
        } else {
          await conn.rollback();
          console.log('No boarding fee found for this hostel/term/year combination');
          // Prevent enrollment without fee structure
          return res.status(400).json({ 
            success: false, 
            message: `Cannot enroll student: No boarding fee structure found for hostel "${hostel[0].name}", term: ${formattedTerm} or "${term}", academic year: ${academic_year}. Please create a fee structure first before enrolling students.` 
          });
        }
        
      } catch (error) {
        if (conn) {
          await conn.rollback();
        }
        
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        
        // Check if it's a deadlock error
        if (error.code === 'ER_LOCK_DEADLOCK' && retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`Deadlock detected. Retrying... (${retryCount}/${maxRetries})`);
          
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
          continue;
        }
        
        // If it's not a deadlock or we've exhausted retries, throw the error
        console.error('Error enrolling student:', error);
        res.status(500).json({ 
          success: false, 
          message: retryCount > 0 ? 
            'Failed to enroll student after multiple attempts due to database conflicts. Please try again.' : 
            'Failed to enroll student' 
        });
        break;
        
      } finally {
        if (conn) {
          conn.release();
        }
      }
    }
  }

  // Get all enrollments with pagination and search
  static async getAllEnrollments(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        hostel_id = '', 
        room_id = '', 
        status = '', 
        term = '', 
        academic_year = '' 
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = [];
      let params = [];

      if (search.trim()) {
        whereConditions.push('(s.Name LIKE ? OR s.Surname LIKE ? OR s.RegNumber LIKE ? OR h.name LIKE ? OR r.room_number LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (hostel_id) {
        whereConditions.push('be.hostel_id = ?');
        params.push(hostel_id);
      }

      if (room_id) {
        whereConditions.push('be.room_id = ?');
        params.push(room_id);
      }

      if (status) {
        whereConditions.push('be.status = ?');
        params.push(status);
      }

      if (term) {
        whereConditions.push('be.term = ?');
        params.push(term);
      }

      if (academic_year) {
        whereConditions.push('be.academic_year = ?');
        params.push(academic_year);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get enrollments with student, hostel, and room details
      const [enrollments] = await pool.execute(`
        SELECT 
          be.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender as student_gender,
          h.name as hostel_name,
          h.gender as hostel_gender,
          r.room_number,
          r.room_type,
          r.capacity as room_capacity,
          bfb.total_fee,
          bfb.paid_amount,
          bfb.outstanding_balance,
          bfb.status as balance_status
        FROM boarding_enrollments be
        LEFT JOIN students s ON be.student_reg_number = s.RegNumber
        LEFT JOIN hostels h ON be.hostel_id = h.id
        LEFT JOIN rooms r ON be.room_id = r.id
        LEFT JOIN boarding_fee_balances bfb ON be.id = bfb.enrollment_id
        ${whereClause}
        ORDER BY be.enrollment_date DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count for pagination
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM boarding_enrollments be
        LEFT JOIN students s ON be.student_reg_number = s.RegNumber
        LEFT JOIN hostels h ON be.hostel_id = h.id
        LEFT JOIN rooms r ON be.room_id = r.id
        ${whereClause}
      `, params);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: enrollments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEnrollments: total,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
    }
  }

  // Get enrollment by ID
  static async getEnrollmentById(req, res) {
    try {
      const { id } = req.params;

      const [enrollments] = await pool.execute(`
        SELECT 
          be.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender as student_gender,
          h.name as hostel_name,
          h.gender as hostel_gender,
          r.room_number,
          r.room_type,
          r.capacity as room_capacity,
          bfb.total_fee,
          bfb.paid_amount,
          bfb.outstanding_balance,
          bfb.status as balance_status
        FROM boarding_enrollments be
        LEFT JOIN students s ON be.student_reg_number = s.RegNumber
        LEFT JOIN hostels h ON be.hostel_id = h.id
        LEFT JOIN rooms r ON be.room_id = r.id
        LEFT JOIN boarding_fee_balances bfb ON be.id = bfb.enrollment_id
        WHERE be.id = ?
      `, [id]);

      if (enrollments.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      res.json({ success: true, data: enrollments[0] });
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch enrollment' });
    }
  }

  // Update enrollment
  static async updateEnrollment(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { room_id, notes, status } = req.body;

      await conn.beginTransaction();

      // Check if enrollment exists
      const [existing] = await conn.execute(
        'SELECT id, student_reg_number, hostel_id, room_id, status FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      const currentEnrollment = existing[0];

      // If changing room, check capacity
      if (room_id && room_id !== currentEnrollment.room_id) {
        const [room] = await conn.execute(
          'SELECT id, room_number, room_type, capacity FROM rooms WHERE id = ? AND is_active = TRUE',
          [room_id]
        );

        if (room.length === 0) {
          return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const [currentEnrollments] = await conn.execute(
          'SELECT COUNT(*) as count FROM boarding_enrollments WHERE room_id = ? AND status IN ("enrolled", "checked_in") AND id != ?',
          [room_id, id]
        );

        if (currentEnrollments[0].count >= room[0].capacity) {
          return res.status(400).json({ 
            success: false, 
            message: 'Room is at full capacity' 
          });
        }
      }

      // Update enrollment
      const updateFields = [];
      const updateValues = [];

      if (room_id !== undefined) {
        updateFields.push('room_id = ?');
        updateValues.push(room_id);
      }

      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      updateFields.push('updated_by = ?');
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(req.user.id, id);

      await conn.execute(
        `UPDATE boarding_enrollments SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_ENROLLMENT_UPDATED',
        table: 'boarding_enrollments',
        record_id: id,
        user_id: req.user.id,
        details: { room_id, notes, status },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Enrollment updated successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating enrollment:', error);
      res.status(500).json({ success: false, message: 'Failed to update enrollment' });
    } finally {
      conn.release();
    }
  }

  // Delete enrollment (hard delete)
  static async deleteEnrollment(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      console.log(`🗑️ Attempting to delete enrollment ID: ${id}`);

      await conn.beginTransaction();

      // Check if enrollment exists
      const [existing] = await conn.execute(
        'SELECT id, student_reg_number, status, hostel_id, term, academic_year FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        await conn.rollback();
        conn.release();
        console.log(`❌ Enrollment ${id} not found`);
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      const enrollment = existing[0];
      console.log(`📋 Enrollment found:`, {
        id: enrollment.id,
        student: enrollment.student_reg_number,
        status: enrollment.status,
        hostel_id: enrollment.hostel_id
      });

      // Check if enrollment can be deleted (not checked in or checked out)
      if (enrollment.status === 'checked_in' || enrollment.status === 'checked_out') {
        await conn.rollback();
        conn.release();
        console.log(`❌ Cannot delete enrollment ${id} - status is '${enrollment.status}'`);
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete enrollment with status '${enrollment.status}'. Please check out the student first.` 
        });
      }

      // Find associated fee transactions and their linked journal entries
      console.log(`🔍 Searching for transactions for student ${enrollment.student_reg_number}, hostel ${enrollment.hostel_id}`);
      
      // Build query based on whether hostel_id exists
      let feeTransactions;
      if (enrollment.hostel_id) {
        [feeTransactions] = await conn.execute(
          `SELECT id, amount, journal_entry_id FROM student_transactions 
           WHERE student_reg_number = ? AND hostel_id = ? AND transaction_type = 'DEBIT' 
           AND description LIKE '%Boarding Enrollment%'
           ORDER BY transaction_date DESC`,
          [enrollment.student_reg_number, enrollment.hostel_id]
        );
      } else {
        // If no hostel_id, search by student and description only
        [feeTransactions] = await conn.execute(
          `SELECT id, amount, journal_entry_id FROM student_transactions 
           WHERE student_reg_number = ? AND transaction_type = 'DEBIT' 
           AND description LIKE '%Boarding Enrollment%'
           ORDER BY transaction_date DESC`,
          [enrollment.student_reg_number]
        );
      }
      console.log(`📊 Found ${feeTransactions.length} associated transactions`);

      // Collect all journal entry IDs from transactions
      const journalEntryIds = [];
      if (feeTransactions.length > 0) {
        for (const tx of feeTransactions) {
          // Update the student balance BEFORE deleting the transaction
          // This reverses the effect of the original transaction
          await StudentBalanceService.updateBalanceOnTransactionDelete(
            enrollment.student_reg_number,
            'DEBIT',
            tx.amount,
            conn
          );
          
          // Delete the student transaction
          await conn.execute(
            'DELETE FROM student_transactions WHERE id = ?',
            [tx.id]
          );
          
          console.log(`Deleted DEBIT transaction ${tx.id} for enrollment deletion`);
          
          // Collect journal entry ID if linked
          if (tx.journal_entry_id) {
            journalEntryIds.push(tx.journal_entry_id);
          }
        }
      } else {
        // If no transactions found, recalculate balance anyway to ensure it's correct
        console.log('No transactions found, recalculating balance from all transactions...');
        await StudentBalanceService.recalculateBalance(enrollment.student_reg_number, conn);
      }

      // Also search for journal entries by reference pattern (in case transaction wasn't linked)
      console.log('🔍 Looking for boarding enrollment journal entries to delete...');
      const [boardingJournalEntries] = await conn.execute(
          `SELECT je.id, je.description, je.reference 
           FROM journal_entries je 
           WHERE je.reference LIKE ? AND je.description LIKE ?`,
          [`%BOARDING-${enrollment.student_reg_number}-%`, `%BOARDING ENROLLMENT%`]
      );

      // Combine journal entry IDs from transactions and search
      const allJournalEntryIds = new Set(journalEntryIds);
      boardingJournalEntries.forEach(je => allJournalEntryIds.add(je.id));

      if (allJournalEntryIds.size > 0) {
          console.log(`🗑️ Found ${allJournalEntryIds.size} boarding journal entries to delete`);
          
          // Reverse account balances for each journal entry before deletion
          for (const journalEntryId of allJournalEntryIds) {
              // Get journal entry lines to reverse balances
              const [journalLines] = await conn.execute(
                  `SELECT jel.account_id, jel.debit, jel.credit, coa.type as account_type, COALESCE(jel.currency_id, 1) as currency_id
                   FROM journal_entry_lines jel
                   INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                   WHERE jel.journal_entry_id = ?`,
                  [journalEntryId]
              );
              
              // Reverse each account balance
              for (const line of journalLines) {
                  // Calculate original balance change
                  const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                      ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                      : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                  
                  // Reverse the balance change
                  const reverseChange = -balanceChange;
                  
                  if (Math.abs(reverseChange) >= 0.01) {
                      // Get current balance
                      const [currentBalance] = await conn.execute(
                          `SELECT id, balance FROM account_balances 
                           WHERE account_id = ? AND currency_id = ? 
                           ORDER BY as_of_date DESC LIMIT 1`,
                          [line.account_id, line.currency_id]
                      );
                      
                      if (currentBalance.length > 0) {
                          const newBalance = parseFloat(currentBalance[0].balance) + reverseChange;
                          await conn.execute(
                              `UPDATE account_balances 
                               SET balance = ?, as_of_date = CURRENT_DATE 
                               WHERE id = ?`,
                              [newBalance, currentBalance[0].id]
                          );
                          console.log(`✅ Reversed balance for account ${line.account_id}: ${currentBalance[0].balance} → ${newBalance}`);
                      }
                  }
              }
              
              // Delete journal entry lines first (foreign key constraint)
              await conn.execute(
                  'DELETE FROM journal_entry_lines WHERE journal_entry_id = ?',
                  [journalEntryId]
              );
              
              // Delete journal entry
              await conn.execute(
                  'DELETE FROM journal_entries WHERE id = ?',
                  [journalEntryId]
              );
              
              console.log(`✅ Deleted boarding enrollment journal entry ${journalEntryId} for student ${enrollment.student_reg_number}`);
          }
          
          console.log('✅ All journal entries and account balances reversed');
      } else {
          console.log('ℹ️ No boarding enrollment journal entries found to delete');
      }

      // Delete boarding fee balance if exists
      await conn.execute(
        'DELETE FROM boarding_fee_balances WHERE enrollment_id = ?',
        [id]
      );

      // Delete the enrollment
      await conn.execute(
        'DELETE FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      // Log audit event
      try {
        await AuditLogger.log({
          action: 'BOARDING_ENROLLMENT_DELETED',
          table: 'boarding_enrollments',
          record_id: id,
          user_id: req.user.id,
          details: { 
            student_reg_number: enrollment.student_reg_number,
            hostel_id: enrollment.hostel_id,
            term: enrollment.term,
            academic_year: enrollment.academic_year
          },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Enrollment deleted successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('❌ Error deleting enrollment:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to delete enrollment',
        error: error.message 
      });
    } finally {
      conn.release();
    }
  }

  // Cancel enrollment
  static async cancelEnrollment(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { reason, isEndOfTerm = false } = req.body;

      await conn.beginTransaction();

      // Check if enrollment exists
      const [existing] = await conn.execute(
        'SELECT id, student_reg_number, status, created_at, hostel_id, term, academic_year FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      if (existing[0].status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Enrollment is already cancelled' });
      }

      // Check grace period for fee reversal (only if not end of term)
      if (!isEndOfTerm) {
        const enrollmentDate = new Date(existing[0].created_at);
        const currentDate = new Date();
        const daysDifference = (currentDate - enrollmentDate) / (1000 * 60 * 60 * 24);

        if (daysDifference <= 30) {
          // Within grace period - check for associated fee transaction
          const [feeTransactions] = await conn.execute(
            `SELECT id, amount FROM student_transactions 
             WHERE student_reg_number = ? AND hostel_id = ? AND transaction_type = 'DEBIT' 
             AND description LIKE '%Boarding Enrollment%'
             ORDER BY transaction_date DESC LIMIT 1`,
            [existing[0].student_reg_number, existing[0].hostel_id]
          );

          if (feeTransactions.length > 0) {
            // Create CREDIT transaction to reverse the fee
            await StudentTransactionController.createTransactionHelper(
              existing[0].student_reg_number,
              'CREDIT',
              feeTransactions[0].amount,
              `Boarding Enrollment Reversal - Grace Period - ${reason || 'Manual Cancellation'}`,
              {
                created_by: req.user.id
              }
            );
          }
        }
      }

      // Cancel enrollment
      await conn.execute(
        'UPDATE boarding_enrollments SET status = "cancelled", notes = CONCAT(IFNULL(notes, ""), " | Cancelled: ", ?), updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reason || 'No reason provided', req.user.id, id]
      );

      // Log audit event
      try {
        await AuditLogger.log({
          action: 'BOARDING_ENROLLMENT_CANCELLED',
          table: 'boarding_enrollments',
          record_id: id,
          user_id: req.user.id,
          details: { reason, isEndOfTerm },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Enrollment cancelled successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error cancelling enrollment:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel enrollment' });
    } finally {
      conn.release();
    }
  }

  // Check in student
  static async checkInStudent(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { check_in_date } = req.body;

      await conn.beginTransaction();

      // Check if enrollment exists
      const [existing] = await conn.execute(
        'SELECT id, student_reg_number, status FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      if (existing[0].status === 'checked_in') {
        return res.status(400).json({ success: false, message: 'Student is already checked in' });
      }

      if (existing[0].status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot check in cancelled enrollment' });
      }

      // Check in student
      await conn.execute(
        'UPDATE boarding_enrollments SET status = "checked_in", check_in_date = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [check_in_date || new Date().toISOString().split('T')[0], req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_CHECK_IN',
        table: 'boarding_enrollments',
        record_id: id,
        user_id: req.user.id,
        details: { check_in_date },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Student checked in successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error checking in student:', error);
      res.status(500).json({ success: false, message: 'Failed to check in student' });
    } finally {
      conn.release();
    }
  }

  // Check out student
  static async checkOutStudent(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { check_out_date, reason } = req.body;

      await conn.beginTransaction();

      // Check if enrollment exists
      const [existing] = await conn.execute(
        'SELECT id, student_reg_number, status FROM boarding_enrollments WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }

      if (existing[0].status === 'checked_out') {
        return res.status(400).json({ success: false, message: 'Student is already checked out' });
      }

      if (existing[0].status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot check out cancelled enrollment' });
      }

      // Check out student
      await conn.execute(
        'UPDATE boarding_enrollments SET status = "checked_out", check_out_date = ?, notes = CONCAT(IFNULL(notes, ""), " | Checked out: ", ?), updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [check_out_date || new Date().toISOString().split('T')[0], reason || 'No reason provided', req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_CHECK_OUT',
        table: 'boarding_enrollments',
        record_id: id,
        user_id: req.user.id,
        details: { check_out_date, reason },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Student checked out successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error checking out student:', error);
      res.status(500).json({ success: false, message: 'Failed to check out student' });
    } finally {
      conn.release();
    }
  }
}

module.exports = EnrollmentController;
