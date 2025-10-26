const express = require('express');
const router = express.Router();
const TrialBalanceController = require('../../controllers/accounting/trialBalanceController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get trial balance
router.get('/', TrialBalanceController.getTrialBalance);

// Get trial balance summary by account type
router.get('/summary', TrialBalanceController.getTrialBalanceSummary);

// Export trial balance to CSV
router.get('/export', TrialBalanceController.exportTrialBalance);

module.exports = router;

