const express = require('express');
const router = express.Router();
const subjectEnrollmentController = require('../../controllers/classes/subjectEnrollmentController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication to all routes (no role requirements)
router.use(authenticateEmployeeToken);

// Employee-specific subject enrollment routes
router.get('/', subjectEnrollmentController.getAllSubjectEnrollments);
router.get('/student/:studentRegNumber', subjectEnrollmentController.getEnrollmentsByStudent);
router.get('/class/:subject_class_id', subjectEnrollmentController.getEnrollmentsBySubjectClass);
router.get('/:id', subjectEnrollmentController.getSubjectEnrollmentById);
router.post('/', subjectEnrollmentController.createSubjectEnrollment);
router.put('/:id', subjectEnrollmentController.updateSubjectEnrollment);
router.delete('/:id', subjectEnrollmentController.deleteSubjectEnrollment);

module.exports = router;
