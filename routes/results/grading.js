const express = require('express');
const router = express.Router();
const gradingController = require('../../controllers/results/gradingController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all grading criteria
router.get('/', requireRole(['VIEW_RESULTS']), gradingController.getGradingCriteria);

// Get grading criteria by ID
router.get('/:id', requireRole(['VIEW_RESULTS']), gradingController.getGradingCriteriaById);

// Add new grading criteria
router.post('/', requireRole(['ADD_GRADES']), gradingController.addGradingCriteria);

// Update grading criteria
router.put('/:id', requireRole(['EDIT_GRADES']), gradingController.updateGradingCriteria);

// Delete grading criteria
router.delete('/:id', requireRole(['EDIT_GRADES']), gradingController.deleteGradingCriteria);

// Calculate grade from mark
router.post('/calculate', requireRole(['VIEW_RESULTS']), gradingController.calculateGrade);

// Bulk calculate grades
router.post('/bulk-calculate', requireRole(['VIEW_RESULTS']), gradingController.bulkCalculateGrades);

module.exports = router;
