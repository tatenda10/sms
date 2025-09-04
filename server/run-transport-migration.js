const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function runTransportMigration() {
  try {
    console.log('🚌 Starting transport module migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'transport_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    
    // Execute the migration
    console.log('🔧 Executing transport tables migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Transport module migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   • transport_routes');
    console.log('   • transport_vehicles');
    console.log('   • route_vehicle_assignments');
    console.log('   • student_transport_registrations');
    console.log('   • transport_fees');
    console.log('   • transport_payments');
    console.log('   • transport_schedules');
    console.log('\n🌱 Sample data inserted for testing');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTransportMigration();
