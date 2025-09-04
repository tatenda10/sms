const express = require('express');
const router = express.Router();
const CloseToTermController = require('../../controllers/classes/closeToTermController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get available terms for Close to Term
router.get('/available-terms', CloseToTermController.getAvailableTerms);

// Get preview of enrollments to be closed
router.get('/preview', CloseToTermController.getCloseToTermPreview);

// Execute Close to Term process
router.post('/close-to-term', requireRole('CLASS_MANAGEMENT'), CloseToTermController.closeToTerm);

// Execute Open to Term process
router.post('/open-to-term', requireRole('CLASS_MANAGEMENT'), CloseToTermController.openToTerm);

module.exports = router;