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
      // Use the same approach as getDetailedCashInflows to ensure consistency
      const [inflowRows] = await pool.execute(`
        SELECT 
          je.id as journal_entry_id,
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          cash_jel.debit as cash_amount,
          contra_jel.credit as revenue_amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines cash_jel ON je.id = cash_jel.journal_entry_id
        INNER JOIN chart_of_accounts cash_coa ON cash_jel.account_id = cash_coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id 
          AND contra_jel.id != cash_jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND cash_coa.type = 'Asset'
          AND (cash_coa.code = '1000' OR cash_coa.code = '1010')
          AND cash_jel.debit > 0
          AND contra_jel.credit > 0
          AND contra_coa.code NOT IN ('1000', '1010')  -- Exclude cash-to-cash transfers
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        ORDER BY contra_coa.code, je.id
      `, [startDate, endDate]);

      // Group by account and sum amounts (handling multiple lines per journal entry correctly)
      const accountMap = {};
      inflowRows.forEach(row => {
        const key = row.account_code;
        if (!accountMap[key]) {
          accountMap[key] = {
            account_code: row.account_code,
            account_name: row.account_name,
            amount: 0
          };
        }
        // Use the credit amount from the contra account
        const amount = parseFloat(row.revenue_amount || 0);
        accountMap[key].amount += amount;
      });

      return Object.values(accountMap);
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
      // Use the same approach as getDetailedCashOutflows to ensure consistency
      const [outflowRows] = await pool.execute(`
        SELECT 
          je.id as journal_entry_id,
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          cash_jel.credit as cash_amount,
          contra_jel.debit as expense_amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines cash_jel ON je.id = cash_jel.journal_entry_id
        INNER JOIN chart_of_accounts cash_coa ON cash_jel.account_id = cash_coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id 
          AND contra_jel.id != cash_jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND cash_coa.type = 'Asset'
          AND (cash_coa.code = '1000' OR cash_coa.code = '1010')
          AND cash_jel.credit > 0
          AND contra_jel.debit > 0
          AND contra_coa.code NOT IN ('1000', '1010')  -- Exclude cash-to-cash transfers
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        ORDER BY contra_coa.code, je.id
      `, [startDate, endDate]);

      // Group by account and sum amounts (handling multiple lines per journal entry correctly)
      const accountMap = {};
      outflowRows.forEach(row => {
        const key = row.account_code;
        if (!accountMap[key]) {
          accountMap[key] = {
            account_code: row.account_code,
            account_name: row.account_name,
            amount: 0
          };
        }
        // Use the debit amount from the contra account
        const amount = parseFloat(row.expense_amount || 0);
        accountMap[key].amount += amount;
      });

      return Object.values(accountMap);
    } catch (error) {
      console.error('Error getting cash outflows:', error);
      throw error;
    }
  }

  // Get cash and bank balance at a specific date
  // Uses account_balances table first, then falls back to journal entries
  static async getCashAndBankBalance(date, isBeginning = false) {
    try {
      // First, try to get from account_balances table
      const dateCondition = isBeginning ? '< ?' : '<= ?';
      
      const [balanceRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(ab.balance), 0) as total_balance
        FROM account_balances ab
        INNER JOIN chart_of_accounts coa ON ab.account_id = coa.id
        WHERE coa.code IN ('1000', '1010')
          AND ab.as_of_date = (
            SELECT MAX(ab2.as_of_date)
            FROM account_balances ab2
            INNER JOIN chart_of_accounts coa2 ON ab2.account_id = coa2.id
            WHERE coa2.code IN ('1000', '1010')
              AND ab2.as_of_date ${dateCondition}
          )
      `, [date]);
      
      if (balanceRows.length > 0 && balanceRows[0].total_balance !== null) {
        const balance = parseFloat(balanceRows[0].total_balance || 0);
        if (balance !== 0 || !isBeginning) {
          return balance;
        }
      }
      
      // Fall back to calculating from journal entries
      const [cashRows] = await pool.execute(`
        SELECT 
          COALESCE(SUM(jel.debit - jel.credit), 0) as balance
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.entry_date ${dateCondition}
          AND coa.type = 'Asset'
          AND (coa.code = '1000' OR coa.code = '1010')
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      `, [date]);

      return parseFloat(cashRows[0]?.balance || 0);
    } catch (error) {
      console.error('Error getting cash balance:', error);
      throw error;
    }
  }

  // Get detailed cash flow statement for multiple months (monthly comparison)
  static async getMultiMonthCashFlow(req, res) {
    try {
      const { startMonth, startYear, endMonth, endYear } = req.query;
      
      if (!startMonth || !startYear || !endMonth || !endYear) {
        return res.status(400).json({ error: 'Start and end month/year are required' });
      }

      const startMonthNum = parseInt(startMonth, 10);
      const startYearNum = parseInt(startYear, 10);
      const endMonthNum = parseInt(endMonth, 10);
      const endYearNum = parseInt(endYear, 10);

      // Generate month ranges
      const months = [];
      let currentMonth = startMonthNum;
      let currentYear = startYearNum;

      while (
        currentYear < endYearNum || 
        (currentYear === endYearNum && currentMonth <= endMonthNum)
      ) {
        const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        // Get last day of the current month (month is 0-indexed, so currentMonth is the next month)
        const endDay = new Date(currentYear, currentMonth, 0).getDate();
        const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
        
        months.push({
          month: currentMonth,
          year: currentYear,
          startDate,
          endDate,
          label: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
        });

        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      // Generate cash flow data for all months
      const monthlyData = await Promise.all(
        months.map(async (month) => {
          const data = await CashFlowController.generateDetailedCashFlowData(month.startDate, month.endDate);
          return {
            ...month,
            ...data
          };
        })
      );

      // Calculate fiscal year totals
      const fyStartDate = months[0]?.startDate;
      const fyEndDate = months[months.length - 1]?.endDate;
      const fyTotals = await CashFlowController.generateDetailedCashFlowData(fyStartDate, fyEndDate);

      // Build structured response
      const response = {
        months,
        monthlyData,
        fiscalYearTotals: fyTotals,
        fiscalYear: `${startYear}-${endYear}`
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching multi-month cash flow:', error);
      res.status(500).json({ error: 'Failed to fetch multi-month cash flow statement' });
    }
  }

  // Generate detailed cash flow data with categorized line items based on COA
  static async generateDetailedCashFlowData(startDate, endDate) {
    try {
      // Get all cash inflows with account details
      const inflows = await CashFlowController.getDetailedCashInflows(startDate, endDate);
      
      // Get all cash outflows with account details
      const outflows = await CashFlowController.getDetailedCashOutflows(startDate, endDate);

      // Group by account type from Chart of Accounts, including ALL accounts
      const categorizedInflows = await CashFlowController.groupByAccountTypeWithAllAccounts(inflows, 'Revenue');
      const categorizedOutflows = await CashFlowController.groupByAccountTypeWithAllAccounts(outflows, 'Expense');

      // Calculate totals
      const totalInflows = inflows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalOutflows = outflows.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netCashFlow = totalInflows - totalOutflows;

      // Get beginning and ending cash balances
      const beginningCash = await CashFlowController.getCashAndBankBalance(startDate, true);
      const endingCash = beginningCash + netCashFlow;

      return {
        categorizedInflows,
        categorizedOutflows,
        allInflows: inflows,
        allOutflows: outflows,
        totals: {
          total_inflows: totalInflows,
          total_outflows: totalOutflows,
          net_cash_flow: netCashFlow,
          beginning_cash: beginningCash,
          ending_cash: endingCash
        }
      };
    } catch (error) {
      console.error('Error generating detailed cash flow data:', error);
      throw error;
    }
  }

  // Group transactions by account type from Chart of Accounts, including ALL accounts
  static async groupByAccountTypeWithAllAccounts(transactions, defaultType) {
    try {
      // Get ALL accounts from Chart of Accounts (excluding Cash/Bank accounts for cash flow)
      const [allAccounts] = await pool.execute(
        `SELECT code, name, type 
         FROM chart_of_accounts 
         WHERE is_active = TRUE 
           AND code NOT IN ('1000', '1010')
         ORDER BY code`
      );

      // Create a map of account code to transaction amount
      const transactionMap = {};
      transactions.forEach(transaction => {
        if (!transactionMap[transaction.account_code]) {
          transactionMap[transaction.account_code] = 0;
        }
        transactionMap[transaction.account_code] += transaction.amount;
      });

      // Group ALL accounts by type, including those with zero transactions
      const grouped = {
        Revenue: [],
        Expense: [],
        Asset: [],
        Liability: [],
        Equity: []
      };

      allAccounts.forEach(account => {
        const accountType = account.type;
        if (grouped[accountType]) {
          grouped[accountType].push({
            account_code: account.code,
            account_name: account.name,
            account_type: accountType,
            amount: transactionMap[account.code] || 0
          });
        }
      });

      // Sort each group by account code
      Object.keys(grouped).forEach(type => {
        grouped[type].sort((a, b) => a.account_code.localeCompare(b.account_code));
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping by account type with all accounts:', error);
      // Fallback: group transactions only
      return CashFlowController.groupByAccountType(transactions, defaultType);
    }
  }

  // Group transactions by account type from Chart of Accounts (fallback method)
  static async groupByAccountType(transactions, defaultType) {
    try {
      // Get all account codes from transactions
      const accountCodes = [...new Set(transactions.map(t => t.account_code))];
      
      if (accountCodes.length === 0) {
        return { Revenue: [], Expense: [], Asset: [], Liability: [], Equity: [] };
      }

      // Get account types from Chart of Accounts
      const placeholders = accountCodes.map(() => '?').join(',');
      const [accounts] = await pool.execute(
        `SELECT code, name, type FROM chart_of_accounts WHERE code IN (${placeholders})`,
        accountCodes
      );

      // Create a map of account code to type
      const accountTypeMap = {};
      accounts.forEach(acc => {
        accountTypeMap[acc.code] = acc.type;
      });

      // Group transactions by type
      const grouped = {
        Revenue: [],
        Expense: [],
        Asset: [],
        Liability: [],
        Equity: []
      };

      transactions.forEach(transaction => {
        const accountType = accountTypeMap[transaction.account_code] || defaultType;
        if (grouped[accountType]) {
          // Check if account already exists in this type group
          const existingAccount = grouped[accountType].find(
            acc => acc.account_code === transaction.account_code
          );
          
          if (existingAccount) {
            existingAccount.amount += transaction.amount;
          } else {
            grouped[accountType].push({
              account_code: transaction.account_code,
              account_name: transaction.account_name,
              account_type: accountType,
              amount: transaction.amount
            });
          }
        }
      });

      // Sort each group by account code
      Object.keys(grouped).forEach(type => {
        grouped[type].sort((a, b) => a.account_code.localeCompare(b.account_code));
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping by account type:', error);
      // Fallback: group by default type
      return {
        Revenue: defaultType === 'Revenue' ? transactions : [],
        Expense: defaultType === 'Expense' ? transactions : [],
        Asset: [],
        Liability: [],
        Equity: []
      };
    }
  }

  // Get detailed cash inflows
  static async getDetailedCashInflows(startDate, endDate) {
    try {
      // Get all cash inflow transactions
      // Cash inflow = when Cash/Bank is DEBITED (money coming in)
      // We use the DEBIT amount from the cash line to ensure accuracy
      // But we categorize by the CREDIT account (revenue source)
      const [detailedInflows] = await pool.execute(`
        SELECT 
          je.id as journal_entry_id,
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          contra_coa.type as account_type,
          cash_jel.debit as cash_amount,
          contra_jel.credit as revenue_amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines cash_jel ON je.id = cash_jel.journal_entry_id
        INNER JOIN chart_of_accounts cash_coa ON cash_jel.account_id = cash_coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id 
          AND contra_jel.id != cash_jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND cash_coa.type = 'Asset'
          AND (cash_coa.code = '1000' OR cash_coa.code = '1010')
          AND cash_jel.debit > 0
          AND contra_jel.credit > 0
          AND contra_coa.code NOT IN ('1000', '1010')  -- Exclude cash-to-cash transfers
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        ORDER BY contra_coa.code, je.id
      `, [startDate, endDate]);

      // Group by account and sum amounts
      // Use the revenue credit amount for each account line
      // This correctly handles cases where one cash transaction is split across multiple revenue accounts
      const accountMap = {};
      detailedInflows.forEach(row => {
        const key = row.account_code;
        if (!accountMap[key]) {
          accountMap[key] = {
            account_code: row.account_code,
            account_name: row.account_name,
            account_type: row.account_type,
            amount: 0
          };
        }
        // Use the revenue credit amount - this represents the portion allocated to this account
        // The cash debit might be the total, but we want the specific revenue allocation
        const amount = parseFloat(row.revenue_amount || 0);
        accountMap[key].amount += amount;
      });

      return Object.values(accountMap);
    } catch (error) {
      console.error('Error getting detailed cash inflows:', error);
      throw error;
    }
  }

  // Get detailed cash outflows
  static async getDetailedCashOutflows(startDate, endDate) {
    try {
      // Get all cash outflow transactions
      // Cash outflow = when Cash/Bank is CREDITED (money going out)
      // We use the CREDIT amount from the cash line to ensure accuracy
      const [detailedOutflows] = await pool.execute(`
        SELECT 
          je.id as journal_entry_id,
          contra_coa.code as account_code,
          contra_coa.name as account_name,
          contra_coa.type as account_type,
          cash_jel.credit as cash_amount,
          contra_jel.debit as expense_amount
        FROM journal_entries je
        INNER JOIN journal_entry_lines cash_jel ON je.id = cash_jel.journal_entry_id
        INNER JOIN chart_of_accounts cash_coa ON cash_jel.account_id = cash_coa.id
        INNER JOIN journal_entry_lines contra_jel ON je.id = contra_jel.journal_entry_id 
          AND contra_jel.id != cash_jel.id
        INNER JOIN chart_of_accounts contra_coa ON contra_jel.account_id = contra_coa.id
        WHERE je.entry_date BETWEEN ? AND ?
          AND cash_coa.type = 'Asset'
          AND (cash_coa.code = '1000' OR cash_coa.code = '1010')
          AND cash_jel.credit > 0
          AND contra_jel.debit > 0
          AND contra_coa.code NOT IN ('1000', '1010')  -- Exclude cash-to-cash transfers
          AND je.description NOT LIKE '%Opening Balances B/D%'
          AND je.description NOT LIKE '%Opening Balance:%'
          AND je.description NOT LIKE '%Close % to Income Summary%'
          AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
        ORDER BY contra_coa.code, je.id
      `, [startDate, endDate]);

      // Group by account and sum amounts
      // Use the expense debit amount for each account line
      // This correctly handles cases where one cash payment is split across multiple expense accounts
      const accountMap = {};
      detailedOutflows.forEach(row => {
        const key = row.account_code;
        if (!accountMap[key]) {
          accountMap[key] = {
            account_code: row.account_code,
            account_name: row.account_name,
            account_type: row.account_type,
            amount: 0
          };
        }
        // Use the expense debit amount - this represents the portion allocated to this account
        // The cash credit might be the total, but we want the specific expense allocation
        const amount = parseFloat(row.expense_amount || 0);
        accountMap[key].amount += amount;
      });

      return Object.values(accountMap);
    } catch (error) {
      console.error('Error getting detailed cash outflows:', error);
      throw error;
    }
  }

}

module.exports = CashFlowController;
