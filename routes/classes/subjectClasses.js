const express = require('express');
const router = express.Router();

// Import controller
const subjectClassController = require('../../controllers/classes/subjectClassController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Subject class routes (actual taught classes)
router.get('/', requireRole('CLASS_MANAGEMENT'), subjectClassController.getAllSubjectClasses);
router.get('/:id', requireRole('CLASS_MANAGEMENT'), subjectClassController.getSubjectClassById);
router.post('/', requireRole('CLASS_MANAGEMENT'), subjectClassController.createSubjectClass);
router.put('/:id', requireRole('CLASS_MANAGEMENT'), subjectClassController.updateSubjectClass);
router.delete('/:id', requireRole('CLASS_MANAGEMENT'), subjectClassController.deleteSubjectClass);

module.exports = router;
