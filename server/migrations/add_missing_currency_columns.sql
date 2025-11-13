-- Add Missing Currency Columns to Financial Tables
-- This ensures all tables handling money have proper currency tracking

-- 1. Add currency_id to student_balances
ALTER TABLE student_balances 
ADD COLUMN currency_id INT NOT NULL DEFAULT 1 AFTER current_balance,
ADD INDEX idx_student_balances_currency (currency_id),
ADD CONSTRAINT fk_student_balances_currency 
    FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- 2. Add currency_id to student_transactions
ALTER TABLE student_transactions 
ADD COLUMN currency_id INT NOT NULL DEFAULT 1 AFTER amount,
ADD INDEX idx_student_transactions_currency (currency_id),
ADD CONSTRAINT fk_student_transactions_currency 
    FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- 3. Add currency_id to uniform_payments
ALTER TABLE uniform_payments 
ADD COLUMN currency_id INT NOT NULL DEFAULT 1 AFTER amount,
ADD INDEX idx_uniform_payments_currency (currency_id),
ADD CONSTRAINT fk_uniform_payments_currency 
    FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- 4. Add currency_id to fixed_asset_payments  
ALTER TABLE fixed_asset_payments 
ADD COLUMN currency_id INT NOT NULL DEFAULT 1 AFTER amount,
ADD INDEX idx_fixed_asset_payments_currency (currency_id),
ADD CONSTRAINT fk_fixed_asset_payments_currency 
    FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- 5. Add currency_id to accounts_payable_payments
ALTER TABLE accounts_payable_payments 
ADD COLUMN currency_id INT NOT NULL DEFAULT 1 AFTER amount_paid,
ADD INDEX idx_accounts_payable_payments_currency (currency_id),
ADD CONSTRAINT fk_accounts_payable_payments_currency 
    FOREIGN KEY (currency_id) REFERENCES currencies(id);

