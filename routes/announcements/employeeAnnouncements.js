const express = require('express');
const router = express.Router();
const AnnouncementsController = require('../../controllers/announcementsController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication middleware to all routes
router.use(authenticateEmployeeToken);

// Get employee announcements (filtered for employees only)
router.get('/', AnnouncementsController.getEmployeeAnnouncements);

// Get dashboard announcements for employees
router.get('/dashboard', AnnouncementsController.getDashboardAnnouncements);

module.exports = router;
