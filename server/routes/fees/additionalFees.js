const express = require('express');
const router = express.Router();
const AdditionalFeeController = require('../../controllers/fees/additionalFeeController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Log all requests to additional-fees routes
router.use((req, res, next) => {
  console.log('🔍 Additional Fees Route Hit:', req.method, req.url);
  console.log('🔍 Request body:', req.body);
  next();
});

// ==========================================
// FEE STRUCTURES ROUTES
// ==========================================

// Get all fee structures
router.get('/structures', authenticateToken, AdditionalFeeController.getFeeStructures);

// Create new fee structure (Admin/Manager only)
router.post('/structures', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), AdditionalFeeController.createFeeStructure);

// Update fee structure (Admin/Manager only)
router.put('/structures/:id', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), AdditionalFeeController.updateFeeStructure);

// ==========================================
// STUDENT FEE ASSIGNMENTS ROUTES
// ==========================================

// Get student fee assignments
router.get('/assignments/student/:studentRegNumber/year/:academicYear', authenticateToken, AdditionalFeeController.getStudentFeeAssignments);

// Assign fee to specific students (manual assignment) (Admin/Manager only)
router.post('/assignments/manual', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), AdditionalFeeController.assignFeeToStudents);

// Generate annual fees for all students (bulk operation) (Admin/Manager only)
router.post('/assignments/bulk-annual', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER']), AdditionalFeeController.generateAnnualFeesForAllStudents);

// ==========================================
// FEE PAYMENTS ROUTES
// ==========================================

// Process fee payment (Admin/Manager/Billing only)
router.post('/payments', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER', 'BILLING']), AdditionalFeeController.processFeePayment);

// Get student payment history for additional fees
router.get('/payments/student/:studentRegNumber/year/:academicYear', authenticateToken, AdditionalFeeController.getStudentPaymentHistory);

// ==========================================
// STATISTICS ROUTES
// ==========================================

// Get fee assignment statistics
router.get('/stats/year/:academicYear', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER', 'BILLING']), AdditionalFeeController.getFeeAssignmentStats);

// Get fee assignments for a specific student
router.get('/assignments/student/:studentRegNumber', authenticateToken, requireRole(['ADMIN', 'STUDENT_BILLING', 'MANAGER', 'BILLING']), AdditionalFeeController.getStudentFeeAssignments);

module.exports = router;
