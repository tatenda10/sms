const { pool } = require('../../config/database');

class StudentFinancialAnalyticsController {
  // Get outstanding balances by class/stream
  async getOutstandingBalancesByClass(req, res) {
    try {
      const { year, term, include_zero_balances = false } = req.query;

      let whereClause = 'WHERE sb.current_balance != 0';
      let params = [];

      if (!include_zero_balances) {
        whereClause = 'WHERE sb.current_balance < 0'; // Only negative balances (outstanding)
      }

      const [balances] = await pool.execute(`
        SELECT 
          gc.id as class_id,
          gc.name as class_name,
          s.name as stream_name,
          s.stage as stream_stage,
          COUNT(DISTINCT sb.student_reg_number) as student_count,
          COALESCE(SUM(ABS(sb.current_balance)), 0) as total_outstanding,
          COALESCE(AVG(ABS(sb.current_balance)), 0) as average_outstanding,
          COALESCE(MIN(ABS(sb.current_balance)), 0) as min_outstanding,
          COALESCE(MAX(ABS(sb.current_balance)), 0) as max_outstanding
        FROM student_balances sb
        JOIN students st ON sb.student_reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        ${whereClause}
        GROUP BY gc.id, gc.name, s.name, s.stage
        ORDER BY total_outstanding DESC
      `, params);

      const balancesWithFormattedData = balances.map(balance => ({
        ...balance,
        total_outstanding: parseFloat(balance.total_outstanding),
        average_outstanding: parseFloat(balance.average_outstanding),
        min_outstanding: parseFloat(balance.min_outstanding),
        max_outstanding: parseFloat(balance.max_outstanding)
      }));

      res.json({
        success: true,
        data: {
          balances_by_class: balancesWithFormattedData,
          total_students_with_balances: balances.reduce((sum, b) => sum + parseInt(b.student_count), 0),
          total_outstanding_amount: balances.reduce((sum, b) => sum + parseFloat(b.total_outstanding), 0)
        }
      });

    } catch (error) {
      console.error('Error fetching outstanding balances by class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch outstanding balances by class',
        error: error.message
      });
    }
  }

  // Get payment completion rates
  async getPaymentCompletionRates(req, res) {
    try {
      const { year, term, start_date, end_date } = req.query;

      let studentTransactionFilter = '';
      let paymentFilter = '';
      let studentParams = [];
      let paymentParams = [];

      if (start_date && end_date) {
        studentTransactionFilter = 'AND st.transaction_date BETWEEN ? AND ?';
        paymentFilter = 'AND fp.payment_date BETWEEN ? AND ?';
        studentParams = [start_date, end_date];
        paymentParams = [start_date, end_date];
      } else if (year && term) {
        studentTransactionFilter = 'AND YEAR(st.transaction_date) = ? AND st.transaction_date LIKE ?';
        paymentFilter = 'AND YEAR(fp.payment_date) = ? AND fp.payment_date LIKE ?';
        studentParams = [year, `%Term ${term}%`];
        paymentParams = [year, `%Term ${term}%`];
      } else if (year) {
        studentTransactionFilter = 'AND YEAR(st.transaction_date) = ?';
        paymentFilter = 'AND YEAR(fp.payment_date) = ?';
        studentParams = [year];
        paymentParams = [year];
      } else {
        // Default to current year
        const now = new Date();
        studentTransactionFilter = 'AND YEAR(st.transaction_date) = ?';
        paymentFilter = 'AND YEAR(fp.payment_date) = ?';
        studentParams = [now.getFullYear()];
        paymentParams = [now.getFullYear()];
      }

      // Get total fees charged (DEBIT transactions)
      const [totalCharges] = await pool.execute(`
        SELECT 
          COALESCE(SUM(st.amount), 0) as total_charged
        FROM student_transactions st
        WHERE st.transaction_type = 'DEBIT'
          ${studentTransactionFilter}
      `, studentParams);

      // Get total payments received (CREDIT transactions)
      const [totalPayments] = await pool.execute(`
        SELECT 
          COALESCE(SUM(fp.base_currency_amount), 0) as total_paid_tuition,
          COALESCE(SUM(bfp.base_currency_amount), 0) as total_paid_boarding,
          COALESCE(SUM(st.amount), 0) as total_paid_other
        FROM fee_payments fp
        LEFT JOIN boarding_fees_payments bfp ON 1=1
        LEFT JOIN student_transactions st ON st.transaction_type = 'CREDIT' AND st.description LIKE '%Fee Payment%'
        WHERE fp.status = 'completed' AND bfp.status = 'completed'
          ${paymentFilter}
      `, paymentParams);

      // Get payment completion by class
      const [completionByClass] = await pool.execute(`
        SELECT 
          gc.id as class_id,
          gc.name as class_name,
          s.name as stream_name,
          COUNT(DISTINCT e.student_regnumber) as total_students,
          COUNT(DISTINCT CASE WHEN sb.current_balance >= 0 THEN e.student_regnumber END) as students_paid_up,
          COUNT(DISTINCT CASE WHEN sb.current_balance < 0 THEN e.student_regnumber END) as students_with_balance
        FROM enrollments_gradelevel_classes e
        JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN student_balances sb ON sb.student_reg_number = e.student_regnumber
        WHERE e.status = 'active'
        GROUP BY gc.id, gc.name, s.name
        ORDER BY students_paid_up DESC
      `);

      const totalCharged = parseFloat(totalCharges[0].total_charged);
      const totalPaid = parseFloat(totalPayments[0].total_paid_tuition) +
        parseFloat(totalPayments[0].total_paid_boarding) +
        parseFloat(totalPayments[0].total_paid_other);

      const overallCompletionRate = totalCharged > 0 ? ((totalPaid / totalCharged) * 100).toFixed(2) : 0;

      const completionByClassFormatted = completionByClass.map(cls => ({
        ...cls,
        completion_rate: cls.total_students > 0 ?
          ((cls.students_paid_up / cls.total_students) * 100).toFixed(2) : 0,
        outstanding_students: parseInt(cls.students_with_balance)
      }));

      res.json({
        success: true,
        data: {
          overall_completion_rate: parseFloat(overallCompletionRate),
          total_charged: totalCharged,
          total_paid: totalPaid,
          outstanding_amount: totalCharged - totalPaid,
          completion_by_class: completionByClassFormatted,
          period: start_date && end_date ? `${start_date} to ${end_date}` :
            year && term ? `${year} Term ${term}` :
              year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching payment completion rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment completion rates',
        error: error.message
      });
    }
  }

  // Get fee collection efficiency metrics
  async getFeeCollectionEfficiencyMetrics(req, res) {
    try {
      const { year, term, start_date, end_date } = req.query;

      let dateFilter = '';
      let params = [];

      if (start_date && end_date) {
        dateFilter = 'AND payment_date BETWEEN ? AND ?';
        params = [start_date, end_date];
      } else if (year && term) {
        dateFilter = 'AND YEAR(payment_date) = ? AND payment_date LIKE ?';
        params = [year, `%Term ${term}%`];
      } else if (year) {
        dateFilter = 'AND YEAR(payment_date) = ?';
        params = [year];
      } else {
        // Default to current year
        const now = new Date();
        dateFilter = 'AND YEAR(payment_date) = ?';
        params = [now.getFullYear()];
      }

      // Get collection efficiency metrics
      const [efficiencyMetrics] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT fp.student_reg_number) as students_paid,
          COUNT(fp.id) as total_payments,
          COALESCE(SUM(fp.base_currency_amount), 0) as total_collected,
          COALESCE(AVG(fp.base_currency_amount), 0) as average_payment,
          COUNT(CASE WHEN fp.payment_method = 'cash' THEN 1 END) as cash_payments,
          COUNT(CASE WHEN fp.payment_method = 'bank_transfer' THEN 1 END) as bank_payments,
          COUNT(CASE WHEN fp.payment_method = 'mobile_money' THEN 1 END) as mobile_payments,
          COUNT(CASE WHEN LOWER(fp.status) = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN LOWER(fp.status) = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN LOWER(fp.status) = 'failed' THEN 1 END) as failed_payments
        FROM fee_payments fp
        WHERE 1=1 ${dateFilter}
      `, params);

      // Get boarding collection metrics
      const [boardingMetrics] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT bfp.student_reg_number) as students_paid_boarding,
          COUNT(bfp.id) as total_boarding_payments,
          COALESCE(SUM(bfp.base_currency_amount), 0) as total_boarding_collected
        FROM boarding_fees_payments bfp
        WHERE bfp.status = 'completed' ${dateFilter}
      `, params);

      // Get total active students for efficiency calculation
      const [totalStudents] = await pool.execute(`
        SELECT COUNT(DISTINCT e.student_regnumber) as total_active_students
        FROM enrollments_gradelevel_classes e
        WHERE e.status = 'active'
      `);

      const metrics = efficiencyMetrics[0];
      const boarding = boardingMetrics[0];
      const totalActiveStudents = parseInt(totalStudents[0].total_active_students);

      const efficiencyData = {
        students_paid: parseInt(metrics.students_paid),
        total_payments: parseInt(metrics.total_payments),
        total_collected: parseFloat(metrics.total_collected),
        average_payment: parseFloat(metrics.average_payment),
        students_paid_boarding: parseInt(boarding.students_paid_boarding),
        total_boarding_collected: parseFloat(boarding.total_boarding_collected),
        total_boarding_payments: parseInt(boarding.total_boarding_payments),
        payment_methods: {
          cash: parseInt(metrics.cash_payments),
          bank_transfer: parseInt(metrics.bank_payments),
          mobile_money: parseInt(metrics.mobile_payments)
        },
        payment_status: {
          completed: parseInt(metrics.completed_payments),
          pending: parseInt(metrics.pending_payments),
          failed: parseInt(metrics.failed_payments)
        },
        efficiency_metrics: {
          collection_rate: totalActiveStudents > 0 ?
            ((metrics.students_paid / totalActiveStudents) * 100).toFixed(2) : 0,
          success_rate: metrics.total_payments > 0 ?
            ((metrics.completed_payments / metrics.total_payments) * 100).toFixed(2) : 0,
          average_payment_per_student: metrics.students_paid > 0 ?
            (metrics.total_collected / metrics.students_paid).toFixed(2) : 0
        }
      };

      res.json({
        success: true,
        data: {
          ...efficiencyData,
          total_active_students: totalActiveStudents,
          period: start_date && end_date ? `${start_date} to ${end_date}` :
            year && term ? `${year} Term ${term}` :
              year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching fee collection efficiency metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee collection efficiency metrics',
        error: error.message
      });
    }
  }

  // Get student financial health summary
  async getStudentFinancialHealthSummary(req, res) {
    try {
      const [healthSummary] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT sb.student_reg_number) as total_students,
          COUNT(CASE WHEN sb.current_balance >= 0 THEN 1 END) as students_paid_up,
          COUNT(CASE WHEN sb.current_balance < 0 AND sb.current_balance >= -100 THEN 1 END) as students_small_balance,
          COUNT(CASE WHEN sb.current_balance < -100 AND sb.current_balance >= -500 THEN 1 END) as students_medium_balance,
          COUNT(CASE WHEN sb.current_balance < -500 THEN 1 END) as students_large_balance,
          COALESCE(SUM(CASE WHEN sb.current_balance < 0 THEN ABS(sb.current_balance) ELSE 0 END), 0) as total_outstanding,
          COALESCE(AVG(CASE WHEN sb.current_balance < 0 THEN ABS(sb.current_balance) ELSE NULL END), 0) as average_outstanding
        FROM student_balances sb
      `);

      const [recentPayments] = await pool.execute(`
        SELECT 
          COUNT(*) as payments_last_30_days,
          COALESCE(SUM(base_currency_amount), 0) as amount_last_30_days
        FROM fee_payments
        WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND status = 'completed'
      `);

      const summary = healthSummary[0];
      const recent = recentPayments[0];

      res.json({
        success: true,
        data: {
          total_students: parseInt(summary.total_students),
          students_paid_up: parseInt(summary.students_paid_up),
          students_small_balance: parseInt(summary.students_small_balance),
          students_medium_balance: parseInt(summary.students_medium_balance),
          students_large_balance: parseInt(summary.students_large_balance),
          total_outstanding: parseFloat(summary.total_outstanding),
          average_outstanding: parseFloat(summary.average_outstanding),
          recent_activity: {
            payments_last_30_days: parseInt(recent.payments_last_30_days),
            amount_last_30_days: parseFloat(recent.amount_last_30_days)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching student financial health summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student financial health summary',
        error: error.message
      });
    }
  }
}

module.exports = new StudentFinancialAnalyticsController();
