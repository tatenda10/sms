const express = require('express');
const router = express.Router();
const EnrollmentController = require('../../controllers/boarding/enrollmentController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Enrollment management routes
router.post('/', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.enrollStudent);
router.get('/', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), EnrollmentController.getAllEnrollments);
router.get('/:id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), EnrollmentController.getEnrollmentById);
router.put('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.updateEnrollment);
router.delete('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.deleteEnrollment);

// Check-in/Check-out routes
router.post('/:id/checkin', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.checkInStudent);
router.post('/:id/checkout', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.checkOutStudent);

// Cancel enrollment (requires request body with reason)
router.post('/:id/cancel', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), EnrollmentController.cancelEnrollment);

module.exports = router;
