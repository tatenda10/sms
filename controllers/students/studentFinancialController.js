const { pool } = require('../../config/database');

class StudentFinancialController {
  // Get student's financial balance
  static async getStudentBalance(req, res) {
    try {
      const { regNumber } = req.student; // From authenticated student
      const connection = await pool.getConnection();
      
      // Get student details
      const [studentRows] = await connection.execute(
        'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ?',
        [regNumber]
      );
      
      if (studentRows.length === 0) {
        connection.release();
        return res.status(404).json({ 
          success: false,
          message: 'Student not found' 
        });
      }
      
      // Get current balance from student_balances table
      const [balanceRows] = await connection.execute(
        'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
        [regNumber]
      );
      
      connection.release();
      
      const balance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;
      
      res.json({
        success: true,
        student: studentRows[0],
        balance: balance
      });
      
    } catch (error) {
      console.error('Error getting student balance:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get student balance',
        error: error.message 
      });
    }
  }

  // Get student's transaction history
  static async getStudentPayments(req, res) {
    try {
      const { regNumber } = req.student; // From authenticated student
      const { page = 1, limit = 20, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE st.student_reg_number = ?';
      let params = [regNumber];

      if (start_date) {
        whereClause += ' AND DATE(st.transaction_date) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND DATE(st.transaction_date) <= ?';
        params.push(end_date);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM student_transactions st ${whereClause}`,
        params
      );

      const totalRecords = countResult[0].total;

      // Get transactions with running balance calculation
      const [allTransactions] = await pool.execute(
        `SELECT 
          st.id,
          st.student_reg_number,
          st.transaction_type,
          st.amount,
          st.description,
          st.transaction_date,
          st.created_at,
          st.term,
          st.academic_year,
          'USD' as currency_symbol
         FROM student_transactions st
         WHERE st.student_reg_number = ?
         ORDER BY st.transaction_date ASC, st.id ASC`,
        [regNumber]
      );

      // Calculate running balance
      let runningBalance = 0;
      const transactionsWithBalance = allTransactions.map(transaction => {
        if (transaction.transaction_type === 'CREDIT') {
          runningBalance += parseFloat(transaction.amount || 0);
        } else if (transaction.transaction_type === 'DEBIT') {
          runningBalance -= parseFloat(transaction.amount || 0);
        }
        return {
          ...transaction,
          running_balance: runningBalance
        };
      });

      // Sort by date descending for display and apply pagination
      const sortedTransactions = transactionsWithBalance
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          student_reg_number: regNumber,
          transactions: sortedTransactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRecords,
            totalPages: Math.ceil(totalRecords / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching student transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student transactions',
        error: error.message
      });
    }
  }

  // Get student's financial summary
  static async getFinancialSummary(req, res) {
    try {
      const { regNumber } = req.student; // From authenticated student
      const connection = await pool.getConnection();
      
      // Get student details
      const [studentRows] = await connection.execute(
        'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ?',
        [regNumber]
      );
      
      if (studentRows.length === 0) {
        connection.release();
        return res.status(404).json({ 
          success: false,
          message: 'Student not found' 
        });
      }

      // Get current balance from student_balances table
      const [balanceRows] = await connection.execute(
        'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
        [regNumber]
      );
      
      const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;

      // Get total CREDIT transactions (payments made)
      const [creditTransactionsResult] = await connection.execute(
        'SELECT COALESCE(SUM(amount), 0) as total_credit FROM student_transactions WHERE student_reg_number = ? AND transaction_type = ?',
        [regNumber, 'CREDIT']
      );
      
      const totalCredit = creditTransactionsResult[0].total_credit;

      // Get total DEBIT transactions (charges/invoices)
      const [debitTransactionsResult] = await connection.execute(
        'SELECT COALESCE(SUM(amount), 0) as total_debit FROM student_transactions WHERE student_reg_number = ? AND transaction_type = ?',
        [regNumber, 'DEBIT']
      );
      
      const totalDebit = debitTransactionsResult[0].total_debit;

      // Get recent transactions (last 5)
      const [recentTransactions] = await connection.execute(
        `SELECT 
          st.transaction_type,
          st.amount,
          st.description,
          st.transaction_date,
          st.term,
          st.academic_year
         FROM student_transactions st
         WHERE st.student_reg_number = ?
         ORDER BY st.transaction_date DESC
         LIMIT 5`,
        [regNumber]
      );

      connection.release();
      
      res.json({
        success: true,
        data: {
          student: studentRows[0],
          current_balance: currentBalance,
          total_credit: totalCredit,
          total_debit: totalDebit,
          recent_transactions: recentTransactions
        }
      });
      
    } catch (error) {
      console.error('Error getting financial summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get financial summary',
        error: error.message 
      });
    }
  }
}

module.exports = StudentFinancialController;
