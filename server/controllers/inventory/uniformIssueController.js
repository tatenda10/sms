const { pool } = require('../../config/database');
const StudentBalanceService = require('../../services/studentBalanceService');
const StudentTransactionController = require('../students/studentTransactionController');
const AccountBalanceService = require('../../services/accountBalanceService');

// Helper function to process uniform payment accounting
const processUniformPayment = async (conn, paymentData) => {
  const { issue_id, student_reg_number, amount, payment_method, payment_date, notes, issued_by } = paymentData;
  
  try {
    // 1. Create journal entry
    const [journalResult] = await conn.execute(
      `INSERT INTO journal_entries (entry_date, description, created_by, reference_type, reference_id) 
       VALUES (?, ?, ?, 'uniform_payment', ?)`,
      [payment_date, `Uniform Payment - Student: ${student_reg_number}`, issued_by, issue_id]
    );
    const journalEntryId = journalResult.insertId;
    
    // 2. Create transaction record
    const [transactionResult] = await conn.execute(
      `INSERT INTO transactions (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) 
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      ['uniform_sale', amount, payment_date, payment_method, notes || 'Uniform Sale', journalEntryId]
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
    
    // Credit: Uniform Sales Revenue (increase revenue)
    const [[revenueAccount]] = await conn.execute(
      `SELECT id FROM chart_of_accounts WHERE code = '4000' LIMIT 1`  // Uniform Sales Revenue
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
    
    // 4. Record payment in uniform_payments table
    await conn.execute(
      `INSERT INTO uniform_payments (issue_id, amount, payment_date, payment_method, reference, notes, recorded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [issue_id, amount, payment_date, payment_method, `UNI-${issue_id}-${Date.now()}`, notes, issued_by]
    );
    
    // 5. Create student transaction (credit for payment received)
    await StudentTransactionController.createTransactionHelper(
      student_reg_number,
      'CREDIT',
      amount,
      `Uniform Payment - ${payment_method} - Issue #${issue_id}`,
      {
        created_by: issued_by
      }
    );
    
    // 6. Update account balances from journal entry
    await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, 1);
    
    console.log(`✅ Uniform payment processed: ${amount} for student ${student_reg_number}`);
    return { journalEntryId, transactionId };
    
  } catch (error) {
    console.error('Error processing uniform payment:', error);
    throw error;
  }
};

// Get all uniform issues with pagination and filters
const getAllIssues = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', student = '', item = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (status) {
      whereClause += ' AND ui.payment_status = ?';
      params.push(status);
    }
    
    if (student) {
      whereClause += ' AND ui.student_reg_number LIKE ?';
      params.push(`%${student}%`);
    }
    
    if (item) {
      whereClause += ' AND (ii.name LIKE ? OR ii.reference LIKE ?)';
      params.push(`%${item}%`, `%${item}%`);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM uniform_issues ui
      JOIN inventory_items ii ON ui.item_id = ii.id
      JOIN users u ON ui.issued_by = u.id
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Get issues with pagination
    const issuesQuery = `
      SELECT 
        ui.*,
        ii.name as item_name,
        ii.reference as item_reference,
        ii.unit_price,
        u.username as issued_by_name
      FROM uniform_issues ui
      JOIN inventory_items ii ON ui.item_id = ii.id
      JOIN users u ON ui.issued_by = u.id
      ${whereClause}
      ORDER BY ui.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const [issues] = await pool.execute(issuesQuery, params);
    
    res.json({
      success: true,
      data: issues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
};

// Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ui.*,
        ii.name as item_name,
        ii.reference as item_reference,
        ii.unit_price,
        u.username as issued_by_name
      FROM uniform_issues ui
      JOIN inventory_items ii ON ui.item_id = ii.id
      JOIN users u ON ui.issued_by = u.id
      WHERE ui.id = ?
    `;
    
    const [issues] = await pool.execute(query, [id]);
    
    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      data: issues[0]
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
      error: error.message
    });
  }
};

// Create new uniform issue
const createIssue = async (req, res) => {
  try {
    const { 
      item_id, 
      student_reg_number, 
      quantity, 
      issue_date, 
      payment_status, 
      payment_method, 
      amount, 
      reference,
      notes 
    } = req.body;
    
    const issued_by = req.user.id;
    
    // Validate required fields
    if (!item_id || !student_reg_number || !quantity || !issue_date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Item, student, quantity, issue date, and amount are required'
      });
    }
    
    // Check if item exists and has sufficient stock
    const [item] = await pool.execute(
      'SELECT id, current_stock, unit_price FROM inventory_items WHERE id = ?',
      [item_id]
    );
    
    if (item.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    if (item[0].current_stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }
    
    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      // Create uniform issue
      const [result] = await conn.execute(
        `INSERT INTO uniform_issues 
         (item_id, student_reg_number, quantity, issue_date, payment_status, 
          payment_method, amount, reference, notes, issued_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item_id, student_reg_number, quantity, issue_date, payment_status || 'pending', 
         payment_method || 'cash', amount, reference || null, notes || null, issued_by]
      );
      
      const issueId = result.insertId;
      
      // Update item stock
      const newStock = item[0].current_stock - quantity;
      await conn.execute(
        'UPDATE inventory_items SET current_stock = ? WHERE id = ?',
        [newStock, item_id]
      );
      
      // Always create a DEBIT transaction for the uniform issue (student owes money)
      await StudentTransactionController.createTransactionHelper(
        student_reg_number,
        'DEBIT',
        parseFloat(amount),
        `Uniform Issue - ${reference || 'No Reference'}`,
        {
          created_by: issued_by
        }
      );
      
      // If payment is made immediately, process accounting entries and create CREDIT transaction
      if (payment_status === 'paid' && payment_method && amount > 0) {
        await processUniformPayment(conn, {
          issue_id: issueId,
          student_reg_number,
          amount: parseFloat(amount),
          payment_method,
          payment_date: issue_date,
          notes: `Uniform issue payment - ${notes || ''}`,
          issued_by
        });
      } else if (payment_status === 'partial' && payment_method && amount > 0) {
        // For partial payments, process partial payment accounting and create CREDIT transaction
        await processUniformPayment(conn, {
          issue_id: issueId,
          student_reg_number,
          amount: parseFloat(amount),
          payment_method,
          payment_date: issue_date,
          notes: `Partial uniform payment - ${notes || ''}`,
          issued_by
        });
      }
      // For pending payments, only the DEBIT transaction is created (no payment processing)
      
      // Commit transaction
      await conn.commit();
      
      // Fetch the created issue
      const [newIssue] = await conn.execute(
        'SELECT * FROM uniform_issues WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'Uniform issued successfully',
        data: newIssue[0]
      });
    } catch (error) {
      // Rollback on error
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue uniform',
      error: error.message
    });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      payment_status, 
      payment_method, 
      amount, 
      notes 
    } = req.body;
    
    // Check if issue exists
    const [existing] = await pool.execute(
      'SELECT id FROM uniform_issues WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Update issue
    await pool.execute(
      `UPDATE uniform_issues 
       SET payment_status = ?, payment_method = ?, amount = ?, notes = ?
       WHERE id = ?`,
      [payment_status, payment_method, amount, notes || null, id]
    );
    
    // Fetch updated issue
    const [updatedIssue] = await pool.execute(
      'SELECT * FROM uniform_issues WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: updatedIssue[0]
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue',
      error: error.message
    });
  }
};

// Delete issue (only if no payments recorded)
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if issue exists
    const [existing] = await pool.execute(
      'SELECT id, item_id, quantity FROM uniform_issues WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Check if payments exist
    const [payments] = await pool.execute(
      'SELECT id FROM uniform_payments WHERE issue_id = ?',
      [id]
    );
    
    if (payments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete issue with existing payments'
      });
    }
    
    // Start transaction
    await pool.execute('START TRANSACTION');
    
    try {
      // Restore item stock
      await pool.execute(
        'UPDATE inventory_items SET current_stock = current_stock + ? WHERE id = ?',
        [existing[0].quantity, existing[0].item_id]
      );
      
      // Delete issue
      await pool.execute(
        'DELETE FROM uniform_issues WHERE id = ?',
        [id]
      );
      
      // Commit transaction
      await pool.execute('COMMIT');
      
      res.json({
        success: true,
        message: 'Issue deleted successfully'
      });
    } catch (error) {
      // Rollback on error
      await pool.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: error.message
    });
  }
};

// Record payment for uniform issue
const recordPayment = async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const { issue_id } = req.params;
    const { 
      amount, 
      payment_date, 
      payment_method, 
      reference, 
      notes 
    } = req.body;
    
    const recorded_by = req.user.id;
    
    // Validate required fields
    if (!amount || !payment_date || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Amount, payment date, and payment method are required'
      });
    }
    
    // Check if issue exists and get student info
    const [issue] = await conn.execute(
      'SELECT id, amount, payment_status, student_reg_number FROM uniform_issues WHERE id = ?',
      [issue_id]
    );
    
    if (issue.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const issueData = issue[0];
    
    // Check if payment amount exceeds issue amount
    if (parseFloat(amount) > parseFloat(issueData.amount)) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed issue amount'
      });
    }
    
    // Start transaction
    await conn.beginTransaction();
    
    try {
      // Process payment with accounting integration
      const paymentResult = await processUniformPayment(conn, {
        issue_id: parseInt(issue_id),
        student_reg_number: issueData.student_reg_number,
        amount: parseFloat(amount),
        payment_method,
        payment_date,
        notes: notes || `Payment for uniform issue #${issue_id}`,
        issued_by: recorded_by
      });
      
      // Calculate total payments for this issue
      const [totalPayments] = await conn.execute(
        'SELECT SUM(amount) as total FROM uniform_payments WHERE issue_id = ?',
        [issue_id]
      );
      
      const totalPaid = parseFloat(totalPayments[0].total || 0);
      const issueAmount = parseFloat(issueData.amount);
      
      // Update issue payment status
      let newStatus = 'partial';
      if (totalPaid >= issueAmount) {
        newStatus = 'paid';
      }
      
      await conn.execute(
        'UPDATE uniform_issues SET payment_status = ? WHERE id = ?',
        [newStatus, issue_id]
      );
      
      // Commit transaction
      await conn.commit();
      
      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          payment_status: newStatus,
          total_paid: totalPaid,
          remaining: issueAmount - totalPaid,
          journal_entry_id: paymentResult.journalEntryId,
          transaction_id: paymentResult.transactionId
        }
      });
    } catch (error) {
      // Rollback on error
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  } finally {
    conn.release();
  }
};

// Get payment history for an issue
const getPaymentHistory = async (req, res) => {
  try {
    const { issue_id } = req.params;
    
    const query = `
      SELECT 
        up.*,
        u.username as recorded_by_name
      FROM uniform_payments up
      JOIN users u ON up.recorded_by = u.id
      WHERE up.issue_id = ?
      ORDER BY up.payment_date DESC
    `;
    
    const [payments] = await pool.execute(query, [issue_id]);
    
    // Get issue details and student balance
    const [issueDetails] = await pool.execute(
      `SELECT ui.*, ii.name as item_name, s.Name as student_name, s.Surname as student_surname
       FROM uniform_issues ui
       JOIN inventory_items ii ON ui.item_id = ii.id
       JOIN students s ON ui.student_reg_number = s.RegNumber
       WHERE ui.id = ?`,
      [issue_id]
    );
    
    // Get student balance
    const [balanceInfo] = await pool.execute(
      'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
      [issueDetails[0]?.student_reg_number]
    );
    
    res.json({
      success: true,
      data: {
        payments,
        issue: issueDetails[0],
        student_balance: balanceInfo[0]?.current_balance || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Get student balance and uniform debt summary
const getStudentUniformSummary = async (req, res) => {
  try {
    const { student_reg_number } = req.params;
    
    // Get student balance
    const [balanceInfo] = await pool.execute(
      'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
      [student_reg_number]
    );
    
    // Get uniform issues summary
    const [issuesSummary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_issues,
        SUM(amount) as total_amount,
        SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'partial' THEN amount ELSE 0 END) as partial_amount,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_amount
       FROM uniform_issues 
       WHERE student_reg_number = ?`,
      [student_reg_number]
    );
    
    // Get recent uniform issues
    const [recentIssues] = await pool.execute(
      `SELECT 
        ui.*,
        ii.name as item_name,
        ii.reference as item_reference
       FROM uniform_issues ui
       JOIN inventory_items ii ON ui.item_id = ii.id
       WHERE ui.student_reg_number = ?
       ORDER BY ui.created_at DESC
       LIMIT 10`,
      [student_reg_number]
    );
    
    // Get uniform-related student transactions
    const [uniformTransactions] = await pool.execute(
      `SELECT 
        st.id,
        st.transaction_type,
        st.amount,
        st.description,
        st.transaction_date,
        st.created_at
       FROM student_transactions st
       WHERE st.student_reg_number = ?
       AND (st.description LIKE '%Uniform%' OR st.description LIKE '%uniform%')
       ORDER BY st.transaction_date DESC
       LIMIT 20`,
      [student_reg_number]
    );
    
    res.json({
      success: true,
      data: {
        student_balance: balanceInfo[0]?.current_balance || 0,
        uniform_summary: issuesSummary[0],
        recent_issues: recentIssues,
        uniform_transactions: uniformTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching student uniform summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student uniform summary',
      error: error.message
    });
  }
};

// Get inventory summary statistics
const getInventorySummary = async (req, res) => {
  try {
    // Get total items count
    const [totalItems] = await pool.execute('SELECT COUNT(*) as count FROM inventory_items');
    
    // Get total categories count
    const [totalCategories] = await pool.execute('SELECT COUNT(*) as count FROM inventory_categories');
    
    // Get low stock items (less than 10)
    const [lowStockItems] = await pool.execute('SELECT COUNT(*) as count FROM inventory_items WHERE current_stock < 10');
    
    // Get out of stock items
    const [outOfStockItems] = await pool.execute('SELECT COUNT(*) as count FROM inventory_items WHERE current_stock = 0');
    
    // Get total uniform issues this month
    const [monthlyIssues] = await pool.execute(
      'SELECT COUNT(*) as count FROM uniform_issues WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );
    
    // Get total payments this month
    const [monthlyPayments] = await pool.execute(
      'SELECT SUM(amount) as total FROM uniform_payments WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())'
    );
    
    res.json({
      success: true,
      data: {
        total_items: totalItems[0].count,
        total_categories: totalCategories[0].count,
        low_stock_items: lowStockItems[0].count,
        out_of_stock_items: outOfStockItems[0].count,
        monthly_issues: monthlyIssues[0].count,
        monthly_payments: monthlyPayments[0].total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory summary',
      error: error.message
    });
  }
};

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  recordPayment,
  getPaymentHistory,
  getStudentUniformSummary,
  getInventorySummary
};
