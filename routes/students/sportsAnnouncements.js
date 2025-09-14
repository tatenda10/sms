const express = require('express');
const router = express.Router();
const SportsAnnouncementsController = require('../../controllers/sports/sportsAnnouncementsController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Apply student authentication to all routes
router.use(authenticateStudentToken);

// Get all sports announcements (read-only for students)
router.get('/', SportsAnnouncementsController.getAllAnnouncements);

// Get announcement by ID (read-only for students)
router.get('/:id', SportsAnnouncementsController.getAnnouncementById);

// Get dashboard announcements (read-only for students)
router.get('/dashboard/list', SportsAnnouncementsController.getDashboardAnnouncements);

module.exports = router;
