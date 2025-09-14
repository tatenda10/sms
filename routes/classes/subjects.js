const express = require('express');
const router = express.Router();

// Import controller
const subjectController = require('../../controllers/classes/subjectController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Subject routes (catalog)
router.get('/', requireRole('CLASS_MANAGEMENT'), subjectController.getAllSubjects);
router.get('/search', requireRole('CLASS_MANAGEMENT'), subjectController.searchSubjects);
router.get('/syllabus/:syllabus', requireRole('CLASS_MANAGEMENT'), subjectController.getSubjectsBySyllabus);
router.post('/', requireRole('CLASS_MANAGEMENT'), subjectController.createSubject);
router.get('/:id', requireRole('CLASS_MANAGEMENT'), subjectController.getSubjectById);
router.put('/:id', requireRole('CLASS_MANAGEMENT'), subjectController.updateSubject);
router.delete('/:id', requireRole('CLASS_MANAGEMENT'), subjectController.deleteSubject);

module.exports = router;
