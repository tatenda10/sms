const express = require('express');
const request = require('supertest');

// Import the student attendance routes
const studentAttendanceRoutes = require('./routes/students/studentAttendance');

const app = express();
app.use(express.json());
app.use('/api/student-attendance', studentAttendanceRoutes);

async function testStudentAttendanceAPI() {
  console.log('🧪 Testing student attendance API endpoints...');
  
  try {
    // Test 1: Check if routes are properly registered
    console.log('\n1️⃣ Testing route registration...');
    const routes = app._router.stack
      .filter(layer => layer.route)
      .map(layer => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));
    
    console.log('📋 Registered routes:');
    routes.forEach(route => {
      console.log(`   ${route.methods.join(', ').toUpperCase()} ${route.path}`);
    });

    // Test 2: Test without authentication (should fail)
    console.log('\n2️⃣ Testing without authentication...');
    const response = await request(app)
      .get('/api/student-attendance/history/TEST123');
    
    console.log('Status:', response.status);
    console.log('Response:', response.body);

    console.log('\n🎉 Student attendance API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentAttendanceAPI();
