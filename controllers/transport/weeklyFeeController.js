const { pool } = require('../../config/database');
const StudentTransactionController = require('../students/studentTransactionController');

class WeeklyFeeController {
  // Get all weekly fees
  static async getAllFees(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', route_id = '', week_start = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (CONCAT(s.Name, \' \', s.Surname) LIKE ? OR s.RegNumber LIKE ? OR tr.route_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (status) {
        whereClause += ' AND tf.status = ?';
        params.push(status);
      }
      
      if (route_id) {
        whereClause += ' AND str.route_id = ?';
        params.push(route_id);
      }
      
      if (week_start) {
        whereClause += ' AND tf.week_start_date = ?';
        params.push(week_start);
      }
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM transport_fees tf
         JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // Get fees with pagination - use string interpolation for LIMIT/OFFSET
      const queryParams = params.length > 0 ? [...params] : [];
            const [fees] = await pool.execute(
                  `SELECT 
            tf.*,
            CONCAT(s.Name, ' ', s.Surname) as student_name,
            s.RegNumber as student_number,
            str.student_reg_number,
            tr.route_name,
            tr.route_code,
            str.pickup_point,
            str.dropoff_point
          FROM transport_fees tf
          JOIN student_transport_registrations str ON tf.student_registration_id = str.id
          JOIN students s ON str.student_reg_number = s.RegNumber
          JOIN transport_routes tr ON str.route_id = tr.id
          ${whereClause}
          ORDER BY tf.week_start_date DESC, s.Name, s.Surname
          LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
         queryParams
       );
       
       console.log('🔍 Fees loaded from database:', fees);
      
      res.json({
        success: true,
        data: fees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching weekly fees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly fees',
        error: error.message
      });
    }
  }
  
  // Generate weekly fees for all active registrations
  static async generateWeeklyFees(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { week_start_date, week_end_date } = req.body;
      
      if (!week_start_date || !week_end_date) {
        return res.status(400).json({
          success: false,
          message: 'Week start date and end date are required'
        });
      }
      
      // Get all active student registrations
      const [registrations] = await connection.execute(
        `SELECT 
           str.id,
           str.student_reg_number,
           str.route_id,
           str.weekly_fee,
           str.currency
         FROM student_transport_registrations str
         WHERE str.is_active = TRUE
         AND str.start_date <= ?
         AND (str.end_date IS NULL OR str.end_date >= ?)`,
        [week_end_date, week_start_date]
      );
      
      if (registrations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active student registrations found for the specified week'
        });
      }
      
      let feesCreated = 0;
      let feesSkipped = 0;
      
      for (const registration of registrations) {
        // Check if fee already exists for this week
        const [existingFees] = await connection.execute(
          'SELECT id FROM transport_fees WHERE student_registration_id = ? AND week_start_date = ?',
          [registration.id, week_start_date]
        );
        
        if (existingFees.length === 0) {
          // Calculate due date (Friday of the week)
          const dueDate = new Date(week_start_date);
          dueDate.setDate(dueDate.getDate() + 4); // Friday is 4 days after Monday
          
          // Create weekly fee
          await connection.execute(
            `INSERT INTO transport_fees (
              student_registration_id, week_start_date, week_end_date, 
              amount, currency, status, due_date
            ) VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
            [registration.id, week_start_date, week_end_date, registration.weekly_fee, registration.currency, dueDate]
          );
          
          feesCreated++;
        } else {
          feesSkipped++;
        }
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Weekly fees generated successfully',
        data: {
          fees_created: feesCreated,
          fees_skipped: feesSkipped,
          week_start: week_start_date,
          week_end: week_end_date
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error generating weekly fees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate weekly fees',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
  
  // Record direct transport payment (without requiring transport fee)
  static async recordDirectPayment(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        route_id,
        student_reg_number,
        payment_date,
        amount,
        payment_method,
        reference,
        notes
      } = req.body;
      
      const created_by = req.user.id;
      
      console.log('🔍 Backend received direct payment data:', {
        route_id,
        student_reg_number,
        payment_date,
        amount,
        payment_method,
        reference,
        notes,
        created_by
      });
      
      // Validate required fields
      if (!route_id || !student_reg_number || !payment_date || !amount || !payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Route ID, student registration number, payment date, amount, and payment method are required'
        });
      }
      
      // Check if route exists and is active
      const [routes] = await connection.execute(
        'SELECT id, route_name, weekly_fee, currency FROM transport_routes WHERE id = ? AND is_active = TRUE',
        [route_id]
      );
      
      if (routes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Route not found or inactive'
        });
      }
      
      const route = routes[0];
      
      // Generate reference and receipt numbers
      const referenceNumber = reference || `TRP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const receiptNumber = `TRP-R${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create a transport payment record directly
      const [paymentResult] = await connection.execute(
        `INSERT INTO transport_payments (
          transport_fee_id, student_reg_number, route_id, payment_date, amount, currency,
          payment_method, reference_number, receipt_number, notes, created_by
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_reg_number, route_id, payment_date, amount, route.currency, payment_method, referenceNumber, receiptNumber, notes, created_by]
      );
      
      // Create student transaction (credit for payment received)
      await StudentTransactionController.createTransactionHelper(
        student_reg_number,
        'CREDIT',
        parseFloat(amount),
        `Transport Payment - ${route.route_name} - ${payment_method} - ${referenceNumber}`,
        {
          created_by: created_by
        }
      );
      
      // Create accounting entries for transport revenue
      await connection.execute(
        `INSERT INTO journal_entries (
          journal_id, entry_date, reference, description, created_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [1, payment_date, referenceNumber, `Transport Payment - ${route.route_name} - ${student_reg_number}`, created_by]
      );
      
      const [journalEntry] = await connection.execute(
        'SELECT id FROM journal_entries WHERE reference = ? ORDER BY id DESC LIMIT 1',
        [referenceNumber]
      );
      
      const journalEntryId = journalEntry[0].id;
      
      // Create transaction record (if transactions table exists)
      let transactionId = null;
      try {
        await connection.execute(
          `INSERT INTO transactions (
            transaction_date, transaction_type, amount, currency, description, 
            reference_number, created_by, journal_entry_id
          ) VALUES (?, 'transport_sale', ?, ?, ?, ?, ?, ?)`,
          [payment_date, amount, route.currency, `Transport Payment - ${route.route_name}`, referenceNumber, created_by, journalEntryId]
        );
        
        const [transaction] = await connection.execute(
          'SELECT id FROM transactions WHERE reference_number = ? ORDER BY id DESC LIMIT 1',
          [referenceNumber]
        );
        
        transactionId = transaction[0].id;
      } catch (transactionError) {
        console.log('⚠️  Transactions table not available, skipping transaction record creation');
        // Continue without transaction record - journal entries are sufficient
      }
      
      // Get account IDs for the accounts
      const [cashAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = 1',
        [payment_method === 'cash' ? '1000' : '1010']
      );
      
      const [revenueAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = 1',
        ['4000']
      );
      
      if (cashAccount.length === 0 || revenueAccount.length === 0) {
        throw new Error('Required chart of accounts not found. Please ensure accounts 1000/1010 (Cash/Bank) and 4000 (Transport Revenue) exist.');
      }
      
      // Create journal entry lines for double-entry bookkeeping
      // Debit Cash/Bank Account
      await connection.execute(
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, description
        ) VALUES (?, ?, ?, 0, ?)`,
        [journalEntryId, cashAccount[0].id, amount, `Transport Payment - ${route.route_name}`]
      );
      
      // Credit Transport Revenue
      await connection.execute(
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, description
        ) VALUES (?, ?, 0, ?, ?)`,
        [journalEntryId, revenueAccount[0].id, amount, `Transport Revenue - ${route.route_name}`]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Transport payment recorded successfully',
        data: {
          payment_id: paymentResult.insertId,
          journal_entry_id: journalEntryId,
          transaction_id: transactionId,
          reference_number: referenceNumber,
          receipt_number: receiptNumber
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error recording direct transport payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record transport payment',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Record weekly payment
  static async recordPayment(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        transport_fee_id,
        student_reg_number,
        payment_date,
        amount,
        currency,
        payment_method,
        notes
      } = req.body;
      
      const created_by = req.user.id;
      
      console.log('🔍 Backend received payment data:', {
        transport_fee_id,
        student_reg_number,
        payment_date,
        amount,
        currency,
        payment_method,
        notes,
        created_by
      });
      
      // Validate required fields
      if (!transport_fee_id || !student_reg_number || !payment_date || !amount || !payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Transport fee ID, student registration number, payment date, amount, and payment method are required'
        });
      }
      
      // Check if fee exists and is unpaid
      const [fees] = await connection.execute(
        'SELECT * FROM transport_fees WHERE id = ? AND status != "Paid"',
        [transport_fee_id]
      );
      
      if (fees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Transport fee not found or already paid'
        });
      }
      
      const fee = fees[0];
      
      // Generate reference and receipt numbers
      const referenceNumber = `TRP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const receiptNumber = `TRP-R${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Record payment
      const [paymentResult] = await connection.execute(
        `INSERT INTO transport_payments (
          transport_fee_id, student_reg_number, payment_date, amount, currency,
          payment_method, reference_number, receipt_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transport_fee_id, student_reg_number, payment_date, amount, currency || fee.currency, payment_method, referenceNumber, receiptNumber, notes, created_by]
      );
      
      // Update fee status to paid
      await connection.execute(
        'UPDATE transport_fees SET status = "Paid" WHERE id = ?',
        [transport_fee_id]
      );
      
      // Create student transaction (credit for payment received)
      await StudentTransactionController.createTransactionHelper(
        student_reg_number,
        'CREDIT',
        parseFloat(amount),
        `Transport Payment - ${payment_method} - Fee #${transport_fee_id}`,
        {
          created_by: created_by
        }
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Weekly transport payment recorded successfully',
        data: {
          payment_id: paymentResult.insertId,
          reference_number: referenceNumber,
          receipt_number: receiptNumber
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error recording weekly payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record weekly payment',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
  
  // Get all transport payments
  static async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', date = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (CONCAT(s.Name, \' \', s.Surname) LIKE ? OR s.RegNumber LIKE ? OR tp.reference_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (status) {
        whereClause += ' AND (tf.status = ? OR (tp.transport_fee_id IS NULL AND ? = "paid"))';
        params.push(status, status);
      }
      
      if (date) {
        whereClause += ' AND DATE(tp.payment_date) = ?';
        params.push(date);
      }
      
      // Get total count - handle both fee-based and direct payments
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM transport_payments tp
         LEFT JOIN transport_fees tf ON tp.transport_fee_id = tf.id
         LEFT JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         LEFT JOIN students s ON (str.student_reg_number = s.RegNumber OR tp.student_reg_number = s.RegNumber)
         LEFT JOIN transport_routes tr ON (str.route_id = tr.id OR tp.route_id = tr.id)
         ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // Get payments with pagination - handle both fee-based and direct payments
      const queryParams = params.length > 0 ? [...params] : [];
      const [payments] = await pool.execute(
        `SELECT 
           tp.*,
           COALESCE(tf.status, 'paid') as status,
           CONCAT(s.Name, ' ', s.Surname) as student_name,
           s.RegNumber as student_number,
           COALESCE(str.student_reg_number, tp.student_reg_number) as student_reg_number,
           tr.route_name,
           tr.route_code,
           COALESCE(str.pickup_point, 'Direct Payment') as pickup_point,
           COALESCE(str.dropoff_point, 'Direct Payment') as dropoff_point
         FROM transport_payments tp
         LEFT JOIN transport_fees tf ON tp.transport_fee_id = tf.id
         LEFT JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         LEFT JOIN students s ON (str.student_reg_number = s.RegNumber OR tp.student_reg_number = s.RegNumber)
         LEFT JOIN transport_routes tr ON (str.route_id = tr.id OR tp.route_id = tr.id)
         ${whereClause}
         ORDER BY tp.payment_date DESC, s.Name, s.Surname
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        queryParams
      );
      
      console.log('🔍 Transport payments loaded:', payments.length, 'payments found');
      
      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching transport payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transport payments',
        error: error.message
      });
    }
  }

  // Get payment summary
  static async getPaymentSummary(req, res) {
    try {
      const [summary] = await pool.execute(
        `SELECT 
           COUNT(DISTINCT tf.id) as total_fees,
           COUNT(DISTINCT CASE WHEN tf.status = 'Paid' THEN tf.id END) as paid_fees,
           COUNT(DISTINCT CASE WHEN tf.status = 'Pending' THEN tf.id END) as pending_fees,
           COUNT(DISTINCT CASE WHEN tf.status = 'Overdue' THEN tf.id END) as overdue_fees,
           SUM(CASE WHEN tf.status = 'Paid' THEN tf.amount ELSE 0 END) as total_paid,
           SUM(CASE WHEN tf.status = 'Pending' THEN tf.amount ELSE 0 END) as total_pending,
           SUM(CASE WHEN tf.status = 'Overdue' THEN tf.amount ELSE 0 END) as total_overdue
         FROM transport_fees tf`
      );
      
      res.json({
        success: true,
        data: summary[0]
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
  
  // Get overdue fees
  static async getOverdueFees(req, res) {
    try {
      const [overdueFees] = await pool.execute(
        `SELECT 
           tf.*,
           CONCAT(s.Name, ' ', s.Surname) as student_name,
           s.RegNumber as student_number,
           str.student_reg_number,
           tr.route_name,
           tr.route_code,
           DATEDIFF(CURDATE(), tf.due_date) as days_overdue
         FROM transport_fees tf
         JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         WHERE tf.status = 'Overdue'
         ORDER BY tf.due_date ASC, s.Name, s.Surname`
      );
      
      res.json({
        success: true,
        data: overdueFees
      });
      
    } catch (error) {
      console.error('Error fetching overdue fees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue fees',
        error: error.message
      });
    }
  }
  
  // Get weekly schedule based on payment status
  static async getWeeklySchedule(req, res) {
    try {
      const { week_start_date, route_id = '' } = req.query;
      
      if (!week_start_date) {
        return res.status(400).json({
          success: false,
          message: 'Week start date is required'
        });
      }
      
      let whereClause = 'WHERE ts.is_active = TRUE';
      const params = [week_start_date];
      
      if (route_id) {
        whereClause += ' AND ts.route_id = ?';
        params.push(route_id);
      }
      
      // Get schedule with student information and payment status
      const [schedule] = await pool.execute(
        `SELECT 
           ts.*,
           tr.route_name,
           tr.route_code,
           str.student_reg_number,
           CONCAT(s.Name, ' ', s.Surname) as student_name,
           s.RegNumber as student_number,
           tf.status as payment_status,
           tf.amount as weekly_fee,
           tf.currency
         FROM transport_schedules ts
         JOIN transport_routes tr ON ts.route_id = tr.id
         LEFT JOIN student_transport_registrations str ON tr.id = str.route_id AND str.is_active = TRUE
         LEFT JOIN students s ON str.student_reg_number = s.RegNumber
         LEFT JOIN transport_fees tf ON str.id = tf.student_registration_id AND tf.week_start_date = ?
         ${whereClause}
         ORDER BY ts.day_of_week, ts.pickup_time, s.Name, s.Surname`,
        params
      );
      
      res.json({
        success: true,
        data: schedule
      });
      
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly schedule',
        error: error.message
      });
    }
  }
}

module.exports = WeeklyFeeController;
