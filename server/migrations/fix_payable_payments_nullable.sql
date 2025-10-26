-- =====================================================
-- Fix Accounts Payable Payments to Support Opening Balances
-- =====================================================
-- Make original_expense_id nullable in accounts_payable_payments
-- so payments can be made against opening balances that don't
-- have an associated expense record.
-- =====================================================

ALTER TABLE accounts_payable_payments 
MODIFY COLUMN original_expense_id INT NULL;

-- Verify the change
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'accounts_payable_payments'
  AND COLUMN_NAME = 'original_expense_id';

