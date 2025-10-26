const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/students_registrations/studentController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication to all routes
router.use(authenticateEmployeeToken);

// Employee-specific student routes
router.get('/search', studentController.searchStudents);
router.get('/:regNumber', studentController.getStudentByRegNumber);

module.exports = router;
