const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function runBankReconciliationMigration() {
  try {
    console.log('🔄 Running Bank Reconciliation Migration...');
    
    // Read the SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'bank_reconciliation_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await pool.execute(statement);
      }
    }
    
    console.log('✅ Bank Reconciliation Migration completed successfully!');
    
    // Verify tables were created
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('bank_reconciliations', 'bank_statement_items', 'book_transactions', 'reconciliation_matches')
    `);
    
    console.log('📋 Created tables:', tables.map(t => t.TABLE_NAME));
    
    // Check if sample data was inserted
    const [reconciliations] = await pool.execute('SELECT COUNT(*) as count FROM bank_reconciliations');
    console.log(`📊 Sample reconciliations: ${reconciliations[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runBankReconciliationMigration();
