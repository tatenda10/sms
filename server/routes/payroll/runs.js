const express = require('express');
const router = express.Router();
const PayrollRunController = require('../../controllers/payroll/payrollRunController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Run payroll for a period
router.post('/run', PayrollRunController.runPayroll);

// Get all payroll runs
router.get('/', PayrollRunController.getPayrollRuns);

// Get payroll run details
router.get('/:id', PayrollRunController.getPayrollRunDetails);

module.exports = router;
