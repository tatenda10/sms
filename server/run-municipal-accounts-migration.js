const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    console.log('🏛️  Starting Municipal Expense Accounts Migration...\n');
    
    connection = await pool.getConnection();
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'migrations', 'add_municipal_expense_accounts.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Remove comments and split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
    
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await connection.execute(statement);
          
          // Extract account name from INSERT statement for better logging
          const nameMatch = statement.match(/VALUES \('(\d+)', '([^']+)'/);
          if (nameMatch) {
            console.log(`✅ Added/Updated: ${nameMatch[1]} - ${nameMatch[2]}`);
          }
        } catch (err) {
          // Skip if it's just a SELECT statement or already exists
          if (!statement.toUpperCase().includes('SELECT')) {
            console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
          }
        }
      }
    }
    
    console.log('\n📊 Verifying new accounts...\n');
    
    // Verify the accounts were created
    const [newAccounts] = await connection.execute(`
      SELECT code, name, type, is_active 
      FROM chart_of_accounts 
      WHERE code IN ('5300', '5310', '5320', '5330', '5340', '5350', '5360', '5370', '5380', '5390')
      ORDER BY code ASC
    `);
    
    console.log('Code\tAccount Name');
    console.log('─'.repeat(60));
    newAccounts.forEach(account => {
      console.log(`${account.code}\t${account.name}`);
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log(`✅ Successfully added ${newAccounts.length} expense accounts!\n`);
    
    console.log('💡 You can now use these accounts for:');
    console.log('   • 5300 - City Council rates and municipal taxes');
    console.log('   • 5310 - Property taxes');
    console.log('   • 5320 - Government licenses and permits');
    console.log('   • 5330 - Legal and professional services');
    console.log('   • 5340 - Bank charges and transaction fees');
    console.log('   • And more...\n');
    
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

