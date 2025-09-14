const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const BalanceSheetController = require('../../controllers/accounting/balanceSheetController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Balance Sheet routes
router.get('/period/:periodId', requireRole('ACCOUNTING_MANAGEMENT'), BalanceSheetController.getBalanceSheet);
router.get('/month/:month/year/:year', requireRole('ACCOUNTING_MANAGEMENT'), BalanceSheetController.getBalanceSheetByMonthYear);
router.get('/range', requireRole('ACCOUNTING_MANAGEMENT'), BalanceSheetController.getBalanceSheetByDateRange);

module.exports = router;
