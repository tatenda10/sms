const { pool } = require('./config/database');

async function checkRetainedEarningsJournal() {
  try {
    console.log('Checking Retained Earnings Journal Entries...\n');
    
    // Get Retained Earnings account ID
    const [[account]] = await pool.execute(`
      SELECT id, code, name FROM chart_of_accounts WHERE code = '3998'
    `);
    
    if (!account) {
      console.log('❌ Retained Earnings account not found!');
      return;
    }
    
    console.log(`Found account: ${account.code} - ${account.name} (ID: ${account.id})\n`);
    
    // Get all journal entry lines for Retained Earnings
    const [lines] = await pool.execute(`
      SELECT 
        jel.id,
        jel.journal_entry_id,
        je.entry_date,
        je.description as journal_description,
        jel.debit,
        jel.credit,
        jel.description as line_description
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE jel.account_id = ?
      ORDER BY je.entry_date, jel.id
    `, [account.id]);
    
    console.log('Journal Entry Lines for Retained Earnings:');
    console.table(lines);
    
    if (lines.length === 0) {
      console.log('\n❌ No journal entry lines found for Retained Earnings!');
      console.log('This is why the balance is not showing - no transactions recorded.');
    } else {
      const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
      const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);
      const balance = totalCredit - totalDebit; // For equity, credits increase
      
      console.log(`\nCalculated Balance:`);
      console.log(`Total Debits: $${totalDebit}`);
      console.log(`Total Credits: $${totalCredit}`);
      console.log(`Balance (Credit - Debit): $${balance}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRetainedEarningsJournal();

