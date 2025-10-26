const express = require('express');
const router = express.Router();
const StudentAnnouncementsController = require('../../controllers/students/studentAnnouncementsController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Get all announcements for students
router.get('/', authenticateStudentToken, StudentAnnouncementsController.getStudentAnnouncements);

// Get specific announcement by ID
router.get('/:id', authenticateStudentToken, StudentAnnouncementsController.getAnnouncementById);

module.exports = router;
