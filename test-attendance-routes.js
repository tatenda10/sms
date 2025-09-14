const express = require('express');
const app = express();

// Test if routes can be loaded without errors
try {
  console.log('🧪 Testing attendance routes...');
  
  // Test employee routes
  const employeeRoutes = require('./routes/attendance/employeeAttendance');
  console.log('✅ Employee attendance routes loaded successfully');
  
  // Test admin routes  
  const adminRoutes = require('./routes/attendance/adminAttendance');
  console.log('✅ Admin attendance routes loaded successfully');
  
  // Test controllers
  const employeeController = require('./controllers/attendance/employeeAttendanceController');
  console.log('✅ Employee attendance controller loaded successfully');
  
  const adminController = require('./controllers/attendance/adminAttendanceController');
  console.log('✅ Admin attendance controller loaded successfully');
  
  console.log('🎉 All attendance components loaded successfully!');
  console.log('\n📋 Available Employee Endpoints:');
  console.log('  POST /api/employee-attendance/mark');
  console.log('  GET  /api/employee-attendance/class/:classId/date/:date');
  console.log('  GET  /api/employee-attendance/class/:classId/history');
  console.log('  GET  /api/employee-attendance/class/:classId/stats');
  console.log('  PUT  /api/employee-attendance/record/:recordId');
  console.log('  GET  /api/employee-attendance/student/:studentId/history');
  
  console.log('\n📋 Available Admin Endpoints:');
  console.log('  GET  /api/attendance/records');
  console.log('  GET  /api/attendance/stats');
  console.log('  GET  /api/attendance/reports');
  console.log('  GET  /api/attendance/settings/:classId');
  console.log('  PUT  /api/attendance/settings/:classId');
  
} catch (error) {
  console.error('❌ Error loading attendance components:', error.message);
  process.exit(1);
}
