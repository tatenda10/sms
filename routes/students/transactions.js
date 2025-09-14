const express = require('express');
const router = express.Router();

// Import controller
const studentTransactionController = require('../../controllers/students/studentTransactionController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Student transaction routes
router.post('/', requireRole('FEES_MANAGEMENT'), studentTransactionController.createTransaction);
router.get('/:id', requireRole('FEES_VIEW'), studentTransactionController.getTransactionById);
router.put('/:id', requireRole('FEES_MANAGEMENT'), studentTransactionController.updateTransaction);
router.post('/:id/reverse', requireRole('FEES_MANAGEMENT'), studentTransactionController.reverseTransaction);

module.exports = router;
