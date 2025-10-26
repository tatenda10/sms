const express = require('express');
const router = express.Router();
const expenseAnalysisController = require('../../controllers/analytics/expenseAnalysisController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get monthly expense breakdown by category
router.get('/monthly-breakdown', expenseAnalysisController.getMonthlyExpenseBreakdown);

// Get cost per student analysis
router.get('/cost-per-student', expenseAnalysisController.getCostPerStudentAnalysis);

// Get expense trends over time
router.get('/trends', expenseAnalysisController.getExpenseTrends);

module.exports = router;
