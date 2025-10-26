-- Update gender column to only allow Male and Female
-- This migration updates the gender column to restrict values to only Male and Female

-- First, update any existing records that have 'Other' or 'Prefer not to say' to NULL
UPDATE employees 
SET gender = NULL 
WHERE gender IN ('Other', 'Prefer not to say');

-- Update the column definition to only allow Male and Female
ALTER TABLE employees 
MODIFY COLUMN gender ENUM('Male', 'Female') NULL 
COMMENT 'Employee gender - Male or Female only';

-- Recreate the index
DROP INDEX IF EXISTS idx_employees_gender;
CREATE INDEX idx_employees_gender ON employees(gender);
