const express = require('express');
const router = express.Router();
const PeriodClosingController = require('../../controllers/accounting/periodClosingController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware
router.use(authenticateToken);

// Get closing preview for a period
router.get('/preview/:periodId', PeriodClosingController.getClosingPreview);

// Close a period
router.post('/close/:periodId', PeriodClosingController.closePeriod);

// Reopen a closed period
router.post('/reopen/:periodId', PeriodClosingController.reopenPeriod);

module.exports = router;

