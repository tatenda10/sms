const express = require('express');
const router = express.Router();
const SportsCategoriesController = require('../../controllers/sports/sportsCategoriesController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Apply student authentication to all routes
router.use(authenticateStudentToken);

// Get all sports categories (read-only for students)
router.get('/', SportsCategoriesController.getAllCategories);

// Get category by ID (read-only for students)
router.get('/:id', SportsCategoriesController.getCategoryById);

module.exports = router;
