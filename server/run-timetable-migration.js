const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runTimetableMigration() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🗄️ Database connection established for timetable migration.');

    const migrationFilePath = path.join(__dirname, 'migrations', '2024-01-16-create-timetable-tables.sql');
    const sql = fs.readFileSync(migrationFilePath, 'utf8');

    // Split SQL into individual statements and execute
    const statements = sql.split(';').filter(statement => statement.trim() !== '');

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
        console.log(`✅ Executed: ${statement.substring(0, 70)}...`);
      }
    }

    console.log('🎉 Timetable tables migration completed successfully.');
    console.log('📋 Created tables:');
    console.log('   - period_templates');
    console.log('   - period_template_days');
    console.log('   - periods');
    console.log('   - timetable_entries');
    console.log('   - timetable_generation_logs');
    console.log('   - timetable_conflicts');
    console.log('📊 Sample data inserted for Term 1 2025 with day-specific periods');
  } catch (error) {
    console.error('❌ Error during timetable migration:', error);
  } finally {
    if (connection) connection.release();
    pool.end(); // Close the pool after migration
  }
}

runTimetableMigration();
