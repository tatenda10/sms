-- ==========================================
-- INSERT 30 TEST EMPLOYEES FOR PAGINATION TESTING
-- ==========================================

-- Insert 30 random employees with realistic data
INSERT INTO employees (
  employee_id, 
  full_name, 
  id_number, 
  address, 
  email, 
  phone_number, 
  gender, 
  department_id, 
  job_title_id, 
  hire_date, 
  is_active, 
  created_at, 
  updated_at,
  password_set
) VALUES
-- Department 1 (Human Resources) - 5 employees
('EMP0081', 'John Smith', 'ID001234567', '123 Main Street, City A', 'john.smith@company.com', '+1234567890', 'Male', 1, 1, '2023-01-15', 1, NOW(), NOW(), 0),
('EMP0082', 'Sarah Johnson', 'ID001234568', '456 Oak Avenue, City B', 'sarah.johnson@company.com', '+1234567891', 'Female', 1, 2, '2023-02-20', 1, NOW(), NOW(), 0),
('EMP0003', 'Michael Brown', 'ID001234569', '789 Pine Road, City C', 'michael.brown@company.com', '+1234567892', 'Male', 1, 3, '2023-03-10', 1, NOW(), NOW(), 0),
('EMP0004', 'Emily Davis', 'ID001234570', '321 Elm Street, City D', 'emily.davis@company.com', '+1234567893', 'Female', 1, 4, '2023-04-05', 1, NOW(), NOW(), 0),
('EMP0005', 'David Wilson', 'ID001234571', '654 Maple Lane, City E', 'david.wilson@company.com', '+1234567894', 'Male', 1, 5, '2023-05-12', 1, NOW(), NOW(), 0),

-- Department 2 (Information Technology) - 8 employees
('EMP0006', 'Lisa Anderson', 'ID001234572', '987 Cedar Drive, City F', 'lisa.anderson@company.com', '+1234567895', 'Female', 2, 6, '2023-01-08', 1, NOW(), NOW(), 0),
('EMP0007', 'Robert Taylor', 'ID001234573', '147 Birch Street, City G', 'robert.taylor@company.com', '+1234567896', 'Male', 2, 7, '2023-02-14', 1, NOW(), NOW(), 0),
('EMP0008', 'Jennifer Martinez', 'ID001234574', '258 Spruce Avenue, City H', 'jennifer.martinez@company.com', '+1234567897', 'Female', 2, 8, '2023-03-22', 1, NOW(), NOW(), 0),
('EMP0009', 'Christopher Lee', 'ID001234575', '369 Willow Road, City I', 'christopher.lee@company.com', '+1234567898', 'Male', 2, 9, '2023-04-18', 1, NOW(), NOW(), 0),
('EMP0010', 'Amanda Garcia', 'ID001234576', '741 Poplar Lane, City J', 'amanda.garcia@company.com', '+1234567899', 'Female', 2, 10, '2023-05-25', 1, NOW(), NOW(), 0),
('EMP0011', 'James Rodriguez', 'ID001234577', '852 Ash Drive, City K', 'james.rodriguez@company.com', '+1234567900', 'Male', 2, 1, '2023-06-03', 1, NOW(), NOW(), 0),
('EMP0012', 'Michelle White', 'ID001234578', '963 Hickory Street, City L', 'michelle.white@company.com', '+1234567901', 'Female', 2, 2, '2023-07-11', 1, NOW(), NOW(), 0),
('EMP0013', 'Daniel Harris', 'ID001234579', '159 Cherry Avenue, City M', 'daniel.harris@company.com', '+1234567902', 'Male', 2, 3, '2023-08-19', 1, NOW(), NOW(), 0),

-- Department 3 (Finance) - 4 employees
('EMP0014', 'Ashley Clark', 'ID001234580', '357 Walnut Road, City N', 'ashley.clark@company.com', '+1234567903', 'Female', 3, 4, '2023-02-28', 1, NOW(), NOW(), 0),
('EMP0015', 'Matthew Lewis', 'ID001234581', '468 Chestnut Lane, City O', 'matthew.lewis@company.com', '+1234567904', 'Male', 3, 5, '2023-03-15', 1, NOW(), NOW(), 0),
('EMP0016', 'Jessica Walker', 'ID001234582', '579 Sycamore Drive, City P', 'jessica.walker@company.com', '+1234567905', 'Female', 3, 6, '2023-04-22', 1, NOW(), NOW(), 0),
('EMP0017', 'Andrew Hall', 'ID001234583', '680 Dogwood Street, City Q', 'andrew.hall@company.com', '+1234567906', 'Male', 3, 7, '2023-05-30', 1, NOW(), NOW(), 0),

-- Department 4 (Marketing) - 3 employees
('EMP0018', 'Stephanie Young', 'ID001234584', '791 Magnolia Avenue, City R', 'stephanie.young@company.com', '+1234567907', 'Female', 4, 8, '2023-01-25', 1, NOW(), NOW(), 0),
('EMP0019', 'Kevin King', 'ID001234585', '802 Redwood Road, City S', 'kevin.king@company.com', '+1234567908', 'Male', 4, 9, '2023-02-12', 1, NOW(), NOW(), 0),
('EMP0020', 'Nicole Wright', 'ID001234586', '913 Cypress Lane, City T', 'nicole.wright@company.com', '+1234567909', 'Female', 4, 10, '2023-03-28', 1, NOW(), NOW(), 0),

-- Department 5 (Operations) - 4 employees
('EMP0021', 'Ryan Lopez', 'ID001234587', '024 Fir Drive, City U', 'ryan.lopez@company.com', '+1234567910', 'Male', 5, 1, '2023-04-05', 1, NOW(), NOW(), 0),
('EMP0022', 'Samantha Hill', 'ID001234588', '135 Hemlock Street, City V', 'samantha.hill@company.com', '+1234567911', 'Female', 5, 2, '2023-05-13', 1, NOW(), NOW(), 0),
('EMP0023', 'Brandon Scott', 'ID001234589', '246 Juniper Avenue, City W', 'brandon.scott@company.com', '+1234567912', 'Male', 5, 3, '2023-06-20', 1, NOW(), NOW(), 0),
('EMP0024', 'Rachel Green', 'ID001234590', '357 Cedar Road, City X', 'rachel.green@company.com', '+1234567913', 'Female', 5, 4, '2023-07-08', 1, NOW(), NOW(), 0),

-- Department 6 (Sales) - 3 employees
('EMP0025', 'Tyler Adams', 'ID001234591', '468 Pine Lane, City Y', 'tyler.adams@company.com', '+1234567914', 'Male', 6, 5, '2023-08-15', 1, NOW(), NOW(), 0),
('EMP0026', 'Lauren Baker', 'ID001234592', '579 Oak Drive, City Z', 'lauren.baker@company.com', '+1234567915', 'Female', 6, 6, '2023-09-02', 1, NOW(), NOW(), 0),
('EMP0027', 'Justin Nelson', 'ID001234593', '680 Maple Street, City AA', 'justin.nelson@company.com', '+1234567916', 'Male', 6, 7, '2023-10-10', 1, NOW(), NOW(), 0),

-- Department 7 (Administration) - 3 employees
('EMP0028', 'Megan Carter', 'ID001234594', '791 Elm Avenue, City BB', 'megan.carter@company.com', '+1234567917', 'Female', 7, 8, '2023-11-17', 1, NOW(), NOW(), 0),
('EMP0029', 'Jordan Mitchell', 'ID001234595', '802 Birch Road, City CC', 'jordan.mitchell@company.com', '+1234567918', 'Male', 7, 9, '2023-12-05', 1, NOW(), NOW(), 0),
('EMP0030', 'Kayla Perez', 'ID001234596', '913 Willow Lane, City DD', 'kayla.perez@company.com', '+1234567919', 'Female', 7, 10, '2024-01-12', 1, NOW(), NOW(), 0);

-- Insert some sample bank accounts for a few employees
INSERT INTO employee_bank_accounts (
  employee_id, 
  bank_name, 
  account_number, 
  currency, 
  is_primary, 
  is_active, 
  created_at, 
  updated_at
) VALUES
-- Bank accounts for first 10 employees
(1, 'First National Bank', 'ACC001234567', 'USD', 1, 1, NOW(), NOW()),
(2, 'City Bank', 'ACC001234568', 'USD', 1, 1, NOW(), NOW()),
(3, 'Metro Credit Union', 'ACC001234569', 'USD', 1, 1, NOW(), NOW()),
(4, 'Regional Bank', 'ACC001234570', 'USD', 1, 1, NOW(), NOW()),
(5, 'Community Bank', 'ACC001234571', 'USD', 1, 1, NOW(), NOW()),
(6, 'Tech Credit Union', 'ACC001234572', 'USD', 1, 1, NOW(), NOW()),
(7, 'Digital Bank', 'ACC001234573', 'USD', 1, 1, NOW(), NOW()),
(8, 'Innovation Bank', 'ACC001234574', 'USD', 1, 1, NOW(), NOW()),
(9, 'Future Bank', 'ACC001234575', 'USD', 1, 1, NOW(), NOW()),
(10, 'NextGen Credit Union', 'ACC001234576', 'USD', 1, 1, NOW(), NOW());

-- Add some secondary bank accounts for a few employees
INSERT INTO employee_bank_accounts (
  employee_id, 
  bank_name, 
  account_number, 
  currency, 
  is_primary, 
  is_active, 
  created_at, 
  updated_at
) VALUES
(1, 'Savings Bank', 'SAV001234567', 'USD', 0, 1, NOW(), NOW()),
(2, 'Investment Bank', 'INV001234568', 'USD', 0, 1, NOW(), NOW()),
(6, 'Tech Savings', 'TECH001234572', 'USD', 0, 1, NOW(), NOW()),
(7, 'Digital Savings', 'DIG001234573', 'USD', 0, 1, NOW(), NOW());
