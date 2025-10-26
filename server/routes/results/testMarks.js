const express = require('express');
const router = express.Router();
const testMarksController = require('../../controllers/results/testMarksController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Admin routes for test marks
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.addTestMark);
router.post('/bulk', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.bulkAddTestMarks);
router.get('/test/:test_id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.getTestMarksByTest);
router.get('/student/:student_reg_number', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.getTestMarksByStudent);
router.get('/class/:class_id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.getTestMarksByClass);
router.get('/:id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.getTestMarkById);
router.put('/:id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.updateTestMark);
router.delete('/:id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.deleteTestMark);
router.get('/statistics/:test_id', authenticateToken, requireRole(['admin', 'teacher']), testMarksController.getTestMarksStatistics);

module.exports = router;