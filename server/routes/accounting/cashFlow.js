const express = require('express');
const router = express.Router();
const CashFlowController = require('../../controllers/accounting/cashFlowController');

// Get cash flow statement by period ID
router.get('/period/:periodId', CashFlowController.getCashFlow);

// Get cash flow statement by month and year
router.get('/month/:month/year/:year', CashFlowController.getCashFlowByMonthYear);

// Get cash flow statement by custom date range
router.get('/range', CashFlowController.getCashFlowByDateRange);

// Get multi-month cash flow statement for comparison
router.get('/multi-month', CashFlowController.getMultiMonthCashFlow);

module.exports = router;
