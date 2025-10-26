const express = require('express');
const router = express.Router();
const testsController = require('../../controllers/results/testsController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Employee routes for tests
router.get('/', authenticateEmployeeToken, testsController.getTests);
router.get('/:id', authenticateEmployeeToken, testsController.getTestById);
router.post('/', authenticateEmployeeToken, testsController.createTest);
router.put('/:id', authenticateEmployeeToken, testsController.updateTest);
router.delete('/:id', authenticateEmployeeToken, testsController.deleteTest);
router.get('/class/:class_id', authenticateEmployeeToken, testsController.getTestsByClass);

module.exports = router;
