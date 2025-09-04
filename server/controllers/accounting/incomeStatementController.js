const { pool } = require('../../config/database');

class IncomeStatementController {
  // Get income statement for a specific period by ID
  static async getIncomeStatement(req, res) {
    try {
      const { periodId } = req.params;
      
      // Get period details
      const [periods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );
      
      if (periods.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }
      
      const period = periods[0];
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      // First, let's check what journal entries exist in the period
      const [journalEntries] = await pool.execute(
        `SELECT je.id, je.entry_date, je.description, je.reference
         FROM journal_entries je 
         WHERE je.entry_date BETWEEN ? AND ?
         ORDER BY je.entry_date`,
        [period.start_date, period.end_date]
      );
      
      console.log(`📝 Journal Entries in period (${journalEntries.length} entries):`);
      journalEntries.forEach(entry => {
        console.log(`  - ${entry.entry_date} | ${entry.reference || 'No Ref'} | ${entry.description}`);
      });
      
      // Get revenue accounts - use LEFT JOIN to include all accounts even with zero values
      const revenueQuery = `
        SELECT 
          coa.id as account_id,
          coa.code as account_code,
          coa.name as account_name,
          COALESCE(SUM(jel.credit), 0) as amount
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        WHERE coa.type = 'Revenue' 
          AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        ORDER BY coa.code
      `;
      
      const [revenue] = await pool.execute(revenueQuery, [period.start_date, period.end_date]);
      
      console.log(`💰 Revenue Query Results (${revenue.length} rows):`);
      revenue.forEach(item => {
        console.log(`  - ${item.account_name} (${item.account_code}): $${item.amount}`);
      });
      
      // Get expense accounts - use LEFT JOIN to include all accounts even with zero values
      const expenseQuery = `
        SELECT 
          coa.id as account_id,
          coa.code as account_code,
          coa.name as account_name,
          COALESCE(SUM(jel.debit), 0) as amount
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        WHERE coa.type = 'Expense' 
          AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        ORDER BY coa.code
      `;
      
      const [expenses] = await pool.execute(expenseQuery, [period.start_date, period.end_date]);
      
      console.log(`💸 Expense Query Results (${expenses.length} rows):`);
      expenses.forEach(item => {
        console.log(`  - ${item.account_name} (${item.account_code}): $${item.amount}`);
      });
      
      // Calculate totals
      const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netIncome = totalRevenue - totalExpenses;
      
      console.log(`📊 Calculated Totals:`);
      console.log(`  Total Revenue: $${totalRevenue}`);
      console.log(`  Total Expenses: $${totalExpenses}`);
      console.log(`  Net Income: $${netIncome}`);
      
      // Calculate percentages
      const revenueWithPercentages = revenue.map(item => ({
        ...item,
        percentage: totalRevenue > 0 ? ((parseFloat(item.amount) / totalRevenue) * 100).toFixed(2) : 0
      }));
      
      const expensesWithPercentages = expenses.map(item => ({
        ...item,
        percentage: totalExpenses > 0 ? ((parseFloat(item.amount) / totalExpenses) * 100).toFixed(2) : 0
      }));
      
      res.json({
        period: period,
        revenue: revenueWithPercentages,
        expenses: expensesWithPercentages,
        totals: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_income: netIncome,
          gross_profit_margin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0
        },
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating income statement:', error);
      res.status(500).json({ error: 'Failed to generate income statement' });
    }
  }

  // Get income statement for a period by month and year
  static async getIncomeStatementByMonthYear(req, res) {
    try {
      const { month, year } = req.params;
      
      // Validate month and year
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12.' });
      }
      
      if (yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ error: 'Invalid year. Must be between 1900 and 2100.' });
      }
      
      // Calculate start and end dates for the month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
      
      console.log(`🔍 Income Statement Request - Month: ${monthNum}, Year: ${yearNum}`);
      console.log(`📅 Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const periodName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Check if period exists
      let [existingPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE start_date = ? AND end_date = ?',
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
      
      let period;
      if (existingPeriods.length > 0) {
        period = existingPeriods[0];
      } else {
        // Create new period
        const [result] = await pool.execute(
          'INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
          [periodName, 'monthly', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 'open']
        );
        
        [existingPeriods] = await pool.execute(
          'SELECT * FROM accounting_periods WHERE id = ?',
          [result.insertId]
        );
        period = existingPeriods[0];
      }
      
      // Now get the income statement for this period
      req.params.periodId = period.id;
      return IncomeStatementController.getIncomeStatement(req, res);
      
    } catch (error) {
      console.error('Error getting income statement by month/year:', error);
      res.status(500).json({ error: 'Failed to get income statement' });
    }
  }

  // Get comparative income statement (current period vs previous period)
  static async getComparativeIncomeStatement(req, res) {
    try {
      const { periodId } = req.params;
      
      // Get current period
      const [currentPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );
      
      if (currentPeriods.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }
      
      const currentPeriod = currentPeriods[0];
      
      // Find previous period
      const [previousPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE end_date < ? ORDER BY end_date DESC LIMIT 1',
        [currentPeriod.start_date]
      );
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      // Get current period data
      const currentData = await IncomeStatementController.generateIncomeStatementData(
        currentPeriod.start_date, 
        currentPeriod.end_date
      );
      
      // Get previous period data (if exists)
      let previousData = null;
      if (previousPeriods.length > 0) {
        const previousPeriod = previousPeriods[0];
        previousData = await IncomeStatementController.generateIncomeStatementData(
          previousPeriod.start_date, 
          previousPeriod.end_date
        );
      }
      
      // Calculate variances
      const variances = IncomeStatementController.calculateVariances(currentData, previousData);
      
      res.json({
        current_period: currentPeriod,
        previous_period: previousPeriods[0] || null,
        current_data: currentData,
        previous_data: previousData,
        variances: variances,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating comparative income statement:', error);
      res.status(500).json({ error: 'Failed to generate comparative income statement' });
    }
  }

  // Get year-to-date income statement
  static async getYearToDateIncomeStatement(req, res) {
    try {
      const { year } = req.params;
      
      const yearNum = parseInt(year);
      if (yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ error: 'Invalid year. Must be between 1900 and 2100.' });
      }
      
      // Calculate year start and end dates
      const yearStartDate = new Date(yearNum, 0, 1);
      const yearEndDate = new Date(yearNum, 11, 31);
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      // Get year-to-date data
      const ytdData = await IncomeStatementController.generateIncomeStatementData(
        yearStartDate.toISOString().split('T')[0],
        yearEndDate.toISOString().split('T')[0]
      );
      
      // Get monthly breakdown
      const monthlyBreakdown = await IncomeStatementController.getMonthlyBreakdown(yearNum);
      
      res.json({
        year: yearNum,
        year_start_date: yearStartDate.toISOString().split('T')[0],
        year_end_date: yearEndDate.toISOString().split('T')[0],
        ytd_data: ytdData,
        monthly_breakdown: monthlyBreakdown,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating year-to-date income statement:', error);
      res.status(500).json({ error: 'Failed to generate year-to-date income statement' });
    }
  }

  // Get quarterly income statement
  static async getQuarterlyIncomeStatement(req, res) {
    try {
      const { year, quarter } = req.params;
      
      const yearNum = parseInt(year);
      const quarterNum = parseInt(quarter);
      
      if (yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ error: 'Invalid year. Must be between 1900 and 2100.' });
      }
      
      if (quarterNum < 1 || quarterNum > 4) {
        return res.status(400).json({ error: 'Invalid quarter. Must be between 1 and 4.' });
      }
      
      // Calculate quarter start and end dates
      const quarterStartMonth = (quarterNum - 1) * 3;
      const quarterStartDate = new Date(yearNum, quarterStartMonth, 1);
      const quarterEndDate = new Date(yearNum, quarterStartMonth + 2, 0);
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      // Get quarterly data
      const quarterlyData = await IncomeStatementController.generateIncomeStatementData(
        quarterStartDate.toISOString().split('T')[0],
        quarterEndDate.toISOString().split('T')[0]
      );
      
      // Get monthly breakdown within the quarter
      const monthlyBreakdown = [];
      for (let month = quarterStartMonth; month < quarterStartMonth + 3; month++) {
        const monthStartDate = new Date(yearNum, month, 1);
        const monthEndDate = new Date(yearNum, month + 1, 0);
        
        const monthData = await IncomeStatementController.generateIncomeStatementData(
          monthStartDate.toISOString().split('T')[0],
          monthEndDate.toISOString().split('T')[0]
        );
        
        monthlyBreakdown.push({
          month: month + 1,
          month_name: monthStartDate.toLocaleDateString('en-US', { month: 'long' }),
          data: monthData
        });
      }
      
      res.json({
        year: yearNum,
        quarter: quarterNum,
        quarter_start_date: quarterStartDate.toISOString().split('T')[0],
        quarter_end_date: quarterEndDate.toISOString().split('T')[0],
        quarterly_data: quarterlyData,
        monthly_breakdown: monthlyBreakdown,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating quarterly income statement:', error);
      res.status(500).json({ error: 'Failed to generate quarterly income statement' });
    }
  }

  // Helper method to generate income statement data
  static async generateIncomeStatementData(startDate, endDate) {
    // Get revenue accounts - use LEFT JOIN to include all accounts even with zero values
    const revenueQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(SUM(jel.credit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.entry_date BETWEEN ? AND ?
        AND je.description NOT LIKE '%Opening Balances B/D%'
        AND je.description NOT LIKE '%Close % to Income Summary%'
        AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      WHERE coa.type = 'Revenue' 
        AND coa.is_active = 1
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code
    `;
    
    const [revenue] = await pool.execute(revenueQuery, [startDate, endDate]);
    
    // Get expense accounts - use LEFT JOIN to include all accounts even with zero values
    const expenseQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(SUM(jel.debit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.entry_date BETWEEN ? AND ?
        AND je.description NOT LIKE '%Opening Balances B/D%'
        AND je.description NOT LIKE '%Close % to Income Summary%'
        AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      WHERE coa.type = 'Expense' 
        AND coa.is_active = 1
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code
    `;
    
    const [expenses] = await pool.execute(expenseQuery, [startDate, endDate]);
    
    // Calculate totals
    const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      revenue: revenue,
      expenses: expenses,
      totals: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: netIncome,
        gross_profit_margin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0
      }
    };
  }

  // Helper method to calculate variances
  static calculateVariances(currentData, previousData) {
    if (!previousData) {
      return {
        revenue_variance: null,
        expense_variance: null,
        net_income_variance: null,
        percentage_changes: null
      };
    }
    
    const revenueVariance = currentData.totals.total_revenue - previousData.totals.total_revenue;
    const expenseVariance = currentData.totals.total_expenses - previousData.totals.total_expenses;
    const netIncomeVariance = currentData.totals.net_income - previousData.totals.net_income;
    
    const revenuePercentageChange = previousData.totals.total_revenue > 0 
      ? ((revenueVariance / previousData.totals.total_revenue) * 100).toFixed(2) 
      : 0;
    
    const expensePercentageChange = previousData.totals.total_expenses > 0 
      ? ((expenseVariance / previousData.totals.total_expenses) * 100).toFixed(2) 
      : 0;
    
    const netIncomePercentageChange = previousData.totals.net_income !== 0 
      ? ((netIncomeVariance / Math.abs(previousData.totals.net_income)) * 100).toFixed(2) 
      : 0;
    
    return {
      revenue_variance: revenueVariance,
      expense_variance: expenseVariance,
      net_income_variance: netIncomeVariance,
      percentage_changes: {
        revenue: revenuePercentageChange,
        expenses: expensePercentageChange,
        net_income: netIncomePercentageChange
      }
    };
  }

  // Helper method to get monthly breakdown
  static async getMonthlyBreakdown(year) {
    const monthlyBreakdown = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStartDate = new Date(year, month, 1);
      const monthEndDate = new Date(year, month + 1, 0);
      
      const monthData = await IncomeStatementController.generateIncomeStatementData(
        monthStartDate.toISOString().split('T')[0],
        monthEndDate.toISOString().split('T')[0]
      );
      
      monthlyBreakdown.push({
        month: month + 1,
        month_name: monthStartDate.toLocaleDateString('en-US', { month: 'long' }),
        data: monthData
      });
    }
    
    return monthlyBreakdown;
  }

  // Get available periods for income statement
  static async getAvailablePeriods(req, res) {
    try {
      const [periods] = await pool.execute(
        'SELECT * FROM accounting_periods ORDER BY start_date DESC'
      );
      
      res.json(periods);
    } catch (error) {
      console.error('Error fetching available periods:', error);
      res.status(500).json({ error: 'Failed to fetch available periods' });
    }
  }

  // Get income statement by custom date range (?start=YYYY-MM-DD&end=YYYY-MM-DD)
  static async getIncomeStatementByDateRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: 'start and end query parameters are required (YYYY-MM-DD)' });
      }
      
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDateRegex.test(start) || !isoDateRegex.test(end)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({ error: 'start date must be before or equal to end date' });
      }
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      // Debug journal entries
      const [journalEntries] = await pool.execute(
        `SELECT je.id, je.entry_date, je.description, je.reference
         FROM journal_entries je 
         WHERE je.entry_date BETWEEN ? AND ?
         ORDER BY je.entry_date`,
        [start, end]
      );
      console.log(`📝 [Custom Range] Journal Entries (${journalEntries.length}) for ${start} to ${end}`);
      
      const data = await IncomeStatementController.generateIncomeStatementData(start, end);
      
      res.json({
        range: { start_date: start, end_date: end },
        ...data,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating income statement by date range:', error);
      res.status(500).json({ error: 'Failed to generate income statement by date range' });
    }
  }
}

module.exports = IncomeStatementController;
