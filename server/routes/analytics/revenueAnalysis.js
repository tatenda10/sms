const express = require('express');
const router = express.Router();
const revenueAnalysisController = require('../../controllers/analytics/revenueAnalysisController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'ACCOUNTING_MANAGEMENT', 'STUDENT_BILLING', 'STUDENT_REGISTRATIONS']));

// Get revenue trends over time
router.get('/trends', revenueAnalysisController.getRevenueTrends);

// Get fee collection trends (tuition, boarding, transport)
router.get('/fee-collection-trends', revenueAnalysisController.getFeeCollectionTrends);

// Get revenue breakdown by source
router.get('/breakdown', revenueAnalysisController.getRevenueBreakdown);

// Get payment method analysis
router.get('/payment-methods', revenueAnalysisController.getPaymentMethodAnalysis);

module.exports = router;
