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

      req.params.periodId = existingPeriods[0].id;
      return BalanceSheetController.getBalanceSheet(req, res);
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
    const balanceSheetQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        CASE 
          WHEN coa.type = 'Asset' THEN 
            COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0)
          ELSE 
            COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0)
        END as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.entry_date <= ?
      WHERE coa.type IN ('Asset', 'Liability', 'Equity') AND coa.is_active = 1
      GROUP BY coa.id, coa.code, coa.name, coa.type
      HAVING balance != 0
      ORDER BY coa.type, coa.code
    `;

    const [rows] = await pool.execute(balanceSheetQuery, [asOfDate]);

    const assets = rows.filter(item => item.account_type === 'Asset').map(r => ({
      account_id: r.account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: parseFloat(r.balance || 0)
    }));

    const liabilities = rows.filter(item => item.account_type === 'Liability').map(r => ({
      account_id: r.account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: parseFloat(r.balance || 0)
    }));

    const equity = rows.filter(item => item.account_type === 'Equity').map(r => ({
      account_id: r.account_id,
      account_code: r.account_code,
      account_name: r.account_name,
      balance: parseFloat(r.balance || 0)
    }));

    const totalAssets = assets.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.balance || 0), 0);
    const totalEquity = equity.reduce((sum, e) => sum + (e.balance || 0), 0);

    return {
      assets,
      liabilities,
      equity,
      totals: {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity
      }
    };
  }
}

module.exports = BalanceSheetController;
