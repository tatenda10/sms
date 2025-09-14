const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/students_registrations/studentController');
const guardianController = require('../../controllers/students_registrations/guardianController');
const studentBalancesController = require('../../controllers/students/studentBalancesController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Student routes
router.get('/', requireRole('STUDENT_REGISTRATIONS'), studentController.getAllStudents);
router.get('/search', studentController.searchStudents); // No role requirement for student search (needed for fee payments)
router.get('/:regNumber', studentController.getStudentByRegNumber); // No role requirement for individual student lookup
router.get('/:id/balance', studentController.getStudentBalance); // No role requirement for balance lookup
router.post('/', requireRole('STUDENT_REGISTRATIONS'), studentController.addStudent);
router.put('/:regNumber', requireRole('STUDENT_REGISTRATIONS'), studentController.updateStudent);
router.delete('/:regNumber', requireRole('STUDENT_REGISTRATIONS'), studentController.deleteStudent);

// Guardian routes
router.get('/:regNumber/guardians', guardianController.getGuardiansByStudent);
router.post('/:regNumber/guardians', guardianController.addGuardian);
router.put('/guardians/:id', guardianController.updateGuardian);
router.delete('/guardians/:id', guardianController.deleteGuardian);

// Additional guardian routes
router.get('/guardians', guardianController.getAllGuardians);
router.get('/guardians/:id', guardianController.getGuardianById);

// Student balances routes
router.get('/balances/outstanding', requireRole('STUDENT_REGISTRATIONS'), studentBalancesController.getAllStudentsWithDebts);
router.get('/balances/summary', requireRole('STUDENT_REGISTRATIONS'), studentBalancesController.getOutstandingDebtSummary);
router.post('/manual-balance-adjustment', requireRole('STUDENT_REGISTRATIONS'), studentBalancesController.manualBalanceAdjustment);

module.exports = router;
