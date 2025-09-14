const express = require('express');
const router = express.Router();
const CashBankController = require('../../controllers/accounting/cashBankController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Get cash and bank account balances
router.get('/balances', authenticateToken, CashBankController.getAccountBalances);

// Cash operations
router.post('/cash/injection', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordCashInjection);
router.post('/cash/withdrawal', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordCashWithdrawal);

// Bank operations
router.post('/bank/deposit', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordBankDeposit);
router.post('/bank/withdrawal', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordBankWithdrawal);

// Transfer operations
router.post('/transfer/cash-to-bank', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordCashToBankTransfer);
router.post('/transfer/bank-to-cash', authenticateToken, requireRole(['admin', 'ACCOUNTING_MANAGEMENT']), CashBankController.recordBankToCashTransfer);

module.exports = router;

