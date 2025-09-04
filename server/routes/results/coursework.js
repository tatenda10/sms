const express = require('express');
const router = express.Router();
const courseworkController = require('../../controllers/results/midTermCourseworkController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get coursework marks
router.get('/', requireRole(['VIEW_RESULTS']), courseworkController.getCoursework);

// Get coursework by ID
router.get('/:id', requireRole(['VIEW_RESULTS']), courseworkController.getCourseworkById);

// Add coursework mark
router.post('/', requireRole(['ADD_RESULTS']), courseworkController.addCoursework);

// Bulk add coursework
router.post('/bulk', requireRole(['ADD_RESULTS']), courseworkController.bulkAddCoursework);

// Update coursework
router.put('/:id', requireRole(['EDIT_RESULTS']), courseworkController.updateCoursework);

// Delete coursework
router.delete('/:id', requireRole(['EDIT_RESULTS']), courseworkController.deleteCoursework);

module.exports = router;
