const express = require('express');
const router = express.Router();
const testsController = require('../../controllers/results/testsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Admin routes
router.get('/', authenticateToken, requireRole(['admin', 'teacher']), testsController.getTests);
router.get('/:id', authenticateToken, requireRole(['admin', 'teacher']), testsController.getTestById);
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), testsController.createTest);
router.put('/:id', authenticateToken, requireRole(['admin', 'teacher']), testsController.updateTest);
router.delete('/:id', authenticateToken, requireRole(['admin', 'teacher']), testsController.deleteTest);
router.get('/class/:class_id', authenticateToken, requireRole(['admin', 'teacher']), testsController.getTestsByClass);

module.exports = router;
