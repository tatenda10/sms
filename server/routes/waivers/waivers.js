const express = require('express');
const router = express.Router();

// Import controller
const waiverController = require('../../controllers/waivers/waiverController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// ==========================================
// WAIVER CATEGORIES ROUTES
// ==========================================

// Get all waiver categories
router.get('/categories',requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.getWaiverCategories);

// Create new waiver category
router.post('/categories', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.createWaiverCategory);

// Update waiver category
router.put('/categories/:id', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.updateWaiverCategory);

// Delete waiver category
router.delete('/categories/:id', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.deleteWaiverCategory);

// ==========================================
// WAIVER PROCESSING ROUTES
// ==========================================

// Process waiver for student
router.post('/process', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.processWaiver);

// Get waivers for specific student
router.get('/student/:student_reg_number', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.getStudentWaivers);

// Get waiver summary for student
router.get('/student/:student_reg_number/summary', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.getStudentWaiverSummary);

// Get all waivers (admin view)
router.get('/all', requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), waiverController.getAllWaivers);

module.exports = router;
