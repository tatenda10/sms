const express = require('express');
const router = express.Router();
const PayslipController = require('../../controllers/payroll/payslipController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create payslip
router.post('/', PayslipController.createPayslip);

// Get all payslips with filters
router.get('/', PayslipController.getPayslips);

// Get payslip by ID
router.get('/:id', PayslipController.getPayslipById);

// Update payslip status
router.patch('/:id/status', PayslipController.updatePayslipStatus);

// Delete payslip
router.delete('/:id', PayslipController.deletePayslip);

// Get payroll summary
router.get('/summary', PayslipController.getPayrollSummary);

module.exports = router;
