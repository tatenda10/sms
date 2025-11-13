const express = require('express');
const router = express.Router();
const SavedReportsController = require('../../controllers/accounting/savedReportsController');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Save a new report
router.post('/', SavedReportsController.saveReport);

// Get all saved reports (with filtering)
router.get('/', SavedReportsController.getAllReports);

// Get reports summary (count by type)
router.get('/summary', SavedReportsController.getReportsSummary);

// Get a specific report by ID
router.get('/:id', SavedReportsController.getReportById);

// Delete a saved report
router.delete('/:id', SavedReportsController.deleteReport);

module.exports = router;

