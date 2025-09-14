const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const IncomeStatementController = require('../../controllers/accounting/incomeStatementController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Basic Income Statement Routes
router.get('/periods', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getAvailablePeriods);
router.get('/period/:periodId', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getIncomeStatement);
router.get('/month/:month/year/:year', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getIncomeStatementByMonthYear);

// Custom date range
router.get('/range', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getIncomeStatementByDateRange);

// Comparative Analysis Routes
router.get('/period/:periodId/comparative', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getComparativeIncomeStatement);

// Year-to-Date and Quarterly Routes
router.get('/year/:year/ytd', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getYearToDateIncomeStatement);
router.get('/year/:year/quarter/:quarter', requireRole('ACCOUNTING_MANAGEMENT'), IncomeStatementController.getQuarterlyIncomeStatement);

module.exports = router;
