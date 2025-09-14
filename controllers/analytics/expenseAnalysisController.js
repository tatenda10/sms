const { pool } = require('../../config/database');

class ExpenseAnalysisController {
  // Get monthly expense breakdown by category
  async getMonthlyExpenseBreakdown(req, res) {
    try {
      const { year, month, start_date, end_date } = req.query;
      
      let dateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND je.entry_date BETWEEN ? AND ?';
        params = [start_date, end_date];
      } else if (year && month) {
        dateFilter = 'AND YEAR(je.entry_date) = ? AND MONTH(je.entry_date) = ?';
        params = [year, month];
      } else if (year) {
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [year];
      } else {
        // Default to current month
        const now = new Date();
        dateFilter = 'AND YEAR(je.entry_date) = ? AND MONTH(je.entry_date) = ?';
        params = [now.getFullYear(), now.getMonth() + 1];
      }

      const [expenses] = await pool.execute(`
        SELECT 
          coa.name as category_name,
          coa.code as category_code,
          coa.type as account_type,
          COALESCE(SUM(jel.debit), 0) as total_amount,
          COUNT(DISTINCT je.id) as transaction_count
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date IS NOT NULL
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
        WHERE coa.type = 'Expense' 
          AND coa.is_active = 1
        GROUP BY coa.id, coa.name, coa.code, coa.type
        HAVING total_amount > 0
        ORDER BY total_amount DESC
      `, params);

      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.total_amount), 0);

      // Add percentage calculation
      const expensesWithPercentage = expenses.map(expense => ({
        ...expense,
        total_amount: parseFloat(expense.total_amount),
        percentage: totalExpenses > 0 ? ((parseFloat(expense.total_amount) / totalExpenses) * 100).toFixed(2) : 0
      }));

      res.json({
        success: true,
        data: {
          expenses: expensesWithPercentage,
          total_expenses: totalExpenses,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year && month ? `${year}-${month.toString().padStart(2, '0')}` : 
                 year ? `${year}` : 'Current Month'
        }
      });

    } catch (error) {
      console.error('Error fetching monthly expense breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expense breakdown',
        error: error.message
      });
    }
  }

  // Get cost per student analysis
  async getCostPerStudentAnalysis(req, res) {
    try {
      const { year, term, start_date, end_date } = req.query;
      
      let dateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND je.entry_date BETWEEN ? AND ?';
        params = [start_date, end_date];
      } else if (year && term) {
        dateFilter = 'AND YEAR(je.entry_date) = ? AND je.description LIKE ?';
        params = [year, `%Term ${term}%`];
      } else if (year) {
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [year];
      } else {
        // Default to current year
        const now = new Date();
        dateFilter = 'AND YEAR(je.entry_date) = ?';
        params = [now.getFullYear()];
      }

      // Get total expenses for the period
      const [totalExpenses] = await pool.execute(`
        SELECT COALESCE(SUM(jel.debit), 0) as total_expenses
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE coa.type = 'Expense' 
          AND coa.is_active = 1
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
      `, params);

      // Get active student count for the period
      const [studentCount] = await pool.execute(`
        SELECT COUNT(DISTINCT e.student_regnumber) as active_students
        FROM enrollments_gradelevel_classes e
        WHERE e.status = 'active'
          AND (e.created_at <= COALESCE(?, NOW()) OR ? IS NULL)
          AND (e.created_at >= COALESCE(?, '1900-01-01') OR ? IS NULL)
      `, start_date && end_date ? [end_date, end_date, start_date, start_date] : [null, null, null, null]);

      // Get expenses by category for detailed breakdown
      const [expensesByCategory] = await pool.execute(`
        SELECT 
          coa.name as category_name,
          coa.type as account_type,
          COALESCE(SUM(jel.debit), 0) as total_amount
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date IS NOT NULL
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
        WHERE coa.type = 'Expense' 
          AND coa.is_active = 1
        GROUP BY coa.id, coa.name, coa.type
        HAVING total_amount > 0
        ORDER BY total_amount DESC
      `, params);

      const totalExpenseAmount = parseFloat(totalExpenses[0].total_expenses);
      const activeStudents = parseInt(studentCount[0].active_students);
      const costPerStudent = activeStudents > 0 ? totalExpenseAmount / activeStudents : 0;

      // Calculate cost per student by category
      const costPerStudentByCategory = expensesByCategory.map(expense => ({
        ...expense,
        total_amount: parseFloat(expense.total_amount),
        cost_per_student: activeStudents > 0 ? parseFloat(expense.total_amount) / activeStudents : 0
      }));

      res.json({
        success: true,
        data: {
          total_expenses: totalExpenseAmount,
          active_students: activeStudents,
          cost_per_student: costPerStudent,
          expenses_by_category: costPerStudentByCategory,
          period: start_date && end_date ? `${start_date} to ${end_date}` : 
                 year && term ? `${year} Term ${term}` : 
                 year ? `${year}` : 'Current Year'
        }
      });

    } catch (error) {
      console.error('Error fetching cost per student analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cost per student analysis',
        error: error.message
      });
    }
  }

  // Get expense trends over time (monthly/quarterly)
  async getExpenseTrends(req, res) {
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
          COALESCE(SUM(jel.debit), 0) as total_expenses,
          COUNT(DISTINCT je.id) as transaction_count
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE coa.type = 'Expense' 
          AND coa.is_active = 1
          ${dateFilter}
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
        GROUP BY YEAR(je.entry_date), ${period === 'monthly' ? 'MONTH(je.entry_date)' : 'QUARTER(je.entry_date)'}, period_label
        ORDER BY YEAR(je.entry_date), ${period === 'monthly' ? 'MONTH(je.entry_date)' : 'QUARTER(je.entry_date)'}
      `, params);

      const trendsWithFormattedData = trends.map(trend => ({
        ...trend,
        total_expenses: parseFloat(trend.total_expenses),
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
      console.error('Error fetching expense trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expense trends',
        error: error.message
      });
    }
  }
}

module.exports = new ExpenseAnalysisController();
