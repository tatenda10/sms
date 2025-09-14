const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running migration to add fee_type column to fee_payments table...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_fee_type_to_fee_payments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(migrationSQL);
      console.log('Migration completed successfully!');
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
