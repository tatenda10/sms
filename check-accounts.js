const { pool } = require('./config/database');

async function checkAccounts() {
  try {
    console.log('Starting account check...');
    
    // Test basic connection
    console.log('Testing database connection...');
    const [testResult] = await pool.execute('SELECT 1 as test');
    console.log('Database connection test:', testResult);
    
    const [rows] = await pool.execute('SELECT id, code, name, type FROM chart_of_accounts WHERE id = 83 OR code = "1000"');
    console.log('Account 83:', rows.find(r => r.id === 83));
    console.log('Cash account:', rows.find(r => r.code === '1000'));
    
    // Check what account 116 is
    const [account116] = await pool.execute('SELECT id, code, name, type FROM chart_of_accounts WHERE id = 116');
    console.log('Account 116:', account116[0]);
    
    // Check if journal_entry_lines table exists
    console.log('\nChecking journal_entry_lines table...');
    try {
      const [tables] = await pool.execute("SHOW TABLES LIKE 'journal_entry_lines'");
      console.log('journal_entry_lines table exists:', tables.length > 0);
      
      if (tables.length > 0) {
        const [journalCount] = await pool.execute('SELECT COUNT(*) as count FROM journal_entry_lines');
        console.log('Total journal entries:', journalCount[0].count);
        
        if (journalCount[0].count > 0) {
          // Show complete journal entry 3
          console.log('\n=== Complete Journal Entry 3 ===');
          const [completeEntry] = await pool.execute(`
            SELECT jel.journal_entry_id, jel.account_id, jel.debit, jel.credit, jel.description,
                   coa.code as account_code, coa.name as account_name
            FROM journal_entry_lines jel
            LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
            WHERE jel.journal_entry_id = 3
            ORDER BY jel.debit DESC, jel.credit DESC
          `);
          
          completeEntry.forEach((row, index) => {
            console.log(`${index + 1}. Account: ${row.account_code} - ${row.account_name}, Debit: ${row.debit}, Credit: ${row.credit}`);
          });
        }
      }
    } catch (error) {
      console.log('Error checking journal_entry_lines:', error.message);
    }
    
    console.log('Script completed successfully');
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

checkAccounts();
