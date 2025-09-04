const { pool } = require('./config/database');

async function debugOpeningBalanceIssue() {
  try {
    console.log('=== DEBUGGING OPENING BALANCE ISSUE ===');
    
    // Check the exact ENUM values
    console.log('1. Checking ENUM values...');
    const [enumValues] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'period_closing_entries' 
      AND COLUMN_NAME = 'entry_type'
    `);
    
    console.log('ENUM values:', enumValues[0]?.COLUMN_TYPE);
    
    // Check if there are any existing records
    console.log('2. Checking existing records...');
    const [existingRecords] = await pool.execute('SELECT COUNT(*) as count FROM period_closing_entries');
    console.log('Existing records:', existingRecords[0].count);
    
    // Try to insert a test record
    console.log('3. Testing insertion...');
    try {
      await pool.execute(
        'INSERT INTO period_closing_entries (period_id, journal_entry_id, entry_type, description) VALUES (?, ?, ?, ?)',
        [1, 1, 'opening_balance', 'Test opening balance entry']
      );
      console.log('✅ Test insertion successful!');
      
      // Clean up the test record
      await pool.execute('DELETE FROM period_closing_entries WHERE description = ?', ['Test opening balance entry']);
      console.log('✅ Test record cleaned up');
      
    } catch (insertError) {
      console.log('❌ Test insertion failed:', insertError.message);
      console.log('Error code:', insertError.code);
      console.log('Error SQL state:', insertError.sqlState);
    }
    
    // Check if there are any periods and journal entries
    console.log('4. Checking periods and journal entries...');
    const [periods] = await pool.execute('SELECT COUNT(*) as count FROM accounting_periods');
    const [journalEntries] = await pool.execute('SELECT COUNT(*) as count FROM journal_entries');
    
    console.log('Periods available:', periods[0].count);
    console.log('Journal entries available:', journalEntries[0].count);
    
    console.log('🎯 Debug complete!');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    pool.end();
  }
}

// Run the debug
debugOpeningBalanceIssue();
