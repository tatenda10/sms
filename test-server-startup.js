const express = require('express');

async function testServerStartup() {
  console.log('🧪 Testing server startup with student attendance routes...');
  
  try {
    // Test 1: Check if all required modules can be imported
    console.log('\n1️⃣ Testing module imports...');
    
    try {
      const studentAttendanceController = require('./controllers/students/studentAttendanceController');
      console.log('✅ Student attendance controller imported');
    } catch (error) {
      console.log('❌ Error importing controller:', error.message);
    }

    try {
      const studentAttendanceRoutes = require('./routes/students/studentAttendance');
      console.log('✅ Student attendance routes imported');
    } catch (error) {
      console.log('❌ Error importing routes:', error.message);
    }

    try {
      const { authenticateStudentToken } = require('./middleware/studentAuth');
      console.log('✅ Student auth middleware imported');
    } catch (error) {
      console.log('❌ Error importing middleware:', error.message);
    }

    // Test 2: Test route registration
    console.log('\n2️⃣ Testing route registration...');
    const app = express();
    app.use(express.json());
    
    try {
      const studentAttendanceRoutes = require('./routes/students/studentAttendance');
      app.use('/api/student-attendance', studentAttendanceRoutes);
      console.log('✅ Routes registered successfully');
    } catch (error) {
      console.log('❌ Error registering routes:', error.message);
    }

    // Test 3: Check if server can start
    console.log('\n3️⃣ Testing server startup...');
    const PORT = 5001; // Use different port to avoid conflicts
    const server = app.listen(PORT, () => {
      console.log(`✅ Test server started on port ${PORT}`);
      server.close(() => {
        console.log('✅ Test server closed successfully');
      });
    });

    console.log('\n🎉 Server startup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Server startup test failed:', error.message);
  }
}

testServerStartup();
