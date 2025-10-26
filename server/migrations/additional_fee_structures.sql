-- ==========================================
-- ADDITIONAL FEE STRUCTURES SYSTEM
-- ==========================================

-- 1. Fee Structures table (for non-invoice fees)
CREATE TABLE IF NOT EXISTS additional_fee_structures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fee_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  fee_type ENUM('annual', 'one_time') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  
  -- Indexes for better performance
  INDEX idx_fee_structures_type (fee_type),
  INDEX idx_fee_structures_active (is_active)
);

-- 2. Student Fee Assignments table (links students to specific fees)
CREATE TABLE IF NOT EXISTS student_fee_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(50) NOT NULL,
  fee_structure_id INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) DEFAULT NULL, -- NULL for annual fees, specific term for one-time fees
  amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  due_date DATE,
  status ENUM('pending', 'paid', 'partial', 'overdue', 'waived') DEFAULT 'pending',
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  assigned_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES additional_fee_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate assignments
  UNIQUE KEY unique_student_fee_year (student_reg_number, fee_structure_id, academic_year),
  
  -- Indexes for better performance
  INDEX idx_student_assignments_student (student_reg_number),
  INDEX idx_student_assignments_fee (fee_structure_id),
  INDEX idx_student_assignments_status (status),
  INDEX idx_student_assignments_due_date (due_date)
);

-- 3. Additional Fee Payments table (tracks payments for these fees)
CREATE TABLE IF NOT EXISTS additional_fee_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(50) NOT NULL,
  fee_assignment_id INT NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  base_currency_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other') NOT NULL,
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  receipt_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  FOREIGN KEY (fee_assignment_id) REFERENCES student_fee_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  
  -- Indexes for better performance
  INDEX idx_additional_payments_student (student_reg_number),
  INDEX idx_additional_payments_assignment (fee_assignment_id),
  INDEX idx_additional_payments_date (payment_date),
  INDEX idx_additional_payments_reference (reference_number),
  INDEX idx_additional_payments_receipt (receipt_number)
);

-- ==========================================
-- INSERT DEFAULT FEE STRUCTURES
-- ==========================================

-- Insert the 3 default fee structures
INSERT INTO additional_fee_structures (fee_name, description, amount, currency_id, fee_type) VALUES
('Textbook Fees', 'Annual textbook and learning materials fee', 35.00, 1, 'annual'),
('Registration Fees', 'One-time registration fee for new students', 30.00, 1, 'one_time')

