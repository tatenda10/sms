const express = require('express');
const router = express.Router();
const EmployeeClassController = require('../../controllers/employees/employeeClassController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication middleware to all routes
router.use(authenticateEmployeeToken);

// Get all classes assigned to an employee
router.get('/:employeeId', EmployeeClassController.getEmployeeClasses);

module.exports = router;
