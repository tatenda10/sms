const { pool } = require('./config/database');

async function testAttendanceDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 Testing attendance database structure...');
    
    // Test 1: Check if attendance_records table exists
    console.log('\n1️⃣ Checking attendance_records table...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'attendance_records'"
    );
    console.log('✅ attendance_records table exists:', tables.length > 0);
    
    // Test 2: Check gradelevel_classes structure
    console.log('\n2️⃣ Checking gradelevel_classes structure...');
    const [columns] = await connection.execute(
      "DESCRIBE gradelevel_classes"
    );
    const hasHomeroomTeacher = columns.some(col => col.Field === 'homeroom_teacher_employee_number');
    console.log('✅ Has homeroom_teacher_employee_number column:', hasHomeroomTeacher);
    
    // Test 3: Check employees structure
    console.log('\n3️⃣ Checking employees structure...');
    const [empColumns] = await connection.execute(
      "DESCRIBE employees"
    );
    const hasEmployeeId = empColumns.some(col => col.Field === 'employee_id');
    console.log('✅ Has employee_id column:', hasEmployeeId);
    
    // Test 4: Check enrollments_gradelevel_classes table
    console.log('\n4️⃣ Checking enrollments_gradelevel_classes table...');
    const [enrollTables] = await connection.execute(
      "SHOW TABLES LIKE 'enrollments_gradelevel_classes'"
    );
    console.log('✅ enrollments_gradelevel_classes table exists:', enrollTables.length > 0);
    
    // Test 5: Test the relationship query
    console.log('\n5️⃣ Testing relationship query...');
    const [testQuery] = await connection.execute(`
      SELECT gc.id, gc.name, e.full_name as teacher_name
      FROM gradelevel_classes gc
      LEFT JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
      LIMIT 3
    `);
    console.log('✅ Relationship query works. Sample data:');
    testQuery.forEach(row => {
      console.log(`   - Class ${row.id}: ${row.name} (Teacher: ${row.teacher_name || 'None'})`);
    });
    
    console.log('\n🎉 Database structure test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    connection.release();
  }
}

testAttendanceDatabase();
