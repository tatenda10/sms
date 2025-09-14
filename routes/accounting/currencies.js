const express = require('express');
const router = express.Router();
const currencyController = require('../../controllers/accounting/currencyController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);

// Apply role-based access control to specific routes
router.get('/', requireRole(['ACCOUNTING_MANAGEMENT', 'BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_VIEW', 'ADMIN']), currencyController.getAllCurrencies);
router.get('/:id', requireRole(['ACCOUNTING_MANAGEMENT', 'BOARDING_MANAGEMENT', 'ADMIN']), currencyController.getCurrencyById);
router.post('/', requireRole('ACCOUNTING_MANAGEMENT'), currencyController.createCurrency);
router.put('/:id', requireRole('ACCOUNTING_MANAGEMENT'), currencyController.updateCurrency);
router.delete('/:id', requireRole('ACCOUNTING_MANAGEMENT'), currencyController.deleteCurrency);

module.exports = router;
