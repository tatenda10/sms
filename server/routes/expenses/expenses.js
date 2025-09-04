const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/expenses/expenseController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);
router.use(requireRole('EXPENSES_MANAGEMENT'));

router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
