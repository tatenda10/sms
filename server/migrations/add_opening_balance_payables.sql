-- Migration: Add Opening Balance support for Accounts Payable
-- This allows recording historical debts without requiring an expense record

-- 1. Make original_expense_id nullable (allow opening balance entries)
ALTER TABLE accounts_payable_balances 
MODIFY COLUMN original_expense_id INT NULL;

-- 2. Add new columns for opening balance entries
ALTER TABLE accounts_payable_balances
ADD COLUMN reference_number VARCHAR(100) NULL COMMENT 'Reference number for the payable';

ALTER TABLE accounts_payable_balances
ADD COLUMN description TEXT NULL COMMENT 'Description of the payable';

ALTER TABLE accounts_payable_balances
ADD COLUMN is_opening_balance BOOLEAN DEFAULT FALSE COMMENT 'True if this is an opening balance entry';

ALTER TABLE accounts_payable_balances
ADD COLUMN opening_balance_date DATE NULL COMMENT 'Date of the opening balance';

-- 3. Create indexes for opening balance queries
ALTER TABLE accounts_payable_balances 
ADD INDEX idx_opening_balance (is_opening_balance);

ALTER TABLE accounts_payable_balances 
ADD INDEX idx_reference_number (reference_number);

