const express = require('express');
const router = express.Router();

// Import controller
const classTermYearController = require('../../controllers/classes/classTermYearController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Class Term Year routes
router.get('/', requireRole('CLASS_MANAGEMENT'), classTermYearController.getAllClassTermYears);
router.get('/:id', requireRole('CLASS_MANAGEMENT'), classTermYearController.getClassTermYearById);
router.post('/', requireRole('CLASS_MANAGEMENT'), classTermYearController.createClassTermYear);
router.put('/:id', requireRole('CLASS_MANAGEMENT'), classTermYearController.updateClassTermYear);
router.delete('/:id', requireRole('CLASS_MANAGEMENT'), classTermYearController.deleteClassTermYear);

// Bulk populate class term years for all classes
router.post('/bulk-populate', requireRole('CLASS_MANAGEMENT'), classTermYearController.bulkPopulateClassTermYears);

// Get classes that don't have term/year records
router.get('/classes-without-term-year', requireRole('CLASS_MANAGEMENT'), classTermYearController.getClassesWithoutTermYear);

module.exports = router;
