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

// Period Closing Routes
router.get('/:periodId/trial-balance', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getTrialBalance);
router.get('/:periodId/income-statement', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getIncomeStatement);
router.get('/:periodId/balance-sheet', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getBalanceSheet);
router.get('/:periodId/closing-entries', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getClosingEntries);
router.get('/:periodId/opening-balances', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getOpeningBalances);
router.post('/:periodId/close', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.closePeriod);

// Dynamic Period Routes (by month/year)
router.get('/month/:month/year/:year', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getOrCreatePeriod);
router.get('/month/:month/year/:year/trial-balance', requireRole('ACCOUNTING_MANAGEMENT'), PeriodClosingController.getTrialBalanceByMonthYear);

module.exports = router;
