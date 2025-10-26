const express = require('express');
const router = express.Router();
const StudentResultsController = require('../../controllers/students/studentResultsController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Get student results by year and term
router.get('/results', authenticateStudentToken, StudentResultsController.getStudentResults);

// Get available academic years and terms for student
router.get('/available-periods', authenticateStudentToken, StudentResultsController.getAvailablePeriods);

// Get student's balance status
router.get('/balance-status', authenticateStudentToken, StudentResultsController.getBalanceStatus);

module.exports = router;
