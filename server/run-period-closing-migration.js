const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_management',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'migrations', 'add_period_closing_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📄 Executing migration: add_period_closing_fields.sql\n');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        await connection.execute(statement);
        console.log('✅ Success\n');
      }
    }

    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Database connection closed');
    }
  }
}

runMigration();
