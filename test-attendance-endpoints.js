const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';

// Test data
const testData = {
  employee: {
    username: 'teacher1', // Replace with actual test employee credentials
    password: 'password123'
  },
  admin: {
    username: 'admin', // Replace with actual test admin credentials
    password: 'admin123'
  },
  classId: 1, // Replace with actual class ID
  studentId: 'STU001', // Replace with actual student ID
  date: new Date().toISOString().split('T')[0] // Today's date
};

let employeeToken = '';
let adminToken = '';

async function loginEmployee() {
  try {
    console.log('🔐 Logging in as employee...');
    const response = await axios.post(`${BASE_URL}/employee-auth/login`, testData.employee);
    employeeToken = response.data.token;
    console.log('✅ Employee login successful');
  } catch (error) {
    console.error('❌ Employee login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testData.admin);
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testEmployeeEndpoints() {
  console.log('\n🧪 Testing Employee Attendance Endpoints...');
  
  const headers = {
    'Authorization': `Bearer ${employeeToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Mark attendance
    console.log('\n1️⃣ Testing mark attendance...');
    const markAttendanceData = {
      class_id: testData.classId,
      date: testData.date,
      records: [
        { student_id: testData.studentId, status: 'present', notes: 'On time' },
        { student_id: 'STU002', status: 'absent', notes: 'Sick leave' }
      ]
    };

    const markResponse = await axios.post(`${BASE_URL}/employee-attendance/mark`, markAttendanceData, { headers });
    console.log('✅ Mark attendance successful:', markResponse.data);

    // Test 2: Get class attendance
    console.log('\n2️⃣ Testing get class attendance...');
    const getAttendanceResponse = await axios.get(
      `${BASE_URL}/employee-attendance/class/${testData.classId}/date/${testData.date}`,
      { headers }
    );
    console.log('✅ Get class attendance successful:', getAttendanceResponse.data);

    // Test 3: Get attendance stats
    console.log('\n3️⃣ Testing get attendance stats...');
    const statsResponse = await axios.get(
      `${BASE_URL}/employee-attendance/class/${testData.classId}/stats`,
      { headers }
    );
    console.log('✅ Get attendance stats successful:', statsResponse.data);

    // Test 4: Get attendance history
    console.log('\n4️⃣ Testing get attendance history...');
    const historyResponse = await axios.get(
      `${BASE_URL}/employee-attendance/class/${testData.classId}/history`,
      { headers }
    );
    console.log('✅ Get attendance history successful:', historyResponse.data);

  } catch (error) {
    console.error('❌ Employee endpoint test failed:', error.response?.data || error.message);
  }
}

async function testAdminEndpoints() {
  console.log('\n🧪 Testing Admin Attendance Endpoints...');
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get all attendance records
    console.log('\n1️⃣ Testing get all attendance records...');
    const recordsResponse = await axios.get(`${BASE_URL}/attendance/records`, { headers });
    console.log('✅ Get all records successful:', recordsResponse.data);

    // Test 2: Get attendance stats
    console.log('\n2️⃣ Testing get attendance stats...');
    const statsResponse = await axios.get(`${BASE_URL}/attendance/stats`, { headers });
    console.log('✅ Get attendance stats successful:', statsResponse.data);

    // Test 3: Generate attendance report
    console.log('\n3️⃣ Testing generate attendance report...');
    const reportResponse = await axios.get(
      `${BASE_URL}/attendance/reports?start_date=2024-01-01&end_date=2024-01-31&group_by=date`,
      { headers }
    );
    console.log('✅ Generate report successful:', reportResponse.data);

    // Test 4: Get attendance settings
    console.log('\n4️⃣ Testing get attendance settings...');
    const settingsResponse = await axios.get(
      `${BASE_URL}/attendance/settings/${testData.classId}`,
      { headers }
    );
    console.log('✅ Get settings successful:', settingsResponse.data);

    // Test 5: Update attendance settings
    console.log('\n5️⃣ Testing update attendance settings...');
    const updateSettingsData = {
      auto_mark_absent_after_hours: 3,
      require_excuse_for_absence: false,
      send_absence_notifications: true
    };

    const updateSettingsResponse = await axios.put(
      `${BASE_URL}/attendance/settings/${testData.classId}`,
      updateSettingsData,
      { headers }
    );
    console.log('✅ Update settings successful:', updateSettingsResponse.data);

  } catch (error) {
    console.error('❌ Admin endpoint test failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Attendance API Tests...\n');
    
    // Login
    await loginEmployee();
    await loginAdmin();
    
    // Test endpoints
    await testEmployeeEndpoints();
    await testAdminEndpoints();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
