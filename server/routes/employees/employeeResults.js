const express = require('express');
const router = express.Router();
const resultsController = require('../../controllers/results/resultsController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication to all routes (no role requirements)
router.use(authenticateEmployeeToken);

// Employee-specific results routes
router.get('/', resultsController.getResults);
router.get('/class-positions', resultsController.getClassPositions);
router.get('/stream-positions', resultsController.getStreamPositions);

module.exports = router;
