const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    console.log('🔧 Fixing Accounts Payable Payments Table...\n');
    
    connection = await pool.getConnection();
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'migrations', 'fix_payable_payments_nullable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Remove comments and split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📄 Executing migration...\n`);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        try {
          const [result] = await connection.execute(statement);
          
          if (statement.toUpperCase().includes('ALTER TABLE')) {
            console.log('✅ Successfully modified accounts_payable_payments table');
          } else if (statement.toUpperCase().includes('SELECT')) {
            console.log('\n📊 Verification:');
            console.log('Column Name\t\tNullable\tType');
            console.log('─'.repeat(60));
            result.forEach(row => {
              console.log(`${row.COLUMN_NAME}\t\t${row.IS_NULLABLE}\t\t${row.COLUMN_TYPE}`);
            });
          }
        } catch (err) {
          console.error(`⚠️  Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 You can now:');
    console.log('   • Make payments on opening balance payables');
    console.log('   • The original_expense_id will be NULL for opening balances');
    console.log('   • Regular expense payments will still record the expense_id\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

runMigration();

