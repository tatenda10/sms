const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middleware/auth');
const BankReconciliationController = require('../../controllers/accounting/bankReconciliationController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Bank Reconciliation routes
router.get('/', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.getAllReconciliations);
router.get('/accounts', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.getBankAccounts);
router.post('/', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.createReconciliation);

// Individual reconciliation routes
router.get('/:id', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.getReconciliationById);
router.get('/:id/summary', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.getReconciliationSummary);
router.put('/:id/complete', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.completeReconciliation);

// Bank statement items routes
router.post('/:reconciliation_id/bank-items', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.addBankStatementItem);

// Book transactions routes
router.post('/:reconciliation_id/book-items', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.addBookTransaction);

// Transaction matching routes
router.post('/:reconciliation_id/match', requireRole('ACCOUNTING_MANAGEMENT'), BankReconciliationController.matchTransactions);

module.exports = router;
