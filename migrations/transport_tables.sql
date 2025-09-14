-- Transport Module Database Schema
-- This creates all necessary tables for managing school transport

-- ==========================================
-- TRANSPORT ROUTES
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(100) NOT NULL,
  route_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  pickup_point VARCHAR(255) NOT NULL,
  dropoff_point VARCHAR(255) NOT NULL,
  distance_km DECIMAL(8,2) DEFAULT 0.00,
  estimated_time_minutes INT DEFAULT 0,
  monthly_fee DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_route_code (route_code),
  INDEX idx_active (is_active)
);

-- ==========================================
-- TRANSPORT VEHICLES
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type ENUM('Bus', 'Minibus', 'Van', 'Car') DEFAULT 'Bus',
  capacity INT NOT NULL,
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  license_plate VARCHAR(20),
  insurance_expiry DATE,
  registration_expiry DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vehicle_number (vehicle_number),
  INDEX idx_active (is_active)
);

-- ==========================================
-- ROUTE VEHICLE ASSIGNMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS route_vehicle_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT,
  assignment_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_route_vehicle (route_id, vehicle_id, assignment_date),
  INDEX idx_route (route_id),
  INDEX idx_vehicle (vehicle_id),
  INDEX idx_active (is_active)
);

-- ==========================================
-- STUDENT TRANSPORT REGISTRATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS student_transport_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  route_id INT NOT NULL,
  pickup_point VARCHAR(255),
  dropoff_point VARCHAR(255),
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_fee DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_frequency ENUM('Monthly', 'Termly', 'Annually') DEFAULT 'Monthly',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_student_route (student_id, route_id, start_date),
  INDEX idx_student (student_id),
  INDEX idx_route (route_id),
  INDEX idx_active (is_active)
);

-- ==========================================
-- TRANSPORT FEES
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_registration_id INT NOT NULL,
  fee_period VARCHAR(20) NOT NULL, -- e.g., "2025-01", "2025-Q1", "2025"
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status ENUM('Pending', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_registration_id) REFERENCES student_transport_registrations(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_fee_period (student_registration_id, fee_period),
  INDEX idx_student_registration (student_registration_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

-- ==========================================
-- TRANSPORT PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transport_fee_id INT NOT NULL,
  student_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money') DEFAULT 'Cash',
  reference_number VARCHAR(100) UNIQUE,
  receipt_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (transport_fee_id) REFERENCES transport_fees(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_transport_fee (transport_fee_id),
  INDEX idx_student (student_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_reference (reference_number)
);

-- ==========================================
-- TRANSPORT SCHEDULES
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  vehicle_id INT,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  pickup_time TIME NOT NULL,
  dropoff_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_route_day (route_id, day_of_week),
  INDEX idx_route (route_id),
  INDEX idx_vehicle (vehicle_id),
  INDEX idx_active (is_active)
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert sample transport routes
INSERT IGNORE INTO transport_routes (route_name, route_code, description, pickup_point, dropoff_point, distance_km, estimated_time_minutes, monthly_fee, currency) VALUES
('North Campus Route', 'NORTH-001', 'Route covering northern residential areas', 'North Mall', 'School Main Gate', 5.2, 15, 50.00, 'USD'),
('South Campus Route', 'SOUTH-001', 'Route covering southern residential areas', 'South Station', 'School Main Gate', 4.8, 12, 45.00, 'USD'),
('East Campus Route', 'EAST-001', 'Route covering eastern residential areas', 'East Park', 'School Main Gate', 6.1, 18, 55.00, 'USD'),
('West Campus Route', 'WEST-001', 'Route covering western residential areas', 'West Terminal', 'School Main Gate', 3.9, 10, 40.00, 'USD');

-- Insert sample vehicles
INSERT IGNORE INTO transport_vehicles (vehicle_number, vehicle_type, capacity, driver_name, driver_phone, license_plate) VALUES
('BUS-001', 'Bus', 45, 'John Driver', '+1234567890', 'ABC-123'),
('MINI-001', 'Minibus', 25, 'Jane Driver', '+1234567891', 'DEF-456'),
('VAN-001', 'Van', 15, 'Mike Driver', '+1234567892', 'GHI-789');

-- Insert sample route-vehicle assignments
INSERT IGNORE INTO route_vehicle_assignments (route_id, vehicle_id, assignment_date) VALUES
(1, 1, CURDATE()),
(2, 2, CURDATE()),
(3, 3, CURDATE()),
(4, 1, CURDATE());

-- Insert sample transport schedules
INSERT IGNORE INTO transport_schedules (route_id, vehicle_id, day_of_week, pickup_time, dropoff_time) VALUES
(1, 1, 'Monday', '07:00:00', '07:15:00'),
(1, 1, 'Tuesday', '07:00:00', '07:15:00'),
(1, 1, 'Wednesday', '07:00:00', '07:15:00'),
(1, 1, 'Thursday', '07:00:00', '07:15:00'),
(1, 1, 'Friday', '07:00:00', '07:15:00'),
(2, 2, 'Monday', '07:15:00', '07:27:00'),
(2, 2, 'Tuesday', '07:15:00', '07:27:00'),
(2, 2, 'Wednesday', '07:15:00', '07:27:00'),
(2, 2, 'Thursday', '07:15:00', '07:27:00'),
(2, 2, 'Friday', '07:15:00', '07:27:00');
