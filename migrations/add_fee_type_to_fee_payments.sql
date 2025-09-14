-- Add fee_type column to fee_payments table
ALTER TABLE fee_payments 
ADD COLUMN fee_type VARCHAR(50) NOT NULL DEFAULT 'tuition' 
COMMENT 'Type of fee: tuition, boarding, transport, other';

-- Add index for better performance
CREATE INDEX idx_fee_payments_fee_type ON fee_payments(fee_type);
