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

  // Generate cash flow data for a given date range - DIRECT METHOD
  static async generateCashFlowData(startDate, endDate) {
    try {
      console.log(`Generating cash flow data from ${startDate} to ${endDate}`);

      // Get cash inflows (money received)
      const cashInflows = await CashFlowController.getCashInflows(startDate, endDate);
      
      // Get cash outflows (money paid)
      const cashOutflows = await CashFlowController.getCashOutflows(startDate, endDate);
      
      // Calculate totals
      const totalInflows = cashInflows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalOutflows = cashOutflows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netCashFlow = totalInflows - totalOutflows;
      
      // Get beginning and ending cash balances (Cash + Bank)
      const beginningCash = await CashFlowController.getCashAndBankBalance(startDate, true);
      const endingCash = beginningCash + netCashFlow;
      
      console.log(`Cash Flow Summary:
        Total Inflows: $${totalInflows}
        Total Outflows: $${totalOutflows}
        Net Cash Flow: $${netCashFlow}
        Beginning Cash: $${beginningCash}
        Ending Cash: $${endingCash}`);

      return {
        cash_inflows: cashInflows,
        cash_outflows: cashOutflows,
        totals: {
          total_inflows: totalInflows,
          total_outflows: totalOutflows,
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

  // Get all cash inflows (money received) - DEBITS to Cash/Bank accounts
  // Aggregated by source account (contra account)
  static async getCashInflows(startDate, endDate) {
    try {
      // Get the contra accounts (where the credit is from) for cash/bank debits
      const [inflowRows] = await pool.execute(`
        SELECT 
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          SUM(contra_jel.credit) as amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id AND contra_jel.id != jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND coa.type = 'Asset'
          AND (coa.code = '1000' OR coa.code = '1010')
          AND jel.debit > 0
          AND contra_jel.credit > 0
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        GROUP BY contra_coa.code, contra_coa.name
        ORDER BY contra_coa.code
      `, [startDate, endDate]);

      return inflowRows.map(row => ({
        account_code: row.account_code,
        account_name: row.account_name,
        amount: parseFloat(row.amount)
      }));
    } catch (error) {
      console.error('Error getting cash inflows:', error);
      throw error;
    }
  }

  // Get all cash outflows (money paid) - CREDITS to Cash/Bank accounts
  // Aggregated by destination account (contra account)
  static async getCashOutflows(startDate, endDate) {
    try {
      // Get the contra accounts (where the debit is to) for cash/bank credits
      const [outflowRows] = await pool.execute(`
        SELECT 
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          SUM(contra_jel.debit) as amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id AND contra_jel.id != jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND coa.type = 'Asset'
          AND (coa.code = '1000' OR coa.code = '1010')
          AND jel.credit > 0
          AND contra_jel.debit > 0
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        GROUP BY contra_coa.code, contra_coa.name
        ORDER BY contra_coa.code
      `, [startDate, endDate]);

      return outflowRows.map(row => ({
        account_code: row.account_code,
        account_name: row.account_name,
        amount: parseFloat(row.amount)
      }));
    } catch (error) {
      console.error('Error getting cash outflows:', error);
      throw error;
    }
  }

  // Get cash and bank balance at a specific date
  static async getCashAndBankBalance(date, isBeginning = false) {
    try {
      const dateCondition = isBeginning ? '< ?' : '<= ?';
      
      const [cashRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(jel.debit - jel.credit), 0) as balance
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date ${dateCondition}
          AND coa.type = 'Asset'
          AND (coa.code = '1000' OR coa.code = '1010')
      `, [date]);

      return parseFloat(cashRows[0]?.balance || 0);
    } catch (error) {
      console.error('Error getting cash balance:', error);
      throw error;
    }
  }
}

module.exports = CashFlowController;
