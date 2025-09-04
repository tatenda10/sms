const express = require('express');
const router = express.Router();
const resultsController = require('../../controllers/results/resultsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get results for a class/subject/term
router.get('/', requireRole(['VIEW_RESULTS']), resultsController.getResults);

// Get class positions
router.get('/class-positions', requireRole(['VIEW_RESULTS']), resultsController.getClassPositions);

// Get stream positions
router.get('/stream-positions', requireRole(['VIEW_RESULTS']), resultsController.getStreamPositions);

// Create new result entry
router.post('/', requireRole(['ADD_RESULTS']), resultsController.createResult);

// Add individual paper mark
router.post('/paper-mark', requireRole(['ADD_RESULTS']), resultsController.addPaperMark);

// Update result
router.put('/:id', requireRole(['EDIT_RESULTS']), resultsController.updateResult);

// Delete result
router.delete('/:id', requireRole(['EDIT_RESULTS']), resultsController.deleteResult);

module.exports = router;
