const { pool } = require('../../config/database');
const AccountBalanceService = require('../../services/accountBalanceService');

class PeriodClosingController {
  /**
   * Close an accounting period (Month-end/Year-end closing)
   * This creates closing entries following traditional accounting practices:
   * 1. Close Revenue accounts to Income Summary
   * 2. Close Expense accounts to Income Summary
   * 3. Close Income Summary to Retained Earnings
   * 4. Mark period as closed
   */
  static async closePeriod(req, res) {
    const conn = await pool.getConnection();
    
    try {
      const { periodId } = req.params;
      const userId = req.user?.id || null; // Get user ID from auth token

      await conn.beginTransaction();

      // 1. Get period details
      const [periods] = await conn.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );

      if (periods.length === 0) {
        await conn.rollback();
        return res.status(404).json({ 
          success: false,
          error: 'Period not found' 
        });
      }

      const period = periods[0];

      // Check if period is already closed
      if (period.status === 'closed') {
        await conn.rollback();
        return res.status(400).json({ 
          success: false,
          error: 'Period is already closed' 
        });
      }

      console.log(`\n🔒 Starting period closing for: ${period.period_name}`);
      console.log(`   Period: ${period.start_date} to ${period.end_date}`);

      // 2. Get account IDs for closing entries
      const [accounts] = await conn.execute(`
        SELECT id, code, name, type 
        FROM chart_of_accounts 
        WHERE code IN ('3998', '3999') AND is_active = 1
      `);

      const retainedEarningsAccount = accounts.find(a => a.code === '3998');
      const incomeSummaryAccount = accounts.find(a => a.code === '3999');

      if (!retainedEarningsAccount || !incomeSummaryAccount) {
        await conn.rollback();
        return res.status(500).json({ 
          success: false,
          error: 'Required accounts not found (3998-Retained Earnings, 3999-Income Summary)' 
        });
      }

      // 3. Calculate total revenue for the period
      const [revenueResult] = await conn.execute(`
        SELECT 
          coa.id as account_id,
          coa.code,
          coa.name,
          COALESCE(SUM(jel.credit - jel.debit), 0) as balance
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
        WHERE coa.type = 'Revenue' AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        HAVING balance != 0
      `, [period.start_date, period.end_date]);

      const totalRevenue = revenueResult.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      console.log(`   📊 Total Revenue: $${totalRevenue.toFixed(2)}`);

      // 4. Calculate total expenses for the period
      const [expenseResult] = await conn.execute(`
        SELECT 
          coa.id as account_id,
          coa.code,
          coa.name,
          COALESCE(SUM(jel.debit - jel.credit), 0) as balance
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
        WHERE coa.type = 'Expense' AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        HAVING balance != 0
      `, [period.start_date, period.end_date]);

      const totalExpenses = expenseResult.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      console.log(`   📊 Total Expenses: $${totalExpenses.toFixed(2)}`);

      const netIncome = totalRevenue - totalExpenses;
      console.log(`   💰 Net Income: $${netIncome.toFixed(2)}`);

      // 5. Create closing journal entry
      const [closingJE] = await conn.execute(`
        INSERT INTO journal_entries (journal_id, entry_date, description, reference, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [
        6, // General Journal
        period.end_date,
        `Closing Entry - ${period.period_name}`,
        `CLOSE-${periodId}-${Date.now()}`,
        userId
      ]);

      const closingJournalId = closingJE.insertId;
      console.log(`   ✅ Created closing journal entry: ${closingJournalId}`);

      // 6. Close Revenue accounts to Income Summary
      // DEBIT: Revenue accounts (to zero them out)
      // CREDIT: Income Summary
      if (totalRevenue > 0) {
        for (const revenue of revenueResult) {
          if (parseFloat(revenue.balance) > 0) {
            await conn.execute(`
              INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
              VALUES (?, ?, ?, ?, ?)
            `, [
              closingJournalId,
              revenue.account_id,
              parseFloat(revenue.balance),
              0,
              `Close ${revenue.name} to Income Summary`
            ]);
          }
        }

        // Credit Income Summary with total revenue
        await conn.execute(`
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
          VALUES (?, ?, ?, ?, ?)
        `, [
          closingJournalId,
          incomeSummaryAccount.id,
          0,
          totalRevenue,
          'Total Revenue closed to Income Summary'
        ]);

        console.log(`   ✅ Closed ${revenueResult.length} revenue accounts`);
      }

      // 7. Close Expense accounts to Income Summary
      // DEBIT: Income Summary
      // CREDIT: Expense accounts (to zero them out)
      if (totalExpenses > 0) {
        // Debit Income Summary with total expenses
        await conn.execute(`
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
          VALUES (?, ?, ?, ?, ?)
        `, [
          closingJournalId,
          incomeSummaryAccount.id,
          totalExpenses,
          0,
          'Total Expenses closed from Income Summary'
        ]);

        for (const expense of expenseResult) {
          if (parseFloat(expense.balance) > 0) {
            await conn.execute(`
              INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
              VALUES (?, ?, ?, ?, ?)
            `, [
              closingJournalId,
              expense.account_id,
              0,
              parseFloat(expense.balance),
              `Close ${expense.name} to Income Summary`
            ]);
          }
        }

        console.log(`   ✅ Closed ${expenseResult.length} expense accounts`);
      }

      // 8. Close Income Summary to Retained Earnings
      // If Net Income (profit): DEBIT Income Summary, CREDIT Retained Earnings
      // If Net Loss: DEBIT Retained Earnings, CREDIT Income Summary
      if (netIncome !== 0) {
        if (netIncome > 0) {
          // Profit
          await conn.execute(`
            INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
            VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
          `, [
            closingJournalId, incomeSummaryAccount.id, Math.abs(netIncome), 0, 'Close Income Summary (Profit)',
            closingJournalId, retainedEarningsAccount.id, 0, Math.abs(netIncome), 'Net Income transferred to Retained Earnings'
          ]);
          console.log(`   ✅ Transferred Net Income to Retained Earnings`);
        } else {
          // Loss
          await conn.execute(`
            INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
            VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
          `, [
            closingJournalId, retainedEarningsAccount.id, Math.abs(netIncome), 0, 'Net Loss transferred from Retained Earnings',
            closingJournalId, incomeSummaryAccount.id, 0, Math.abs(netIncome), 'Close Income Summary (Loss)'
          ]);
          console.log(`   ✅ Transferred Net Loss to Retained Earnings`);
        }
      }

      // 9. Recalculate account balances
      console.log(`   🔄 Recalculating account balances...`);
      await AccountBalanceService.recalculateAllAccountBalances();

      // 10. Mark period as closed
      await conn.execute(`
        UPDATE accounting_periods 
        SET status = 'closed', 
            closed_at = NOW(),
            closed_by = ?
        WHERE id = ?
      `, [userId, periodId]);

      await conn.commit();

      console.log(`   ✅ Period closed successfully!\n`);

      res.json({
        success: true,
        message: `Period ${period.period_name} closed successfully`,
        data: {
          period_id: periodId,
          period_name: period.period_name,
          closing_journal_id: closingJournalId,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_income: netIncome,
          revenue_accounts_closed: revenueResult.length,
          expense_accounts_closed: expenseResult.length
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error closing period:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to close period',
        details: error.message 
      });
    } finally {
      conn.release();
    }
  }

  /**
   * Reopen a closed period (reverse closing entries)
   */
  static async reopenPeriod(req, res) {
    const conn = await pool.getConnection();
    
    try {
      const { periodId } = req.params;

      await conn.beginTransaction();

      // 1. Get period details
      const [periods] = await conn.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );

      if (periods.length === 0) {
        await conn.rollback();
        return res.status(404).json({ 
          success: false,
          error: 'Period not found' 
        });
      }

      const period = periods[0];

      if (period.status !== 'closed') {
        await conn.rollback();
        return res.status(400).json({ 
          success: false,
          error: 'Period is not closed' 
        });
      }

      console.log(`\n🔓 Reopening period: ${period.period_name}`);

      // 2. Find and delete closing entries
      const [closingEntries] = await conn.execute(`
        SELECT je.id 
        FROM journal_entries je
        WHERE je.description LIKE ? 
          AND je.entry_date = ?
      `, [`Closing Entry - ${period.period_name}`, period.end_date]);

      if (closingEntries.length > 0) {
        const closingEntryIds = closingEntries.map(e => e.id);
        
        // Delete journal entry lines
        await conn.execute(`
          DELETE FROM journal_entry_lines 
          WHERE journal_entry_id IN (?)
        `, [closingEntryIds]);

        // Delete journal entries
        await conn.execute(`
          DELETE FROM journal_entries 
          WHERE id IN (?)
        `, [closingEntryIds]);

        console.log(`   ✅ Deleted ${closingEntries.length} closing entries`);
      }

      // 3. Recalculate account balances
      console.log(`   🔄 Recalculating account balances...`);
      await AccountBalanceService.recalculateAllAccountBalances();

      // 4. Mark period as open
      await conn.execute(`
        UPDATE accounting_periods 
        SET status = 'open', 
            closed_at = NULL,
            closed_by = NULL
        WHERE id = ?
      `, [periodId]);

      await conn.commit();

      console.log(`   ✅ Period reopened successfully!\n`);

      res.json({
        success: true,
        message: `Period ${period.period_name} reopened successfully`,
        data: {
          period_id: periodId,
          period_name: period.period_name,
          closing_entries_deleted: closingEntries.length
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error reopening period:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to reopen period',
        details: error.message 
      });
    } finally {
      conn.release();
    }
  }

  /**
   * Get period closing status and preview
   */
  static async getClosingPreview(req, res) {
    try {
      const { periodId } = req.params;

      // Get period details
      const [periods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );

      if (periods.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Period not found' 
        });
      }

      const period = periods[0];

      // Calculate revenue
      const [revenueResult] = await pool.execute(`
        SELECT 
          coa.id, coa.code, coa.name,
          COALESCE(SUM(jel.credit - jel.debit), 0) as balance
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
        WHERE coa.type = 'Revenue' AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        HAVING balance != 0
      `, [period.start_date, period.end_date]);

      const totalRevenue = revenueResult.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      // Calculate expenses
      const [expenseResult] = await pool.execute(`
        SELECT 
          coa.id, coa.code, coa.name,
          COALESCE(SUM(jel.debit - jel.credit), 0) as balance
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
        LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
          AND je.entry_date BETWEEN ? AND ?
        WHERE coa.type = 'Expense' AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        HAVING balance != 0
      `, [period.start_date, period.end_date]);

      const totalExpenses = expenseResult.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const netIncome = totalRevenue - totalExpenses;

      res.json({
        success: true,
        data: {
          period,
          is_closed: period.status === 'closed',
          revenue_accounts: revenueResult.map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
            balance: parseFloat(r.balance)
          })),
          expense_accounts: expenseResult.map(e => ({
            id: e.id,
            code: e.code,
            name: e.name,
            balance: parseFloat(e.balance)
          })),
          summary: {
            total_revenue: totalRevenue,
            total_expenses: totalExpenses,
            net_income: netIncome,
            revenue_accounts_count: revenueResult.length,
            expense_accounts_count: expenseResult.length
          }
        }
      });

    } catch (error) {
      console.error('Error getting closing preview:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get closing preview',
        details: error.message 
      });
    }
  }
}

module.exports = PeriodClosingController;
