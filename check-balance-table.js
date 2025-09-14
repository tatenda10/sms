const { pool } = require('./config/database');

async function checkBalanceTable() {
  try {
    const connection = await pool.getConnection();
    
    // Check if student_balances table exists and what columns it has
    console.log('🔍 Checking student_balances table structure...');
    
    const [columns] = await connection.execute('DESCRIBE student_balances');
    console.log('📊 student_balances table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // Check if there are any records
    const [records] = await connection.execute('SELECT COUNT(*) as count FROM student_balances');
    console.log(`📊 Total records in student_balances: ${records[0].count}`);
    
    // Check a few sample records
    const [samples] = await connection.execute('SELECT * FROM student_balances LIMIT 3');
    console.log('📊 Sample records:');
    samples.forEach((record, index) => {
      console.log(`  Record ${index + 1}:`, record);
    });
    
    connection.release();
  } catch (error) {
    console.error('❌ Error checking student_balances table:', error);
  }
}

checkBalanceTable();
