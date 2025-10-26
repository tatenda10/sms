const { pool } = require('./config/database');

async function checkAccountBalances() {
  try {
    console.log('Checking account balances...\n');
    
    // Check all account balances
    const [balances] = await pool.execute(`
      SELECT 
        ab.id,
        ab.account_id,
        coa.code,
        coa.name,
        coa.type,
        ab.balance,
        ab.as_of_date
      FROM account_balances ab
      JOIN chart_of_accounts coa ON ab.account_id = coa.id
      WHERE coa.type IN ('Asset', 'Liability', 'Equity')
      ORDER BY ab.as_of_date DESC, coa.type, coa.code
    `);
    
    console.log('All Account Balances:');
    console.table(balances);
    
    console.log('\n\nEquity Accounts Specifically:');
    const equityBalances = balances.filter(b => b.type === 'Equity');
    console.table(equityBalances);
    
    // Check the Retained Earnings account specifically
    const [retainedEarnings] = await pool.execute(`
      SELECT 
        coa.id as account_id,
        coa.code,
        coa.name,
        coa.type,
        ab.balance,
        ab.as_of_date
      FROM chart_of_accounts coa
      LEFT JOIN account_balances ab ON ab.account_id = coa.id
      WHERE coa.code = '3998'
      ORDER BY ab.as_of_date DESC
      LIMIT 1
    `);
    
    console.log('\n\nRetained Earnings (3998) Account:');
    console.table(retainedEarnings);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAccountBalances();

