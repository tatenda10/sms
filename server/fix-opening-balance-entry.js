const { pool } = require('./config/database');
const AccountBalanceService = require('./services/accountBalanceService');

async function fixOpeningBalanceEntry() {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    console.log('🔍 Finding opening balance entries...\n');
    
    // Find all opening balance journal entries
    const [openingBalanceEntries] = await conn.execute(`
      SELECT 
        je.id as journal_entry_id,
        je.entry_date,
        je.description,
        je.reference
      FROM journal_entries je
      WHERE je.description LIKE 'Opening Balance:%'
      ORDER BY je.id
    `);
    
    if (openingBalanceEntries.length === 0) {
      console.log('✅ No opening balance entries found. Nothing to fix.');
      await conn.rollback();
      return;
    }
    
    console.log(`Found ${openingBalanceEntries.length} opening balance entry(ies):\n`);
    
    for (const entry of openingBalanceEntries) {
      console.log(`\n📋 Processing Journal Entry #${entry.journal_entry_id}`);
      console.log(`   Date: ${entry.entry_date}`);
      console.log(`   Description: ${entry.description}`);
      console.log(`   Reference: ${entry.reference}`);
      
      // Get the journal entry lines
      const [lines] = await conn.execute(`
        SELECT 
          jel.id,
          jel.account_id,
          jel.debit,
          jel.credit,
          jel.currency_id,
          jel.description,
          coa.code,
          coa.name,
          coa.type
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE jel.journal_entry_id = ?
        ORDER BY jel.debit DESC
      `, [entry.journal_entry_id]);
      
      console.log('\n   Current Journal Lines:');
      lines.forEach(line => {
        if (line.debit > 0) {
          console.log(`   DEBIT:  ${line.code} - ${line.name} (${line.type}) = $${line.debit}`);
        } else {
          console.log(`   CREDIT: ${line.code} - ${line.name} (${line.type}) = $${line.credit}`);
        }
      });
      
      // Check if this entry has an expense account (needs fixing)
      const expenseLine = lines.find(line => line.type === 'Expense' && line.debit > 0);
      const payableLine = lines.find(line => line.code === '2000' && line.credit > 0);
      
      if (expenseLine && payableLine) {
        console.log('\n   ❌ INCORRECT ENTRY FOUND! This debits an expense account.');
        console.log('   🔧 Fixing...');
        
        const amount = expenseLine.debit;
        const currency_id = expenseLine.currency_id;
        
        // Get Retained Earnings account
        const [[retainedEarnings]] = await conn.execute(
          `SELECT id, code, name FROM chart_of_accounts WHERE code = '3998' LIMIT 1`
        );
        
        if (!retainedEarnings) {
          console.log('   ⚠️  ERROR: Retained Earnings account (3998) not found!');
          continue;
        }
        
        // Delete the incorrect expense line
        await conn.execute(`DELETE FROM journal_entry_lines WHERE id = ?`, [expenseLine.id]);
        console.log(`   ✓ Deleted incorrect expense line (${expenseLine.code} - ${expenseLine.name})`);
        
        // Insert the correct Retained Earnings line
        await conn.execute(`
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id, description)
          VALUES (?, ?, ?, 0, ?, ?)
        `, [
          entry.journal_entry_id,
          retainedEarnings.id,
          amount,
          currency_id,
          expenseLine.description
        ]);
        console.log(`   ✓ Created correct line: DEBIT ${retainedEarnings.code} - ${retainedEarnings.name} = $${amount}`);
        
        console.log('\n   ✅ Entry fixed!');
        console.log('   New correct entry:');
        console.log(`      DEBIT:  ${retainedEarnings.code} - ${retainedEarnings.name} (Equity) = $${amount}`);
        console.log(`      CREDIT: ${payableLine.code} - ${payableLine.name} (Liability) = $${amount}`);
        
      } else if (lines.find(line => line.code === '3998' && line.debit > 0)) {
        console.log('\n   ✅ This entry is already correct (uses Retained Earnings)');
      } else {
        console.log('\n   ⚠️  Unrecognized entry format, skipping...');
      }
    }
    
    // Recalculate all account balances
    console.log('\n\n🔄 Recalculating all account balances...');
    await AccountBalanceService.recalculateAllAccountBalances();
    console.log('✅ Account balances recalculated!\n');
    
    await conn.commit();
    
    console.log('\n✨ All opening balance entries have been corrected!');
    console.log('📊 Your Balance Sheet should now balance correctly.\n');
    
  } catch (error) {
    await conn.rollback();
    console.error('\n❌ Error fixing opening balance entries:', error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

// Run the fix
fixOpeningBalanceEntry();

