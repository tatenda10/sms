const express = require('express');
const router = express.Router();
const TransportRouteController = require('../../controllers/transport/transportRouteControllerSimplified');
const StudentRegistrationController = require('../../controllers/transport/studentRegistrationController');
const WeeklyFeeController = require('../../controllers/transport/weeklyFeeController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes first
router.use(authenticateToken);

// Then apply role requirement - temporarily use admin role
router.use(requireRole(['admin']));

// ==========================================
// ROUTE MANAGEMENT
// ==========================================
router.get('/routes', TransportRouteController.getAllRoutes);
router.get('/routes/:id', TransportRouteController.getRouteById);
router.post('/routes', TransportRouteController.createRoute);
router.put('/routes/:id', TransportRouteController.updateRoute);
router.delete('/routes/:id', TransportRouteController.deleteRoute);
router.get('/routes/stats/summary', TransportRouteController.getRouteStats);

// ==========================================
// STUDENT REGISTRATION
// ==========================================
router.get('/registrations', StudentRegistrationController.getAllRegistrations);
router.get('/registrations/:id', StudentRegistrationController.getRegistrationById);
router.post('/registrations', StudentRegistrationController.registerStudent);
router.put('/registrations/:id', StudentRegistrationController.updateRegistration);
router.delete('/registrations/:id', StudentRegistrationController.deleteRegistration);
router.get('/registrations/summary', StudentRegistrationController.getRegistrationSummary);

// ==========================================
// WEEKLY FEES & PAYMENTS
// ==========================================
router.get('/fees', WeeklyFeeController.getAllFees);
router.post('/fees/generate', WeeklyFeeController.generateWeeklyFees);
router.get('/payments', WeeklyFeeController.getAllPayments);
router.post('/payments', WeeklyFeeController.recordPayment);
router.post('/payments/direct', WeeklyFeeController.recordDirectPayment);
router.get('/payments/summary', WeeklyFeeController.getPaymentSummary);
router.get('/payments/overdue', WeeklyFeeController.getOverdueFees);

// ==========================================
// SCHEDULES
// ==========================================
router.get('/schedules/weekly', WeeklyFeeController.getWeeklySchedule);

module.exports = router;
