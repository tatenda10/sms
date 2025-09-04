const express = require('express');
const router = express.Router();

// Import controller
const feePaymentController = require('../../controllers/fees/feePaymentController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Fee payment routes
router.post('/', requireRole('STUDENT_BILLING'), feePaymentController.processPayment);



// Other fee payment routes
router.get('/:id', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentById);
router.get('/student/:student_reg_number', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentsByStudent);
router.post('/:id/refund', requireRole('STUDENT_BILLING'), feePaymentController.refundPayment);
router.get('/student/:student_reg_number/summary', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentSummary);

module.exports = router;
