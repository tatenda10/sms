const express = require('express');
const router = express.Router();
const PayrollSummaryController = require('../../controllers/payroll/payrollSummaryController');
const BankAccountController = require('../../controllers/payroll/bankAccountController');
const { authenticateToken } = require('../../middleware/auth');

// Import payroll route modules
const payslipsRoutes = require('./payslips');
const runsRoutes = require('./runs');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Mount payroll routes
router.use('/payslips', payslipsRoutes);
router.use('/runs', runsRoutes);

// Payroll summary routes
router.get('/summary', PayrollSummaryController.getPayrollSummary);
router.get('/stats/:period', PayrollSummaryController.getPayrollStatsByPeriod);

// Bank account routes
router.get('/bank-accounts', BankAccountController.getOrganizationBankAccounts);
router.get('/bank-accounts/:id', BankAccountController.getBankAccountById);

module.exports = router;
