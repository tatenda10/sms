const express = require('express');
const router = express.Router();
const SportsAnnouncementsController = require('../../controllers/sports/sportsAnnouncementsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all sports announcements
router.get('/', SportsAnnouncementsController.getAllAnnouncements);

// Get dashboard sports announcements
router.get('/dashboard', SportsAnnouncementsController.getDashboardAnnouncements);

// Get announcement by ID
router.get('/:id', SportsAnnouncementsController.getAnnouncementById);

// Create new sports announcement (admin/coach only)
router.post('/', requireRole(['admin', 'teacher']), SportsAnnouncementsController.createAnnouncement);

// Update sports announcement (admin/coach only)
router.put('/:id', requireRole(['admin', 'teacher']), SportsAnnouncementsController.updateAnnouncement);

// Delete sports announcement (admin only)
router.delete('/:id', requireRole(['admin']), SportsAnnouncementsController.deleteAnnouncement);

module.exports = router;
