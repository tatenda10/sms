const express = require('express');
const router = express.Router();
const TransportPaymentController = require('../../controllers/transport/transportPaymentController');
const { requireRole } = require('../../middleware/auth');

// Apply authentication middleware
router.use(requireRole('TRANSPORT_MANAGEMENT'));

// Get all transport fees
router.get('/fees', TransportPaymentController.getAllFees);

// Get fee by ID
router.get('/fees/:id', TransportPaymentController.getFeeById);

// Generate transport fees for a period
router.post('/fees/generate', TransportPaymentController.generateFees);

// Record transport payment
router.post('/payments', TransportPaymentController.recordPayment);

// Get payment summary
router.get('/summary', TransportPaymentController.getPaymentSummary);

// Get overdue fees
router.get('/overdue', TransportPaymentController.getOverdueFees);

module.exports = router;
