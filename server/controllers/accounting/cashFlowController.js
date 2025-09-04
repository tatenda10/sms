const { pool } = require('../../config/database');

class CashFlowController {
  // Get cash flow statement by period ID
  static async getCashFlow(req, res) {
    try {
      const { periodId } = req.params;
      
      // Get period details
      const [periodRows] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );
      
      if (periodRows.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }
      
      const period = periodRows[0];
      const cashFlowData = await CashFlowController.generateCashFlowData(period.start_date, period.end_date);
      
      res.json({
        period,
        ...cashFlowData
      });
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      res.status(500).json({ error: 'Failed to fetch cash flow statement' });
    }
  }

  // Get cash flow statement by month and year
  static async getCashFlowByMonthYear(req, res) {
    try {
      const { month, year } = req.params;
      
      console.log(`Generating Cash Flow for Month: ${month}, Year: ${year}`);
      
      // Calculate start and end dates for the month
      const monthNum = parseInt(month, 10);
      const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
      const endDay = new Date(parseInt(year, 10), monthNum, 0).getDate();
      const endDate = `${year}-${monthNum.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`; // Last day of month
      
      console.log(`Date Range: ${startDate} to ${endDate}`);
      
      const cashFlowData = await CashFlowController.generateCashFlowData(startDate, endDate);
      
      res.json({
        period: {
          period_name: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
          start_date: startDate,
          end_date: endDate
        },
        ...cashFlowData
      });
    } catch (error) {
      console.error('Error fetching cash flow by month/year:', error);
      res.status(500).json({ error: 'Failed to fetch cash flow statement' });
    }
  }

  // Get cash flow statement by custom date range
  static async getCashFlowByDateRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }
      
      console.log(`Generating Cash Flow for Date Range: ${start} to ${end}`);
      
      const cashFlowData = await CashFlowController.generateCashFlowData(start, end);
      
      res.json({
        start_date: start,
        end_date: end,
        ...cashFlowData
      });
    } catch (error) {
      console.error('Error fetching cash flow by date range:', error);
      res.status(500).json({ error: 'Failed to fetch cash flow statement' });
    }
  }

  // Generate cash flow data for a given date range
  static async generateCashFlowData(startDate, endDate) {
    try {
      console.log(`Generating cash flow data from ${startDate} to ${endDate}`);

      // Get operating activities (revenues and expenses)
      const operatingActivities = await CashFlowController.getOperatingActivities(startDate, endDate);
      
      // Get investing activities (asset purchases/sales)
      const investingActivities = await CashFlowController.getInvestingActivities(startDate, endDate);
      
      // Get financing activities (loans, equity, dividends)
      const financingActivities = await CashFlowController.getFinancingActivities(startDate, endDate);
      
      // Calculate net cash flow
      const netOperatingCash = operatingActivities.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netInvestingCash = investingActivities.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netFinancingCash = financingActivities.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      
      const netCashFlow = netOperatingCash + netInvestingCash + netFinancingCash;
      
      // Get beginning and ending cash balances
      const beginningCash = await CashFlowController.getCashBalance(startDate, true);
      const endingCash = beginningCash + netCashFlow;
      
      console.log(`Cash Flow Summary:
        Operating: $${netOperatingCash}
        Investing: $${netInvestingCash}
        Financing: $${netFinancingCash}
        Net Cash Flow: $${netCashFlow}
        Beginning Cash: $${beginningCash}
        Ending Cash: $${endingCash}`);

      return {
        operating_activities: operatingActivities,
        investing_activities: investingActivities,
        financing_activities: financingActivities,
        totals: {
          net_operating_cash: netOperatingCash,
          net_investing_cash: netInvestingCash,
          net_financing_cash: netFinancingCash,
          net_cash_flow: netCashFlow,
          beginning_cash: beginningCash,
          ending_cash: endingCash
        }
      };
    } catch (error) {
      console.error('Error generating cash flow data:', error);
      throw error;
    }
  }

  // Get operating activities (indirect method)
  static async getOperatingActivities(startDate, endDate) {
    try {
      // Start with net income
      const [netIncomeRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN coa.type = 'Revenue' THEN jel.credit ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN coa.type = 'Expense' THEN jel.debit ELSE 0 END), 0) as net_income
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND coa.type IN ('Revenue', 'Expense')
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      `, [startDate, endDate]);

      const netIncome = parseFloat(netIncomeRows[0]?.net_income || 0);

      // Get changes in working capital accounts
      const [workingCapitalRows] = await pool.execute(`
        SELECT 
          coa.name as account_name,
          coa.type,
          COALESCE(SUM(
            CASE 
              WHEN coa.type = 'Asset' THEN -(jel.debit - jel.credit)  -- Increase in assets is cash outflow
              WHEN coa.type = 'Liability' THEN (jel.credit - jel.debit)  -- Increase in liabilities is cash inflow
              ELSE 0 
            END
          ), 0) as amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND coa.type IN ('Asset', 'Liability')
          AND coa.name NOT LIKE '%Cash%'
          AND coa.name NOT LIKE '%Fixed Asset%'
          AND coa.name NOT LIKE '%Equipment%'
          AND coa.name NOT LIKE '%Building%'
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        GROUP BY coa.id, coa.name, coa.type
        HAVING ABS(amount) > 0.01
        ORDER BY coa.type, coa.name
      `, [startDate, endDate]);

      // Get depreciation (non-cash expense)
      const [depreciationRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(jel.debit), 0) as depreciation
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND (coa.name LIKE '%Depreciation%' OR je.description LIKE '%depreciation%')
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      `, [startDate, endDate]);

      const depreciation = parseFloat(depreciationRows[0]?.depreciation || 0);

      let operatingActivities = [
        { activity_name: 'Net Income', amount: netIncome }
      ];

      if (depreciation > 0) {
        operatingActivities.push({ activity_name: 'Depreciation Expense', amount: depreciation });
      }

      // Add working capital changes
      workingCapitalRows.forEach(row => {
        if (Math.abs(row.amount) > 0.01) {
          operatingActivities.push({
            activity_name: `Change in ${row.account_name}`,
            amount: parseFloat(row.amount)
          });
        }
      });

      return operatingActivities;
    } catch (error) {
      console.error('Error getting operating activities:', error);
      throw error;
    }
  }

  // Get investing activities
  static async getInvestingActivities(startDate, endDate) {
    try {
      const [investingRows] = await pool.execute(`
        SELECT 
          coa.name as account_name,
          COALESCE(SUM(-(jel.debit - jel.credit)), 0) as amount  -- Net increase in fixed assets is cash outflow
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND coa.type = 'Asset'
          AND (coa.name LIKE '%Fixed Asset%' OR coa.name LIKE '%Equipment%' OR coa.name LIKE '%Building%' OR coa.name LIKE '%Investment%')
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        GROUP BY coa.id, coa.name
        HAVING ABS(amount) > 0.01
        ORDER BY coa.name
      `, [startDate, endDate]);

      return investingRows.map(row => ({
        activity_name: `Purchase of ${row.account_name}`,
        amount: parseFloat(row.amount)
      }));
    } catch (error) {
      console.error('Error getting investing activities:', error);
      throw error;
    }
  }

  // Get financing activities
  static async getFinancingActivities(startDate, endDate) {
    try {
      const [financingRows] = await pool.execute(`
        SELECT 
          coa.name as account_name,
          coa.type,
          COALESCE(SUM(
            CASE 
              WHEN coa.type = 'Liability' AND (coa.name LIKE '%Loan%' OR coa.name LIKE '%Note%') THEN (jel.credit - jel.debit)  -- Loan proceeds net
              WHEN coa.type = 'Equity' THEN (jel.credit - jel.debit)  -- Equity contributions net
              ELSE 0 
            END
          ), 0) as amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND (
            (coa.type = 'Liability' AND (coa.name LIKE '%Loan%' OR coa.name LIKE '%Note%')) OR
            (coa.type = 'Equity')
          )
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        GROUP BY coa.id, coa.name, coa.type
        HAVING ABS(amount) > 0.01
        ORDER BY coa.type, coa.name
      `, [startDate, endDate]);

      return financingRows.map(row => ({
        activity_name: row.type === 'Equity' ? `Equity Contribution - ${row.account_name}` : `Loan Proceeds - ${row.account_name}`,
        amount: parseFloat(row.amount)
      }));
    } catch (error) {
      console.error('Error getting financing activities:', error);
      throw error;
    }
  }

  // Get cash balance at a specific date
  static async getCashBalance(date, isBeginning = false) {
    try {
      const dateCondition = isBeginning ? '< ?' : '<= ?';
      
      const [cashRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(jel.debit - jel.credit), 0) as cash_balance
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date ${dateCondition}
          AND coa.name LIKE '%Cash%'
      `, [date]);

      return parseFloat(cashRows[0]?.cash_balance || 0);
    } catch (error) {
      console.error('Error getting cash balance:', error);
      throw error;
    }
  }
}

module.exports = CashFlowController;
