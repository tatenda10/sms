const { pool } = require('../../config/database');
const StudentTransactionController = require('../students/studentTransactionController');
const AccountBalanceService = require('../../services/accountBalanceService');

// Helper function to process transport payment accounting
const processTransportPayment = async (conn, paymentData) => {
  const { transport_fee_id, student_reg_number, amount, payment_method, payment_date, notes, created_by } = paymentData;
  
  try {
    // 1. Create journal entry
    const [journalResult] = await conn.execute(
      `INSERT INTO journal_entries (entry_date, description, created_by, reference_type, reference_id) 
       VALUES (?, ?, ?, 'transport_payment', ?)`,
      [payment_date, `Transport Payment - Student: ${student_reg_number}`, created_by, transport_fee_id]
    );
    const journalEntryId = journalResult.insertId;
    
    // 2. Create transaction record
    const [transactionResult] = await conn.execute(
      `INSERT INTO transactions (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) 
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      ['transport_sale', amount, payment_date, payment_method, notes || 'Transport Fee Payment', journalEntryId]
    );
    const transactionId = transactionResult.insertId;
    
    // 3. Create journal entry lines (double-entry bookkeeping)
    // Debit: Cash/Bank Account (increase asset)
    let debitAccountCode;
    if (payment_method === 'cash') debitAccountCode = 1000;  // Cash on Hand
    else if (payment_method === 'bank_transfer' || payment_method === 'card') debitAccountCode = 1010;  // Bank Account
    else debitAccountCode = 1000;  // Default to Cash on Hand
    
    const [[debitAccount]] = await conn.execute(
      `SELECT id FROM chart_of_accounts WHERE code = ? LIMIT 1`,
      [debitAccountCode.toString()]
    );
    
    // Credit: Transport Revenue (increase revenue)
    const [[revenueAccount]] = await conn.execute(
      `SELECT id FROM chart_of_accounts WHERE code = '4000' LIMIT 1`  // Transport Revenue
    );
    
    if (!debitAccount || !revenueAccount) {
      throw new Error('Required accounts not found in chart of accounts');
    }
    
    // Debit cash/bank
    await conn.execute(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) 
       VALUES (?, ?, ?, 0, 1)`,
      [journalEntryId, debitAccount.id, amount]
    );
    
    // Credit revenue
    await conn.execute(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) 
       VALUES (?, ?, 0, ?, 1)`,
      [journalEntryId, revenueAccount.id, amount]
    );
    
    // 4. Create student transaction (credit for payment received)
    await StudentTransactionController.createTransactionHelper(
      student_reg_number,
      'CREDIT',
      amount,
      `Transport Payment - ${payment_method} - Fee #${transport_fee_id}`,
      {
        created_by: created_by
      }
    );
    
    // 5. Update account balances from journal entry
    await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, 1);
    
    console.log(`✅ Transport payment processed: ${amount} for student ${student_reg_number}`);
    return { journalEntryId, transactionId };
    
  } catch (error) {
    console.error('Error processing transport payment:', error);
    throw error;
  }
};

class TransportPaymentController {
  // Get all transport fees
  static async getAllFees(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', route_id = '', student_id = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR tr.route_name LIKE ?)';
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
      
      if (student_id) {
        whereClause += ' AND str.student_id = ?';
        params.push(student_id);
      }
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM transport_fees tf
         JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         JOIN students s ON str.student_id = s.id
         JOIN transport_routes tr ON str.route_id = tr.id
         ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // Get fees with pagination
      const [fees] = await pool.execute(
        `SELECT 
           tf.*,
           s.full_name as student_name,
           s.student_id as student_number,
           tr.route_name,
           tr.route_code,
           str.pickup_point,
           str.dropoff_point
         FROM transport_fees tf
         JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         JOIN students s ON str.student_id = s.id
         JOIN transport_routes tr ON str.route_id = tr.id
         ${whereClause}
         ORDER BY tf.due_date DESC, s.full_name
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
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
      console.error('Error fetching transport fees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transport fees',
        error: error.message
      });
    }
  }
  
  // Get fee by ID
  static async getFeeById(req, res) {
    try {
      const { id } = req.params;
      
      const [fees] = await pool.execute(
        `SELECT 
           tf.*,
           s.full_name as student_name,
           s.student_id as student_number,
           tr.route_name,
           tr.route_code,
           str.pickup_point,
           str.dropoff_point
         FROM transport_fees tf
         JOIN student_transport_registrations str ON tf.student_registration_id = str.id
         JOIN students s ON str.student_id = s.id
         JOIN transport_routes tr ON str.route_id = str.id
         WHERE tf.id = ?`,
        [id]
      );
      
      if (fees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transport fee not found'
        });
      }
      
      res.json({
        success: true,
        data: fees[0]
      });
      
    } catch (error) {
      console.error('Error fetching transport fee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transport fee',
        error: error.message
      });
    }
  }
  
  // Generate transport fees for a period
  static async generateFees(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { fee_period, due_date } = req.body;
      
      if (!fee_period || !due_date) {
        return res.status(400).json({
          success: false,
          message: 'Fee period and due date are required'
        });
      }
      
      // Get all active student transport registrations
      const [registrations] = await connection.execute(
        `SELECT 
           str.*,
           tr.monthly_fee,
           tr.currency
         FROM student_transport_registrations str
         JOIN transport_routes tr ON str.route_id = tr.id
         WHERE str.is_active = TRUE`,
        []
      );
      
      if (registrations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active student transport registrations found'
        });
      }
      
      let feesGenerated = 0;
      let feesSkipped = 0;
      
      for (const registration of registrations) {
        // Check if fee already exists for this period
        const [existingFees] = await connection.execute(
          'SELECT id FROM transport_fees WHERE student_registration_id = ? AND fee_period = ?',
          [registration.id, fee_period]
        );
        
        if (existingFees.length === 0) {
          // Generate new fee
          await connection.execute(
            `INSERT INTO transport_fees (
              student_registration_id, fee_period, due_date, amount, currency, status
            ) VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [registration.id, fee_period, due_date, registration.monthly_fee, registration.currency]
          );
          feesGenerated++;
        } else {
          feesSkipped++;
        }
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Transport fees generated successfully',
        data: {
          fees_generated: feesGenerated,
          fees_skipped: feesSkipped,
          total_registrations: registrations.length
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error generating transport fees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate transport fees',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
  
  // Record transport payment
  static async recordPayment(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        transport_fee_id,
        student_id,
        payment_date,
        amount,
        currency,
        payment_method,
        notes
      } = req.body;
      
      const created_by = req.user.id;
      
      // Validate required fields
      if (!transport_fee_id || !student_id || !payment_date || !amount || !payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Transport fee ID, student ID, payment date, amount, and payment method are required'
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
      
      // Get student registration number for the fee
      const [studentReg] = await connection.execute(
        'SELECT student_reg_number FROM student_transport_registrations WHERE id = ?',
        [fee.student_registration_id]
      );
      
      if (studentReg.length === 0) {
        throw new Error('Student registration not found for this transport fee');
      }
      
      const student_reg_number = studentReg[0].student_reg_number;
      
      // Record payment
      const [paymentResult] = await connection.execute(
        `INSERT INTO transport_payments (
          transport_fee_id, student_id, payment_date, amount, currency,
          payment_method, reference_number, receipt_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transport_fee_id, student_id, payment_date, amount, currency || fee.currency, payment_method, referenceNumber, receiptNumber, notes, created_by]
      );
      
      // Update fee status to paid
      await connection.execute(
        'UPDATE transport_fees SET status = "Paid" WHERE id = ?',
        [transport_fee_id]
      );
      
      // Process payment with accounting integration and student transaction
      const paymentResult_accounting = await processTransportPayment(connection, {
        transport_fee_id: parseInt(transport_fee_id),
        student_reg_number: student_reg_number,
        amount: parseFloat(amount),
        payment_method,
        payment_date,
        notes: notes || `Payment for transport fee #${transport_fee_id}`,
        created_by: created_by
      });
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Transport payment recorded successfully',
        data: {
          payment_id: paymentResult.insertId,
          reference_number: referenceNumber,
          receipt_number: receiptNumber,
          journal_entry_id: paymentResult_accounting.journalEntryId,
          transaction_id: paymentResult_accounting.transactionId
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error recording transport payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record transport payment',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
  
  // Create journal entry for transport payment
  static async createTransportJournalEntry(connection, fee, amount, currency, reference, paymentDate, createdBy) {
    try {
      // Get account IDs from chart of accounts
      const [cashAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code = '1000' AND type = 'Asset' LIMIT 1"
      );
      
      const [transportRevenueAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code LIKE '4%' AND name LIKE '%Transport%' AND type = 'Revenue' LIMIT 1"
      );
      
      // Default to general revenue if transport revenue account not found
      let revenueAccountId = transportRevenueAccount.length > 0 ? transportRevenueAccount[0].id : null;
      if (!revenueAccountId) {
        const [generalRevenue] = await connection.execute(
          "SELECT id FROM chart_of_accounts WHERE code LIKE '4%' AND type = 'Revenue' LIMIT 1"
        );
        revenueAccountId = generalRevenue.length > 0 ? generalRevenue[0].id : null;
      }
      
      if (!cashAccount.length || !revenueAccountId) {
        throw new Error('Required chart of accounts not found');
      }
      
      // Get currency ID
      const [currencyResult] = await connection.execute(
        'SELECT id FROM currencies WHERE code = ? LIMIT 1',
        [currency]
      );
      const currencyId = currencyResult.length > 0 ? currencyResult[0].id : 1;
      
      // Create journal entry
      const [journalResult] = await connection.execute(
        `INSERT INTO journal_entries (
          journal_id, entry_date, reference, description, created_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [1, paymentDate, reference, 'Transport fee payment', createdBy]
      );
      
      const journalEntryId = journalResult.insertId;
      
      // Create journal entry lines
      // Debit: Cash/Bank
      await connection.execute(
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, description, currency_id
        ) VALUES (?, ?, ?, 0, 'Transport fee payment received', ?)`,
        [journalEntryId, cashAccount[0].id, amount, currencyId]
      );
      
      // Credit: Transport Revenue
      await connection.execute(
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, debit, credit, description, currency_id
        ) VALUES (?, ?, 0, ?, 'Transport fee revenue', ?)`,
        [journalEntryId, revenueAccountId, amount, currencyId]
      );
      
    } catch (error) {
      console.error('Error creating transport journal entry:', error);
      throw error;
    }
  }
  
  // Get payment summary
  static async getPaymentSummary(req, res) {
    try {
      const [summary] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT tf.id) as total_fees,
          COUNT(DISTINCT CASE WHEN tf.status = 'Paid' THEN tf.id END) as paid_fees,
          COUNT(DISTINCT CASE WHEN tf.status = 'Pending' THEN tf.id END) as pending_fees,
          COUNT(DISTINCT CASE WHEN tf.status = 'Overdue' THEN tf.id END) as overdue_fees,
          SUM(CASE WHEN tf.status = 'Paid' THEN tf.amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN tf.status = 'Pending' THEN tf.amount ELSE 0 END) as total_pending,
          SUM(CASE WHEN tf.status = 'Overdue' THEN tf.amount ELSE 0 END) as total_overdue,
          COUNT(DISTINCT str.student_id) as active_students
        FROM transport_fees tf
        JOIN student_transport_registrations str ON tf.student_registration_id = str.id
        WHERE str.is_active = TRUE
      `);
      
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
      const [overdueFees] = await pool.execute(`
        SELECT 
          tf.*,
          s.full_name as student_name,
          s.student_id as student_number,
          tr.route_name,
          tr.route_code,
          DATEDIFF(CURDATE(), tf.due_date) as days_overdue
        FROM transport_fees tf
        JOIN student_transport_registrations str ON tf.student_registration_id = str.id
        JOIN students s ON str.student_id = s.id
        JOIN transport_routes tr ON str.route_id = tr.id
        WHERE tf.status = 'Pending' AND tf.due_date < CURDATE() AND str.is_active = TRUE
        ORDER BY tf.due_date ASC, s.full_name
      `);
      
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
}

module.exports = TransportPaymentController;
