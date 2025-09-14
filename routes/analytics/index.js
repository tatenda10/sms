const express = require('express');
const router = express.Router();

// Import analytics route modules
const expenseAnalysisRoutes = require('./expenseAnalysis');
const revenueAnalysisRoutes = require('./revenueAnalysis');
const studentFinancialAnalyticsRoutes = require('./studentFinancialAnalytics');
const studentResultsAnalyticsRoutes = require('./studentResultsAnalytics');

// Mount analytics routes
router.use('/expenses', expenseAnalysisRoutes);
router.use('/revenue', revenueAnalysisRoutes);
router.use('/student-financial', studentFinancialAnalyticsRoutes);
router.use('/student-results', studentResultsAnalyticsRoutes);

module.exports = router;
