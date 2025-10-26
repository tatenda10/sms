const express = require('express');
const router = express.Router();
const studentResultsAnalyticsController = require('../../controllers/analytics/studentResultsAnalyticsController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication and authorization to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'teacher']));

// Get academic performance overview
router.get('/academic-performance', studentResultsAnalyticsController.getAcademicPerformanceOverview);

// Get grade distribution analysis
router.get('/grade-distribution', studentResultsAnalyticsController.getGradeDistributionAnalysis);

// Get student performance trends
router.get('/performance-trends', studentResultsAnalyticsController.getStudentPerformanceTrends);

// Get top and bottom performers
router.get('/top-bottom-performers', studentResultsAnalyticsController.getTopBottomPerformers);

module.exports = router;
