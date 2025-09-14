const express = require('express');
const router = express.Router();
const gradingController = require('../../controllers/results/gradingController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

router.use(authenticateEmployeeToken);

// Get all grading criteria
router.get('/', gradingController.getGradingCriteria);

// Get grading criteria by ID
router.get('/:id', gradingController.getGradingCriteriaById);

// Calculate grade for a given mark
router.post('/calculate', gradingController.calculateGrade);

// Bulk calculate grades
router.post('/bulk-calculate', gradingController.bulkCalculateGrades);

module.exports = router;
