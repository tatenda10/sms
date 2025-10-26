const { pool } = require('./config/database');
const AccountBalanceService = require('./services/accountBalanceService');

async function fixBoardingPaymentEntry() {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    console.log('🔧 Fixing Boarding Payment Journal Entry #27...\n');
    
    // Get the current entry
    const [lines] = await conn.execute(`
      SELECT 
        jel.id as line_id,
        jel.journal_entry_id,
        coa.code,
        coa.name,
        jel.debit,
        jel.credit
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.id
      WHERE jel.journal_entry_id = 27
      ORDER BY jel.debit DESC
    `);
    
    console.log('Current Entry #27:');
    console.table(lines);
    
    // Find the revenue line that should be Accounts Receivable
    const revenueLine = lines.find(l => l.code === '4040' && parseFloat(l.credit) > 0);
    
    if (!revenueLine) {
      console.log('✅ Entry already correct or not found');
      await conn.rollback();
      return;
    }
    
    console.log('\n❌ Found incorrect revenue line, fixing...');
    
    // Get Accounts Receivable account ID
    const [[arAccount]] = await conn.execute(
      `SELECT id FROM chart_of_accounts WHERE code = '1100' LIMIT 1`
    );
    
    if (!arAccount) {
      throw new Error('Accounts Receivable account not found');
    }
    
    // Update the credit line to use Accounts Receivable instead of Revenue
    await conn.execute(
      `UPDATE journal_entry_lines 
       SET account_id = ?, 
           description = 'Reduce receivable for payment - Marny Todd (R03819Q)'
       WHERE id = ?`,
      [arAccount.id, revenueLine.line_id]
    );
    
    console.log('✅ Updated journal entry line to use Accounts Receivable');
    
    // Recalculate all account balances
    console.log('\n🔄 Recalculating all account balances...');
    await AccountBalanceService.recalculateAllAccountBalances();
    console.log('✅ Account balances recalculated');
    
    await conn.commit();
    
    // Show updated results
    console.log('\n📊 Checking updated balances...\n');
    
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
      WHERE coa.type IN ('Asset', 'Liability', 'Equity')
        AND COALESCE(ab.balance, 0) != 0
      ORDER BY coa.type, coa.code
    `);
    
    console.log('Updated Account Balances:');
    console.table(balances);
    
    const assets = balances.filter(b => b.type === 'Asset').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    const liabilities = balances.filter(b => b.type === 'Liability').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    const equity = balances.filter(b => b.type === 'Equity').reduce((sum, b) => sum + parseFloat(b.balance), 0);
    
    console.log('\n📈 Balance Sheet Check:');
    console.log(`Assets:              $${assets.toFixed(2)}`);
    console.log(`Liabilities:         $${Math.abs(liabilities).toFixed(2)} (shown as positive)`);
    console.log(`Equity:              $${equity.toFixed(2)}`);
    console.log(`\nAccounting Equation:`);
    console.log(`Assets ($${assets.toFixed(2)}) = Liabilities ($${Math.abs(liabilities).toFixed(2)}) + Equity ($${equity.toFixed(2)})`);
    console.log(`$${assets.toFixed(2)} = $${(Math.abs(liabilities) + equity).toFixed(2)}`);
    
    const difference = assets - (Math.abs(liabilities) + equity);
    if (Math.abs(difference) < 0.01) {
      console.log('\n✅✅✅ Balance Sheet NOW BALANCES! ✅✅✅');
    } else {
      console.log(`\n⚠️  Balance Sheet does NOT balance. Difference: $${difference.toFixed(2)}`);
    }
    
  } catch (error) {
    await conn.rollback();
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    conn.release();
    await pool.end();
  }
}

fixBoardingPaymentEntry();

