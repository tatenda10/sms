-- ==========================================
-- ADD TERM AND ACADEMIC YEAR TO WAIVER TRACKING
-- ==========================================

-- Add term and academic_year columns to student_transactions for waiver tracking
-- We'll use the description field to store this information in a structured way
-- This migration is for documentation - the actual implementation will be in the controller

-- The waiver description will now follow this format:
-- "Fee Waiver - [Category]: [Reason] | Term: [Term] | Year: [Year]"

-- Example: "Fee Waiver - Staff Child: Parent is school employee | Term: Term 1 | Year: 2025"

-- This approach allows us to:
-- 1. Keep existing data intact
-- 2. Add term/year information to new waivers
-- 3. Parse the information for display and filtering
-- 4. Maintain backward compatibility

-- No actual schema changes needed as we're using the existing description field
-- The parsing logic will be implemented in the controller
