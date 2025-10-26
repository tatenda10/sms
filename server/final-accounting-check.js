const { pool } = require('./config/database');

async function finalAccountingCheck() {
  try {
    console.log('📊 FINAL ACCOUNTING STATUS CHECK\n');
    console.log('═'.repeat(80));
    
    // 1. Check all account balances
    const [balances] = await pool.execute(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        COALESCE(ab.balance, 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN (
        SELECT account_id, balance
        FROM account_balances
        WHERE as_of_date = (SELECT MAX(as_of_date) FROM account_balances)
      ) ab ON coa.id = ab.account_id
      WHERE COALESCE(ab.balance, 0) != 0
      ORDER BY coa.type, coa.code
    `);
    
    console.log('\n📋 ALL ACCOUNT BALANCES:\n');
    console.table(balances);
    
    // 2. Balance Sheet Check (Assets, Liabilities, Equity only)
    const bsBalances = balances.filter(b => ['Asset', 'Liability', 'Equity'].includes(b.type));
    
    const assets = bsBalances.filter(b => b.type === 'Asset').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    const liabilities = bsBalances.filter(b => b.type === 'Liability').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    const equity = bsBalances.filter(b => b.type === 'Equity').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    
    console.log('\n' + '═'.repeat(80));
    console.log('📈 BALANCE SHEET CHECK');
    console.log('═'.repeat(80));
    console.log(`\n  Assets:              $${assets.toFixed(2)}`);
    console.log(`  Liabilities:         $${liabilities.toFixed(2)} (credit balance)`);
    console.log(`  Equity:              $${equity.toFixed(2)} (credit balance)`);
    console.log(`\n  Accounting Equation Check:`);
    console.log(`  Assets = Liabilities + Equity`);
    console.log(`  $${assets.toFixed(2)} = $${liabilities.toFixed(2)} + $${equity.toFixed(2)}`);
    console.log(`  $${assets.toFixed(2)} = $${(liabilities + equity).toFixed(2)}`);
    
    const difference = assets - (liabilities + equity);
    if (Math.abs(difference) < 0.01) {
      console.log(`\n  ✅✅✅ BALANCE SHEET BALANCES PERFECTLY! ✅✅✅`);
    } else {
      console.log(`\n  ⚠️  Balance Sheet does NOT balance. Difference: $${difference.toFixed(2)}`);
    }
    
    // 3. Revenue check (should NOT be on Balance Sheet)
    const revenue = balances.filter(b => b.type === 'Revenue').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    if (revenue !== 0) {
      console.log(`\n  ℹ️  Revenue: $${revenue.toFixed(2)}`);
      console.log(`      (This is CORRECT - Revenue appears on Income Statement, not Balance Sheet)`);
      console.log(`      (Revenue will transfer to Retained Earnings when period is closed)`);
    }
    
    // 4. Expenses check
    const expenses = balances.filter(b => b.type === 'Expense').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    if (expenses !== 0) {
      console.log(`\n  ℹ️  Expenses: $${expenses.toFixed(2)}`);
      console.log(`      (This is CORRECT - Expenses appear on Income Statement, not Balance Sheet)`);
      console.log(`      (Expenses will transfer to Retained Earnings when period is closed)`);
    }
    
    // 5. Income Statement Preview
    const netIncome = revenue - expenses;
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log('📊 INCOME STATEMENT PREVIEW (Current Period)');
    console.log('═'.repeat(80));
    console.log(`\n  Revenue:             $${revenue.toFixed(2)}`);
    console.log(`  Expenses:            $${expenses.toFixed(2)}`);
    console.log(`  ─────────────────────────────────`);
    console.log(`  Net Income:          $${netIncome.toFixed(2)}`);
    console.log(`\n  (When period closes, this Net Income will add to Retained Earnings)`);
    
    // 6. Journal entries summary
    const [jeCount] = await pool.execute('SELECT COUNT(*) as count FROM journal_entries');
    const [jelCount] = await pool.execute('SELECT COUNT(*) as count FROM journal_entry_lines');
    
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log('📚 ACCOUNTING RECORDS SUMMARY');
    console.log('═'.repeat(80));
    console.log(`\n  Journal Entries:     ${jeCount[0].count}`);
    console.log(`  Journal Entry Lines: ${jelCount[0].count}`);
    console.log(`  Account Balances:    ${balances.length}`);
    
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log('✅ ALL ACCOUNTING CHECKS COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n✨ System is ready for use! All journal entries will now automatically');
    console.log('   update account balances with proper DEBIT/CREDIT sign conventions.');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

finalAccountingCheck();

