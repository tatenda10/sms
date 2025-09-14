-- Add password fields to employees table for authentication
-- This allows employees to login with their employee number and password

-- Add password and password_set fields to employees table
ALTER TABLE employees 
ADD COLUMN password VARCHAR(255) NULL,
ADD COLUMN password_set BOOLEAN DEFAULT FALSE,
ADD COLUMN last_login TIMESTAMP NULL,
ADD COLUMN password_created_at TIMESTAMP NULL,
ADD COLUMN password_updated_at TIMESTAMP NULL;

-- Add index for employee_id lookups during login
CREATE INDEX idx_employee_login ON employees(employee_id, is_active);

-- Add index for password_set status
CREATE INDEX idx_employee_password_set ON employees(password_set, is_active);

-- Update existing employees to have password_set = FALSE
UPDATE employees SET password_set = FALSE WHERE password_set IS NULL;
