-- =====================================================
-- BOARDING FEES PAYMENTS SYSTEM
-- =====================================================
-- This migration creates the boarding fees payments table
-- and integrates with the accounting system
-- =====================================================

-- Boarding Fees Payments Table
CREATE TABLE IF NOT EXISTS boarding_fees_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  hostel_id INT NOT NULL,
  student_reg_number VARCHAR(50) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other') NOT NULL,
  payment_date DATE NOT NULL,
  receipt_number VARCHAR(50) UNIQUE,
  reference_number VARCHAR(100),
  notes TEXT,
  status ENUM('Pending', 'Completed', 'Cancelled', 'Refunded') DEFAULT 'Completed',
  is_active TINYINT(1) DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign Keys
  FOREIGN KEY (enrollment_id) REFERENCES hostel_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_hostel_id (hostel_id),
  INDEX idx_student_reg (student_reg_number),
  INDEX idx_payment_date (payment_date),
  INDEX idx_receipt_number (receipt_number),
  INDEX idx_status (status)
);

-- Add Accounts Receivable - Boarding Fees to COA if not exists
INSERT IGNORE INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_active, created_at, updated_at) 
VALUES ('1120', 'Accounts Receivable - Boarding Fees', 'Asset', NULL, 1, NOW(), NOW());

-- Add Boarding Fees Receivable account (if not exists)
INSERT IGNORE INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_active, created_at, updated_at) 
VALUES ('1121', 'Boarding Fees Receivable', 'Asset', NULL, 1, NOW(), NOW());

-- Add Boarding Fees Revenue account (already exists in your COA as 4040)
-- The account 4040 "Boarding Fees" already exists in your COA

-- Create trigger to generate receipt numbers
DELIMITER //
CREATE TRIGGER IF NOT EXISTS generate_receipt_number 
BEFORE INSERT ON boarding_fees_payments
FOR EACH ROW
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    SET NEW.receipt_number = CONCAT('BF', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD((SELECT COUNT(*) + 1 FROM boarding_fees_payments WHERE DATE(created_at) = CURDATE()), 4, '0'));
  END IF;
END//
DELIMITER ;

