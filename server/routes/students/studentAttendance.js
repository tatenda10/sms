const express = require('express');
const router = express.Router();
const studentAttendanceController = require('../../controllers/students/studentAttendanceController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Apply authentication middleware to all routes
router.use(authenticateStudentToken);

// Get attendance history for a student
router.get('/history/:studentId', (req, res, next) => {
  console.log('🎯 Student attendance route hit:', req.params);
  next();
}, studentAttendanceController.getStudentAttendanceHistory);

// Get attendance statistics for a student
router.get('/stats/:studentId', studentAttendanceController.getStudentAttendanceStats);

// Get attendance for a specific date
router.get('/date/:studentId/:date', studentAttendanceController.getStudentAttendanceForDate);

module.exports = router;
