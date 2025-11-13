-- Fix Currency IDs in Journal Entry Lines and Account Balances
-- This migration ensures all financial records have proper currency tracking

-- 1. Update NULL currency_ids in journal_entry_lines to base currency (USD = 1)
UPDATE journal_entry_lines 
SET currency_id = 1 
WHERE currency_id IS NULL;

-- 2. Update NULL currency_ids in account_balances to base currency (USD = 1)
UPDATE account_balances 
SET currency_id = 1 
WHERE currency_id IS NULL;

-- 3. Make currency_id NOT NULL with default value for future entries
ALTER TABLE journal_entry_lines 
MODIFY COLUMN currency_id INT NOT NULL DEFAULT 1;

ALTER TABLE account_balances 
MODIFY COLUMN currency_id INT NOT NULL DEFAULT 1;

-- 4. Add index on currency_id for better query performance
-- Note: Using ALTER TABLE ADD INDEX with IF NOT EXISTS equivalent
ALTER TABLE journal_entry_lines 
ADD INDEX idx_journal_entry_lines_currency (currency_id);

ALTER TABLE account_balances 
ADD INDEX idx_account_balances_currency (currency_id);

