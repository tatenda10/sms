-- Employee Management System Database Schema
-- Created for comprehensive employee management with departments, titles, and bank information

-- ==========================================
-- CONFIGURATION TABLES (Departments & Titles)
-- ==========================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job titles table
CREATE TABLE IF NOT EXISTS job_titles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- EMPLOYEE TABLES
-- ==========================================

-- Main employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  email VARCHAR(100) UNIQUE,
  phone_number VARCHAR(20),
  department_id INT,
  job_title_id INT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL,
  
  -- Indexes for better performance
  INDEX idx_employee_id (employee_id),
  INDEX idx_id_number (id_number),
  INDEX idx_email (email),
  INDEX idx_department (department_id),
  INDEX idx_job_title (job_title_id),
  INDEX idx_active (is_active)
);

-- Employee bank accounts table
CREATE TABLE IF NOT EXISTS employee_bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_employee_bank (employee_id),
  INDEX idx_primary_account (employee_id, is_primary),
  
  -- Unique constraint to prevent duplicate accounts
  UNIQUE KEY unique_employee_account (employee_id, account_number, bank_name)
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert default departments
INSERT IGNORE INTO departments (name, description) VALUES 
('Human Resources', 'Manages employee relations, policies, and benefits'),
('Information Technology', 'Manages technology infrastructure and software development'),
('Finance', 'Handles financial planning, accounting, and budgeting'),
('Marketing', 'Manages marketing campaigns and brand promotion'),
('Operations', 'Oversees daily business operations and processes'),
('Sales', 'Manages sales activities and customer relationships'),
('Administration', 'Handles administrative tasks and office management');

-- Insert default job titles
INSERT IGNORE INTO job_titles (title, description) VALUES 
('Manager', 'Supervises team members and manages departmental operations'),
('Senior Developer', 'Experienced software developer with leadership responsibilities'),
('Developer', 'Software developer responsible for coding and development tasks'),
('Analyst', 'Analyzes data and provides insights for business decisions'),
('Coordinator', 'Coordinates activities and manages project timelines'),
('Specialist', 'Subject matter expert in a specific field or technology'),
('Assistant', 'Provides administrative and operational support'),
('Director', 'High-level executive responsible for strategic decisions'),
('Supervisor', 'Oversees daily operations and supervises team members'),
('Intern', 'Entry-level position for gaining work experience');

-- ==========================================
-- CURRENCY OPTIONS (for reference)
-- ==========================================

-- Common currencies that can be used in the system
-- USD - US Dollar
-- EUR - Euro
-- GBP - British Pound
-- CAD - Canadian Dollar
-- AUD - Australian Dollar
-- ZAR - South African Rand
-- KES - Kenyan Shilling
-- NGN - Nigerian Naira

-- ==========================================
-- TRIGGERS (Optional - for audit trail)
-- ==========================================

-- Trigger to ensure only one primary bank account per employee
DELIMITER //
CREATE TRIGGER IF NOT EXISTS ensure_single_primary_account 
BEFORE INSERT ON employee_bank_accounts
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE employee_bank_accounts 
    SET is_primary = FALSE 
    WHERE employee_id = NEW.employee_id AND is_primary = TRUE;
  END IF;
END//

CREATE TRIGGER IF NOT EXISTS ensure_single_primary_account_update
BEFORE UPDATE ON employee_bank_accounts
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE AND OLD.is_primary = FALSE THEN
    UPDATE employee_bank_accounts 
    SET is_primary = FALSE 
    WHERE employee_id = NEW.employee_id AND id != NEW.id AND is_primary = TRUE;
  END IF;
END//
DELIMITER ;

-- ==========================================
-- SAMPLE QUERIES (for testing)
-- ==========================================

-- Get employee with department and job title
-- SELECT 
--   e.id, e.employee_id, e.full_name, e.email, e.phone_number,
--   d.name as department_name, 
--   jt.title as job_title,
--   ba.bank_name, ba.account_number, ba.currency
-- FROM employees e
-- LEFT JOIN departments d ON e.department_id = d.id
-- LEFT JOIN job_titles jt ON e.job_title_id = jt.id
-- LEFT JOIN employee_bank_accounts ba ON e.id = ba.employee_id AND ba.is_primary = TRUE
-- WHERE e.is_active = TRUE;

-- Get all bank accounts for an employee
-- SELECT * FROM employee_bank_accounts WHERE employee_id = ? ORDER BY is_primary DESC;

-- Get employees by department
-- SELECT e.*, d.name as department_name 
-- FROM employees e 
-- JOIN departments d ON e.department_id = d.id 
-- WHERE d.name = 'Information Technology';
