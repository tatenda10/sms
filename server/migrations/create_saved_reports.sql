-- ============================================
-- SAVED FINANCIAL REPORTS SYSTEM
-- ============================================
-- This table stores snapshots of financial reports
-- for historical viewing and comparison

CREATE TABLE IF NOT EXISTS saved_financial_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Report Identification
    report_type ENUM('trial_balance', 'income_statement', 'cash_flow_statement', 'balance_sheet') NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_description TEXT,
    
    -- Period Information
    period_id INT,
    period_name VARCHAR(100),
    period_start_date DATE,
    period_end_date DATE,
    
    -- Report Data (stored as JSON)
    report_data JSON NOT NULL,
    report_summary JSON, -- Key metrics/totals for quick reference
    
    -- Additional Metadata
    currency_id INT DEFAULT 1,
    created_by INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit Trail
    notes TEXT,
    tags VARCHAR(500), -- Comma-separated tags for easy filtering
    
    -- Indexes
    INDEX idx_report_type (report_type),
    INDEX idx_period_id (period_id),
    INDEX idx_saved_at (saved_at),
    INDEX idx_created_by (created_by),
    INDEX idx_report_name (report_name),
    
    -- Foreign Keys
    FOREIGN KEY (period_id) REFERENCES accounting_periods(id) ON DELETE SET NULL,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Unique constraint to prevent duplicate report names
    UNIQUE KEY idx_unique_report_name (report_type, report_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

