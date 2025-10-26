const express = require('express');
const router = express.Router();
const expenseAccountPayablesController = require('../../controllers/expenses/expenseAccountPayablesController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireRole('EXPENSES_MANAGEMENT'));

// Get all accounts payable with pagination and search
router.get('/', expenseAccountPayablesController.getAllAccountsPayable);

// Get accounts payable summary statistics
router.get('/summary', expenseAccountPayablesController.getSummary);

// Create opening balance payable (historical debt)
router.post('/opening-balance', expenseAccountPayablesController.createOpeningBalance);

// Get accounts payable by ID
router.get('/:id', expenseAccountPayablesController.getAccountsPayableById);

// Get payment history for a specific accounts payable
router.get('/:payable_id/payments', expenseAccountPayablesController.getPaymentHistory);

// Make a payment against accounts payable
router.post('/:payable_id/pay', expenseAccountPayablesController.makePayment);

module.exports = router;
