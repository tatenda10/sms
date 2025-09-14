const express = require('express');
const router = express.Router();
const SportsCategoriesController = require('../../controllers/sports/sportsCategoriesController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all sports categories
router.get('/', SportsCategoriesController.getAllCategories);

// Get category by ID
router.get('/:id', SportsCategoriesController.getCategoryById);

// Create new sports category (admin only)
router.post('/', requireRole(['admin']), SportsCategoriesController.createCategory);

// Update sports category (admin only)
router.put('/:id', requireRole(['admin']), SportsCategoriesController.updateCategory);

// Delete sports category (admin only)
router.delete('/:id', requireRole(['admin']), SportsCategoriesController.deleteCategory);

module.exports = router;
