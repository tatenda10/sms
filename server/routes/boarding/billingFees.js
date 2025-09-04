const express = require('express');
const router = express.Router();
const BillingFeesController = require('../../controllers/boarding/billingFeesController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Billing fees management routes
router.post('/', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), BillingFeesController.createBillingFee);
router.get('/', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), BillingFeesController.getAllBillingFees);
router.get('/:id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), BillingFeesController.getBillingFeeById);
router.put('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), BillingFeesController.updateBillingFee);
router.delete('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), BillingFeesController.deleteBillingFee);

module.exports = router;
