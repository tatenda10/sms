const express = require('express');
const router = express.Router();
const AnnouncementsController = require('../controllers/announcementsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all announcements (with pagination and filtering)
router.get('/', AnnouncementsController.getAllAnnouncements);

// Get dashboard announcements (published, within date range)
router.get('/dashboard', AnnouncementsController.getDashboardAnnouncements);

// Get announcement by ID
router.get('/:id', AnnouncementsController.getAnnouncementById);

// Get target options (classes for students, departments for employees)
router.get('/targets/:type', AnnouncementsController.getTargetOptions);

// Create new announcement
router.post('/', AnnouncementsController.createAnnouncement);

// Update announcement
router.put('/:id', AnnouncementsController.updateAnnouncement);

// Delete announcement
router.delete('/:id', AnnouncementsController.deleteAnnouncement);

module.exports = router;
