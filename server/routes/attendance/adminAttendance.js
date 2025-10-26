const express = require('express');
const router = express.Router();
const adminAttendanceController = require('../../controllers/attendance/adminAttendanceController');
const { authenticateToken } = require('../../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(authenticateToken);

// Get all attendance records with filters
router.get('/records', adminAttendanceController.getAllAttendanceRecords);

// Get attendance statistics dashboard
router.get('/stats', adminAttendanceController.getAttendanceStats);

// Generate attendance reports
router.get('/reports', adminAttendanceController.generateAttendanceReport);

// Get attendance settings for a class
router.get('/settings/:classId', adminAttendanceController.getAttendanceSettings);

// Update attendance settings for a class
router.put('/settings/:classId', adminAttendanceController.updateAttendanceSettings);

module.exports = router;
