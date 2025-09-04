const express = require('express');
const router = express.Router();
const chartOfAccountsController = require('../../controllers/accounting/chartOfAccountsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);
// Optionally, restrict to users with ACCOUNTING_MANAGEMENT role
router.use(requireRole('ACCOUNTING_MANAGEMENT'));

// Get all accounts
router.get('/', chartOfAccountsController.getAllAccounts);
// Get account by ID
router.get('/:id', chartOfAccountsController.getAccountById);
// Create account
router.post('/', chartOfAccountsController.createAccount);
// Update account
router.put('/:id', chartOfAccountsController.updateAccount);
// Delete account
router.delete('/:id', chartOfAccountsController.deleteAccount);

module.exports = router;
