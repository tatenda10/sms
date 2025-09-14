const { pool } = require('./config/database');

async function testTransportFees() {
  try {
    console.log('🔍 Testing transport fees data...');
    
    // Check if transport_fees table has data
    const [fees] = await pool.execute('SELECT * FROM transport_fees LIMIT 5');
    console.log('📊 Transport fees found:', fees.length);
    if (fees.length > 0) {
      console.log('📋 Sample fee:', fees[0]);
    }
    
    // Check if student_transport_registrations table has data
    const [registrations] = await pool.execute('SELECT * FROM student_transport_registrations LIMIT 5');
    console.log('📊 Student registrations found:', registrations.length);
    if (registrations.length > 0) {
      console.log('📋 Sample registration:', registrations[0]);
    }
    
    // Test the actual query that's failing
    const [testFees] = await pool.execute(`
      SELECT 
        tf.*,
        CONCAT(s.Name, ' ', s.Surname) as student_name,
        s.RegNumber as student_number,
        str.student_reg_number,
        tr.route_name,
        tr.route_code,
        str.pickup_point,
        str.dropoff_point
      FROM transport_fees tf
      JOIN student_transport_registrations str ON tf.student_registration_id = str.id
      JOIN students s ON str.student_reg_number = s.RegNumber
      JOIN transport_routes tr ON str.route_id = tr.id
      LIMIT 5
    `);
    
    console.log('🔍 Test query result:', testFees.length, 'fees found');
    if (testFees.length > 0) {
      console.log('📋 Sample test fee:', testFees[0]);
      console.log('🔍 student_reg_number field:', testFees[0].student_reg_number);
    }
    
  } catch (error) {
    console.error('❌ Error testing transport fees:', error);
  } finally {
    await pool.end();
  }
}

testTransportFees();
