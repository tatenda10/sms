-- Add Fixed Assets Chart of Accounts
-- This migration adds all necessary accounts for tracking fixed assets

-- FIXED ASSETS (Asset accounts)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1500', 'Land', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Land';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1510', 'Buildings & Improvements', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Buildings & Improvements';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1520', 'Vehicles', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Vehicles';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1530', 'Furniture & Fixtures', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Furniture & Fixtures';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1540', 'Computer Equipment', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Computer Equipment';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1550', 'Office Equipment', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Office Equipment';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1555', 'Laboratory Equipment', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Laboratory Equipment';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1558', 'Sports Equipment', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Sports Equipment';

-- ACCUMULATED DEPRECIATION (Contra-Asset accounts)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1560', 'Accumulated Depreciation - Buildings', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Accumulated Depreciation - Buildings';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1570', 'Accumulated Depreciation - Vehicles', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Accumulated Depreciation - Vehicles';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1580', 'Accumulated Depreciation - Furniture', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Accumulated Depreciation - Furniture';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('1590', 'Accumulated Depreciation - Equipment', 'Asset', 1)
ON DUPLICATE KEY UPDATE name = 'Accumulated Depreciation - Equipment';

-- DEPRECIATION EXPENSE (Expense accounts)
INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5400', 'Depreciation Expense', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Depreciation Expense';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5410', 'Depreciation - Buildings', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Depreciation - Buildings';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5420', 'Depreciation - Vehicles', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Depreciation - Vehicles';

INSERT IGNORE INTO chart_of_accounts (code, name, type, is_active)
VALUES ('5430', 'Depreciation - Furniture & Equipment', 'Expense', 1)
ON DUPLICATE KEY UPDATE name = 'Depreciation - Furniture & Equipment';

