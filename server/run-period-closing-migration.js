const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running period closing tables migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'period_closing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const connection = await pool.getConnection();
    
    try {
      // Split the SQL by semicolons and execute each statement separately
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          await connection.execute(statement);
        }
      }
      
      console.log('Period closing tables migration completed successfully!');
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
