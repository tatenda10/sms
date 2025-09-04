-- =====================================================
-- UPDATE BOARDING FEES PAYMENTS SCHEMA
-- =====================================================
-- This migration updates the boarding_fees_payments table to:
-- 1. Remove enrollment_id dependency
-- 2. Add currency conversion fields
-- 3. Support payments for non-enrolled students
-- =====================================================

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS boarding_fees_payments;

-- Create updated Boarding Fees Payments Table
CREATE TABLE IF NOT EXISTS boarding_fees_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_reg_number VARCHAR(50) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) NOT NULL,
  hostel_id INT,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  base_currency_amount DECIMAL(10,2) NOT NULL,
  base_currency_id INT NOT NULL,
  exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
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
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE RESTRICT,
  FOREIGN KEY (base_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_student_reg (student_reg_number),
  INDEX idx_academic_year (academic_year),
  INDEX idx_term (term),
  INDEX idx_hostel_id (hostel_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_receipt_number (receipt_number),
  INDEX idx_status (status),
  INDEX idx_currency (currency_id),
  INDEX idx_base_currency (base_currency_id)
);

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

