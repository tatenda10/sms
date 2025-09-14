const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Import controllers
const inventoryCategoryController = require('../../controllers/inventory/inventoryCategoryController');
const inventoryItemController = require('../../controllers/inventory/inventoryItemController');
const uniformIssueController = require('../../controllers/inventory/uniformIssueController');

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  console.log('🔐 Inventory route accessed:', req.method, req.path);
  console.log('🔐 Auth header:', req.headers.authorization);
  next();
});

router.use(authenticateToken);

// Category routes
router.get('/categories', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryCategoryController.getAllCategories);
router.get('/categories/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryCategoryController.getCategoryById);
router.post('/categories', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryCategoryController.createCategory);
router.put('/categories/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryCategoryController.updateCategory);
router.delete('/categories/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryCategoryController.deleteCategory);

// Item routes
router.get('/items', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.getAllItems);
router.get('/items/search', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.searchItems);
router.get('/items/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.getItemById);
router.post('/items', requireRole(['admin', 'INVENTORY_MANAGER']), (req, res, next) => {
  console.log('📦 POST /items route hit');
  console.log('📦 Request body:', req.body);
  next();
}, inventoryItemController.createItem);
router.put('/items/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.updateItem);
router.delete('/items/:id', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.deleteItem);
router.patch('/items/:id/stock', requireRole(['admin', 'INVENTORY_MANAGER']), inventoryItemController.updateStock);

// Uniform issue routes
router.get('/issues', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.getAllIssues);
router.get('/issues/:id', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.getIssueById);
router.post('/issues', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.createIssue);
router.put('/issues/:id', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.updateIssue);
router.delete('/issues/:id', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.deleteIssue);

// Payment routes
router.post('/issues/:issue_id/payments', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.recordPayment);
router.get('/issues/:issue_id/payments', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.getPaymentHistory);

// Student uniform summary
router.get('/students/:student_reg_number/summary', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.getStudentUniformSummary);

// Summary and statistics
router.get('/summary', requireRole(['admin', 'INVENTORY_MANAGER']), uniformIssueController.getInventorySummary);

module.exports = router;
