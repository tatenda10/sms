-- Bank Reconciliation Tables Migration
-- Run this script to create the necessary tables for bank reconciliation functionality

-- Create bank_reconciliations table
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_account_id INT NOT NULL,
    reconciliation_date DATE NOT NULL,
    bank_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    book_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    adjusted_balance DECIMAL(15,2) NULL,
    description TEXT,
    notes TEXT,
    status ENUM('open', 'in_progress', 'completed', 'cancelled') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_by INT NULL,
    FOREIGN KEY (bank_account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_bank_account (bank_account_id),
    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status (status)
);

-- Create bank_statement_items table
CREATE TABLE IF NOT EXISTS bank_statement_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reconciliation_id INT NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    reference VARCHAR(100),
    transaction_type ENUM('deposit', 'withdrawal', 'fee', 'interest', 'transfer', 'other') DEFAULT 'other',
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reconciliation_id) REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    INDEX idx_reconciliation_id (reconciliation_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_is_reconciled (is_reconciled)
);

-- Create book_transactions table
CREATE TABLE IF NOT EXISTS book_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reconciliation_id INT NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    reference VARCHAR(100),
    journal_entry_line_id INT NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reconciliation_id) REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    FOREIGN KEY (journal_entry_line_id) REFERENCES journal_entry_lines(id) ON DELETE SET NULL,
    INDEX idx_reconciliation_id (reconciliation_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_is_reconciled (is_reconciled),
    INDEX idx_journal_entry_line (journal_entry_line_id)
);

-- Create reconciliation_matches table (optional - for tracking which items were matched)
CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reconciliation_id INT NOT NULL,
    bank_statement_item_id INT NOT NULL,
    book_transaction_id INT NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matched_by INT NULL,
    FOREIGN KEY (reconciliation_id) REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_statement_item_id) REFERENCES bank_statement_items(id) ON DELETE CASCADE,
    FOREIGN KEY (book_transaction_id) REFERENCES book_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (matched_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_bank_item (bank_statement_item_id),
    UNIQUE KEY unique_book_item (book_transaction_id),
    INDEX idx_reconciliation_id (reconciliation_id)
);

-- Insert sample data for testing (optional)
-- This assumes you have a Cash account in your chart of accounts
INSERT IGNORE INTO bank_reconciliations (
    bank_account_id, 
    reconciliation_date, 
    bank_balance, 
    book_balance, 
    description, 
    status
) 
SELECT 
    id, 
    '2025-01-31', 
    5000.00, 
    4800.00, 
    'January 2025 Bank Reconciliation', 
    'open'
FROM chart_of_accounts 
WHERE name LIKE '%Cash%' AND type = 'Asset' 
LIMIT 1;

-- Add some sample bank statement items
INSERT IGNORE INTO bank_statement_items (
    reconciliation_id,
    description,
    amount,
    transaction_date,
    reference,
    transaction_type
) VALUES 
(1, 'Customer Payment - ABC Corp', 1500.00, '2025-01-15', 'DEP001', 'deposit'),
(1, 'Office Supplies Payment', -250.00, '2025-01-16', 'CHK001', 'withdrawal'),
(1, 'Bank Service Charge', -25.00, '2025-01-31', 'FEE001', 'fee'),
(1, 'Interest Earned', 15.00, '2025-01-31', 'INT001', 'interest');

-- Add some sample book transactions
INSERT IGNORE INTO book_transactions (
    reconciliation_id,
    description,
    amount,
    transaction_date,
    reference
) VALUES 
(1, 'Customer Payment - ABC Corp', 1500.00, '2025-01-15', 'REC001'),
(1, 'Office Supplies Purchase', -250.00, '2025-01-16', 'PAY001'),
(1, 'Utility Bill Payment', -300.00, '2025-01-20', 'PAY002');
