const express = require('express');
const router = express.Router();

// Import existing controller
const gradelevelEnrollmentController = require('../../controllers/classes/gradelevelEnrollmentController');

// Import employee authentication middleware
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication to all routes (no role requirements)
router.use(authenticateEmployeeToken);

// Use existing controller methods directly - no role requirements
router.get('/', gradelevelEnrollmentController.getAllGradelevelEnrollments);
router.get('/student/:studentRegNumber', gradelevelEnrollmentController.getEnrollmentsByStudent);
router.get('/class/:gradelevel_class_id', gradelevelEnrollmentController.getEnrollmentsByGradelevelClass);
router.get('/:id', gradelevelEnrollmentController.getGradelevelEnrollmentById);
router.post('/', gradelevelEnrollmentController.createGradelevelEnrollment);
router.put('/:id', gradelevelEnrollmentController.updateGradelevelEnrollment);
router.delete('/:id', gradelevelEnrollmentController.deleteGradelevelEnrollment);

module.exports = router;
