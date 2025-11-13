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
        let accounts;

        if (as_of_date) {
          // Get trial balance as of a specific date using account_balances table
          accounts = await TrialBalanceController.getTrialBalanceAsOfDate(conn, as_of_date);
        } else {
          // Get trial balance for a date range using account_balances table
          accounts = await TrialBalanceController.getTrialBalanceForDateRange(conn, start_date, end_date);
        }

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

  // Get trial balance as of a specific date using account_balances table
  static async getTrialBalanceAsOfDate(conn, asOfDate) {
    const [accounts] = await conn.execute(`
      SELECT 
        coa.id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        coa.parent_id,
        COALESCE(ab.balance, 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN (
        SELECT 
          ab1.account_id,
          ab1.balance
        FROM account_balances ab1
        INNER JOIN (
          SELECT 
            account_id,
            MAX(as_of_date) as max_date
          FROM account_balances
          WHERE as_of_date <= ?
          GROUP BY account_id
        ) ab2 ON ab1.account_id = ab2.account_id AND ab1.as_of_date = ab2.max_date
      ) ab ON coa.id = ab.account_id
      WHERE coa.is_active = TRUE
        AND COALESCE(ab.balance, 0) != 0
      ORDER BY coa.code
    `, [asOfDate]);

    // Calculate debit and credit based on account type and balance
    return accounts.map(account => {
      const balance = parseFloat(account.balance || 0);
      let total_debit = 0;
      let total_credit = 0;

      // Asset & Expense: Debit balances are positive, Credit balances are negative
      // Liability, Equity, Revenue: Credit balances are positive, Debit balances are negative
      if (account.account_type === 'Asset' || account.account_type === 'Expense') {
        if (balance >= 0) {
          total_debit = balance;
        } else {
          total_credit = Math.abs(balance);
        }
      } else {
        // Liability, Equity, Revenue
        if (balance >= 0) {
          total_credit = balance;
        } else {
          total_debit = Math.abs(balance);
        }
      }

      return {
        ...account,
        total_debit,
        total_credit,
        balance
      };
    });
  }

  // Get trial balance for a date range using account_balances table
  static async getTrialBalanceForDateRange(conn, startDate, endDate) {
    // Get beginning balances (as of day before start_date)
    const beginDate = new Date(startDate);
    beginDate.setDate(beginDate.getDate() - 1);
    const beginDateStr = beginDate.toISOString().split('T')[0];

    const [beginBalances] = await conn.execute(`
      SELECT 
        ab1.account_id,
        COALESCE(ab1.balance, 0) as balance
      FROM (
        SELECT DISTINCT account_id FROM account_balances
      ) accounts
      LEFT JOIN account_balances ab1 ON accounts.account_id = ab1.account_id
        AND ab1.as_of_date = (
          SELECT MAX(ab2.as_of_date)
          FROM account_balances ab2
          WHERE ab2.account_id = accounts.account_id
            AND ab2.as_of_date <= ?
        )
    `, [beginDateStr]);

    // Get ending balances (as of end_date)
    const [endBalances] = await conn.execute(`
      SELECT 
        ab1.account_id,
        COALESCE(ab1.balance, 0) as balance
      FROM (
        SELECT DISTINCT account_id FROM account_balances
      ) accounts
      LEFT JOIN account_balances ab1 ON accounts.account_id = ab1.account_id
        AND ab1.as_of_date = (
          SELECT MAX(ab2.as_of_date)
          FROM account_balances ab2
          WHERE ab2.account_id = accounts.account_id
            AND ab2.as_of_date <= ?
        )
    `, [endDate]);

    // Create maps for quick lookup
    const beginBalanceMap = {};
    beginBalances.forEach(row => {
      beginBalanceMap[row.account_id] = parseFloat(row.balance || 0);
    });

    const endBalanceMap = {};
    endBalances.forEach(row => {
      endBalanceMap[row.account_id] = parseFloat(row.balance || 0);
    });

    // Get all active accounts
    const [allAccounts] = await conn.execute(`
      SELECT 
        id,
        code as account_code,
        name as account_name,
        type as account_type,
        parent_id
      FROM chart_of_accounts
      WHERE is_active = TRUE
      ORDER BY code
    `);

    // Calculate changes for each account
    const accounts = allAccounts
      .map(account => {
        const beginBalance = beginBalanceMap[account.id] || 0;
        const endBalance = endBalanceMap[account.id] || 0;
        const change = endBalance - beginBalance;

        // If no change and no balance, skip this account
        if (change === 0 && endBalance === 0) {
          return null;
        }

        let total_debit = 0;
        let total_credit = 0;

        // Calculate debits and credits based on account type and change
        if (account.account_type === 'Asset' || account.account_type === 'Expense') {
          // For Asset/Expense: Increase = Debit, Decrease = Credit
          if (change > 0) {
            total_debit = change;
          } else if (change < 0) {
            total_credit = Math.abs(change);
          }
        } else {
          // For Liability/Equity/Revenue: Increase = Credit, Decrease = Debit
          if (change > 0) {
            total_credit = change;
          } else if (change < 0) {
            total_debit = Math.abs(change);
          }
        }

        return {
          id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          parent_id: account.parent_id,
          total_debit,
          total_credit,
          balance: endBalance
        };
      })
      .filter(account => account !== null);

    return accounts;
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
        // Get trial balance using account_balances
        const accounts = await TrialBalanceController.getTrialBalanceAsOfDate(conn, as_of_date);

        // Group by account type
        const summaryMap = {};
        accounts.forEach(account => {
          if (!summaryMap[account.account_type]) {
            summaryMap[account.account_type] = {
              account_type: account.account_type,
              total_debit: 0,
              total_credit: 0,
              net_balance: 0,
              account_count: 0
            };
          }
          summaryMap[account.account_type].total_debit += parseFloat(account.total_debit || 0);
          summaryMap[account.account_type].total_credit += parseFloat(account.total_credit || 0);
          summaryMap[account.account_type].net_balance += parseFloat(account.balance || 0);
          summaryMap[account.account_type].account_count += 1;
        });

        const summary = Object.values(summaryMap).sort((a, b) => {
          const order = {
            'Asset': 1,
            'Liability': 2,
            'Equity': 3,
            'Revenue': 4,
            'Expense': 5
          };
          return (order[a.account_type] || 6) - (order[b.account_type] || 6);
        });

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
        let accounts;

        if (as_of_date) {
          // Get trial balance using account_balances
          accounts = await TrialBalanceController.getTrialBalanceAsOfDate(conn, as_of_date);
        } else {
          // Get trial balance for date range using account_balances
          accounts = await TrialBalanceController.getTrialBalanceForDateRange(conn, start_date, end_date);
        }

        // Format for CSV export
        const accountsForCSV = accounts.map(account => ({
          'Account Code': account.account_code,
          'Account Name': account.account_name,
          'Account Type': account.account_type,
          'Debit': account.total_debit,
          'Credit': account.total_credit,
          'Balance': account.balance
        }));

        // Generate CSV
        const headers = Object.keys(accountsForCSV[0] || {});
        let csv = headers.join(',') + '\n';

        accountsForCSV.forEach(account => {
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

