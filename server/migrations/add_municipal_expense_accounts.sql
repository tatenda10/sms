-- =====================================================
-- Add Municipal & Government Expense Accounts
-- =====================================================
-- This migration adds expense accounts for municipal rates,
-- property taxes, and government-related fees.
-- 
-- Run with: node run-municipal-accounts-migration.js
-- =====================================================

-- Add Municipal Rates & Taxes account
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5300', 'Municipal Rates & Taxes', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Municipal Rates & Taxes';

-- Add Property Taxes account
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5310', 'Property Taxes', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Property Taxes';

-- Add Government Fees & Licenses account
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5320', 'Government Fees & Licenses', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Government Fees & Licenses';

-- Add Legal & Professional Fees account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5330', 'Legal & Professional Fees', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Legal & Professional Fees';

-- Add Bank Charges & Fees account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5340', 'Bank Charges & Fees', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Bank Charges & Fees';

-- Add Advertising & Marketing account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5350', 'Advertising & Marketing', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Advertising & Marketing';

-- Add Donations & Contributions account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5360', 'Donations & Contributions', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Donations & Contributions';

-- Add Office Supplies account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5370', 'Office Supplies', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Office Supplies';

-- Add Fuel & Vehicle Expenses account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5380', 'Fuel & Vehicle Expenses', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Fuel & Vehicle Expenses';

-- Add Telephone & Communication account (if not exists)
INSERT INTO chart_of_accounts (code, name, type, is_active) 
VALUES ('5390', 'Telephone & Communication', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Telephone & Communication';

-- Display summary
SELECT 
    'Municipal & Government Expense Accounts Added' as Status,
    COUNT(*) as 'New Accounts'
FROM chart_of_accounts 
WHERE code IN ('5300', '5310', '5320', '5330', '5340', '5350', '5360', '5370', '5380', '5390');

