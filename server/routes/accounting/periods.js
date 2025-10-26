const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const PeriodController = require('../../controllers/accounting/periodController');
const PeriodClosingController = require('../../controllers/accounting/periodClosingController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Period Management Routes
router.get('/', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.getAllPeriods);
router.get('/current', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.getCurrentPeriod);
router.get('/year/:year', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.getPeriodsByYear);
router.get('/:id', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.getPeriodById);
router.post('/', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.createPeriod);
router.put('/:id/status', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.updatePeriodStatus);
router.delete('/:id', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.deletePeriod);
router.post('/generate-yearly', requireRole('ACCOUNTING_MANAGEMENT'), PeriodController.generateYearlyPeriods);

// Note: Trial Balance, Income Statement, and Balance Sheet routes are handled by their respective controllers
// Period closing is now handled by the separate period-closing routes

module.exports = router;
