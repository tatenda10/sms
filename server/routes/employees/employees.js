const express = require('express');
const router = express.Router();
const EmployeeController = require('../../controllers/employees/employeeController');
const BankAccountController = require('../../controllers/employees/bankAccountController');
const { authenticateToken, requireRole, auditMiddleware } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All employee routes require HR or admin access
router.use(requireRole(['admin', 'hr']));

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Get all employees (with pagination and filtering)
router.get('/', EmployeeController.getAllEmployees);

// Search employees
router.get('/search', EmployeeController.searchEmployees);

// Get single employee by ID
router.get('/:id', EmployeeController.getEmployeeById);

// Create new employee
router.post('/', auditMiddleware('EMPLOYEE_CREATED', 'employees'), EmployeeController.createEmployee);

// Update employee
router.put('/:id', auditMiddleware('EMPLOYEE_UPDATED', 'employees'), EmployeeController.updateEmployee);

// Delete employee (soft delete)
router.delete('/:id', auditMiddleware('EMPLOYEE_DELETED', 'employees'), EmployeeController.deleteEmployee);

// ==========================================
// BANK ACCOUNT ROUTES
// ==========================================

// Get all bank accounts for an employee
router.get('/:employeeId/bank-accounts', BankAccountController.getEmployeeBankAccounts);

// Get single bank account
router.get('/bank-accounts/:id', BankAccountController.getBankAccountById);

// Create new bank account for employee
router.post('/:employeeId/bank-accounts', auditMiddleware('BANK_ACCOUNT_CREATED', 'employee_bank_accounts'), BankAccountController.createBankAccount);

// Update bank account
router.put('/bank-accounts/:id', auditMiddleware('BANK_ACCOUNT_UPDATED', 'employee_bank_accounts'), BankAccountController.updateBankAccount);

// Delete bank account
router.delete('/bank-accounts/:id', auditMiddleware('BANK_ACCOUNT_DELETED', 'employee_bank_accounts'), BankAccountController.deleteBankAccount);

// Set bank account as primary
router.patch('/bank-accounts/:id/set-primary', auditMiddleware('PRIMARY_ACCOUNT_CHANGED', 'employee_bank_accounts'), BankAccountController.setPrimaryAccount);

// Get supported currencies
router.get('/bank-accounts/currencies/list', BankAccountController.getSupportedCurrencies);

module.exports = router;
