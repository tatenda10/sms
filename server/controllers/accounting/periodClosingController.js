const { pool } = require('../../config/database');

class PeriodClosingController {
  // Get trial balance for a period
  static async getTrialBalance(req, res) {
    try {
      const { periodId } = req.params;
      
      // Get period details
      const [periods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );
      
      let period;
      if (periods.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }
      
      period = periods[0];
      
      // Get base currency
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE base_currency = TRUE LIMIT 1'
      );
      const baseCurrency = currencies.length > 0 ? currencies[0] : null;
      
                                                                                                           // Get trial balance for the period (excluding opening balance entries and closing entries)
         const query = `
           SELECT 
             coa.id as account_id,
             coa.code as account_code,
             coa.name as account_name,
             coa.type as account_type,
             COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as total_credit,
             CASE 
               WHEN coa.type IN ('Asset', 'Expense') THEN 
                 COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0)
               ELSE 
                 COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0)
             END as balance
           FROM chart_of_accounts coa
           LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
           LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
             AND je.entry_date BETWEEN ? AND ?
             AND je.description NOT LIKE '%Opening Balances B/D%'
             AND je.description NOT LIKE '%Close % to Income Summary%'
             AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
           WHERE coa.is_active = 1
           GROUP BY coa.id, coa.code, coa.name, coa.type
           HAVING total_debit > 0 OR total_credit > 0
           ORDER BY coa.code
         `;
      
                           // Debug: Check what journal entries exist for this period
                const debugQuery = `
           SELECT 
             je.id as journal_id,
             je.description,
             je.entry_date,
             jel.account_id,
             coa.name as account_name,
             jel.debit,
             jel.credit
           FROM journal_entries je
           JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
           JOIN chart_of_accounts coa ON jel.account_id = coa.id
           WHERE je.entry_date BETWEEN ? AND ?
             AND je.description NOT LIKE '%Opening Balances B/D%'
             AND je.description NOT LIKE '%Close % to Income Summary%'
             AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
           ORDER BY je.entry_date, je.id
         `;
       
       const [debugEntries] = await pool.execute(debugQuery, [period.start_date, period.end_date]);
       console.log('=== JOURNAL ENTRIES DEBUG ===');
       console.log('Journal entries found for period:', debugEntries.length);
       console.log('Journal entries data:', JSON.stringify(debugEntries, null, 2));
       console.log('=== END JOURNAL ENTRIES DEBUG ===');
       
                       const [trialBalance] = await pool.execute(query, [period.start_date, period.end_date]);
         
         // Get opening balances for this period
         const [openingBalances] = await pool.execute(
           `SELECT 
             pob.account_id,
             pob.opening_balance,
             pob.balance_type,
             coa.code as account_code,
             coa.name as account_name,
             coa.type as account_type
            FROM period_opening_balances pob
            JOIN chart_of_accounts coa ON pob.account_id = coa.id
            WHERE pob.period_id = ?`,
           [period.id]
         );
         
                   // Check if this period has any transactions
          const hasTransactions = trialBalance.length > 0 && trialBalance.some(account => 
            parseFloat(account.total_debit || 0) > 0 || parseFloat(account.total_credit || 0) > 0
          );
         
         console.log(`Period ${period.period_name} has transactions:`, hasTransactions);
         console.log(`Opening balances found:`, openingBalances.length);
         
                   // If no transactions in this period, show only opening balances
          if (!hasTransactions && openingBalances.length > 0) {
           console.log('Showing only opening balances for this period');
           const openingBalanceAccounts = openingBalances.map(openingBalance => ({
             account_id: openingBalance.account_id,
             account_code: openingBalance.account_code,
             account_name: openingBalance.account_name,
             account_type: openingBalance.account_type,
             total_debit: openingBalance.balance_type === 'debit' ? openingBalance.opening_balance : 0,
             total_credit: openingBalance.balance_type === 'credit' ? openingBalance.opening_balance : 0,
             balance: openingBalance.opening_balance
           }));
           
           // Replace trial balance with opening balances only
           trialBalance.length = 0;
           trialBalance.push(...openingBalanceAccounts);
         } else {
           // Merge opening balances with trial balance (existing logic)
           const openingBalancesMap = new Map();
           openingBalances.forEach(ob => {
             openingBalancesMap.set(ob.account_id, ob);
           });
           
           // Add opening balances to trial balance
           trialBalance.forEach(account => {
             const openingBalance = openingBalancesMap.get(account.account_id);
             if (openingBalance) {
               if (openingBalance.balance_type === 'debit') {
                 account.total_debit = parseFloat(account.total_debit || 0) + parseFloat(openingBalance.opening_balance);
               } else {
                 account.total_credit = parseFloat(account.total_credit || 0) + parseFloat(openingBalance.opening_balance);
               }
               // Recalculate balance
               if (account.account_type === 'Asset' || account.account_type === 'Expense') {
                 account.balance = parseFloat(account.total_debit || 0) - parseFloat(account.total_credit || 0);
               } else {
                 account.balance = parseFloat(account.total_credit || 0) - parseFloat(account.total_debit || 0);
               }
             }
           });
           
           // Add accounts that only have opening balances
           openingBalances.forEach(openingBalance => {
             const existingAccount = trialBalance.find(account => account.account_id === openingBalance.account_id);
             if (!existingAccount) {
               const newAccount = {
                 account_id: openingBalance.account_id,
                 account_code: openingBalance.account_code,
                 account_name: openingBalance.account_name,
                 account_type: openingBalance.account_type,
                 total_debit: openingBalance.balance_type === 'debit' ? openingBalance.opening_balance : 0,
                 total_credit: openingBalance.balance_type === 'credit' ? openingBalance.opening_balance : 0,
                 balance: openingBalance.opening_balance
               };
               trialBalance.push(newAccount);
             }
           });
         }
        
        // Debug logging
        console.log('=== TRIAL BALANCE DEBUG ===');
        console.log('Period:', period.period_name, 'Start:', period.start_date, 'End:', period.end_date);
        console.log('Opening balances found:', openingBalances.length);
        console.log('Raw trial balance data:', JSON.stringify(trialBalance, null, 2));
       
       // Calculate totals - convert to numbers to avoid string concatenation
       const totalDebit = trialBalance.reduce((sum, account) => sum + parseFloat(account.total_debit || 0), 0);
       const totalCredit = trialBalance.reduce((sum, account) => sum + parseFloat(account.total_credit || 0), 0);
       
       console.log('Calculated totals:');
       console.log('- Total Debit:', totalDebit);
       console.log('- Total Credit:', totalCredit);
       console.log('- Difference:', totalDebit - totalCredit);
       
       // Log each account's contribution
       console.log('Account breakdown:');
       trialBalance.forEach(account => {
         console.log(`- ${account.account_name} (${account.account_code}): Debit=${account.total_debit}, Credit=${account.total_credit}`);
       });
       console.log('=== END DEBUG ===');
      
      res.json({
        period: period,
        trial_balance: trialBalance,
        totals: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          difference: totalDebit - totalCredit
        },
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating trial balance:', error);
      res.status(500).json({ error: 'Failed to generate trial balance' });
    }
  }

  // Get income statement for a period
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
      
                                       // Get revenue accounts
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
        WHERE coa.type = 'Revenue' AND coa.is_active = 1
        GROUP BY coa.id, coa.code, coa.name
        ORDER BY coa.code
      `;
      
      const [revenue] = await pool.execute(revenueQuery, [period.start_date, period.end_date]);
      
             // Get expense accounts
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
         WHERE coa.type = 'Expense' AND coa.is_active = 1
         GROUP BY coa.id, coa.code, coa.name
         ORDER BY coa.code
       `;
      
      const [expenses] = await pool.execute(expenseQuery, [period.start_date, period.end_date]);
      
             // Calculate totals - convert to numbers
       const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
       const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const netIncome = totalRevenue - totalExpenses;
      
      res.json({
        period: period,
        revenue: revenue,
        expenses: expenses,
        totals: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_income: netIncome
        },
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating income statement:', error);
      res.status(500).json({ error: 'Failed to generate income statement' });
    }
  }

  // Get balance sheet for a period
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
      
                   // Get balance sheet accounts (Assets, Liabilities, Equity)
      const balanceSheetQuery = `
        SELECT 
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
        GROUP BY coa.id, coa.name, coa.type
        HAVING balance != 0
        ORDER BY coa.type, coa.code
      `;
      
      const [balanceSheet] = await pool.execute(balanceSheetQuery, [period.end_date]);
      
      // Group by account type
      const assets = balanceSheet.filter(item => item.account_type === 'Asset');
      const liabilities = balanceSheet.filter(item => item.account_type === 'Liability');
      const equity = balanceSheet.filter(item => item.account_type === 'Equity');
      
             // Calculate totals - convert to numbers
       const totalAssets = assets.reduce((sum, item) => sum + parseFloat(item.balance || 0), 0);
       const totalLiabilities = liabilities.reduce((sum, item) => sum + parseFloat(item.balance || 0), 0);
       const totalEquity = equity.reduce((sum, item) => sum + parseFloat(item.balance || 0), 0);
      
      res.json({
        period: period,
        assets: assets,
        liabilities: liabilities,
        equity: equity,
        totals: {
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          total_equity: totalEquity
        },
        currency: baseCurrency
      });
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
  }

  // Close a period
  static async closePeriod(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { periodId } = req.params;
      const userId = req.user.id;
      
      // Get period details
      const [periods] = await connection.execute(
        'SELECT * FROM accounting_periods WHERE id = ?',
        [periodId]
      );
      
      if (periods.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Period not found' });
      }
      
      const period = periods[0];
      
      if (period.status === 'closed') {
        await connection.rollback();
        return res.status(400).json({ error: 'Period is already closed' });
      }
      
      // Generate trial balance to validate
      const trialBalance = await PeriodClosingController.generateTrialBalanceForPeriod(connection, period);
      
      if (Math.abs(trialBalance.totals.difference) > 0.01) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Trial balance does not balance',
          difference: trialBalance.totals.difference
        });
      }
      
      // Generate income statement
      const incomeStatement = await PeriodClosingController.generateIncomeStatementForPeriod(connection, period);
      
             // Create closing entries
       const closingEntries = await PeriodClosingController.createClosingEntries(connection, period, incomeStatement, userId);
       
       // Create opening balances for next period
       const openingBalances = await PeriodClosingController.createOpeningBalancesForNextPeriod(connection, period, trialBalance, userId);
       
       // Update period status
       await connection.execute(
         'UPDATE accounting_periods SET status = ?, closed_date = NOW(), closed_by = ? WHERE id = ?',
         ['closed', userId, periodId]
       );
      
             // Create audit trail
       await connection.execute(
         `INSERT INTO period_closing_audit (period_id, action, performed_by, description, metadata) 
          VALUES (?, ?, ?, ?, ?)`,
         [
           periodId,
           'close',
           userId,
           `Period ${period.period_name} closed successfully`,
           JSON.stringify({
             trial_balance_totals: trialBalance.totals,
             income_statement_totals: incomeStatement.totals,
             closing_entries_count: closingEntries.length,
             opening_balances_count: openingBalances.length
           })
         ]
       );
      
      await connection.commit();
      
             res.json({
         message: 'Period closed successfully',
         period: period,
         closing_summary: {
           trial_balance: trialBalance.totals,
           income_statement: incomeStatement.totals,
           closing_entries: closingEntries,
           opening_balances: openingBalances
         }
       });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error closing period:', error);
      res.status(500).json({ error: 'Failed to close period' });
    } finally {
      connection.release();
    }
  }

       // Helper method to generate trial balance
  static async generateTrialBalanceForPeriod(connection, period) {
    const query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END), 0) as total_credit
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND je.entry_date BETWEEN ? AND ?
        AND je.description NOT LIKE '%Opening Balances B/D%'
        AND je.description NOT LIKE '%Close % to Income Summary%'
        AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      WHERE coa.is_active = 1
      GROUP BY coa.id, coa.code, coa.name, coa.type
      HAVING total_debit > 0 OR total_credit > 0
    `;
   
   const [trialBalance] = await connection.execute(query, [period.start_date, period.end_date]);
   
   const totalDebit = trialBalance.reduce((sum, account) => sum + parseFloat(account.total_debit || 0), 0);
   const totalCredit = trialBalance.reduce((sum, account) => sum + parseFloat(account.total_credit || 0), 0);
   
   // Store trial balance in database
   for (const account of trialBalance) {
     const balance = parseFloat(account.total_debit || 0) - parseFloat(account.total_credit || 0);
     const balanceType = balance >= 0 ? 'debit' : 'credit';
     
     await connection.execute(
       `INSERT INTO trial_balance (period_id, account_id, account_code, account_name, account_type, total_debit, total_credit, balance, balance_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        total_debit = VALUES(total_debit), 
        total_credit = VALUES(total_credit), 
        balance = VALUES(balance), 
        balance_type = VALUES(balance_type)`,
       [
         period.id,
         account.account_id,
         account.account_code,
         account.account_name,
         account.account_type,
         account.total_debit,
         account.total_credit,
         Math.abs(balance),
         balanceType
       ]
     );
   }
   
   return {
     trial_balance: trialBalance,
     totals: {
       total_debit: totalDebit,
       total_credit: totalCredit,
       difference: totalDebit - totalCredit
     }
   };
 }

               // Helper method to generate income statement
   static async generateIncomeStatementForPeriod(connection, period) {
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
       WHERE coa.type = 'Revenue' AND coa.is_active = 1
       GROUP BY coa.id, coa.code, coa.name
       ORDER BY coa.code
     `;
    
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
       WHERE coa.type = 'Expense' AND coa.is_active = 1
       GROUP BY coa.id, coa.code, coa.name
       ORDER BY coa.code
     `;
    
    const [revenue] = await connection.execute(revenueQuery, [period.start_date, period.end_date]);
    const [expenses] = await connection.execute(expenseQuery, [period.start_date, period.end_date]);
    
         const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
     const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      revenue: revenue,
      expenses: expenses,
      totals: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: netIncome
      }
    };
  }

  // Helper method to create closing entries
  static async createClosingEntries(connection, period, incomeStatement, userId) {
    const closingEntries = [];
    
    // 1. Close revenue accounts to Income Summary
    for (const revenue of incomeStatement.revenue) {
      if (revenue.amount > 0) {
        const journalEntry = await PeriodClosingController.createJournalEntry(
          connection,
          `Close ${revenue.account_name} to Income Summary`,
          period.end_date,
          userId
        );
        
        // Debit revenue account, Credit Income Summary
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, revenue.account_id, revenue.amount, 0);
        
                 // Find or create Income Summary account
         const [incomeSummary] = await connection.execute(
           'SELECT id FROM chart_of_accounts WHERE name = ? AND type = ?',
           ['Income Summary', 'Equity']
         );
        
        let incomeSummaryId;
        if (incomeSummary.length === 0) {
                     const [result] = await connection.execute(
             'INSERT INTO chart_of_accounts (code, name, type, is_active) VALUES (?, ?, ?, ?)',
             ['3999', 'Income Summary', 'Equity', 1]
           );
          incomeSummaryId = result.insertId;
        } else {
          incomeSummaryId = incomeSummary[0].id;
        }
        
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, incomeSummaryId, 0, revenue.amount);
        
        closingEntries.push({
          type: 'revenue_close',
          journal_entry_id: journalEntry.insertId,
          description: `Close ${revenue.account_name} to Income Summary`
        });
      }
    }
    
    // 2. Close expense accounts to Income Summary
    for (const expense of incomeStatement.expenses) {
      if (expense.amount > 0) {
        const journalEntry = await PeriodClosingController.createJournalEntry(
          connection,
          `Close ${expense.account_name} to Income Summary`,
          period.end_date,
          userId
        );
        
                 // Debit Income Summary, Credit expense account
         const [incomeSummary] = await connection.execute(
           'SELECT id FROM chart_of_accounts WHERE name = ? AND type = ?',
           ['Income Summary', 'Equity']
         );
        
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, incomeSummary[0].id, expense.amount, 0);
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, expense.account_id, 0, expense.amount);
        
        closingEntries.push({
          type: 'expense_close',
          journal_entry_id: journalEntry.insertId,
          description: `Close ${expense.account_name} to Income Summary`
        });
      }
    }
    
    // 3. Close Income Summary to Retained Earnings
    if (incomeStatement.totals.net_income !== 0) {
      const journalEntry = await PeriodClosingController.createJournalEntry(
        connection,
        'Close Income Summary to Retained Earnings',
        period.end_date,
        userId
      );
      
             // Find or create Retained Earnings account
       const [retainedEarnings] = await connection.execute(
         'SELECT id FROM chart_of_accounts WHERE name = ? AND type = ?',
         ['Retained Earnings', 'Equity']
       );
      
      let retainedEarningsId;
      if (retainedEarnings.length === 0) {
                 const [result] = await connection.execute(
           'INSERT INTO chart_of_accounts (code, name, type, is_active) VALUES (?, ?, ?, ?)',
           ['3998', 'Retained Earnings', 'Equity', 1]
         );
        retainedEarningsId = result.insertId;
      } else {
        retainedEarningsId = retainedEarnings[0].id;
      }
      
             const [incomeSummary] = await connection.execute(
         'SELECT id FROM chart_of_accounts WHERE name = ? AND type = ?',
         ['Income Summary', 'Equity']
       );
      
      if (incomeStatement.totals.net_income > 0) {
        // Debit Income Summary, Credit Retained Earnings
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, incomeSummary[0].id, incomeStatement.totals.net_income, 0);
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, retainedEarningsId, 0, incomeStatement.totals.net_income);
      } else {
        // Debit Retained Earnings, Credit Income Summary
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, retainedEarningsId, Math.abs(incomeStatement.totals.net_income), 0);
        await PeriodClosingController.createJournalEntryLine(connection, journalEntry.insertId, incomeSummary[0].id, 0, Math.abs(incomeStatement.totals.net_income));
      }
      
      closingEntries.push({
        type: 'income_summary_close',
        journal_entry_id: journalEntry.insertId,
        description: 'Close Income Summary to Retained Earnings'
      });
    }
    
    // Store closing entries
    for (const entry of closingEntries) {
      await connection.execute(
        'INSERT INTO period_closing_entries (period_id, journal_entry_id, entry_type, description) VALUES (?, ?, ?, ?)',
        [period.id, entry.journal_entry_id, entry.type, entry.description]
      );
    }
    
    return closingEntries;
  }

  // Helper method to create journal entry
  static async createJournalEntry(connection, description, entryDate, userId) {
    const [result] = await connection.execute(
      'INSERT INTO journal_entries (journal_id, description, entry_date, created_by) VALUES (?, ?, ?, ?)',
      [1, description, entryDate, userId] // Using General Journal (id: 1) for closing entries
    );
    return result;
  }

     // Helper method to create journal entry line
   static async createJournalEntryLine(connection, journalEntryId, accountId, debit, credit) {
     await connection.execute(
       'INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
       [journalEntryId, accountId, debit, credit]
     );
   }

       // Helper method to create opening balances for next period
    static async createOpeningBalancesForNextPeriod(connection, currentPeriod, trialBalance, userId) {
      const openingBalances = [];
      
      // Find the next period (create it if it doesn't exist)
      const [nextPeriods] = await connection.execute(
        'SELECT * FROM accounting_periods WHERE start_date > ? ORDER BY start_date ASC LIMIT 1',
        [currentPeriod.end_date]
      );
      
      let nextPeriod;
      if (nextPeriods.length === 0) {
        // Create the next period automatically
        const currentEndDate = new Date(currentPeriod.end_date);
        const nextStartDate = new Date(currentEndDate);
        nextStartDate.setDate(currentEndDate.getDate() + 1);
        
        const nextEndDate = new Date(nextStartDate.getFullYear(), nextStartDate.getMonth() + 1, 0);
        
        // Ensure we get the correct last day of the month for next period
        const nextLastDay = new Date(nextStartDate.getFullYear(), nextStartDate.getMonth() + 1, 0).getDate();
        const nextEndDateCorrected = new Date(nextStartDate.getFullYear(), nextStartDate.getMonth(), nextLastDay);
        
        const nextPeriodName = nextStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Debug the next period creation
        console.log(`Creating next period after ${currentPeriod.period_name}:`);
        console.log(`- Next Start Date: ${nextStartDate.toISOString().split('T')[0]}`);
        console.log(`- Next End Date: ${nextEndDateCorrected.toISOString().split('T')[0]}`);
        console.log(`- Next Period Name: ${nextPeriodName}`);
        
        const [result] = await connection.execute(
          'INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
          [nextPeriodName, 'monthly', nextStartDate.toISOString().split('T')[0], nextEndDateCorrected.toISOString().split('T')[0], 'open']
        );
        
        const [newPeriods] = await connection.execute(
          'SELECT * FROM accounting_periods WHERE id = ?',
          [result.insertId]
        );
        nextPeriod = newPeriods[0];
        console.log(`Created next period: ${nextPeriod.period_name}`);
      } else {
        nextPeriod = nextPeriods[0];
      }
      
      console.log(`Creating opening balances for next period: ${nextPeriod.period_name}`);
     
     // Create opening balance journal entry with special flag to exclude from trial balance
     const journalEntry = await PeriodClosingController.createJournalEntry(
       connection,
       `Opening Balances B/D for ${nextPeriod.period_name}`,
       nextPeriod.start_date,
       userId
     );
     
     // Process each account with a balance
     for (const account of trialBalance.trial_balance) {
       const balance = parseFloat(account.total_debit || 0) - parseFloat(account.total_credit || 0);
       
       if (Math.abs(balance) > 0.01) { // Only create entries for accounts with significant balances
         const balanceType = balance >= 0 ? 'debit' : 'credit';
         const absBalance = Math.abs(balance);
         
         // Create journal entry line for opening balance
         if (balanceType === 'debit') {
           await PeriodClosingController.createJournalEntryLine(
             connection, 
             journalEntry.insertId, 
             account.account_id, 
             absBalance, 
             0
           );
         } else {
           await PeriodClosingController.createJournalEntryLine(
             connection, 
             journalEntry.insertId, 
             account.account_id, 
             0, 
             absBalance
           );
         }
         
         // Store in period_opening_balances table
         await connection.execute(
           `INSERT INTO period_opening_balances (period_id, account_id, opening_balance, balance_type) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            opening_balance = VALUES(opening_balance), 
            balance_type = VALUES(balance_type)`,
           [nextPeriod.id, account.account_id, absBalance, balanceType]
         );
         
         openingBalances.push({
           account_id: account.account_id,
           account_code: account.account_code,
           account_name: account.account_name,
           opening_balance: absBalance,
           balance_type: balanceType,
           journal_entry_id: journalEntry.insertId
         });
         
         console.log(`Created opening balance for ${account.account_name}: ${balanceType} ${absBalance}`);
       }
     }
     
     // Store the opening balance journal entry reference
     const entryType = 'opening_balance';
     console.log('🔍 DEBUG: Trying to insert entry_type:', entryType);
     console.log('🔍 DEBUG: entry_type type:', typeof entryType);
     console.log('🔍 DEBUG: entry_type length:', entryType.length);
     
     await connection.execute(
       'INSERT INTO period_closing_entries (period_id, journal_entry_id, entry_type, description) VALUES (?, ?, ?, ?)',
       [currentPeriod.id, journalEntry.insertId, entryType, `Opening balances for ${nextPeriod.period_name}`]
     );
     
     console.log(`Created ${openingBalances.length} opening balance entries for ${nextPeriod.period_name}`);
     return openingBalances;
   }

     // Get closing entries for a period
   static async getClosingEntries(req, res) {
     try {
       const { periodId } = req.params;
       
              const query = `
          SELECT 
            pce.*,
            je.description as journal_description,
            je.entry_date,
            jel.account_id,
            coa.name as account_name,
            jel.debit,
            jel.credit
          FROM period_closing_entries pce
          JOIN journal_entries je ON pce.journal_entry_id = je.id
          JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
          JOIN chart_of_accounts coa ON jel.account_id = coa.id
          WHERE pce.period_id = ?
          ORDER BY je.entry_date, je.id, jel.id
        `;
       
       const [closingEntries] = await pool.execute(query, [periodId]);
       
       res.json(closingEntries);
     } catch (error) {
       console.error('Error fetching closing entries:', error);
       res.status(500).json({ error: 'Failed to fetch closing entries' });
     }
   }

     // Get opening balances for a period
  static async getOpeningBalances(req, res) {
    try {
      const { periodId } = req.params;
      
      const query = `
        SELECT 
          pob.*,
          coa.code as account_code,
          coa.name as account_name,
          coa.type as account_type
        FROM period_opening_balances pob
        JOIN chart_of_accounts coa ON pob.account_id = coa.id
        WHERE pob.period_id = ?
        ORDER BY coa.code
      `;
      
      const [openingBalances] = await pool.execute(query, [periodId]);
      
      res.json(openingBalances);
    } catch (error) {
      console.error('Error fetching opening balances:', error);
      res.status(500).json({ error: 'Failed to fetch opening balances' });
    }
  }

  // Get or create period by month and year
  static async getOrCreatePeriod(req, res) {
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
      // Get the last day of the month by going to the first day of next month and subtracting 1 day
      const endDate = new Date(yearNum, monthNum, 0);
      
      // Ensure we get the correct last day of the month
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDateCorrected = new Date(yearNum, monthNum - 1, lastDay);
      
      const periodName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Debug the date calculation
      console.log(`Creating period for ${monthNum}/${yearNum}:`);
      console.log(`- Start Date: ${startDate.toISOString().split('T')[0]}`);
      console.log(`- End Date: ${endDateCorrected.toISOString().split('T')[0]}`);
      console.log(`- Period Name: ${periodName}`);
      
      // Check if period already exists
      let [existingPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE start_date = ? AND end_date = ?',
        [startDate.toISOString().split('T')[0], endDateCorrected.toISOString().split('T')[0]]
      );
      
      let period;
      if (existingPeriods.length > 0) {
        period = existingPeriods[0];
      } else {
        // Create new period
        const [result] = await pool.execute(
          'INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
          [periodName, 'monthly', startDate.toISOString().split('T')[0], endDateCorrected.toISOString().split('T')[0], 'open']
        );
        
        [existingPeriods] = await pool.execute(
          'SELECT * FROM accounting_periods WHERE id = ?',
          [result.insertId]
        );
        period = existingPeriods[0];
      }
      
      res.json({
        period: period,
        message: existingPeriods.length > 0 ? 'Period found' : 'Period created'
      });
      
    } catch (error) {
      console.error('Error getting or creating period:', error);
      res.status(500).json({ error: 'Failed to get or create period' });
    }
  }

  // Get trial balance for a period by month and year
  static async getTrialBalanceByMonthYear(req, res) {
    try {
      const { month, year } = req.params;
      
      // Get or create the period
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
      // Get the last day of the month by going to the first day of next month and subtracting 1 day
      const endDate = new Date(yearNum, monthNum, 0);
      
      // Ensure we get the correct last day of the month
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDateCorrected = new Date(yearNum, monthNum - 1, lastDay);
      
      const periodName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Debug the date calculation
      console.log(`Creating period for ${monthNum}/${yearNum}:`);
      console.log(`- Start Date: ${startDate.toISOString().split('T')[0]}`);
      console.log(`- End Date: ${endDateCorrected.toISOString().split('T')[0]}`);
      console.log(`- Period Name: ${periodName}`);
      
      // Check if period exists
      let [existingPeriods] = await pool.execute(
        'SELECT * FROM accounting_periods WHERE start_date = ? AND end_date = ?',
        [startDate.toISOString().split('T')[0], endDateCorrected.toISOString().split('T')[0]]
      );
      
      let period;
      if (existingPeriods.length > 0) {
        period = existingPeriods[0];
      } else {
        // Create new period
        const [result] = await pool.execute(
          'INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
          [periodName, 'monthly', startDate.toISOString().split('T')[0], endDateCorrected.toISOString().split('T')[0], 'open']
        );
        
        [existingPeriods] = await pool.execute(
          'SELECT * FROM accounting_periods WHERE id = ?',
          [result.insertId]
        );
        period = existingPeriods[0];
      }
      
      // Now get the trial balance for this period
      req.params.periodId = period.id;
      return PeriodClosingController.getTrialBalance(req, res);
      
    } catch (error) {
      console.error('Error getting trial balance by month/year:', error);
      res.status(500).json({ error: 'Failed to get trial balance' });
    }
  }
}

module.exports = PeriodClosingController;
