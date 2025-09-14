const express = require('express');
const router = express.Router();
const testMarksController = require('../../controllers/results/testMarksController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

router.use(authenticateEmployeeToken);

// Add a single test mark
router.post('/', testMarksController.addTestMark);

// Bulk add test marks
router.post('/bulk', testMarksController.bulkAddTestMarks);

// Get test marks by test ID
router.get('/test/:test_id', testMarksController.getTestMarksByTest);

// Get test marks by student
router.get('/student/:student_reg_number', testMarksController.getTestMarksByStudent);

// Get test marks by class (supports both subject and gradelevel classes)
router.get('/class/:class_id', testMarksController.getTestMarksByClass);

// Get test mark by ID
router.get('/:id', testMarksController.getTestMarkById);

// Update test mark
router.put('/:id', testMarksController.updateTestMark);

// Delete test mark
router.delete('/:id', testMarksController.deleteTestMark);

// Get test marks statistics for a test
router.get('/statistics/:test_id', testMarksController.getTestMarksStatistics);

module.exports = router;
