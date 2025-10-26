const express = require('express');
const router = express.Router();
const PayslipController = require('../../controllers/payroll/payslipController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication middleware to all routes
router.use(authenticateEmployeeToken);

// Get payslips for a specific employee
router.get('/:employeeId', PayslipController.getEmployeePayslips);

module.exports = router;
