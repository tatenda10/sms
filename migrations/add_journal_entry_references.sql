-- Migration: Add journal_entry_id references to transaction tables
-- This enables proper double-entry bookkeeping by linking transactions to journal entries

-- Add journal_entry_id to fee_payments table
ALTER TABLE fee_payments 
ADD COLUMN journal_entry_id INT NULL AFTER id,
ADD INDEX idx_journal_entry_id (journal_entry_id),
ADD CONSTRAINT fk_fee_payments_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) 
    ON DELETE SET NULL;

-- Add journal_entry_id to student_transactions table
ALTER TABLE student_transactions 
ADD COLUMN journal_entry_id INT NULL AFTER id,
ADD INDEX idx_journal_entry_id (journal_entry_id),
ADD CONSTRAINT fk_student_transactions_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) 
    ON DELETE SET NULL;

-- Add journal_entry_id to boarding_fees_payments table
ALTER TABLE boarding_fees_payments 
ADD COLUMN journal_entry_id INT NULL AFTER id,
ADD INDEX idx_journal_entry_id (journal_entry_id),
ADD CONSTRAINT fk_boarding_fees_payments_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) 
    ON DELETE SET NULL;

-- Create default journal if it doesn't exist
INSERT IGNORE INTO journals (id, name, description, is_active, created_at, updated_at) 
VALUES (1, 'General Journal', 'Default journal for system transactions', 1, NOW(), NOW());
