const { pool } = require('./config/database');

async function testSetup() {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    console.log('Testing basic queries...');
    
    // Test roles query
    const [roles] = await connection.execute('SELECT * FROM roles');
    console.log(`Found ${roles.length} roles:`, roles.map(r => r.name));
    
    // Test users query
    const [users] = await connection.execute('SELECT username FROM users');
    console.log(`Found ${users.length} users:`, users.map(u => u.username));
    
    // Test user_roles query
    const [userRoles] = await connection.execute(`
      SELECT u.username, GROUP_CONCAT(r.name) as roles
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.username
    `);
    console.log('User roles:', userRoles.map(ur => ({ username: ur.username, roles: ur.roles || 'none' })));
    
    // Test audit logs query
    const [auditLogs] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    console.log(`Found ${auditLogs[0].count} audit logs`);
    
    connection.release();
    
    console.log('\n✅ Setup test completed successfully!');
    console.log('\nYou can now start the server with:');
    console.log('  npm run dev');
    console.log('\nDefault admin credentials:');
    console.log('  Username: sysadmin');
    console.log('  Password: admin123');
    console.log('\nMultiple roles are now supported!');
    console.log('Users can have multiple roles simultaneously.');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('\nMake sure you have:');
    console.log('1. Created the database (e.g., sms_system)');
    console.log('2. Run the migrations in the migrations/ folder (including 004_create_user_roles_table.sql)');
    console.log('3. Updated the database credentials in .env file');
    process.exit(1);
  }
}

testSetup();
