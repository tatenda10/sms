-- Migration: Add Missing Chart of Accounts
-- This migration adds all accounts required by the system that are currently missing
-- Date: 2025-10-28

-- Asset Accounts (1510-1550)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active) VALUES 
('1510', 'Buildings & Improvements', 'Asset', TRUE),
('1520', 'Vehicles', 'Asset', TRUE),
('1530', 'Furniture & Fixtures', 'Asset', TRUE),
('1540', 'Computer Equipment', 'Asset', TRUE),
('1550', 'Office Equipment', 'Asset', TRUE);

-- Liability Accounts (2201-2203) - Payroll Tax Accounts
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active) VALUES 
('2201', 'PAYE Payable', 'Liability', TRUE),
('2202', 'NHIF Payable', 'Liability', TRUE),
('2203', 'NSSF Payable', 'Liability', TRUE);

-- Revenue Accounts (4100-4900)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active) VALUES 
('4100', 'Boarding Revenue', 'Revenue', TRUE),
('4200', 'Transport Revenue', 'Revenue', TRUE),
('4300', 'Uniform Sales Revenue', 'Revenue', TRUE),
('4400', 'Additional Fees Revenue', 'Revenue', TRUE),
('4900', 'Other Revenue', 'Revenue', TRUE);

-- Expense Accounts (5200-5900)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active) VALUES 
('5200', 'Maintenance & Repairs', 'Expense', TRUE),
('5300', 'Office Supplies', 'Expense', TRUE),
('5400', 'Transportation Expenses', 'Expense', TRUE),
('5500', 'Marketing & Advertising', 'Expense', TRUE),
('5600', 'Professional Fees', 'Expense', TRUE),
('5700', 'Insurance', 'Expense', TRUE),
('5800', 'Depreciation', 'Expense', TRUE),
('5900', 'Other Expenses', 'Expense', TRUE);

-- Verify accounts were created
SELECT code, name, type, is_active 
FROM chart_of_accounts 
WHERE code IN ('1510', '1520', '1530', '1540', '1550', 
                '2201', '2202', '2203',
                '4100', '4200', '4300', '4400', '4900',
                '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900')
ORDER BY code;

