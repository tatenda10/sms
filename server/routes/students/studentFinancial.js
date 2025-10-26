const express = require('express');
const router = express.Router();
const StudentFinancialController = require('../../controllers/students/studentFinancialController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Student financial routes (protected)
router.get('/balance', authenticateStudentToken, StudentFinancialController.getStudentBalance);
router.get('/payments', authenticateStudentToken, StudentFinancialController.getStudentPayments);
router.get('/summary', authenticateStudentToken, StudentFinancialController.getFinancialSummary);

module.exports = router;
