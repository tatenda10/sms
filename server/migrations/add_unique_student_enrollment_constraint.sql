-- Migration: Add unique constraint to prevent duplicate enrollments
-- This ensures that no student can have multiple active enrollments in grade-level classes

-- First, verify there are no duplicates (should be clean after the cleanup script)
-- If there are duplicates, they need to be removed first

-- Add a unique index on student_regnumber to ensure only one enrollment per student
-- This prevents duplicate enrollments regardless of status
ALTER TABLE `enrollments_gradelevel_classes` 
ADD UNIQUE KEY `unique_student_enrollment` (`student_regnumber`);

-- Note: This constraint will prevent any duplicate enrollments.
-- If you need to allow re-enrollment after de-enrollment, you would need to:
-- 1. Update the existing enrollment record instead of creating a new one, OR
-- 2. Use a unique constraint on (student_regnumber, status) and handle status changes in application logic

