-- Add reference column to uniform_issues table
ALTER TABLE uniform_issues 
ADD COLUMN reference VARCHAR(100) NULL AFTER amount;

-- Add index for better performance
CREATE INDEX idx_uniform_issues_reference ON uniform_issues(reference);
