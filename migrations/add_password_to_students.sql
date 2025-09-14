-- Add password field to students table
ALTER TABLE students ADD COLUMN password VARCHAR(255) NULL;

-- Add index for better performance
CREATE INDEX idx_students_password ON students(password);

-- Set default password for existing students (registration number)
-- This will be used for first login
UPDATE students SET password = NULL WHERE password IS NULL;
