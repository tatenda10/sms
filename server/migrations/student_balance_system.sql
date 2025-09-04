-- Migration: Student Balance System
-- This migration creates the new transaction-based student balance system

-- Drop existing student_balances table if it exists
DROP TABLE IF EXISTS student_balances;

-- Create new student_balances table
CREATE TABLE student_balances (
    student_reg_number VARCHAR(50) PRIMARY KEY,
    current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create student_transactions table
CREATE TABLE student_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_reg_number VARCHAR(50) NOT NULL,
    transaction_type ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    term VARCHAR(20) NULL,
    academic_year VARCHAR(10) NULL,
    class_id INT NULL,
    hostel_id INT NULL,
    enrollment_id INT NULL,
    created_by INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES gradelevel_classes(id) ON DELETE SET NULL,
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_student_reg_number (student_reg_number),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_term_year (term, academic_year),
    INDEX idx_class_id (class_id),
    INDEX idx_hostel_id (hostel_id)
);

-- Create fee_payments table
CREATE TABLE fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_reg_number VARCHAR(50) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_currency INT NOT NULL,
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
    base_currency_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    status ENUM('Completed', 'Pending', 'Failed', 'Refunded') DEFAULT 'Completed',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
    FOREIGN KEY (payment_currency) REFERENCES currencies(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_student_reg_number (student_reg_number),
    INDEX idx_payment_date (payment_date),
    INDEX idx_receipt_number (receipt_number),
    INDEX idx_status (status)
);

-- Create trigger to update student balance when transaction is created
DELIMITER //
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT ON student_transactions
FOR EACH ROW
BEGIN
    INSERT INTO student_balances (student_reg_number, current_balance)
    VALUES (NEW.student_reg_number, 
            CASE 
                WHEN NEW.transaction_type = 'CREDIT' THEN NEW.amount
                ELSE -NEW.amount
            END)
    ON DUPLICATE KEY UPDATE
        current_balance = current_balance + 
            CASE 
                WHEN NEW.transaction_type = 'CREDIT' THEN NEW.amount
                ELSE -NEW.amount
            END,
        last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create trigger to update student balance when transaction is updated
DELIMITER //
CREATE TRIGGER update_balance_on_transaction_update
AFTER UPDATE ON student_transactions
FOR EACH ROW
BEGIN
    -- Remove old transaction effect
    UPDATE student_balances 
    SET current_balance = current_balance - 
        CASE 
            WHEN OLD.transaction_type = 'CREDIT' THEN OLD.amount
            ELSE -OLD.amount
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE student_reg_number = OLD.student_reg_number;
    
    -- Add new transaction effect
    UPDATE student_balances 
    SET current_balance = current_balance + 
        CASE 
            WHEN NEW.transaction_type = 'CREDIT' THEN NEW.amount
            ELSE -NEW.amount
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE student_reg_number = NEW.student_reg_number;
END//
DELIMITER ;

-- Create trigger to update student balance when transaction is deleted
DELIMITER //
CREATE TRIGGER update_balance_on_transaction_delete
AFTER DELETE ON student_transactions
FOR EACH ROW
BEGIN
    UPDATE student_balances 
    SET current_balance = current_balance - 
        CASE 
            WHEN OLD.transaction_type = 'CREDIT' THEN OLD.amount
            ELSE -OLD.amount
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE student_reg_number = OLD.student_reg_number;
END//
DELIMITER ;

-- Insert initial balance records for existing students (if any)
INSERT IGNORE INTO student_balances (student_reg_number, current_balance)
SELECT RegNumber, 0.00 FROM students;

-- Create indexes for better performance
CREATE INDEX idx_student_transactions_composite ON student_transactions(student_reg_number, transaction_date, transaction_type);
CREATE INDEX idx_fee_payments_composite ON fee_payments(student_reg_number, payment_date, status);

-- Add comments for documentation
ALTER TABLE student_balances COMMENT = 'Current balance for each student';
ALTER TABLE student_transactions COMMENT = 'All debit/credit transactions for student accounts';
ALTER TABLE fee_payments COMMENT = 'Fee payment records with multi-currency support';
