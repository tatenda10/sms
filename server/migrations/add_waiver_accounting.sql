-- Add Waiver Accounting Support
-- This migration adds proper accounting for fee waivers/scholarships

-- 1. Add Waiver Expense accounts to Chart of Accounts
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5500', 'Waiver Expense - Tuition', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Waiver Expense - Tuition';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5510', 'Waiver Expense - Boarding', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Waiver Expense - Boarding';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5520', 'Waiver Expense - Transport', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Waiver Expense - Transport';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5530', 'Waiver Expense - Uniform', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Waiver Expense - Uniform';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5540', 'Waiver Expense - Other Fees', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Waiver Expense - Other Fees';

-- 2. Create waivers table for better tracking
CREATE TABLE IF NOT EXISTS waivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_reg_number VARCHAR(50) NOT NULL,
  category_id INT NOT NULL,
  waiver_amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL DEFAULT 1,
  waiver_type ENUM('Tuition', 'Boarding', 'Transport', 'Uniform', 'Other') DEFAULT 'Tuition',
  reason TEXT NOT NULL,
  notes TEXT,
  term VARCHAR(20),
  academic_year VARCHAR(10),
  
  -- Accounting links
  journal_entry_id INT NULL,
  student_transaction_id INT,
  
  -- Metadata
  granted_by INT NOT NULL,
  granted_date DATE NOT NULL,
  status ENUM('Active', 'Reversed', 'Cancelled') DEFAULT 'Active',
  reversal_reason TEXT NULL,
  reversed_at DATETIME NULL,
  reversed_by INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES waiver_categories(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (student_transaction_id) REFERENCES student_transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  FOREIGN KEY (reversed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_student (student_reg_number),
  INDEX idx_term_year (term, academic_year),
  INDEX idx_status (status),
  INDEX idx_granted_date (granted_date),
  INDEX idx_waiver_type (waiver_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Migrate existing waivers from student_transactions
-- Find all transactions that look like waivers and create proper waiver records
INSERT INTO waivers (
  student_reg_number,
  category_id,
  waiver_amount,
  currency_id,
  waiver_type,
  reason,
  term,
  academic_year,
  student_transaction_id,
  granted_by,
  granted_date,
  created_at
)
SELECT 
  st.student_reg_number,
  1, -- Default to first category, adjust manually if needed
  st.amount,
  COALESCE(st.currency_id, 1),
  'Tuition', -- Default type
  st.description,
  st.term,
  st.academic_year,
  st.id,
  st.created_by,
  DATE(st.transaction_date),
  st.created_at
FROM student_transactions st
WHERE st.description LIKE '%Fee Waiver%'
  AND st.transaction_type = 'CREDIT'
  AND NOT EXISTS (
    SELECT 1 FROM waivers w WHERE w.student_transaction_id = st.id
  );

