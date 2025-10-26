const { pool } = require('./config/database');
const AccountBalanceService = require('./services/accountBalanceService');

async function recalculateAllBalances() {
  try {
    console.log('🔄 Recalculating ALL account balances...\n');
    console.log('This will fix any missing balances including Retained Earnings.\n');
    
    await AccountBalanceService.recalculateAllAccountBalances();
    
    console.log('\n✅ All account balances have been recalculated successfully!');
    console.log('\n📊 Checking results...\n');
    
    // Show all current balances
    const [balances] = await pool.execute(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        COALESCE(ab.balance, 0) as balance,
        ab.as_of_date
      FROM chart_of_accounts coa
      LEFT JOIN (
        SELECT account_id, balance, as_of_date
        FROM account_balances
        WHERE as_of_date = (SELECT MAX(as_of_date) FROM account_balances)
      ) ab ON coa.id = ab.account_id
      WHERE coa.type IN ('Asset', 'Liability', 'Equity')
        AND COALESCE(ab.balance, 0) != 0
      ORDER BY coa.type, coa.code
    `);
    
    console.log('Current Account Balances:');
    console.table(balances);
    
    const assets = balances.filter(b => b.type === 'Asset').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    const liabilities = balances.filter(b => b.type === 'Liability').reduce((sum, b) => sum + Math.abs(parseFloat(b.balance)), 0);
    const equity = balances.filter(b => b.type === 'Equity').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    
    console.log('\n📈 Balance Sheet Check:');
    console.log(`Assets:              $${assets.toFixed(2)}`);
    console.log(`Liabilities:         $${liabilities.toFixed(2)}`);
    console.log(`Equity:              $${equity.toFixed(2)}`);
    console.log(`Liabilities + Equity: $${(liabilities + equity).toFixed(2)}`);
    
    const difference = assets - (liabilities + equity);
    if (Math.abs(difference) < 0.01) {
      console.log('\n✅ Balance Sheet BALANCES! (Assets = Liabilities + Equity)');
    } else {
      console.log(`\n⚠️  Balance Sheet does NOT balance. Difference: $${difference.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

recalculateAllBalances();

