const express = require('express');
const router = express.Router();
const accountBalanceController = require('../../controllers/accounting/accountBalanceController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);
router.use(requireRole('ACCOUNTING_MANAGEMENT'));

// Get latest balance for an account
router.get('/:account_id', accountBalanceController.getBalanceByAccountId);
// Update or create balance for an account (for a given date)
router.put('/:account_id', accountBalanceController.updateBalance);

module.exports = router; 