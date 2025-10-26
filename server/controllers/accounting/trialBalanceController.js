const { pool } = require('../../config/database');

class TrialBalanceController {
  // Get trial balance for a specific date or date range
  static async getTrialBalance(req, res) {
    try {
      const { as_of_date, start_date, end_date } = req.query;

      // Validate that we have either as_of_date or both start_date and end_date
      if (!as_of_date && (!start_date || !end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either as_of_date or both start_date and end_date'
        });
      }

      const conn = await pool.getConnection();

      try {
        let query;
        let params;

        if (as_of_date) {
          // Get trial balance as of a specific date
          query = `
            SELECT 
              coa.id,
              coa.code as account_code,
              coa.name as account_name,
              coa.type as account_type,
              coa.parent_id,
              COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as total_debit,
              COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as total_credit,
              COALESCE(SUM(jel.debit - jel.credit), 0) as balance
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = TRUE
              AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY coa.id, coa.code, coa.name, coa.type, coa.parent_id
            HAVING total_debit > 0 OR total_credit > 0 OR balance != 0
            ORDER BY coa.code
          `;
          params = [as_of_date];
        } else {
          // Get trial balance for a date range
          query = `
            SELECT 
              coa.id,
              coa.code as account_code,
              coa.name as account_name,
              coa.type as account_type,
              coa.parent_id,
              COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as total_debit,
              COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as total_credit,
              COALESCE(SUM(jel.debit - jel.credit), 0) as balance
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = TRUE
              AND (je.entry_date IS NULL OR (je.entry_date BETWEEN ? AND ?))
            GROUP BY coa.id, coa.code, coa.name, coa.type, coa.parent_id
            HAVING total_debit > 0 OR total_credit > 0 OR balance != 0
            ORDER BY coa.code
          `;
          params = [start_date, end_date];
        }

        const [accounts] = await conn.execute(query, params);

        // Calculate totals
        const totals = {
          total_debit: 0,
          total_credit: 0,
          difference: 0
        };

        accounts.forEach(account => {
          totals.total_debit += parseFloat(account.total_debit);
          totals.total_credit += parseFloat(account.total_credit);
        });

        totals.difference = totals.total_debit - totals.total_credit;

        // Check if trial balance is balanced
        const is_balanced = Math.abs(totals.difference) < 0.01; // Allow for small rounding differences

        console.log(`📊 Trial Balance Generated:`);
        console.log(`   As of: ${as_of_date || `${start_date} to ${end_date}`}`);
        console.log(`   Total Debits: ${totals.total_debit.toFixed(2)}`);
        console.log(`   Total Credits: ${totals.total_credit.toFixed(2)}`);
        console.log(`   Difference: ${totals.difference.toFixed(2)}`);
        console.log(`   Balanced: ${is_balanced ? '✅' : '❌'}`);

        res.json({
          success: true,
          data: {
            trial_balance: accounts,
            totals,
            is_balanced,
            as_of_date: as_of_date || null,
            start_date: start_date || null,
            end_date: end_date || null
          }
        });

      } finally {
        conn.release();
      }

    } catch (error) {
      console.error('Error generating trial balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trial balance',
        error: error.message
      });
    }
  }

  // Get trial balance summary by account type
  static async getTrialBalanceSummary(req, res) {
    try {
      const { as_of_date } = req.query;

      if (!as_of_date) {
        return res.status(400).json({
          success: false,
          message: 'Please provide as_of_date parameter'
        });
      }

      const conn = await pool.getConnection();

      try {
        const query = `
          SELECT 
            coa.type as account_type,
            COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as total_debit,
            COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as total_credit,
            COALESCE(SUM(jel.debit - jel.credit), 0) as net_balance,
            COUNT(DISTINCT coa.id) as account_count
          FROM chart_of_accounts coa
          LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
          LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
          WHERE coa.is_active = TRUE
            AND (je.entry_date IS NULL OR je.entry_date <= ?)
          GROUP BY coa.type
          ORDER BY 
            CASE coa.type
              WHEN 'Asset' THEN 1
              WHEN 'Liability' THEN 2
              WHEN 'Equity' THEN 3
              WHEN 'Revenue' THEN 4
              WHEN 'Expense' THEN 5
              ELSE 6
            END
        `;

        const [summary] = await conn.execute(query, [as_of_date]);

        res.json({
          success: true,
          data: {
            summary,
            as_of_date
          }
        });

      } finally {
        conn.release();
      }

    } catch (error) {
      console.error('Error generating trial balance summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate trial balance summary',
        error: error.message
      });
    }
  }

  // Export trial balance to CSV
  static async exportTrialBalance(req, res) {
    try {
      const { as_of_date, start_date, end_date } = req.query;

      if (!as_of_date && (!start_date || !end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either as_of_date or both start_date and end_date'
        });
      }

      const conn = await pool.getConnection();

      try {
        let query;
        let params;

        if (as_of_date) {
          query = `
            SELECT 
              coa.code as 'Account Code',
              coa.name as 'Account Name',
              coa.type as 'Account Type',
              COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as 'Debit',
              COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as 'Credit',
              COALESCE(SUM(jel.debit - jel.credit), 0) as 'Balance'
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = TRUE
              AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY coa.id, coa.code, coa.name, coa.type
            HAVING Debit > 0 OR Credit > 0 OR Balance != 0
            ORDER BY coa.code
          `;
          params = [as_of_date];
        } else {
          query = `
            SELECT 
              coa.code as 'Account Code',
              coa.name as 'Account Name',
              coa.type as 'Account Type',
              COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as 'Debit',
              COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as 'Credit',
              COALESCE(SUM(jel.debit - jel.credit), 0) as 'Balance'
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = TRUE
              AND (je.entry_date IS NULL OR (je.entry_date BETWEEN ? AND ?))
            GROUP BY coa.id, coa.code, coa.name, coa.type
            HAVING Debit > 0 OR Credit > 0 OR Balance != 0
            ORDER BY coa.code
          `;
          params = [start_date, end_date];
        }

        const [accounts] = await conn.execute(query, params);

        // Generate CSV
        const headers = Object.keys(accounts[0] || {});
        let csv = headers.join(',') + '\n';

        accounts.forEach(account => {
          const row = headers.map(header => {
            const value = account[header];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csv += row.join(',') + '\n';
        });

        // Set headers for file download
        const filename = `trial_balance_${as_of_date || `${start_date}_to_${end_date}`}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);

      } finally {
        conn.release();
      }

    } catch (error) {
      console.error('Error exporting trial balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export trial balance',
        error: error.message
      });
    }
  }
}

module.exports = TrialBalanceController;

