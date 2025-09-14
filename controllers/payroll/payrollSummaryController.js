const { pool } = require('../../config/database');

class PayrollSummaryController {
  // Get payroll summary statistics for dashboard
  async getPayrollSummary(req, res) {
    try {
      // Get total employees
      const [totalEmployees] = await pool.execute(
        'SELECT COUNT(*) as total_employees FROM employees WHERE is_active = TRUE'
      );

      // Get current month payroll data
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const [currentMonthPayroll] = await pool.execute(
        `SELECT 
           COUNT(*) as payslip_count,
           COALESCE(SUM(total_earnings), 0) as total_earnings,
           COALESCE(SUM(total_deductions), 0) as total_deductions,
           COALESCE(SUM(net_pay), 0) as total_net_pay
         FROM payslips 
         WHERE pay_period = ?`,
        [currentMonth]
      );

      // Get pending payslips count
      const [pendingPayslips] = await pool.execute(
        "SELECT COUNT(*) as pending_count FROM payslips WHERE status = 'pending'"
      );

      // Get processed payslips count
      const [processedPayslips] = await pool.execute(
        "SELECT COUNT(*) as processed_count FROM payslips WHERE status = 'processed'"
      );

      // Get recent payroll runs
      const [recentPayrolls] = await pool.execute(
        `SELECT 
           pr.id,
           pr.pay_period,
           pr.pay_date,
           pr.total_amount,
           pr.employee_count,
           pr.status,
           pr.created_at,
           COUNT(prd.id) as payslip_count
         FROM payroll_runs pr
         LEFT JOIN payroll_run_details prd ON pr.id = prd.payroll_run_id
         GROUP BY pr.id
         ORDER BY pr.created_at DESC
         LIMIT 5`
      );

             // Get currencies for reference
       const [currencies] = await pool.execute(
         'SELECT id, code, name, symbol FROM currencies WHERE is_active = TRUE ORDER BY code'
       );

       const summary = {
         total_employees: totalEmployees[0]?.total_employees || 0,
         current_month_payroll: currentMonthPayroll[0]?.total_net_pay || 0,
         current_month_earnings: currentMonthPayroll[0]?.total_earnings || 0,
         current_month_deductions: currentMonthPayroll[0]?.total_deductions || 0,
         pending_payslips: pendingPayslips[0]?.pending_count || 0,
         processed_payslips: processedPayslips[0]?.processed_count || 0,
         recent_payrolls: recentPayrolls,
         currencies: currencies
       };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll summary',
        error: error.message
      });
    }
  }

  // Get payroll statistics by period
  async getPayrollStatsByPeriod(req, res) {
    try {
      const { period } = req.params; // YYYY-MM format

      const [stats] = await pool.execute(
        `SELECT 
           COUNT(*) as payslip_count,
           COALESCE(SUM(total_earnings), 0) as total_earnings,
           COALESCE(SUM(total_deductions), 0) as total_deductions,
           COALESCE(SUM(net_pay), 0) as total_net_pay,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
           COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count
         FROM payslips 
         WHERE pay_period = ?`,
        [period]
      );

      res.json({
        success: true,
        data: stats[0] || {
          payslip_count: 0,
          total_earnings: 0,
          total_deductions: 0,
          total_net_pay: 0,
          pending_count: 0,
          processed_count: 0
        }
      });
    } catch (error) {
      console.error('Error fetching payroll stats by period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll stats',
        error: error.message
      });
    }
  }
}

module.exports = new PayrollSummaryController();
