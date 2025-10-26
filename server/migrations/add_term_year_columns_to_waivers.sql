-- ==========================================
-- ADD TERM AND ACADEMIC YEAR COLUMNS TO WAIVERS
-- ==========================================

-- Add term and academic_year columns to student_transactions table
-- for better waiver tracking and filtering

ALTER TABLE student_transactions 
ADD COLUMN term VARCHAR(20) NULL AFTER description,
ADD COLUMN academic_year VARCHAR(10) NULL AFTER term;

-- Add index for better query performance
CREATE INDEX idx_student_transactions_term_year ON student_transactions(term, academic_year);

-- Add index for waiver queries (transactions with "Fee Waiver" in description)
CREATE INDEX idx_student_transactions_waiver ON student_transactions(description(50)) 
WHERE description LIKE '%Fee Waiver%';

-- Update existing waiver records to extract term and year from description
-- This will populate the new columns with data from existing waivers
UPDATE student_transactions 
SET 
  term = CASE 
    WHEN description LIKE '%Term: Term 1%' THEN 'Term 1'
    WHEN description LIKE '%Term: Term 2%' THEN 'Term 2'
    WHEN description LIKE '%Term: Term 3%' THEN 'Term 3'
    ELSE NULL
  END,
  academic_year = CASE 
    WHEN description REGEXP 'Year: [0-9]{4}' THEN 
      SUBSTRING(description, LOCATE('Year: ', description) + 6, 4)
    ELSE NULL
  END
WHERE description LIKE '%Fee Waiver%';

-- Add comments to document the new columns
ALTER TABLE student_transactions 
MODIFY COLUMN term VARCHAR(20) NULL COMMENT 'Academic term for waiver transactions',
MODIFY COLUMN academic_year VARCHAR(10) NULL COMMENT 'Academic year for waiver transactions';
