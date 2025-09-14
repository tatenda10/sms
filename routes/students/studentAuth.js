const express = require('express');
const router = express.Router();
const StudentAuthController = require('../../controllers/students/studentAuthController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Public routes (no authentication required)
router.post('/login', StudentAuthController.login);

// Protected routes (authentication required)
router.get('/profile', authenticateStudentToken, StudentAuthController.getProfile);
router.post('/change-password', authenticateStudentToken, StudentAuthController.changePassword);
router.post('/set-initial-password', authenticateStudentToken, StudentAuthController.setInitialPassword);

module.exports = router;