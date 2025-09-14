const express = require('express');
const router = express.Router();

// Import controller
const gradelevelEnrollmentController = require('../../controllers/classes/gradelevelEnrollmentController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Grade-level enrollment routes (homeroom membership)
router.get('/', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.getAllGradelevelEnrollments);
router.get('/student/:studentRegNumber', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.getEnrollmentsByStudent);
router.get('/class/:gradelevelClassId', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.getEnrollmentsByGradelevelClass);
router.get('/:id', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.getGradelevelEnrollmentById);
router.post('/', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.createGradelevelEnrollment);
router.put('/:id', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.updateGradelevelEnrollment);
router.delete('/:id', requireRole('ENROLLMENT_MANAGEMENT'), gradelevelEnrollmentController.deleteGradelevelEnrollment);

module.exports = router;
