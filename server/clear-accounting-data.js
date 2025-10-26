const { pool } = require('./config/database');

async function clearAccountingData() {
  let connection;
  try {
    console.log('🧹 Starting accounting data cleanup...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await pool.getConnection();
    console.log('✅ Connected to database successfully\n');
    
    await connection.beginTransaction();
    
    console.log('🗑️ Step 1: Clearing account balances...');
    await connection.execute('DELETE FROM account_balances');
    console.log('✅ Account balances cleared\n');
    
    console.log('🗑️ Step 2: Clearing journal entry lines...');
    await connection.execute('DELETE FROM journal_entry_lines');
    console.log('✅ Journal entry lines cleared\n');
    
    console.log('🗑️ Step 3: Clearing journal entries...');
    await connection.execute('DELETE FROM journal_entries');
    console.log('✅ Journal entries cleared\n');
    
    console.log('🗑️ Step 4: Clearing student transactions...');
    await connection.execute('DELETE FROM student_transactions');
    console.log('✅ Student transactions cleared\n');
    
    console.log('🗑️ Step 5: Clearing student balances...');
    await connection.execute('DELETE FROM student_balances');
    console.log('✅ Student balances cleared\n');
    
    console.log('🗑️ Step 6: Clearing boarding fee balances...');
    await connection.execute('DELETE FROM boarding_fee_balances');
    console.log('✅ Boarding fee balances cleared\n');
    
    console.log('🗑️ Step 7: Clearing boarding enrollments...');
    await connection.execute('DELETE FROM boarding_enrollments');
    console.log('✅ Boarding enrollments cleared\n');
    
    console.log('🗑️ Step 8: Clearing grade-level enrollments...');
    await connection.execute('DELETE FROM enrollments_gradelevel_classes');
    console.log('✅ Grade-level enrollments cleared\n');
    
    console.log('🗑️ Step 9: Clearing subject enrollments...');
    await connection.execute('DELETE FROM enrollments_subject_classes');
    console.log('✅ Subject enrollments cleared\n');
    
    await connection.commit();
    console.log('✅ All accounting data cleared successfully!');
    console.log('\n📊 Summary of cleared data:');
    console.log('   - Account balances');
    console.log('   - Journal entries and lines');
    console.log('   - Student transactions and balances');
    console.log('   - Boarding enrollments and fee balances');
    console.log('   - Grade-level and subject enrollments');
    console.log('\n🎯 Ready for fresh testing!');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error clearing accounting data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
}

clearAccountingData()
  .then(() => {
    console.log('\n✅ Accounting data cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Accounting data cleanup failed:', error);
    process.exit(1);
  });