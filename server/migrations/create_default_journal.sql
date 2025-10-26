-- Migration: Create all standard journals for the accounting system
-- This ensures all necessary journals exist for proper transaction categorization

-- Create all standard journals if they don't exist
INSERT IGNORE INTO journals (id, name, description, is_active, created_at, updated_at) VALUES 
(1, 'General Journal', 'All general and adjusting transactions, including corrections and non-routine entries.', 1, NOW(), NOW()),
(2, 'Cash Receipts Journal', 'All cash received by the school, including tuition, boarding fees, donations, and other income.', 1, NOW(), NOW()),
(3, 'Cash Payments Journal', 'All cash paid out by the school, including expenses, supplier payments, and salaries.', 1, NOW(), NOW()),
(4, 'Bank Receipts Journal', 'All money received directly into the bank account, such as grants and transfers.', 1, NOW(), NOW()),
(5, 'Bank Payments Journal', 'All payments made from the bank account, including supplier payments and salaries.', 1, NOW(), NOW()),
(6, 'Fees Journal', 'All student fee-related transactions, including tuition, exam fees, and boarding fees.', 1, NOW(), NOW()),
(7, 'Petty Cash Journal', 'Small cash transactions and petty cash management.', 1, NOW(), NOW());

-- Verify all journals were created
SELECT * FROM journals ORDER BY id;
