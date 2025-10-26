const { pool } = require('./config/database');

async function testStudentAttendance() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 Testing student attendance system...');
    
    // Test 1: Check if student attendance routes load
    console.log('\n1️⃣ Testing route loading...');
    try {
      const studentAttendanceController = require('./controllers/students/studentAttendanceController');
      console.log('✅ Student attendance controller loaded successfully');
    } catch (error) {
      console.log('❌ Error loading controller:', error.message);
    }

    try {
      const studentAttendanceRoutes = require('./routes/students/studentAttendance');
      console.log('✅ Student attendance routes loaded successfully');
    } catch (error) {
      console.log('❌ Error loading routes:', error.message);
    }

    // Test 2: Check if we have any students
    console.log('\n2️⃣ Checking for students...');
    const [students] = await connection.execute('SELECT RegNumber, Name, Surname FROM students LIMIT 3');
    console.log('✅ Found students:', students.length);
    students.forEach(student => {
      console.log(`   - ${student.RegNumber}: ${student.Name} ${student.Surname}`);
    });

    // Test 3: Check if we have any attendance records
    console.log('\n3️⃣ Checking attendance records...');
    const [attendanceRecords] = await connection.execute('SELECT COUNT(*) as count FROM attendance_records');
    console.log('✅ Total attendance records:', attendanceRecords[0].count);

    if (attendanceRecords[0].count > 0) {
      const [sampleRecords] = await connection.execute(`
        SELECT ar.*, s.Name, s.Surname 
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.RegNumber
        LIMIT 3
      `);
      console.log('📋 Sample attendance records:');
      sampleRecords.forEach(record => {
        console.log(`   - ${record.student_id} (${record.Name} ${record.Surname}): ${record.status} on ${record.attendance_date}`);
      });
    }

    // Test 4: Test the query that the controller uses
    console.log('\n4️⃣ Testing attendance query...');
    if (students.length > 0) {
      const testStudentId = students[0].RegNumber;
      const [testQuery] = await connection.execute(`
        SELECT 
          ar.*,
          gc.name as class_name,
          s.name as stream_name,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ar.student_id = ?
        ORDER BY ar.attendance_date DESC
      `, [testStudentId]);
      
      console.log(`✅ Query test for student ${testStudentId}:`, testQuery.length, 'records found');
    }

    console.log('\n🎉 Student attendance system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    connection.release();
  }
}

testStudentAttendance();
