-- Add academic_year column to additional_fee_structures table
ALTER TABLE additional_fee_structures 
ADD COLUMN academic_year VARCHAR(10) DEFAULT NULL AFTER fee_type;

-- Add index for better performance
CREATE INDEX idx_fee_structures_academic_year ON additional_fee_structures(academic_year);
