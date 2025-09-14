const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const generalLedgerController = require('../../controllers/accounting/generalLedgerController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all journal entries
router.get('/', generalLedgerController.getAllEntries);

// Get account balances
router.get('/account-balances', generalLedgerController.getAccountBalances);

// Get transaction summary
router.get('/transaction-summary', generalLedgerController.getTransactionSummary);

// Get currencies
router.get('/currencies', generalLedgerController.getCurrencies);

// Get journal entries for a specific account
router.get('/journal-entries/account/:accountId', generalLedgerController.getJournalEntriesForAccount);

// Get entry by ID
router.get('/entry/:id', generalLedgerController.getEntryById);

module.exports = router;
