const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentTransactionController = require('../students/studentTransactionController');
const AccountBalanceService = require('../../services/accountBalanceService');

class BoardingFeesPaymentsController {
  // Create new boarding fees payment
  static async createPayment(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const {
        student_reg_number,
        academic_year,
        term,
        hostel_id,
        amount_paid,
        currency_id,
        payment_method,
        payment_date,
        reference_number,
        notes
      } = req.body;

      // Validate required fields
      if (!student_reg_number || !academic_year || !term || !amount_paid || 
          !currency_id || !payment_method || !payment_date) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: student_reg_number, academic_year, term, amount_paid, currency_id, payment_method, payment_date'
        });
      }

      // Fetch student details to ensure student exists
      const [student] = await conn.execute(
        'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ? AND Active = "Yes"',
        [student_reg_number]
      );

      if (student.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found with provided registration number'
        });
      }

      // Get base currency from currencies table
      const [baseCurrency] = await conn.execute(
        'SELECT id, name, symbol FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      
      if (baseCurrency.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Base currency not configured in system'
        });
      }
      
      const base_currency_id = baseCurrency[0].id;

      // Calculate exchange rate and base currency amount
      let exchange_rate = 1.0000;
      let base_currency_amount = amount_paid;

      if (currency_id !== base_currency_id) {
        // Get exchange rate from currency table
        const [currencyRate] = await conn.execute(
          'SELECT exchange_rate FROM currencies WHERE id = ?',
          [currency_id]
        );
        
        if (currencyRate.length > 0 && currencyRate[0].exchange_rate) {
          exchange_rate = currencyRate[0].exchange_rate;
          base_currency_amount = amount_paid * exchange_rate;
        } else {
          // If no exchange rate found, use 1:1 (you might want to implement a currency API here)
          exchange_rate = 1.0000;
          base_currency_amount = amount_paid;
        }
      }

      // Generate receipt number
      const [countResult] = await conn.execute(
        'SELECT COUNT(*) as count FROM boarding_fees_payments WHERE DATE(created_at) = CURDATE()'
      );
      const receiptNumber = `BF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(countResult[0].count + 1).padStart(4, '0')}`;

      // Create boarding fees payment
      const [paymentResult] = await conn.execute(
        `INSERT INTO boarding_fees_payments 
         (student_reg_number, academic_year, term, hostel_id, amount_paid, 
          currency_id, base_currency_amount, base_currency_id, exchange_rate,
          payment_method, payment_date, receipt_number, reference_number, notes, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_reg_number, academic_year, term, hostel_id || null, amount_paid,
         currency_id, base_currency_amount, base_currency_id, exchange_rate,
         payment_method, payment_date, receiptNumber, reference_number || null, notes || null, req.user.id]
      );

      const paymentId = paymentResult.insertId;

      // Get the generated receipt number (should be the one we just created)
      const [paymentRecord] = await conn.execute(
        'SELECT receipt_number FROM boarding_fees_payments WHERE id = ?',
        [paymentId]
      );

      // Create CREDIT transaction for boarding payment
      await StudentTransactionController.createTransactionHelper(
        student_reg_number,
        'CREDIT',
        base_currency_amount,
        `BOARDING PAYMENT - ${payment_method} - Receipt #${paymentRecord[0].receipt_number}`,
        {
          term,
          academic_year,
          hostel_id: hostel_id || null,
          payment_id: paymentId,
          created_by: req.user.id
        }
      );

      // Create journal entries for the payment
      const journalEntryId = await BoardingFeesPaymentsController.createJournalEntries(conn, {
        paymentId,
        amount_paid,
        currency_id,
        base_currency_amount,
        base_currency_id,
        payment_method,
        payment_date,
        student_reg_number,
        student_name: `${student[0].Name} ${student[0].Surname}`,
        reference_number: reference_number || receiptNumber,
        created_by: req.user.id
      });

      // Update account balances from the journal entry
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId);
      console.log(`✅ Updated account balances for journal entry ${journalEntryId}`);

      await conn.commit();

      // Log the audit
      await AuditLogger.log({
        user_id: req.user.id,
        action: 'CREATE',
        table_name: 'boarding_fees_payments',
        record_id: paymentId,
        details: {
          student_reg_number,
          hostel_id,
          amount_paid,
          currency_id,
          base_currency_amount,
          payment_method,
          receipt_number: paymentRecord[0].receipt_number
        }
      });

      res.status(201).json({
        success: true,
        message: 'Boarding fees payment created successfully',
        data: {
          id: paymentId,
          receipt_number: paymentRecord[0].receipt_number,
          amount_paid,
          base_currency_amount,
          exchange_rate
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error creating boarding fees payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create boarding fees payment',
        error: error.message
      });
    } finally {
      conn.release();
    }
  }

  // Create journal entries for the payment
  static async createJournalEntries(conn, paymentData) {
    const { paymentId, amount_paid, currency_id, base_currency_amount, base_currency_id,
            payment_method, payment_date, student_reg_number, student_name, 
            reference_number, created_by } = paymentData;

    // Get account IDs from COA
    const [cashAccount] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE',
      ['1000'] // Cash on Hand
    );

    const [bankAccount] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE',
      ['1010'] // Bank Account
    );

    const [boardingFeesReceivable] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE',
      ['1100'] // Accounts Receivable - Tuition (using this for boarding fees receivable)
    );

    if (!cashAccount.length || !bankAccount.length || !boardingFeesReceivable.length) {
      throw new Error('Required chart of accounts not found');
    }

    // Determine debit account based on payment method
    let debitAccountId;
    if (payment_method === 'Cash' || payment_method === 'Mobile Money') {
      debitAccountId = cashAccount[0].id;
    } else {
      debitAccountId = bankAccount[0].id;
    }

    // Get or create journal for boarding fees
    let journalId = 1; // Default journal ID
    const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
    if (journalCheck.length === 0) {
      // Create a default journal if it doesn't exist
      const [journalResult] = await conn.execute(
        'INSERT INTO journals (name, description) VALUES (?, ?)',
        ['Boarding Fees Journal', 'Journal for boarding fees transactions']
      );
      journalId = journalResult.insertId;
    }

    // Create journal entry
    const [journalResult] = await conn.execute(
      `INSERT INTO journal_entries 
       (journal_id, entry_date, reference, description) 
       VALUES (?, ?, ?, ?)`,
      [journalId, payment_date, reference_number, `Boarding Fees Payment - ${student_name} (${student_reg_number})`]
    );

    const journalEntryId = journalResult.insertId;

    // Create journal entry lines
    const journalLines = [
      // Debit: Cash/Bank (in payment currency)
      {
        journal_entry_id: journalEntryId,
        account_id: debitAccountId,
        debit_amount: amount_paid,
        credit_amount: 0,
        description: `Payment received for boarding fees - ${student_name} (${student_reg_number})`
      },
      // Credit: Accounts Receivable (reduce receivable when payment received)
      {
        journal_entry_id: journalEntryId,
        account_id: boardingFeesReceivable[0].id,
        debit_amount: 0,
        credit_amount: amount_paid,
        description: `Reduce receivable for payment - ${student_name} (${student_reg_number})`
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

    // Create transaction record
    await conn.execute(
      `INSERT INTO transactions 
       (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['payment', amount_paid, currency_id, payment_date, payment_method, 
       `Boarding Fees Payment - ${student_name} (${student_reg_number})`, journalEntryId]
    );

    // Return the journal entry ID so account balances can be updated
    return journalEntryId;
  }

  // Get a single payment by ID
  static async getPaymentById(req, res) {
    const { id } = req.params;

    try {
      const conn = await pool.getConnection();

      const [payments] = await conn.query(
        `SELECT 
           bfp.id,
           bfp.student_reg_number,
           bfp.academic_year,
           bfp.term,
           bfp.hostel_id,
           bfp.amount_paid,
           bfp.currency_id,
           bfp.base_currency_amount,
           bfp.base_currency_id,
           bfp.exchange_rate,
           bfp.payment_method,
           bfp.payment_date,
           bfp.reference_number,
           bfp.receipt_number,
           bfp.notes,
           bfp.created_at,
           s.Name as student_name,
           s.Surname as student_surname,
           h.name as hostel_name,
           c.name as currency_name,
           c.symbol as currency_symbol,
           bc.name as base_currency_name,
           bc.symbol as base_currency_symbol
         FROM boarding_fees_payments bfp
         LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
         LEFT JOIN hostels h ON bfp.hostel_id = h.id
         LEFT JOIN currencies c ON bfp.currency_id = c.id
         LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
         WHERE bfp.id = ?`,
        [id]
      );

      conn.release();

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payments[0]
      });

    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment',
        error: error.message
      });
    }
  }

  // Update a payment
  static async updatePayment(req, res) {
    const { id } = req.params;
    const {
      amount_paid,
      currency_id,
      payment_method,
      payment_date,
      reference_number,
      notes
    } = req.body;

    try {
      const conn = await pool.getConnection();

      // Start transaction
      await conn.beginTransaction();

      try {
        // Get the original payment to calculate exchange rate
        const [originalPayment] = await conn.query(
          'SELECT * FROM boarding_fees_payments WHERE id = ?',
          [id]
        );

        if (originalPayment.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({
            success: false,
            message: 'Payment not found'
          });
        }

        const payment = originalPayment[0];

        // Get base currency
        const [baseCurrency] = await conn.query(
          'SELECT id, name, symbol FROM currencies WHERE base_currency = TRUE LIMIT 1'
        );

        if (baseCurrency.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(500).json({
            success: false,
            message: 'Base currency not found'
          });
        }

        const base_currency_id = baseCurrency[0].id;

        // Calculate exchange rate and base currency amount
        let exchange_rate = 1.0000;
        let base_currency_amount = amount_paid;

        if (currency_id !== base_currency_id) {
          const [exchangeRate] = await conn.query(
            `SELECT exchange_rate FROM exchange_rates
             WHERE from_currency_id = ? AND to_currency_id = ?
             AND effective_date <= ? AND is_active = TRUE
             ORDER BY effective_date DESC LIMIT 1`,
            [currency_id, base_currency_id, payment_date]
          );

          if (exchangeRate.length > 0) {
            exchange_rate = exchangeRate[0].exchange_rate;
            base_currency_amount = amount_paid * exchange_rate;
          }
        }

        // Update the payment
        await conn.query(
          `UPDATE boarding_fees_payments SET
           amount_paid = ?,
           currency_id = ?,
           base_currency_amount = ?,
           base_currency_id = ?,
           exchange_rate = ?,
           payment_method = ?,
           payment_date = ?,
           reference_number = ?,
           notes = ?,
           updated_at = NOW(),
           updated_by = ?
           WHERE id = ?`,
          [
            amount_paid,
            currency_id,
            base_currency_amount,
            base_currency_id,
            exchange_rate,
            payment_method,
            payment_date,
            reference_number || null,
            notes || null,
            req.user.id,
            id
          ]
        );

        // Find and update the corresponding journal entry
        const [journalEntries] = await conn.query(
          'SELECT id FROM journal_entries WHERE reference = ?',
          [payment.receipt_number]
        );

        if (journalEntries.length > 0) {
          const journalEntryId = journalEntries[0].id;

          // Update journal entry description
          await conn.query(
            `UPDATE journal_entries SET
             description = ?,
             updated_at = NOW()
             WHERE id = ?`,
            [`Boarding Fees Payment - ${reference_number || payment.receipt_number}`, journalEntryId]
          );

          // Update journal entry lines (debit and credit amounts)
          await conn.query(
            `UPDATE journal_entry_lines SET
             debit = ?,
             credit = ?,
             updated_at = NOW()
             WHERE journal_entry_id = ? AND debit > 0`,
            [base_currency_amount, 0, journalEntryId]
          );

          await conn.query(
            `UPDATE journal_entry_lines SET
             debit = ?,
             credit = ?,
             updated_at = NOW()
             WHERE journal_entry_id = ? AND credit > 0`,
            [0, base_currency_amount, journalEntryId]
          );

          // Update transactions
          await conn.query(
            `UPDATE transactions SET
             amount = ?,
             currency_id = ?,
             transaction_date = ?,
             payment_method = ?,
             description = ?,
             updated_at = NOW()
             WHERE journal_entry_id = ?`,
            [
              base_currency_amount,
              currency_id,
              payment_date,
              payment_method,
              `Boarding Fees Payment - ${reference_number || payment.receipt_number}`,
              journalEntryId
            ]
          );
        }

        // Commit transaction
        await conn.commit();
        conn.release();

        res.json({
          success: true,
          message: 'Payment and related accounting entries updated successfully'
        });

      } catch (error) {
        // Rollback on error
        await conn.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error.message
      });
    }
  }

  // Delete a payment and its related accounting entries
  static async deletePayment(req, res) {
    const { id } = req.params;

    try {
      const conn = await pool.getConnection();

      // Start transaction
      await conn.beginTransaction();

      try {
        // Get the payment to find the receipt number
        const [payment] = await conn.query(
          'SELECT receipt_number FROM boarding_fees_payments WHERE id = ?',
          [id]
        );

        if (payment.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({
            success: false,
            message: 'Payment not found'
          });
        }

        const receiptNumber = payment[0].receipt_number;

        // Find and delete the corresponding journal entry
        const [journalEntries] = await conn.query(
          'SELECT id FROM journal_entries WHERE reference = ?',
          [receiptNumber]
        );

        if (journalEntries.length > 0) {
          const journalEntryId = journalEntries[0].id;

          // Delete transactions first (foreign key constraint)
          await conn.query(
            'DELETE FROM transactions WHERE journal_entry_id = ?',
            [journalEntryId]
          );

          // Delete journal entry lines
          await conn.query(
            'DELETE FROM journal_entry_lines WHERE journal_entry_id = ?',
            [journalEntryId]
          );

          // Delete journal entry
          await conn.query(
            'DELETE FROM journal_entries WHERE id = ?',
            [journalEntryId]
          );
        }

        // Delete the payment
        await conn.query(
          'DELETE FROM boarding_fees_payments WHERE id = ?',
          [id]
        );

        // Commit transaction
        await conn.commit();
        conn.release();

        res.json({
          success: true,
          message: 'Payment and related accounting entries deleted successfully'
        });

      } catch (error) {
        // Rollback on error
        await conn.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment',
        error: error.message
      });
    }
  }

  // Get payments by student registration number
  static async getPaymentsByStudent(req, res) {
    const { studentRegNumber } = req.params;

    try {
      const conn = await pool.getConnection();

      const [payments] = await conn.query(
        `SELECT 
           bfp.id, bfp.student_reg_number, bfp.academic_year, bfp.term, bfp.hostel_id,
           bfp.amount_paid, bfp.currency_id, bfp.base_currency_amount, bfp.base_currency_id,
           bfp.exchange_rate, bfp.payment_method, bfp.payment_date, bfp.reference_number,
           bfp.receipt_number, bfp.notes, bfp.created_at,
           s.Name as student_name, s.Surname as student_surname,
           h.name as hostel_name,
           c.name as currency_name, c.symbol as currency_symbol,
           bc.name as base_currency_name, bc.symbol as base_currency_symbol
         FROM boarding_fees_payments bfp
         LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
         LEFT JOIN hostels h ON bfp.hostel_id = h.id
         LEFT JOIN currencies c ON bfp.currency_id = c.id
         LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
         WHERE bfp.student_reg_number = ?
         ORDER BY bfp.created_at DESC`,
        [studentRegNumber]
      );

      conn.release();

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error('Error fetching student payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student payments',
        error: error.message
      });
    }
  }

  // Get payment summary by student
  static async getPaymentSummaryByStudent(req, res) {
    const { studentRegNumber } = req.params;

    try {
      const conn = await pool.getConnection();

      const [summary] = await conn.query(
        `SELECT 
           student_reg_number,
           academic_year,
           term,
           SUM(amount_paid) as total_paid,
           COUNT(*) as payment_count,
           MIN(payment_date) as first_payment,
           MAX(payment_date) as last_payment
         FROM boarding_fees_payments
         WHERE student_reg_number = ?
         GROUP BY student_reg_number, academic_year, term
         ORDER BY academic_year DESC, term DESC`,
        [studentRegNumber]
      );

      conn.release();

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error fetching payment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment summary',
        error: error.message
      });
    }
  }

  // Get all boarding fees payments with pagination
  static async getAllPayments(req, res) {
    const { page = 1, limit = 10, search = '', academic_year = '', term = '', hostel_id = '' } = req.query;
    
    console.log('Backend received query params:', req.query);
    console.log('Backend parsed values:', { page, limit, search, academic_year, term, hostel_id });
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    console.log('Backend calculated values:', { pageNum, limitNum, offset });

    try {
      const conn = await pool.getConnection();

      // Build WHERE clause for filtering
      let whereConditions = ['1=1'];
      let queryParams = [];

      if (search) {
        whereConditions.push('(bfp.student_reg_number LIKE ? OR s.Name LIKE ? OR s.Surname LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (academic_year) {
        whereConditions.push('bfp.academic_year = ?');
        queryParams.push(academic_year);
      }

      if (term) {
        whereConditions.push('bfp.term = ?');
        queryParams.push(term);
      }

      if (hostel_id) {
        whereConditions.push('bfp.hostel_id = ?');
        queryParams.push(hostel_id);
      }

      const whereClause = whereConditions.join(' AND ');

      console.log('Backend SQL params:', { whereClause, queryParams, limitNum, offset });

      // Get total count
      const [countResult] = await conn.query(
        `SELECT COUNT(*) as total
         FROM boarding_fees_payments bfp
         LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
         LEFT JOIN hostels h ON bfp.hostel_id = h.id
         WHERE ${whereClause}`,
        queryParams
      );

      const totalPayments = countResult[0].total;
      const totalPages = Math.ceil(totalPayments / limitNum);

      // Get payments with pagination
      const finalParams = [...queryParams, limitNum, offset];
      console.log('Backend final SQL params:', finalParams);
      console.log('Backend final SQL param types:', finalParams.map(p => typeof p));
      
      // Try using query instead of execute for better parameter handling
      const [payments] = await conn.query(
        `SELECT 
           bfp.id,
           bfp.student_reg_number,
           bfp.academic_year,
           bfp.term,
           bfp.hostel_id,
           bfp.amount_paid,
           bfp.currency_id,
           bfp.base_currency_amount,
           bfp.base_currency_id,
           bfp.exchange_rate,
           bfp.payment_method,
           bfp.payment_date,
           bfp.reference_number,
           bfp.receipt_number,
           bfp.notes,
           bfp.created_at,
           s.Name as student_name,
           s.Surname as student_surname,
           h.name as hostel_name,
           c.name as currency_name,
           c.symbol as currency_symbol,
           bc.name as base_currency_name,
           bc.symbol as base_currency_symbol
         FROM boarding_fees_payments bfp
         LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
         LEFT JOIN hostels h ON bfp.hostel_id = h.id
         LEFT JOIN currencies c ON bfp.currency_id = c.id
         LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
         WHERE ${whereClause}
         ORDER BY bfp.created_at DESC
         LIMIT ? OFFSET ?`,
        finalParams
      );

      conn.release();

      res.json({
        success: true,
        data: payments,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_items: totalPayments,
          items_per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Error fetching boarding fees payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch boarding fees payments',
        error: error.message
      });
    }
  }

  // Get payments by student
  static async getPaymentsByStudent(req, res) {
    try {
      const { studentRegNumber } = req.params;

      const [payments] = await pool.execute(`
        SELECT 
          bfp.*,
          h.name as hostel_name,
          c.name as currency_name,
          c.symbol as currency_symbol,
          bc.name as base_currency_name,
          bc.symbol as base_currency_symbol
        FROM boarding_fees_payments bfp
        LEFT JOIN hostels h ON bfp.hostel_id = h.id
        LEFT JOIN currencies c ON bfp.currency_id = c.id
        LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
        WHERE bfp.student_reg_number = ? AND bfp.is_active = TRUE
        ORDER BY bfp.payment_date DESC, bfp.created_at DESC
      `, [studentRegNumber]);

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching student payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student payments'
      });
    }
  }

  // Get payment by ID
  static async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      const [payments] = await pool.execute(`
        SELECT 
          bfp.*,
          h.name as hostel_name,
          c.name as currency_name,
          c.symbol as currency_symbol,
          bc.name as base_currency_name,
          bc.symbol as base_currency_symbol,
          s.Name as student_name,
          s.Surname as student_surname
        FROM boarding_fees_payments bfp
        LEFT JOIN hostels h ON bfp.hostel_id = h.id
        LEFT JOIN currencies c ON bfp.currency_id = c.id
        LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
        LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
        WHERE bfp.id = ? AND bfp.is_active = TRUE
      `, [id]);

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payments[0]
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment'
      });
    }
  }

  // Update payment
  static async updatePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { id } = req.params;
      const {
        amount_paid,
        currency_id,
        payment_method,
        payment_date,
        reference_number,
        notes,
        status
      } = req.body;

      // Check if payment exists
      const [existingPayment] = await conn.execute(
        'SELECT * FROM boarding_fees_payments WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existingPayment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Get base currency
      const [baseCurrency] = await conn.query(
        'SELECT id, name, symbol FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );

      if (baseCurrency.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(500).json({
          success: false,
          message: 'Base currency not found'
        });
      }

      const base_currency_id = baseCurrency[0].id;

      // Calculate exchange rate and base currency amount
      let exchange_rate = 1.0000;
      let base_currency_amount = amount_paid;

      if (currency_id !== base_currency_id) {
        const [exchangeRate] = await conn.query(
          `SELECT exchange_rate FROM exchange_rates
           WHERE from_currency_id = ? AND to_currency_id = ?
           AND effective_date <= ? AND is_active = TRUE
           ORDER BY effective_date DESC LIMIT 1`,
          [currency_id, base_currency_id, payment_date]
        );

        if (exchangeRate.length > 0) {
          exchange_rate = exchangeRate[0].exchange_rate;
          base_currency_amount = amount_paid * exchange_rate;
        }
      }

      // Update payment
      await conn.query(
        `UPDATE boarding_fees_payments 
         SET amount_paid = ?, currency_id = ?, base_currency_amount = ?, base_currency_id = ?, exchange_rate = ?,
             payment_method = ?, payment_date = ?, reference_number = ?, 
             notes = ?, updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [amount_paid, currency_id, base_currency_amount, base_currency_id, exchange_rate,
         payment_method, payment_date, reference_number || null, 
         notes || null, req.user.id, id]
      );

      // Find and update the corresponding journal entry
      const existingReference = existingPayment[0].reference_number;
      console.log(`🔍 Looking for journal entry with reference: ${existingReference}`);
      const [journalEntries] = await conn.query(
        'SELECT id FROM journal_entries WHERE reference = ?',
        [existingReference]
      );

      if (journalEntries.length > 0) {
        const journalEntryId = journalEntries[0].id;
        console.log(`📝 Found journal entry ${journalEntryId}, updating amounts to ${base_currency_amount}`);

        // Update journal entry reference and description
        await conn.query(
          `UPDATE journal_entries SET
           reference = ?,
           description = ?,
           updated_at = NOW()
           WHERE id = ?`,
          [reference_number, `Boarding Fees Payment - Updated`, journalEntryId]
        );

        // Update journal entry lines (debit and credit amounts)
        const [debitUpdate] = await conn.query(
          `UPDATE journal_entry_lines SET
           debit = ?,
           credit = ?,
           updated_at = NOW()
           WHERE journal_entry_id = ? AND debit > 0`,
          [base_currency_amount, 0, journalEntryId]
        );
        console.log(`📊 Updated ${debitUpdate.affectedRows} debit line(s)`);

        const [creditUpdate] = await conn.query(
          `UPDATE journal_entry_lines SET
           debit = ?,
           credit = ?,
           updated_at = NOW()
           WHERE journal_entry_id = ? AND credit > 0`,
          [0, base_currency_amount, journalEntryId]
        );
        console.log(`📊 Updated ${creditUpdate.affectedRows} credit line(s)`);

        // Update transactions
        await conn.query(
          `UPDATE transactions SET
           amount = ?,
           currency_id = ?,
           transaction_date = ?,
           payment_method = ?,
           description = ?,
           updated_at = NOW()
           WHERE journal_entry_id = ?`,
          [
            base_currency_amount,
            currency_id,
            payment_date,
            payment_method,
            `Boarding Fees Payment - ${reference_number}`,
            journalEntryId
          ]
        );

        // Recalculate all account balances after updating journal entry
        console.log(`🔄 Recalculating account balances...`);
        await AccountBalanceService.recalculateAllAccountBalances(conn);
        console.log(`✅ Recalculated account balances after updating journal entry ${journalEntryId}`);
      } else {
        console.log(`⚠️ No journal entry found for reference ${existingReference}`);
      }

      await conn.commit();

      res.json({
        success: true,
        message: 'Payment and related accounting entries updated successfully'
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error.message
      });
    } finally {
      conn.release();
    }
  }

  // Delete payment (soft delete)
  static async deletePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { id } = req.params;

      // Check if payment exists
      const [existingPayment] = await conn.execute(
        'SELECT * FROM boarding_fees_payments WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existingPayment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Find and delete the journal entries for this payment
      const paymentReference = existingPayment[0].reference_number;
      const [journalEntries] = await conn.query(
        'SELECT id FROM journal_entries WHERE reference = ?',
        [paymentReference]
      );

      if (journalEntries.length > 0) {
        const journalEntryId = journalEntries[0].id;

        // Delete transactions first (foreign key constraint)
        await conn.query('DELETE FROM transactions WHERE journal_entry_id = ?', [journalEntryId]);

        // Delete journal entry lines
        await conn.query('DELETE FROM journal_entry_lines WHERE journal_entry_id = ?', [journalEntryId]);

        // Delete journal entry
        await conn.query('DELETE FROM journal_entries WHERE id = ?', [journalEntryId]);

        console.log(`🗑️ Deleted journal entry ${journalEntryId} for payment reference ${paymentReference}`);
      } else {
        console.log(`⚠️ No journal entry found for payment reference ${paymentReference}`);
      }

      // Soft delete payment
      await conn.execute(
        'UPDATE boarding_fees_payments SET is_active = FALSE, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [req.user.id, id]
      );

      // Recalculate all account balances after deleting journal entry
      await AccountBalanceService.recalculateAllAccountBalances(conn);
      console.log(`✅ Recalculated account balances after deleting payment`);

      await conn.commit();

      // Log the audit
      await AuditLogger.log({
        user_id: req.user.id,
        action: 'DELETE',
        table_name: 'boarding_fees_payments',
        record_id: id,
        details: { receipt_number: existingPayment[0].receipt_number }
      });

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment'
      });
    } finally {
      conn.release();
    }
  }

  // Get payment summary by student
  static async getPaymentSummaryByStudent(req, res) {
    try {
      const { studentRegNumber } = req.params;
      const { academic_year, term } = req.query;

      let whereClause = 'WHERE bfp.student_reg_number = ? AND bfp.is_active = TRUE';
      let params = [studentRegNumber];

      if (academic_year) {
        whereClause += ' AND bfp.academic_year = ?';
        params.push(academic_year);
      }

      if (term) {
        whereClause += ' AND bfp.term = ?';
        params.push(term);
      }

      const [summary] = await pool.execute(`
        SELECT 
          bfp.academic_year,
          bfp.term,
          COUNT(*) as total_payments,
          SUM(bfp.amount_paid) as total_amount,
          SUM(bfp.base_currency_amount) as total_base_amount,
          bfp.currency_id,
          c.name as currency_name,
          c.symbol as currency_symbol,
          bc.name as base_currency_name,
          bc.symbol as base_currency_symbol
        FROM boarding_fees_payments bfp
        LEFT JOIN currencies c ON bfp.currency_id = c.id
        LEFT JOIN currencies bc ON bfp.base_currency_id = bc.id
        ${whereClause}
        GROUP BY bfp.academic_year, bfp.term, bfp.currency_id
        ORDER BY bfp.academic_year DESC, bfp.term
      `, params);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment summary'
      });
    }
  }
}

module.exports = BoardingFeesPaymentsController;
