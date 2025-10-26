-- ==========================================
-- ADD GENDER COLUMN TO EMPLOYEES TABLE
-- ==========================================

-- Add gender column to employees table
ALTER TABLE employees 
ADD COLUMN gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NULL AFTER phone_number;

-- Add index for gender filtering
CREATE INDEX idx_employees_gender ON employees(gender);

-- Add comment to document the new column
ALTER TABLE employees 
MODIFY COLUMN gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NULL 
COMMENT 'Employee gender for demographic tracking and reporting';
