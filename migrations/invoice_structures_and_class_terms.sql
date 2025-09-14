-- =====================================================
-- INVOICE STRUCTURES AND CLASS TERM/YEAR MANAGEMENT
-- =====================================================
-- This file creates tables for invoice structures and class term/year management
-- =====================================================

-- 1. Class Term Year table (links classes to specific terms and years)
CREATE TABLE IF NOT EXISTS class_term_year (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gradelevel_class_id INT NOT NULL,
  term VARCHAR(20) NOT NULL, -- 'Term 1', 'Term 2', 'Term 3'
  academic_year VARCHAR(10) NOT NULL, -- '2025', '2026'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (gradelevel_class_id) REFERENCES gradelevel_classes(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate class-term-year combinations
  UNIQUE KEY unique_class_term_year (gradelevel_class_id, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_class_term_year_class (gradelevel_class_id),
  INDEX idx_class_term_year_term (term),
  INDEX idx_class_term_year_year (academic_year),
  INDEX idx_class_term_year_active (is_active)
);

-- 2. Invoice Structures table (tuition fee structures only)
CREATE TABLE IF NOT EXISTS invoice_structures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gradelevel_class_id INT NOT NULL,
  term VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (gradelevel_class_id) REFERENCES gradelevel_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate class-term-year combinations
  UNIQUE KEY unique_class_term_year_fee (gradelevel_class_id, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_invoice_class (gradelevel_class_id),
  INDEX idx_invoice_term_year (term, academic_year),
  INDEX idx_invoice_active (is_active)
);

-- 3. Invoice Items table (breakdown of tuition fees)
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_structure_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL, -- 'Levy', 'Sport Fee', 'Library Fee', etc.
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (invoice_structure_id) REFERENCES invoice_structures(id) ON DELETE CASCADE,
  
  -- Indexes for better performance
  INDEX idx_invoice_items_structure (invoice_structure_id),
  INDEX idx_invoice_items_active (is_active)
);

-- 4. Student Balances table (for tracking outstanding amounts)
CREATE TABLE IF NOT EXISTS student_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(10) NOT NULL,
  fee_type VARCHAR(50) NOT NULL, -- 'tuition', 'boarding', 'transport', 'other'
  term VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  total_invoiced DECIMAL(10,2) DEFAULT 0.00,
  total_paid DECIMAL(10,2) DEFAULT 0.00,
  balance DECIMAL(10,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY unique_student_fee_balance (student_reg_number, fee_type, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_balance_student (student_reg_number),
  INDEX idx_balance_fee_type (fee_type),
  INDEX idx_balance_term_year (term, academic_year)
);

-- 5. Update boarding_fees_payments table to remove enrollment_id dependency
-- (This allows payments without enrollment)
ALTER TABLE boarding_fees_payments 
DROP FOREIGN KEY IF EXISTS boarding_fees_payments_ibfk_2,
DROP COLUMN IF EXISTS enrollment_id;

-- 6. Add triggers to maintain student balances
DELIMITER //

-- Trigger to update student balance when invoice structure is created
CREATE TRIGGER IF NOT EXISTS update_balance_on_invoice_structure
AFTER INSERT ON invoice_structures
FOR EACH ROW
BEGIN
    -- For tuition fees, update balances for all students enrolled in that class for that term/year
    INSERT INTO student_balances (student_reg_number, fee_type, term, academic_year, total_invoiced, balance)
    SELECT e.student_regnumber, 'tuition', NEW.term, NEW.academic_year, NEW.total_amount, NEW.total_amount
    FROM enrollments_gradelevel_classes e
    WHERE e.gradelevel_class_id = NEW.gradelevel_class_id 
    AND e.status = 'active'
    ON DUPLICATE KEY UPDATE 
    total_invoiced = total_invoiced + NEW.total_amount,
    balance = balance + NEW.total_amount;
END//

-- Trigger to update student balance when payment is made
CREATE TRIGGER IF NOT EXISTS update_balance_on_payment
AFTER INSERT ON boarding_fees_payments
FOR EACH ROW
BEGIN
    UPDATE student_balances 
    SET total_paid = total_paid + NEW.base_currency_amount,
        balance = total_invoiced - total_paid
    WHERE student_reg_number = NEW.student_reg_number 
    AND fee_type = 'boarding'
    AND term = NEW.term 
    AND academic_year = NEW.academic_year;
END//

DELIMITER ;

-- 7. Insert sample data for testing (optional)
-- INSERT INTO class_term_year (gradelevel_class_id, term, academic_year, start_date, end_date) VALUES
-- (1, 'Term 1', '2025', '2025-01-20', '2025-04-10'),
-- (1, 'Term 2', '2025', '2025-05-05', '2025-07-25'),
-- (1, 'Term 3', '2025', '2025-09-01', '2025-11-20');

-- INSERT INTO invoice_structures (gradelevel_class_id, term, academic_year, total_amount, currency_id, description) VALUES
-- (1, 'Term 1', '2025', 100.00, 1, 'Term 1 Tuition Fee for Form 1A'),
-- (1, 'Term 2', '2025', 100.00, 1, 'Term 2 Tuition Fee for Form 1A'),
-- (1, 'Term 3', '2025', 100.00, 1, 'Term 3 Tuition Fee for Form 1A');

-- INSERT INTO invoice_items (invoice_structure_id, item_name, amount, description) VALUES
-- (1, 'Levy', 50.00, 'General school levy'),
-- (1, 'Sport Fee', 50.00, 'Sports and recreation fee'),
-- (2, 'Levy', 50.00, 'General school levy'),
-- (2, 'Sport Fee', 50.00, 'Sports and recreation fee'),
-- (3, 'Levy', 50.00, 'General school levy'),
-- (3, 'Sport Fee', 50.00, 'Sports and recreation fee');
