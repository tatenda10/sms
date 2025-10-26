const { pool } = require('../../config/database');

class BalanceSheetController {
  // Get balance sheet for a specific period by ID
  static async getBalanceSheet(req, res) {
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

      // Generate balance sheet as of period end date
      const data = await BalanceSheetController.generateBalanceSheetData(period.end_date);

      res.json({
        period: period,
        ...data,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
  }

  // Get balance sheet by month and year (as of end of month)
  static async getBalanceSheetByMonthYear(req, res) {
    try {
      const { month, year } = req.params;

      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12.' });
      }
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ error: 'Invalid year. Must be between 1900 and 2100.' });
      }

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0); // last day of the month
      const periodName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Ensure period exists (align with income controller behavior)
      let [existingPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE start_date = ? AND end_date = ?',
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );

      if (existingPeriods.length === 0) {
        const [result] = await pool.execute(
          'INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
          [periodName, 'monthly', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 'open']
        );
        const [created] = await pool.execute('SELECT * FROM accounting_periods WHERE id = ?', [result.insertId]);
        existingPeriods = created;
      }

      const period = existingPeriods[0];
      
      // Get the balance sheet data
      const data = await BalanceSheetController.generateBalanceSheetData(period.end_date);
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
      return res.json({
        period: {
          ...period,
          is_closed: period.status === 'closed'
        },
        ...data,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error getting balance sheet by month/year:', error);
      res.status(500).json({ error: 'Failed to get balance sheet' });
    }
  }

  // Get balance sheet by custom date range (as of end date)
  static async getBalanceSheetByDateRange(req, res) {
    try {
      const { start, end } = req.query;

      const endDate = end;
      if (!endDate) {
        return res.status(400).json({ error: 'end query parameter is required (YYYY-MM-DD)' });
      }

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDateRegex.test(endDate)) {
        return res.status(400).json({ error: 'Invalid date format for end. Use YYYY-MM-DD' });
      }
      if (start && !isoDateRegex.test(start)) {
        return res.status(400).json({ error: 'Invalid date format for start. Use YYYY-MM-DD' });
      }

      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;

      const data = await BalanceSheetController.generateBalanceSheetData(endDate);

      res.json({
        as_of_date: endDate,
        ...data,
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating balance sheet by date range:', error);
      res.status(500).json({ error: 'Failed to generate balance sheet by date range' });
    }
  }

  // Helper to compute balances as of a date
  static async generateBalanceSheetData(asOfDate) {
    // Use actual account balances from the account_balances table
    const balanceSheetQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(ab.balance, 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN (
        SELECT account_id, balance
        FROM account_balances
        WHERE as_of_date = (
          SELECT MAX(as_of_date) 
          FROM account_balances 
          WHERE as_of_date <= ?
        )
      ) ab ON ab.account_id = coa.id
      WHERE coa.type IN ('Asset', 'Liability', 'Equity') 
        AND coa.is_active = 1
        AND COALESCE(ab.balance, 0) != 0
      ORDER BY coa.type, coa.code
    `;
    
    // Get Revenue and Expense balances to calculate Net Income
    const incomeQuery = `
      SELECT 
        coa.type as account_type,
        COALESCE(ab.balance, 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN (
        SELECT account_id, balance
        FROM account_balances
        WHERE as_of_date = (
          SELECT MAX(as_of_date) 
          FROM account_balances 
          WHERE as_of_date <= ?
        )
      ) ab ON ab.account_id = coa.id
      WHERE coa.type IN ('Revenue', 'Expense') 
        AND coa.is_active = 1
    `;

    const [rows] = await pool.execute(balanceSheetQuery, [asOfDate]);
    const [incomeRows] = await pool.execute(incomeQuery, [asOfDate]);
    
    // Calculate Net Income (Revenue - Expenses)
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    incomeRows.forEach(row => {
      const balance = parseFloat(row.balance || 0);
      if (row.account_type === 'Revenue') {
        // Revenue has positive balance (credit balance)
        totalRevenue += balance;
      } else if (row.account_type === 'Expense') {
        // Expense has positive balance (debit balance)
        totalExpenses += balance;
      }
    });
    
    // Net Income = Revenue - Expenses (increases equity if positive, decreases if negative)
    const netIncome = totalRevenue - totalExpenses;
    console.log(`📊 Net Income: Revenue $${totalRevenue} - Expenses $${totalExpenses} = $${netIncome}`);

    // Categorize assets by account code and name
    const currentAssets = [];
    const fixedAssets = [];
    const otherAssets = [];

    rows.filter(item => item.account_type === 'Asset').forEach(r => {
      const account = {
        account_id: r.account_id,
        account_code: r.account_code,
        account_name: r.account_name,
        balance: parseFloat(r.balance || 0)
      };

      const code = parseInt(r.account_code);
      const nameLower = (r.account_name || '').toLowerCase();
      
      // Categorize based on account code ranges and name keywords
      if (code >= 1000 && code < 1500) {
        // Current Assets: 1000-1499 (Cash, Bank, Receivables, Inventory)
        currentAssets.push(account);
      } else if (code >= 1500 && code < 2000) {
        // Fixed Assets: 1500-1999 (Property, Equipment, Vehicles)
        fixedAssets.push(account);
      } else if (nameLower.includes('cash') || nameLower.includes('bank') || 
                 nameLower.includes('receivable') || nameLower.includes('inventory')) {
        currentAssets.push(account);
      } else if (nameLower.includes('property') || nameLower.includes('equipment') || 
                 nameLower.includes('building') || nameLower.includes('vehicle')) {
        fixedAssets.push(account);
      } else {
        otherAssets.push(account);
      }
    });

    // Categorize liabilities by account code and name
    const currentLiabilities = [];
    const longTermLiabilities = [];

    rows.filter(item => item.account_type === 'Liability').forEach(r => {
      const account = {
        account_id: r.account_id,
        account_code: r.account_code,
        account_name: r.account_name,
        balance: parseFloat(r.balance || 0)
      };

      const code = parseInt(r.account_code);
      const nameLower = (r.account_name || '').toLowerCase();
      
      // Categorize based on account code ranges and name keywords
      if (code >= 2000 && code < 2500) {
        // Current Liabilities: 2000-2499 (Payables, Short-term)
        currentLiabilities.push(account);
      } else if (code >= 2500 && code < 3000) {
        // Long-term Liabilities: 2500-2999
        longTermLiabilities.push(account);
      } else if (nameLower.includes('payable') || nameLower.includes('current') || 
                 nameLower.includes('short')) {
        currentLiabilities.push(account);
      } else if (nameLower.includes('long') || nameLower.includes('term') || 
                 nameLower.includes('loan')) {
        longTermLiabilities.push(account);
      } else {
        // Default to current liabilities
        currentLiabilities.push(account);
      }
    });

    // Get equity accounts (including Retained Earnings from actual account balance)
    const equity = rows.filter(item => item.account_type === 'Equity').map(r => ({
      account_id: r.account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: parseFloat(r.balance || 0)
    }));
    
    // Add Current Period Net Income to equity (if not zero)
    if (netIncome !== 0) {
      equity.push({
        account_id: null,
        account_code: 'NET_INCOME',
        account_name: 'Current Period Net Income',
        balance: netIncome
      });
    }

    const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalOtherAssets = otherAssets.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

    const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + (l.balance || 0), 0);
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, l) => sum + (l.balance || 0), 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    // Total Equity = Retained Earnings + Net Income
    const totalEquity = equity.reduce((sum, e) => sum + (e.balance || 0), 0);

    return {
      current_assets: currentAssets,
      fixed_assets: fixedAssets,
      other_assets: otherAssets,
      current_liabilities: currentLiabilities,
      long_term_liabilities: longTermLiabilities,
      equity,
      totals: {
        total_current_assets: totalCurrentAssets,
        total_fixed_assets: totalFixedAssets,
        total_other_assets: totalOtherAssets,
        total_assets: totalAssets,
        total_current_liabilities: totalCurrentLiabilities,
        total_long_term_liabilities: totalLongTermLiabilities,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity,
        net_income: netIncome
      }
    };
  }
}

module.exports = BalanceSheetController;
