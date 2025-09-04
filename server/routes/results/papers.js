const express = require('express');
const router = express.Router();
const papersController = require('../../controllers/results/papersController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all papers
router.get('/', requireRole(['VIEW_RESULTS']), papersController.getAllPapers);

// Get paper by ID
router.get('/:id', requireRole(['VIEW_RESULTS']), papersController.getPaperById);

// Add new paper
router.post('/', requireRole(['ADD_RESULTS']), papersController.addPaper);

// Update paper
router.put('/:id', requireRole(['EDIT_RESULTS']), papersController.updatePaper);

// Delete paper
router.delete('/:id', requireRole(['EDIT_RESULTS']), papersController.deletePaper);

module.exports = router;
