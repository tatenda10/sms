const express = require('express');
const router = express.Router();
const StudentEnrollmentController = require('../../controllers/students/studentEnrollmentController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Get subject classes that the student is enrolled in
router.get('/subject-classes', authenticateStudentToken, StudentEnrollmentController.getStudentSubjectClasses);

// Get tests for a specific subject class
router.get('/subject-classes/:subjectClassId/tests', authenticateStudentToken, StudentEnrollmentController.getTestsForSubjectClass);

// Get test marks for a specific test
router.get('/tests/:testId/marks', authenticateStudentToken, StudentEnrollmentController.getTestMarks);

module.exports = router;
