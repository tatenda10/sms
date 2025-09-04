const express = require('express');
const router = express.Router();

// Import controller
const gradelevelClassController = require('../../controllers/classes/gradelevelClassController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Grade-level class routes (homerooms within streams)
router.get('/', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.getAllGradelevelClasses);
router.get('/search', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.searchGradelevelClasses);
router.get('/:id', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.getGradelevelClassById);
router.get('/:id/students', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.getStudentsByClass);
router.post('/', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.createGradelevelClass);
router.put('/:id', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.updateGradelevelClass);
router.delete('/:id', requireRole('CLASS_MANAGEMENT'), gradelevelClassController.deleteGradelevelClass);

module.exports = router;
