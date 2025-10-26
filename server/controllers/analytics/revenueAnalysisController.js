const { pool } = require('../../config/database');

class RevenueAnalysisController {
  // Get monthly/quarterly revenue over time
  async getRevenueTrends(req, res) {
    try {
      const { period = 'monthly', year, start_date, end_date } = req.query;
      
      let dateFilter = '';
      let groupBy = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND je.entry_date BETWEEN ? AND ?';
        params = [start_date, end_date];
        groupBy = period === 'monthly' ? 
          'YEAR(je.entry_date), MONTH(je.entry_date)' : 
          'YEAR(je.entry_date), QUARTER(je.entry_date)';
      } else if (year) {
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [year];
        groupBy = period === 'monthly' ? 
          'YEAR(je.entry_date), MONTH(je.entry_date)' : 
          'YEAR(je.entry_date), QUARTER(je.entry_date)';
      } else {
        // Default to current year
        const now = new Date();
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [now.getFullYear()];
        groupBy = period === 'monthly' ? 
          'YEAR(je.entry_date), MONTH(je.entry_date)' : 
          'YEAR(je.entry_date), QUARTER(je.entry_date)';
      }

      const [trends] = await pool.execute(`
        SELECT 
          YEAR(je.entry_date) as year, 
          ${period === 'monthly' ? 'MONTH(je.entry_date) as month' : 'QUARTER(je.entry_date) as quarter'},
          ${period === 'monthly' ? 
            'CONCAT(YEAR(je.entry_date), "-", LPAD(MONTH(je.entry_date), 2, "0")) as period_label' :
            'CONCAT(YEAR(je.entry_date), " Q", QUARTER(je.entry_date)) as period_label'
          },
          COALESCE(SUM(jel.credit), 0) as total_revenue,
          COUNT(DISTINCT je.id) as transaction_count
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE coa.type = 'Revenue' 
          AND coa.is_active = 1
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
        GROUP BY YEAR(je.entry_date), ${period === 'monthly' ? 'MONTH(je.entry_date)' : 'QUARTER(je.entry_date)'}, period_label
        ORDER BY YEAR(je.entry_date), ${period === 'monthly' ? 'MONTH(je.entry_date)' : 'QUARTER(je.entry_date)'}
      `, params);

      const trendsWithFormattedData = trends.map(trend => ({
        ...trend,
        total_revenue: parseFloat(trend.total_revenue),
        period_label: trend.period_label
      }));

      res.json({
        success: true,
        data: {
          trends: trendsWithFormattedData,
          period_type: period,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching revenue trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue trends',
        error: error.message
      });
    }
  }

  // Get fee collection trends (tuition, boarding, transport)
  async getFeeCollectionTrends(req, res) {
    try {
      const { year, start_date, end_date } = req.query;
      
      let paymentDateFilter = '';
      let transactionDateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        paymentDateFilter = 'AND payment_date BETWEEN ? AND ?';
        transactionDateFilter = 'AND transaction_date BETWEEN ? AND ?';
        params = [start_date, end_date, start_date, end_date];
      } else if (year) {
        paymentDateFilter = 'AND YEAR(payment_date) = ?';
        transactionDateFilter = 'AND YEAR(transaction_date) = ?';
        params = [year, year];
      } else {
        // Default to current year
        const now = new Date();
        paymentDateFilter = 'AND YEAR(payment_date) = ?';
        transactionDateFilter = 'AND YEAR(transaction_date) = ?';
        params = [now.getFullYear(), now.getFullYear()];
      }

      // Get tuition fee payments
      const [tuitionPayments] = await pool.execute(`
        SELECT 
          YEAR(payment_date) as year,
          MONTH(payment_date) as month,
          CONCAT(YEAR(payment_date), "-", LPAD(MONTH(payment_date), 2, "0")) as period_label,
          COALESCE(SUM(base_currency_amount), 0) as total_amount,
          COUNT(*) as payment_count,
          'tuition' as fee_type
        FROM fee_payments
        WHERE status = 'completed'
          ${paymentDateFilter}
        GROUP BY YEAR(payment_date), MONTH(payment_date), period_label
        ORDER BY year, month
      `, params);

      // Get boarding fee payments
      const [boardingPayments] = await pool.execute(`
        SELECT 
          YEAR(payment_date) as year,
          MONTH(payment_date) as month,
          CONCAT(YEAR(payment_date), "-", LPAD(MONTH(payment_date), 2, "0")) as period_label,
          COALESCE(SUM(base_currency_amount), 0) as total_amount,
          COUNT(*) as payment_count,
          'boarding' as fee_type
        FROM boarding_fees_payments
        WHERE status = 'completed'
          ${paymentDateFilter}
        GROUP BY YEAR(payment_date), MONTH(payment_date), period_label
        ORDER BY year, month
      `, params);

      // Get transport fee payments (from student_transactions)
      const [transportPayments] = await pool.execute(`
        SELECT 
          YEAR(transaction_date) as year,
          MONTH(transaction_date) as month,
          CONCAT(YEAR(transaction_date), "-", LPAD(MONTH(transaction_date), 2, "0")) as period_label,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as payment_count,
          'transport' as fee_type
        FROM student_transactions
        WHERE transaction_type = 'CREDIT'
          AND description LIKE '%Transport%'
          ${transactionDateFilter}
        GROUP BY YEAR(transaction_date), MONTH(transaction_date), period_label
        ORDER BY year, month
      `, params);

      // Combine all fee types
      const allPayments = [
        ...tuitionPayments.map(p => ({ ...p, total_amount: parseFloat(p.total_amount) })),
        ...boardingPayments.map(p => ({ ...p, total_amount: parseFloat(p.total_amount) })),
        ...transportPayments.map(p => ({ ...p, total_amount: parseFloat(p.total_amount) }))
      ];

      // Group by period and fee type
      const groupedPayments = {};
      allPayments.forEach(payment => {
        const key = payment.period_label;
        if (!groupedPayments[key]) {
          groupedPayments[key] = {
            period_label: payment.period_label,
            year: payment.year,
            month: payment.month,
            tuition: 0,
            boarding: 0,
            transport: 0,
            total: 0
          };
        }
        groupedPayments[key][payment.fee_type] = payment.total_amount;
        groupedPayments[key].total += payment.total_amount;
      });

      const trends = Object.values(groupedPayments).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      res.json({
        success: true,
        data: {
          trends: trends,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching fee collection trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee collection trends',
        error: error.message
      });
    }
  }

  // Get revenue breakdown by source
  async getRevenueBreakdown(req, res) {
    try {
      const { year, start_date, end_date } = req.query;
      
      let dateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND je.entry_date BETWEEN ? AND ?';
        params = [start_date, end_date];
      } else if (year) {
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [year];
      } else {
        // Default to current year
        const now = new Date();
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [now.getFullYear()];
      }

      const [revenueBreakdown] = await pool.execute(`
        SELECT 
          coa.name as source_name,
          coa.code as source_code,
          COALESCE(SUM(jel.credit), 0) as total_amount,
          COUNT(DISTINCT je.id) as transaction_count
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date IS NOT NULL
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
        WHERE coa.type = 'Revenue' 
          AND coa.is_active = 1
        GROUP BY coa.id, coa.name, coa.code
        HAVING total_amount > 0
        ORDER BY total_amount DESC
      `, params);

      // Calculate total revenue
      const totalRevenue = revenueBreakdown.reduce((sum, source) => sum + parseFloat(source.total_amount), 0);

      // Add percentage calculation
      const breakdownWithPercentage = revenueBreakdown.map(source => ({
        ...source,
        total_amount: parseFloat(source.total_amount),
        percentage: totalRevenue > 0 ? ((parseFloat(source.total_amount) / totalRevenue) * 100).toFixed(2) : 0
      }));

      res.json({
        success: true,
        data: {
          revenue_sources: breakdownWithPercentage,
          total_revenue: totalRevenue,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue breakdown',
        error: error.message
      });
    }
  }

  // Get payment method analysis
  async getPaymentMethodAnalysis(req, res) {
    try {
      const { year, start_date, end_date } = req.query;
      
      let dateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND payment_date BETWEEN ? AND ?';
        params = [start_date, end_date];
      } else if (year) {
        dateFilter = 'AND YEAR(payment_date) = ?';
        params = [year];
      } else {
        // Default to current year
        const now = new Date();
        dateFilter = 'AND YEAR(payment_date) = ?';
        params = [now.getFullYear()];
      }

      // Get payment methods from fee_payments
      const [feePaymentMethods] = await pool.execute(`
        SELECT 
          payment_method,
          COALESCE(SUM(base_currency_amount), 0) as total_amount,
          COUNT(*) as payment_count,
          'tuition' as fee_type
        FROM fee_payments
        WHERE status = 'completed'
          ${dateFilter}
        GROUP BY payment_method
      `, params);

      // Get payment methods from boarding_fees_payments
      const [boardingPaymentMethods] = await pool.execute(`
        SELECT 
          payment_method,
          COALESCE(SUM(base_currency_amount), 0) as total_amount,
          COUNT(*) as payment_count,
          'boarding' as fee_type
        FROM boarding_fees_payments
        WHERE status = 'completed'
          ${dateFilter}
        GROUP BY payment_method
      `, params);

      // Combine payment methods
      const allMethods = [...feePaymentMethods, ...boardingPaymentMethods];
      const methodTotals = {};

      allMethods.forEach(method => {
        if (!methodTotals[method.payment_method]) {
          methodTotals[method.payment_method] = {
            payment_method: method.payment_method,
            total_amount: 0,
            payment_count: 0
          };
        }
        methodTotals[method.payment_method].total_amount += parseFloat(method.total_amount);
        methodTotals[method.payment_method].payment_count += parseInt(method.payment_count);
      });

      const paymentMethods = Object.values(methodTotals);
      const totalAmount = paymentMethods.reduce((sum, method) => sum + method.total_amount, 0);

      // Add percentage calculation
      const methodsWithPercentage = paymentMethods.map(method => ({
        ...method,
        percentage: totalAmount > 0 ? ((method.total_amount / totalAmount) * 100).toFixed(2) : 0
      }));

      res.json({
        success: true,
        data: {
          payment_methods: methodsWithPercentage,
          total_amount: totalAmount,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching payment method analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment method analysis',
        error: error.message
      });
    }
  }
}

module.exports = new RevenueAnalysisController();
