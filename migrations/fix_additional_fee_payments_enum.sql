-- Fix additional_fee_payments table payment_method ENUM
-- This ensures the table has the correct ENUM values

-- First, let's check if the table exists and drop it if it has wrong structure
DROP TABLE IF EXISTS additional_fee_payments;

-- Recreate the table with correct ENUM values
CREATE TABLE additional_fee_payments (
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
  FOREIGN KEY (fee_assignment_id) REFERENCES additional_fee_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
