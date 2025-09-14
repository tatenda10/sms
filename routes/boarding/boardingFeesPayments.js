const express = require('express');
const router = express.Router();
const BoardingFeesPaymentsController = require('../../controllers/boarding/boardingFeesPaymentsController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Boarding fees payments management routes
router.post('/', requireRole(['BOARDING_MANAGEMENT', 'ACCOUNTING_MANAGEMENT', 'ADMIN']), BoardingFeesPaymentsController.createPayment);
router.get('/', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), BoardingFeesPaymentsController.getAllPayments);
router.get('/student/:studentRegNumber', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), BoardingFeesPaymentsController.getPaymentsByStudent);
router.get('/student/:studentRegNumber/summary', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), BoardingFeesPaymentsController.getPaymentSummaryByStudent);
router.get('/:id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), BoardingFeesPaymentsController.getPaymentById);
router.put('/:id', requireRole(['BOARDING_MANAGEMENT', 'ACCOUNTING_MANAGEMENT', 'ADMIN']), BoardingFeesPaymentsController.updatePayment);
router.delete('/:id', requireRole(['BOARDING_MANAGEMENT', 'ACCOUNTING_MANAGEMENT', 'ADMIN']), BoardingFeesPaymentsController.deletePayment);

module.exports = router;

