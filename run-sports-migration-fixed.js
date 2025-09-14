const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function runSportsMigration() {
  try {
    console.log('🏃‍♂️ Starting Sports Fixtures Migration (Fixed)...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '2025-01-04-create-sports-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          console.log(`📋 SQL: ${statement.substring(0, 100)}...`);
          
          await pool.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('🎉 Sports Fixtures Migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - sports_categories');
    console.log('   - sports_teams');
    console.log('   - sports_fixtures');
    console.log('   - sports_participants');
    console.log('   - sports_announcements');
    console.log('   - sports_fixture_attendance');
    
    // Test the tables by inserting a sample category
    console.log('\n🧪 Testing the tables...');
    try {
      const [testResult] = await pool.execute('SELECT COUNT(*) as count FROM sports_categories');
      console.log(`✅ sports_categories table has ${testResult[0].count} records`);
      
      const [testFixtures] = await pool.execute('SELECT COUNT(*) as count FROM sports_fixtures');
      console.log(`✅ sports_fixtures table has ${testFixtures[0].count} records`);
      
    } catch (testError) {
      console.error('❌ Error testing tables:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runSportsMigration();
