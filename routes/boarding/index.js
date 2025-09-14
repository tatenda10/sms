const express = require('express');
const router = express.Router();

// Import boarding routes
const hostelRoutes = require('./hostels');
const roomRoutes = require('./rooms');
const enrollmentRoutes = require('./enrollments');
const billingFeesRoutes = require('./billingFees');
const boardingFeesPaymentsRoutes = require('./boardingFeesPayments');

// Mount boarding routes
router.use('/hostels', hostelRoutes);
router.use('/rooms', roomRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/billing-fees', billingFeesRoutes);
router.use('/payments', boardingFeesPaymentsRoutes);

module.exports = router;
