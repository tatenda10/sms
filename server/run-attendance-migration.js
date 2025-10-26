const mysql = require('mysql2/promise');
require('dotenv').config();

async function runAttendanceMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_management',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔌 Connected to database');

    // Read migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '2024-01-15-create-attendance-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading migration file...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await connection.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 Attendance migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - attendance_records');
    console.log('   - attendance_settings');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runAttendanceMigration();
