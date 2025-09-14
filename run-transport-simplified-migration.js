const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function runTransportSimplifiedMigration() {
  try {
    console.log('🚌 Starting simplified transport module migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'transport_tables_simplified.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    console.log('🔧 Executing simplified transport tables migration...');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Simplified transport module migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   • transport_routes (simplified)');
    console.log('   • student_transport_registrations (simplified)');
    console.log('   • transport_fees (weekly structure)');
    console.log('   • transport_payments (simplified)');
    console.log('   • transport_schedules (basic)');
    console.log('\n🌱 Sample data inserted for testing');
    console.log('\n🎯 Key Features:');
    console.log('   • Weekly fee structure instead of monthly');
    console.log('   • Simple route management');
    console.log('   • Basic student registration');
    console.log('   • Payment status-based schedules');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTransportSimplifiedMigration();
