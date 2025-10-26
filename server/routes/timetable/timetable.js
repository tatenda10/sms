const express = require('express');
const router = express.Router();
const timetableController = require('../../controllers/timetable/timetableController');
const timetableGenerationController = require('../../controllers/timetable/timetableGenerationController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===========================================
// TEMPLATE MANAGEMENT ROUTES
// ===========================================

// Get all timetable templates
router.get('/templates', timetableController.getAllTemplates.bind(timetableController));

// Get template by ID with full details
router.get('/templates/:id', timetableController.getTemplateById.bind(timetableController));

// Create new timetable template
router.post('/templates', timetableController.createTemplate.bind(timetableController));

// Update timetable template
router.put('/templates/:id', timetableController.updateTemplate.bind(timetableController));

// ===========================================
// PERIOD MANAGEMENT ROUTES
// ===========================================

// Get periods for a specific day
router.get('/templates/:templateId/periods/:dayOfWeek', timetableController.getPeriodsForDay.bind(timetableController));

// Create period for a specific day
router.post('/templates/:templateId/periods/:dayOfWeek', timetableController.createPeriod.bind(timetableController));

// Update period
router.put('/periods/:id', timetableController.updatePeriod.bind(timetableController));

// Delete period
router.delete('/periods/:id', timetableController.deletePeriod.bind(timetableController));

// ===========================================
// TIMETABLE ENTRIES ROUTES
// ===========================================

// Get timetable entries for a template
router.get('/templates/:templateId/entries', timetableController.getTimetableEntries.bind(timetableController));

// Create timetable entry
router.post('/templates/:templateId/entries', timetableController.createTimetableEntry.bind(timetableController));

// Update timetable entry
router.put('/entries/:id', timetableController.updateTimetableEntry.bind(timetableController));

// Delete timetable entry
router.delete('/entries/:id', timetableController.deleteTimetableEntry.bind(timetableController));

// ===========================================
// HELPER ROUTES
// ===========================================

// Get available subject classes for timetable
router.get('/templates/:templateId/available-subject-classes', timetableController.getAvailableSubjectClasses.bind(timetableController));

// Get teacher availability for a specific day and period
router.get('/templates/:templateId/availability/:dayOfWeek/:periodId', timetableController.getTeacherAvailability.bind(timetableController));

module.exports = router;
