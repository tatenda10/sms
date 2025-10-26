-- =====================================================
-- UPDATE CLASS TERM YEAR CONSTRAINT
-- =====================================================
-- This migration updates the class_term_year table to allow only one record per class
-- =====================================================

-- Remove the current unique constraint that allows multiple records per class
ALTER TABLE class_term_year DROP INDEX unique_class_term_year;

-- Add new constraint to ensure only one record per class
ALTER TABLE class_term_year ADD UNIQUE KEY unique_class_active (gradelevel_class_id);

-- Optional: Clean up any duplicate records if they exist
-- This will keep the most recent record for each class
DELETE cty1 FROM class_term_year cty1
INNER JOIN class_term_year cty2 
WHERE cty1.id < cty2.id 
AND cty1.gradelevel_class_id = cty2.gradelevel_class_id;
