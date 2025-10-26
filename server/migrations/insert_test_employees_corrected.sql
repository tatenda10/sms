-- ==========================================
-- INSERT 30 TEST EMPLOYEES FOR PAGINATION TESTING (CORRECTED)
-- ==========================================

-- First, let's check what departments and job titles exist
-- SELECT * FROM departments;
-- SELECT * FROM job_titles;

-- Insert 30 random employees with realistic data using existing department and job title IDs
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
-- Using department_id 2 (Information Technology) and various job titles
('EMP0101', 'John Smith', 'ID001234567', '123 Main Street, City A', 'john.smith@company.com', '+1234567890', 'Male', 2, 8, '2023-01-15', 1, NOW(), NOW(), 0),
('EMP0102', 'Sarah Johnson', 'ID001234568', '456 Oak Avenue, City B', 'sarah.johnson@company.com', '+1234567891', 'Female', 2, 8, '2023-02-20', 1, NOW(), NOW(), 0),
('EMP0103', 'Michael Brown', 'ID001234569', '789 Pine Road, City C', 'michael.brown@company.com', '+1234567892', 'Male', 2, 8, '2023-03-10', 1, NOW(), NOW(), 0),
('EMP0104', 'Emily Davis', 'ID001234570', '321 Elm Street, City D', 'emily.davis@company.com', '+1234567893', 'Female', 2, 8, '2023-04-05', 1, NOW(), NOW(), 0),
('EMP0105', 'David Wilson', 'ID001234571', '654 Maple Lane, City E', 'david.wilson@company.com', '+1234567894', 'Male', 2, 8, '2023-05-12', 1, NOW(), NOW(), 0),

-- Using department_id 10 and job_title_id 17
('EMP0106', 'Lisa Anderson', 'ID001234572', '987 Cedar Drive, City F', 'lisa.anderson@company.com', '+1234567895', 'Female', 10, 17, '2023-01-08', 1, NOW(), NOW(), 0),
('EMP0107', 'Robert Taylor', 'ID001234573', '147 Birch Street, City G', 'robert.taylor@company.com', '+1234567896', 'Male', 10, 17, '2023-02-14', 1, NOW(), NOW(), 0),
('EMP0108', 'Jennifer Martinez', 'ID001234574', '258 Spruce Avenue, City H', 'jennifer.martinez@company.com', '+1234567897', 'Female', 10, 17, '2023-03-22', 1, NOW(), NOW(), 0),
('EMP0109', 'Christopher Lee', 'ID001234575', '369 Willow Road, City I', 'christopher.lee@company.com', '+1234567898', 'Male', 10, 17, '2023-04-18', 1, NOW(), NOW(), 0),
('EMP0110', 'Amanda Garcia', 'ID001234576', '741 Poplar Lane, City J', 'amanda.garcia@company.com', '+1234567899', 'Female', 10, 17, '2023-05-25', 1, NOW(), NOW(), 0),

-- Mix of department 2 and 10 with job titles 8 and 17
('EMP0111', 'James Rodriguez', 'ID001234577', '852 Ash Drive, City K', 'james.rodriguez@company.com', '+1234567900', 'Male', 2, 8, '2023-06-03', 1, NOW(), NOW(), 0),
('EMP0112', 'Michelle White', 'ID001234578', '963 Hickory Street, City L', 'michelle.white@company.com', '+1234567901', 'Female', 10, 17, '2023-07-11', 1, NOW(), NOW(), 0),
('EMP0113', 'Daniel Harris', 'ID001234579', '159 Cherry Avenue, City M', 'daniel.harris@company.com', '+1234567902', 'Male', 2, 8, '2023-08-19', 1, NOW(), NOW(), 0),
('EMP0114', 'Ashley Clark', 'ID001234580', '357 Walnut Road, City N', 'ashley.clark@company.com', '+1234567903', 'Female', 10, 17, '2023-02-28', 1, NOW(), NOW(), 0),
('EMP0115', 'Matthew Lewis', 'ID001234581', '468 Chestnut Lane, City O', 'matthew.lewis@company.com', '+1234567904', 'Male', 2, 8, '2023-03-15', 1, NOW(), NOW(), 0),

('EMP0116', 'Jessica Walker', 'ID001234582', '579 Sycamore Drive, City P', 'jessica.walker@company.com', '+1234567905', 'Female', 10, 17, '2023-04-22', 1, NOW(), NOW(), 0),
('EMP0117', 'Andrew Hall', 'ID001234583', '680 Dogwood Street, City Q', 'andrew.hall@company.com', '+1234567906', 'Male', 2, 8, '2023-05-30', 1, NOW(), NOW(), 0),
('EMP0118', 'Stephanie Young', 'ID001234584', '791 Magnolia Avenue, City R', 'stephanie.young@company.com', '+1234567907', 'Female', 10, 17, '2023-01-25', 1, NOW(), NOW(), 0),
('EMP0119', 'Kevin King', 'ID001234585', '802 Redwood Road, City S', 'kevin.king@company.com', '+1234567908', 'Male', 2, 8, '2023-02-12', 1, NOW(), NOW(), 0),
('EMP0120', 'Nicole Wright', 'ID001234586', '913 Cypress Lane, City T', 'nicole.wright@company.com', '+1234567909', 'Female', 10, 17, '2023-03-28', 1, NOW(), NOW(), 0),

('EMP0121', 'Ryan Lopez', 'ID001234587', '024 Fir Drive, City U', 'ryan.lopez@company.com', '+1234567910', 'Male', 2, 8, '2023-04-05', 1, NOW(), NOW(), 0),
('EMP0122', 'Samantha Hill', 'ID001234588', '135 Hemlock Street, City V', 'samantha.hill@company.com', '+1234567911', 'Female', 10, 17, '2023-05-13', 1, NOW(), NOW(), 0),
('EMP0123', 'Brandon Scott', 'ID001234589', '246 Juniper Avenue, City W', 'brandon.scott@company.com', '+1234567912', 'Male', 2, 8, '2023-06-20', 1, NOW(), NOW(), 0),
('EMP0124', 'Rachel Green', 'ID001234590', '357 Cedar Road, City X', 'rachel.green@company.com', '+1234567913', 'Female', 10, 17, '2023-07-08', 1, NOW(), NOW(), 0),
('EMP0125', 'Tyler Adams', 'ID001234591', '468 Pine Lane, City Y', 'tyler.adams@company.com', '+1234567914', 'Male', 2, 8, '2023-08-15', 1, NOW(), NOW(), 0),

('EMP0126', 'Lauren Baker', 'ID001234592', '579 Oak Drive, City Z', 'lauren.baker@company.com', '+1234567915', 'Female', 10, 17, '2023-09-02', 1, NOW(), NOW(), 0),
('EMP0127', 'Justin Nelson', 'ID001234593', '680 Maple Street, City AA', 'justin.nelson@company.com', '+1234567916', 'Male', 2, 8, '2023-10-10', 1, NOW(), NOW(), 0),
('EMP0128', 'Megan Carter', 'ID001234594', '791 Elm Avenue, City BB', 'megan.carter@company.com', '+1234567917', 'Female', 10, 17, '2023-11-17', 1, NOW(), NOW(), 0),
('EMP0129', 'Jordan Mitchell', 'ID001234595', '802 Birch Road, City CC', 'jordan.mitchell@company.com', '+1234567918', 'Male', 2, 8, '2023-12-05', 1, NOW(), NOW(), 0),
('EMP0130', 'Kayla Perez', 'ID001234596', '913 Willow Lane, City DD', 'kayla.perez@company.com', '+1234567919', 'Female', 10, 17, '2024-01-12', 1, NOW(), NOW(), 0);

-- Insert some sample bank accounts for a few employees (using the new employee IDs)
-- Note: These will reference the auto-generated IDs from the employees table
-- You may need to adjust these based on the actual IDs generated

-- Get the last 30 employee IDs and create bank accounts for some of them
INSERT INTO employee_bank_accounts (
  employee_id, 
  bank_name, 
  account_number, 
  currency, 
  is_primary, 
  is_active, 
  created_at, 
  updated_at
) 
SELECT 
  e.id,
  CONCAT('Bank ', e.employee_id),
  CONCAT('ACC', e.employee_id),
  'USD',
  1,
  1,
  NOW(),
  NOW()
FROM employees e 
WHERE e.employee_id IN ('EMP0101', 'EMP0102', 'EMP0103', 'EMP0104', 'EMP0105', 'EMP0106', 'EMP0107', 'EMP0108', 'EMP0109', 'EMP0110')
ORDER BY e.id
LIMIT 10;
