const express = require('express');
const router = express.Router();
const employeeAttendanceController = require('../../controllers/attendance/employeeAttendanceController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication middleware to all routes
router.use(authenticateEmployeeToken);

// Mark attendance for a class
router.post('/mark', employeeAttendanceController.markAttendance);

// Get attendance for a class on specific date
router.get('/class/:classId/date/:date', employeeAttendanceController.getClassAttendance);

// Get attendance history for a class
router.get('/class/:classId/history', employeeAttendanceController.getClassAttendanceHistory);

// Get attendance statistics for a class
router.get('/class/:classId/stats', employeeAttendanceController.getAttendanceStats);

// Update attendance record
router.put('/record/:recordId', employeeAttendanceController.updateAttendanceRecord);

// Get student attendance history
router.get('/student/:studentId/history', employeeAttendanceController.getStudentAttendanceHistory);

module.exports = router;
