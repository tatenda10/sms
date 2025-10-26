const express = require('express');
const router = express.Router();
const studentFinancialAnalyticsController = require('../../controllers/analytics/studentFinancialAnalyticsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get outstanding balances by class/stream
router.get('/outstanding-balances', studentFinancialAnalyticsController.getOutstandingBalancesByClass);

// Get payment completion rates
router.get('/payment-completion-rates', studentFinancialAnalyticsController.getPaymentCompletionRates);

// Get fee collection efficiency metrics
router.get('/efficiency-metrics', studentFinancialAnalyticsController.getFeeCollectionEfficiencyMetrics);

// Get student financial health summary
router.get('/health-summary', studentFinancialAnalyticsController.getStudentFinancialHealthSummary);

module.exports = router;
