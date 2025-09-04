-- =====================================================
-- UPDATE BOARDING FEES SCHEMA
-- =====================================================
-- This migration updates the boarding_fees table to remove room_type
-- and change the billing structure from per-room to per-hostel
-- =====================================================

-- First, drop any existing unique constraints that include room_type
-- (This will fail if the constraint doesn't exist, but that's okay)
ALTER TABLE boarding_fees DROP INDEX unique_boarding_fee;

-- Drop the room_type column
ALTER TABLE boarding_fees DROP COLUMN room_type;

-- Add new unique constraint for hostel, term, and academic year
ALTER TABLE boarding_fees ADD CONSTRAINT unique_boarding_fee 
UNIQUE KEY (hostel_id, term, academic_year);

-- Update any existing indexes to remove room_type reference
-- (This will fail if the index doesn't exist, but that's okay)
DROP INDEX idx_boarding_fees_room_type ON boarding_fees;

-- Add new index for better query performance
CREATE INDEX idx_boarding_fees_hostel_term_year ON boarding_fees (hostel_id, term, academic_year);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the table structure after migration:
-- DESCRIBE boarding_fees;
-- 
-- Expected result should show:
-- - id (int, AI, PK)
-- - hostel_id (int)
-- - term (varchar(20))
-- - academic_year (varchar(10))
-- - amount (decimal(10,2))
-- - currency_id (int)
-- - is_active (tinyint(1))
-- - created_at (timestamp)
-- - updated_at (timestamp)
-- - created_by (int)
-- - updated_by (int)
-- =====================================================
