-- Simplified Transport Module Database Schema
-- Focus: Routes, Student Registration, Weekly Payments, Schedules

-- ==========================================
-- TRANSPORT ROUTES (Simplified)
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(100) NOT NULL,
  route_code VARCHAR(20) UNIQUE NOT NULL,
  pickup_point VARCHAR(255) NOT NULL,
  dropoff_point VARCHAR(255) NOT NULL,
  weekly_fee DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_route_code (route_code),
  INDEX idx_active (is_active)
);

-- ==========================================
-- STUDENT TRANSPORT REGISTRATIONS (Simplified)
-- ==========================================
CREATE TABLE IF NOT EXISTS student_transport_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(10) NOT NULL,
  route_id INT NOT NULL,
  pickup_point VARCHAR(255),
  dropoff_point VARCHAR(255),
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  weekly_fee DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_student_route (student_reg_number, route_id, start_date),
  INDEX idx_student_reg_number (student_reg_number),
  INDEX idx_route (route_id),
  INDEX idx_active (is_active)
);

-- ==========================================
-- WEEKLY TRANSPORT FEES (Simplified)
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_registration_id INT NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  week_end_date DATE NOT NULL,   -- Sunday of the week
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_registration_id) REFERENCES student_transport_registrations(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_weekly_fee (student_registration_id, week_start_date),
  INDEX idx_student_registration (student_registration_id),
  INDEX idx_status (status),
  INDEX idx_week_start (week_start_date),
  INDEX idx_due_date (due_date)
);

-- ==========================================
-- TRANSPORT PAYMENTS (Simplified)
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transport_fee_id INT NOT NULL,
  student_reg_number VARCHAR(10) NOT NULL,
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
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  
  INDEX idx_transport_fee (transport_fee_id),
  INDEX idx_student_reg_number (student_reg_number),
  INDEX idx_payment_date (payment_date),
  INDEX idx_reference (reference_number)
);

-- ==========================================
-- TRANSPORT SCHEDULES (Simplified - Based on Payment Status)
-- ==========================================
CREATE TABLE IF NOT EXISTS transport_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  pickup_time TIME NOT NULL,
  dropoff_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_route_day (route_id, day_of_week),
  INDEX idx_route (route_id),
  INDEX idx_active (is_active)
);
