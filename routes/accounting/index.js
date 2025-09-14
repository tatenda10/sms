const express = require('express');
const router = express.Router();

const chartOfAccountsRoutes = require('./chartOfAccounts');
const accountBalancesRoutes = require('./accountBalances');
const currenciesRoutes = require('./currencies');
const periodsRoutes = require('./periods');
const incomeStatementRoutes = require('./incomeStatement');
const balanceSheetRoutes = require('./balanceSheet');
const cashFlowRoutes = require('./cashFlow');
const bankReconciliationRoutes = require('./bankReconciliation');
const cashBankRoutes = require('./cashBank');

router.use('/chart-of-accounts', chartOfAccountsRoutes);
router.use('/account-balances', accountBalancesRoutes);
router.use('/currencies', currenciesRoutes);
router.use('/periods', periodsRoutes);
router.use('/income-statement', incomeStatementRoutes);
router.use('/balance-sheet', balanceSheetRoutes);
router.use('/cash-flow', cashFlowRoutes);
router.use('/bank-reconciliation', bankReconciliationRoutes);
router.use('/cash-bank', cashBankRoutes);

module.exports = router;
