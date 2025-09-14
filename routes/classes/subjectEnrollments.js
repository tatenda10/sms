const express = require('express');
const router = express.Router();

// Import controller
const subjectEnrollmentController = require('../../controllers/classes/subjectEnrollmentController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Subject enrollment routes (subject class membership)
router.get('/', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.getAllSubjectEnrollments);
router.get('/student/:studentRegNumber', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.getEnrollmentsByStudent);
router.get('/class/:subjectClassId', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.getEnrollmentsBySubjectClass);
router.post('/', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.createSubjectEnrollment);
router.post('/bulk', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.bulkEnrollStudents);
router.get('/:id', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.getSubjectEnrollmentById);
router.put('/:id', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.updateSubjectEnrollment);
router.delete('/:id', requireRole('ENROLLMENT_MANAGEMENT'), subjectEnrollmentController.deleteSubjectEnrollment);

module.exports = router;
