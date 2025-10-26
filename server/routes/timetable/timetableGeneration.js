const express = require('express');
const router = express.Router();
const timetableGenerationController = require('../../controllers/timetable/timetableGenerationController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===========================================
// TIMETABLE GENERATION ROUTES
// ===========================================

// Generate timetable automatically
router.post('/templates/:templateId/generate', timetableGenerationController.generateTimetable.bind(timetableGenerationController));

// Detect conflicts in timetable
router.get('/templates/:templateId/conflicts', timetableGenerationController.detectConflicts.bind(timetableGenerationController));

// Resolve conflict
router.put('/conflicts/:conflictId/resolve', timetableGenerationController.resolveConflict.bind(timetableGenerationController));

// Get timetable statistics
router.get('/templates/:templateId/stats', timetableGenerationController.getTimetableStats.bind(timetableGenerationController));

// Get generation history
router.get('/templates/:templateId/history', timetableGenerationController.getGenerationHistory.bind(timetableGenerationController));

module.exports = router;
