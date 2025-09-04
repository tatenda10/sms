-- Period Closing Tables for Calendar-Based Accounting

-- Table to store accounting periods
CREATE TABLE IF NOT EXISTS accounting_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_name VARCHAR(50) NOT NULL, -- e.g., "January 2025", "Q1 2025"
    period_type ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('open', 'in_progress', 'closed', 'reopened') NOT NULL DEFAULT 'open',
    closed_date DATETIME NULL,
    closed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_period (start_date, end_date)
);

-- Table to store closing journal entries
CREATE TABLE IF NOT EXISTS period_closing_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    journal_entry_id INT NOT NULL,
         entry_type ENUM('revenue_close', 'expense_close', 'income_summary_close', 'opening_balance') NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES accounting_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- Table to store opening balances for next period
CREATE TABLE IF NOT EXISTS period_opening_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    account_id INT NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_type ENUM('debit', 'credit') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES accounting_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_period_account (period_id, account_id)
);

-- Table to store trial balance for periods
CREATE TABLE IF NOT EXISTS trial_balance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    account_id INT NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_type ENUM('debit', 'credit') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES accounting_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_period_account (period_id, account_id)
);

-- Table to store period closing audit trail
CREATE TABLE IF NOT EXISTS period_closing_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    action ENUM('close', 'reopen', 'adjust') NOT NULL,
    performed_by INT NOT NULL,
    description TEXT NOT NULL,
    metadata JSON NULL, -- Store additional data like totals, entry counts, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES accounting_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some sample periods for 2025
-- Create indexes for better performance
CREATE INDEX idx_accounting_periods_status ON accounting_periods(status);
CREATE INDEX idx_accounting_periods_dates ON accounting_periods(start_date, end_date);
CREATE INDEX idx_closing_entries_period ON period_closing_entries(period_id);
CREATE INDEX idx_opening_balances_period ON period_opening_balances(period_id);
CREATE INDEX idx_closing_audit_period ON period_closing_audit(period_id);
CREATE INDEX idx_trial_balance_period ON trial_balance(period_id);
