const { pool } = require('./config/database');

async function verifyIncomeStatementLogic() {
  const conn = await pool.getConnection();
  
  try {
    console.log('\n🔍 VERIFYING INCOME STATEMENT LOGIC\n');
    console.log('='.repeat(70));
    
    // Test period: Last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`\n📅 Date Range: ${startDateStr} to ${endDateStr}\n`);
    
    // ==========================================
    // CURRENT LOGIC (INCORRECT)
    // ==========================================
    console.log('❌ CURRENT LOGIC (from student_transactions DEBIT):\n');
    
    const currentRevenueQuery = `
      SELECT 
        'INVOICE_REVENUE' as account_id,
        'INV' as account_code,
        'Tuition Revenue (Invoices Generated)' as account_name,
        COALESCE(SUM(st.amount), 0) as amount
      FROM student_transactions st
      WHERE st.transaction_type = 'DEBIT'
        AND st.transaction_date BETWEEN ? AND ?
        AND st.description LIKE '%TUITION INVOICE%'
    `;
    
    const [currentRevenue] = await conn.execute(currentRevenueQuery, [startDateStr, endDateStr]);
    console.log(`   Tuition Revenue (from DEBIT transactions): $${parseFloat(currentRevenue[0].amount || 0).toFixed(2)}`);
    
    // ==========================================
    // CORRECT LOGIC (from journal entries)
    // ==========================================
    console.log('\n✅ CORRECT LOGIC (from journal entries CREDIT to revenue accounts):\n');
    
    const correctRevenueQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(SUM(jel.credit), 0) as amount
      FROM chart_of_accounts coa
      INNER JOIN journal_entry_lines jel ON jel.account_id = coa.id
      INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE coa.type = 'Revenue'
        AND coa.is_active = 1
        AND je.entry_date BETWEEN ? AND ?
        AND jel.credit > 0
        AND je.description NOT LIKE '%Opening Balances B/D%'
        AND je.description NOT LIKE '%Close % to Income Summary%'
        AND je.description NOT LIKE '%Close Income Summary to Retained Earnings%'
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code
    `;
    
    const [correctRevenue] = await conn.execute(correctRevenueQuery, [startDateStr, endDateStr]);
    
    let totalCorrectRevenue = 0;
    console.log('   Revenue Accounts:');
    correctRevenue.forEach(acc => {
      const amount = parseFloat(acc.amount || 0);
      totalCorrectRevenue += amount;
      if (amount > 0) {
        console.log(`     ${acc.account_code} - ${acc.account_name}: $${amount.toFixed(2)}`);
      }
    });
    console.log(`   Total Revenue (correct): $${totalCorrectRevenue.toFixed(2)}`);
    
    // ==========================================
    // VERIFY EXPENSES
    // ==========================================
    console.log('\n💸 EXPENSE CALCULATION:\n');
    
    // Current logic (from expenses table)
    const currentExpenseQuery = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(SUM(jel.debit), 0) as amount
      FROM chart_of_accounts coa
      INNER JOIN journal_entry_lines jel ON jel.account_id = coa.id
      INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
      INNER JOIN expenses e ON e.journal_entry_id = je.id
        AND e.expense_date BETWEEN ? AND ?
      WHERE coa.type = 'Expense' 
        AND coa.is_active = 1
        AND jel.debit > 0
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code
    `;
    
    const [currentExpenses] = await conn.execute(currentExpenseQuery, [startDateStr, endDateStr]);
    let totalCurrentExpenses = 0;
    currentExpenses.forEach(exp => {
      totalCurrentExpenses += parseFloat(exp.amount || 0);
    });
    console.log(`   Expenses (from expenses table): $${totalCurrentExpenses.toFixed(2)}`);
    
    // Correct logic (all expense accounts from journal entries)
    const correctExpenseQuery = `
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
      WHERE coa.type = 'Expense' 
        AND coa.is_active = 1
      GROUP BY coa.id, coa.code, coa.name
      HAVING amount > 0
      ORDER BY coa.code
    `;
    
    const [correctExpenses] = await conn.execute(correctExpenseQuery, [startDateStr, endDateStr]);
    let totalCorrectExpenses = 0;
    console.log('   Expense Accounts:');
    correctExpenses.forEach(exp => {
      const amount = parseFloat(exp.amount || 0);
      totalCorrectExpenses += amount;
      if (amount > 0) {
        console.log(`     ${exp.account_code} - ${exp.account_name}: $${amount.toFixed(2)}`);
      }
    });
    console.log(`   Total Expenses (correct): $${totalCorrectExpenses.toFixed(2)}`);
    
    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 SUMMARY:\n');
    console.log(`   Current Revenue Logic: $${parseFloat(currentRevenue[0].amount || 0).toFixed(2)}`);
    console.log(`   Correct Revenue Logic: $${totalCorrectRevenue.toFixed(2)}`);
    console.log(`   Difference: $${(totalCorrectRevenue - parseFloat(currentRevenue[0].amount || 0)).toFixed(2)}`);
    console.log(`\n   Current Expense Logic: $${totalCurrentExpenses.toFixed(2)}`);
    console.log(`   Correct Expense Logic: $${totalCorrectExpenses.toFixed(2)}`);
    console.log(`   Difference: $${(totalCorrectExpenses - totalCurrentExpenses).toFixed(2)}`);
    console.log(`\n   Net Income (Correct): $${(totalCorrectRevenue - totalCorrectExpenses).toFixed(2)}`);
    
    // ==========================================
    // CHECK FOR MISSING REVENUE SOURCES
    // ==========================================
    console.log('\n\n🔍 CHECKING FOR ADDITIONAL REVENUE SOURCES:\n');
    
    // Check additional fees revenue
    const [additionalFeesRevenue] = await conn.execute(`
      SELECT COALESCE(SUM(jel.credit), 0) as amount
      FROM journal_entry_lines jel
      INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
      INNER JOIN chart_of_accounts coa ON coa.id = jel.account_id
      WHERE coa.code = '4400'
        AND coa.type = 'Revenue'
        AND je.entry_date BETWEEN ? AND ?
        AND jel.credit > 0
    `, [startDateStr, endDateStr]);
    
    console.log(`   Additional Fees Revenue (4400): $${parseFloat(additionalFeesRevenue[0].amount || 0).toFixed(2)}`);
    
    // Check if it's included in correct revenue
    const additionalFeesIncluded = correctRevenue.find(r => r.account_code === '4400');
    if (additionalFeesIncluded) {
      console.log(`   ✅ Additional Fees included in correct revenue calculation`);
    } else {
      console.log(`   ⚠️  Additional Fees NOT included in correct revenue calculation`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

verifyIncomeStatementLogic();

