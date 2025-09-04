-- Migration: Remove Student Balance Triggers
-- This migration removes the database triggers since we're now using JavaScript functions

-- Drop the triggers
DROP TRIGGER IF EXISTS update_balance_on_transaction;
DROP TRIGGER IF EXISTS update_balance_on_transaction_update;
DROP TRIGGER IF EXISTS update_balance_on_transaction_delete;

-- Verify triggers are removed
SHOW TRIGGERS LIKE 'student_transactions';
