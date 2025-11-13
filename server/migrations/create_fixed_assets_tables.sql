-- Fixed Assets Management System Tables

-- Table 1: Fixed Asset Types (Dynamic Categories)
CREATE TABLE IF NOT EXISTS fixed_asset_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  chart_of_account_id INT NOT NULL,
  depreciation_account_id INT NULL,
  expense_account_id INT NULL,
  requires_registration BOOLEAN DEFAULT FALSE,
  requires_serial_number BOOLEAN DEFAULT FALSE,
  icon VARCHAR(50) DEFAULT 'faBox',
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (chart_of_account_id) REFERENCES chart_of_accounts(id),
  FOREIGN KEY (depreciation_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: Custom Field Definitions for Asset Types
CREATE TABLE IF NOT EXISTS fixed_asset_custom_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_type_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(100) NOT NULL,
  field_type ENUM('text', 'number', 'date', 'textarea', 'select', 'checkbox') DEFAULT 'text',
  field_options JSON NULL,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_type_id) REFERENCES fixed_asset_types(id) ON DELETE CASCADE,
  
  INDEX idx_asset_type (asset_type_id),
  INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 3: Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_type_id INT NOT NULL,
  asset_code VARCHAR(50) UNIQUE,
  asset_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Purchase Details
  purchase_date DATE NOT NULL,
  total_cost DECIMAL(15,2) NOT NULL,
  supplier_name VARCHAR(255),
  
  -- Standard Fields
  registration_number VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  serial_number VARCHAR(100) NULL,
  
  -- Custom Fields (Dynamic)
  custom_fields JSON NULL,
  
  -- Depreciation (OPTIONAL)
  enable_depreciation BOOLEAN DEFAULT FALSE,
  depreciation_method ENUM('Straight Line', 'Declining Balance', 'Units of Production') NULL,
  useful_life_years INT NULL,
  salvage_value DECIMAL(15,2) DEFAULT 0,
  
  -- Financial Status
  amount_paid DECIMAL(15,2) DEFAULT 0,
  outstanding_balance DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  status ENUM('Active', 'Disposed', 'Lost', 'Damaged', 'Under Repair') DEFAULT 'Active',
  disposal_date DATE NULL,
  disposal_amount DECIMAL(15,2) NULL,
  disposal_notes TEXT NULL,
  
  -- Opening Balance
  is_opening_balance BOOLEAN DEFAULT FALSE,
  opening_balance_date DATE NULL,
  opening_balance_journal_id INT NULL,
  
  -- Attachments
  attachment_urls JSON NULL,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_type_id) REFERENCES fixed_asset_types(id),
  FOREIGN KEY (opening_balance_journal_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_asset_type (asset_type_id),
  INDEX idx_status (status),
  INDEX idx_opening_balance (is_opening_balance),
  INDEX idx_purchase_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 4: Fixed Asset Payments
CREATE TABLE IF NOT EXISTS fixed_asset_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other') DEFAULT 'Bank Transfer',
  payment_account_code VARCHAR(10),
  reference_number VARCHAR(100),
  description TEXT,
  
  journal_entry_id INT NULL,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES fixed_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  INDEX idx_asset (asset_id),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 5: Fixed Asset Depreciation
CREATE TABLE IF NOT EXISTS fixed_asset_depreciation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  
  period_id INT NOT NULL,
  depreciation_date DATE NOT NULL,
  depreciation_amount DECIMAL(15,2) NOT NULL,
  accumulated_depreciation DECIMAL(15,2) NOT NULL,
  net_book_value DECIMAL(15,2) NOT NULL,
  
  journal_entry_id INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES fixed_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES accounting_periods(id),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  INDEX idx_asset (asset_id),
  INDEX idx_period (period_id),
  INDEX idx_date (depreciation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Default Asset Types
INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Land', 'Land and plots', coa_asset.id, NULL, NULL, TRUE, FALSE, 'faLandmark', 1
FROM chart_of_accounts coa_asset
WHERE coa_asset.code = '1500'
LIMIT 1;

INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Buildings', 'Buildings and improvements', coa_asset.id, coa_dep.id, coa_exp.id, FALSE, FALSE, 'faBuilding', 1
FROM chart_of_accounts coa_asset
LEFT JOIN chart_of_accounts coa_dep ON coa_dep.code = '1560'
LEFT JOIN chart_of_accounts coa_exp ON coa_exp.code = '5410'
WHERE coa_asset.code = '1510'
LIMIT 1;

INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Vehicles', 'Cars, buses, trucks', coa_asset.id, coa_dep.id, coa_exp.id, TRUE, FALSE, 'faCar', 1
FROM chart_of_accounts coa_asset
LEFT JOIN chart_of_accounts coa_dep ON coa_dep.code = '1570'
LEFT JOIN chart_of_accounts coa_exp ON coa_exp.code = '5420'
WHERE coa_asset.code = '1520'
LIMIT 1;

INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Furniture', 'Furniture and fixtures', coa_asset.id, coa_dep.id, coa_exp.id, FALSE, FALSE, 'faCouch', 1
FROM chart_of_accounts coa_asset
LEFT JOIN chart_of_accounts coa_dep ON coa_dep.code = '1580'
LEFT JOIN chart_of_accounts coa_exp ON coa_exp.code = '5430'
WHERE coa_asset.code = '1530'
LIMIT 1;

INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Computer Equipment', 'Computers, laptops, printers', coa_asset.id, coa_dep.id, coa_exp.id, FALSE, TRUE, 'faLaptop', 1
FROM chart_of_accounts coa_asset
LEFT JOIN chart_of_accounts coa_dep ON coa_dep.code = '1590'
LEFT JOIN chart_of_accounts coa_exp ON coa_exp.code = '5430'
WHERE coa_asset.code = '1540'
LIMIT 1;

INSERT IGNORE INTO fixed_asset_types (name, description, chart_of_account_id, depreciation_account_id, expense_account_id, requires_registration, requires_serial_number, icon, created_by)
SELECT 'Office Equipment', 'Office equipment and machinery', coa_asset.id, coa_dep.id, coa_exp.id, FALSE, TRUE, 'faPrint', 1
FROM chart_of_accounts coa_asset
LEFT JOIN chart_of_accounts coa_dep ON coa_dep.code = '1590'
LEFT JOIN chart_of_accounts coa_exp ON coa_exp.code = '5430'
WHERE coa_asset.code = '1550'
LIMIT 1;

