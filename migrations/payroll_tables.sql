-- Payroll System Tables

-- Payslips table
CREATE TABLE IF NOT EXISTS payslips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    pay_period VARCHAR(7) NOT NULL, -- YYYY-MM format
    pay_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method ENUM('bank', 'cash') DEFAULT 'bank',
    bank_account_id INT,
    total_earnings DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES employee_bank_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_period (employee_id, pay_period),
    INDEX idx_status (status),
    INDEX idx_pay_period (pay_period),
    INDEX idx_payment_method (payment_method)
);

-- Payslip earnings table
CREATE TABLE IF NOT EXISTS payslip_earnings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payslip_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
    INDEX idx_payslip_id (payslip_id)
);

-- Payslip deductions table
CREATE TABLE IF NOT EXISTS payslip_deductions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payslip_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
    INDEX idx_payslip_id (payslip_id)
);

-- Payroll runs table (for tracking payroll processing)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pay_period VARCHAR(7) NOT NULL,
    pay_date DATE NOT NULL,
    bank_account_id INT,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    reference VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    employee_count INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    -- bank_account_id stores the raw bank account ID without foreign key constraint
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_pay_period (pay_period),
    INDEX idx_status (status)
);

-- Payroll run details (which payslips were processed in each run)
CREATE TABLE IF NOT EXISTS payroll_run_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payroll_run_id INT NOT NULL,
    payslip_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_payslip_id (payslip_id)
);
