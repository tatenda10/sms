-- Migration to update transport_payments table for direct payments
-- This allows transport_fee_id to be NULL for direct payments

-- Make transport_fee_id nullable
ALTER TABLE transport_payments 
MODIFY COLUMN transport_fee_id INT NULL;

-- Add index for better performance on direct payments
CREATE INDEX idx_transport_payments_student_reg ON transport_payments(student_reg_number);
CREATE INDEX idx_transport_payments_payment_date ON transport_payments(payment_date);

-- Add comment to clarify the column usage
ALTER TABLE transport_payments 
MODIFY COLUMN transport_fee_id INT NULL COMMENT 'NULL for direct payments, references transport_fees.id for fee-based payments';
