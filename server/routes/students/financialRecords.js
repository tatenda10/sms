const express = require('express');
const router = express.Router();

// Import controller
const studentFinancialRecordController = require('../../controllers/students/studentFinancialRecordController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Student financial record routes
router.get('/:student_reg_number/summary', requireRole('STUDENT_BILLING'), studentFinancialRecordController.getStudentFinancialSummary);
router.get('/:student_reg_number/transactions', requireRole('STUDENT_BILLING'), studentFinancialRecordController.getStudentTransactions);
router.get('/:student_reg_number/statement', requireRole('STUDENT_BILLING'), studentFinancialRecordController.getStudentFinancialStatement);
router.get('/:student_reg_number/outstanding-balance', requireRole('STUDENT_BILLING'), studentFinancialRecordController.getStudentOutstandingBalance);

module.exports = router;
