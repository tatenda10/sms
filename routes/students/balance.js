const express = require('express');
const router = express.Router();

// Import controller
const studentBalanceController = require('../../controllers/students/studentBalanceController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Student balance routes
router.get('/:student_reg_number', requireRole('STUDENT_BILLING'), studentBalanceController.getStudentBalance);
router.get('/:student_reg_number/statement', requireRole('STUDENT_BILLING'), studentBalanceController.getStudentStatement);
router.get('/:student_reg_number/summary', requireRole('STUDENT_BILLING'), studentBalanceController.getBalanceSummary);

module.exports = router;
