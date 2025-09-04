const express = require('express');
const router = express.Router();

const suppliersRoutes = require('./suppliers');
const expensesRoutes = require('./expenses');
const accountsPayableRoutes = require('./accountsPayable');

router.use('/suppliers', suppliersRoutes);
router.use('/expenses', expensesRoutes);
router.use('/accounts-payable', accountsPayableRoutes);

module.exports = router;
