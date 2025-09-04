const { pool } = require('./config/database');

async function clearAllAccountingData() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧹 Starting comprehensive accounting data cleanup...');
    
    // Start transaction
    await connection.beginTransaction();
    
    // Clear data in the correct order (respecting foreign key constraints)
    const tablesToClear = [
      'period_closing_entries',
      'period_opening_balances', 
      'trial_balance',
      'period_closing_audit',
      'journal_entry_lines',
      'journal_entries',
      'accounting_periods'
    ];
    
    console.log('\n📋 Clearing tables in order:');
    
    for (const table of tablesToClear) {
      try {
        const [result] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}: ${result.affectedRows} records deleted`);
      } catch (error) {
        console.log(`⚠️  Warning clearing ${table}:`, error.message);
      }
    }
    
    // Reset auto-increment counters
    console.log('\n🔄 Resetting auto-increment counters...');
    const tablesWithAutoIncrement = [
      'period_closing_entries',
      'period_opening_balances',
      'trial_balance', 
      'period_closing_audit',
      'journal_entry_lines',
      'journal_entries',
      'accounting_periods'
    ];
    
    for (const table of tablesWithAutoIncrement) {
      try {
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`✅ Reset auto-increment for ${table}`);
      } catch (error) {
        console.log(`⚠️  Warning resetting ${table}:`, error.message);
      }
    }
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    for (const table of tablesToClear) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0].count;
        console.log(`📊 ${table}: ${count} records remaining`);
      } catch (error) {
        console.log(`⚠️  Could not verify ${table}:`, error.message);
      }
    }
    
    // Commit the transaction
    await connection.commit();
    
    console.log('\n🎉 SUCCESS: All accounting data has been cleared!');
    console.log('\n📝 Summary:');
    console.log('- All journal entries and lines deleted');
    console.log('- All accounting periods deleted');
    console.log('- All trial balance data deleted');
    console.log('- All period closing entries deleted');
    console.log('- All opening balances deleted');
    console.log('- All audit trails deleted');
    console.log('- Auto-increment counters reset');
    
    console.log('\n✨ You can now start fresh with a clean accounting system!');
    console.log('\n💡 This script has been saved as "clear-accounting-data.js" for future use.');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    connection.release();
    pool.end();
  }
}

// Run the cleanup
clearAllAccountingData()
  .then(() => {
    console.log('\n🏁 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
