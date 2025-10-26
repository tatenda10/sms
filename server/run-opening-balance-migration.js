require('dotenv').config();
const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Running Opening Balance Payables Migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_opening_balance_payables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and split by semicolon
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--')) // Remove comment lines
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await conn.execute(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        // Some statements might fail if already executed (e.g., column already exists)
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key')) {
          console.log(`⏭️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('📋 Changes made:');
    console.log('   ✅ original_expense_id is now nullable');
    console.log('   ✅ Added reference_number column');
    console.log('   ✅ Added description column');
    console.log('   ✅ Added is_opening_balance flag');
    console.log('   ✅ Added opening_balance_date column');
    console.log('   ✅ Updated unique constraints');
    console.log('   ✅ Added indexes for performance\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

