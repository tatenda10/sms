-- =====================================================
-- BOARDING FACILITIES MANAGEMENT SYSTEM
-- =====================================================
-- This file creates all necessary tables for managing boarding facilities
-- including hostels, rooms, student enrollments, and fee structures
-- =====================================================

-- 1. Hostels table
CREATE TABLE IF NOT EXISTS hostels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Mixed')),
  total_rooms INT DEFAULT 0,
  total_capacity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Indexes for better performance
  INDEX idx_hostel_name (name),
  INDEX idx_hostel_gender (gender),
  INDEX idx_hostel_active (is_active)
);

-- 2. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hostel_id INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  room_type VARCHAR(50) NOT NULL, -- 'Single', 'Double', 'Triple', 'Quad', etc.
  capacity INT NOT NULL,
  current_occupancy INT DEFAULT 0,
  floor_number INT DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraint
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  
  -- Unique constraint for room number within hostel
  UNIQUE KEY unique_room_hostel (hostel_id, room_number),
  
  -- Indexes for better performance
  INDEX idx_room_hostel (hostel_id),
  INDEX idx_room_number (room_number),
  INDEX idx_room_type (room_type),
  INDEX idx_room_active (is_active)
);

-- 3. Boarding fee structure table
CREATE TABLE IF NOT EXISTS boarding_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hostel_id INT NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  term VARCHAR(20) NOT NULL, -- 'Term 1', 'Term 2', 'Term 3'
  academic_year VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  
  -- Unique constraint for fee structure
  UNIQUE KEY unique_boarding_fee (hostel_id, room_type, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_boarding_fee_hostel (hostel_id),
  INDEX idx_boarding_fee_term_year (term, academic_year),
  INDEX idx_boarding_fee_active (is_active)
);

-- 4. Boarding enrollments table
CREATE TABLE IF NOT EXISTS boarding_enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(10) NOT NULL,
  hostel_id INT NOT NULL,
  room_id INT NOT NULL,
  enrollment_date DATE NOT NULL,
  check_in_date DATE,
  check_out_date DATE,
  term VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'enrolled', -- 'enrolled', 'checked_in', 'checked_out', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate enrollments
  UNIQUE KEY unique_student_enrollment (student_reg_number, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_enrollment_student (student_reg_number),
  INDEX idx_enrollment_hostel (hostel_id),
  INDEX idx_enrollment_room (room_id),
  INDEX idx_enrollment_term_year (term, academic_year),
  INDEX idx_enrollment_status (status)
);

-- 5. Boarding payments table
CREATE TABLE IF NOT EXISTS boarding_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'bank', 'mobile_money', etc.
  receipt_number VARCHAR(50),
  term VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'refunded'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (enrollment_id) REFERENCES boarding_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  
  -- Indexes for better performance
  INDEX idx_payment_enrollment (enrollment_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_payment_term_year (term, academic_year),
  INDEX idx_payment_status (status)
);

-- 6. Boarding fee balances table
CREATE TABLE IF NOT EXISTS boarding_fee_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  total_fee DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  outstanding_balance DECIMAL(10,2) NOT NULL,
  currency_id INT NOT NULL,
  term VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'outstanding', -- 'outstanding', 'partial', 'paid', 'overdue'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (enrollment_id) REFERENCES boarding_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  
  -- Unique constraint for balance tracking
  UNIQUE KEY unique_enrollment_balance (enrollment_id, term, academic_year),
  
  -- Indexes for better performance
  INDEX idx_balance_enrollment (enrollment_id),
  INDEX idx_balance_term_year (term, academic_year),
  INDEX idx_balance_status (status)
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update hostel capacity when rooms are added/updated
DELIMITER //
CREATE TRIGGER update_hostel_capacity_after_room_insert
AFTER INSERT ON rooms
FOR EACH ROW
BEGIN
  UPDATE hostels 
  SET total_rooms = (SELECT COUNT(*) FROM rooms WHERE hostel_id = NEW.hostel_id AND is_active = TRUE),
      total_capacity = (SELECT SUM(capacity) FROM rooms WHERE hostel_id = NEW.hostel_id AND is_active = TRUE)
  WHERE id = NEW.hostel_id;
END//

CREATE TRIGGER update_hostel_capacity_after_room_update
AFTER UPDATE ON rooms
FOR EACH ROW
BEGIN
  UPDATE hostels 
  SET total_rooms = (SELECT COUNT(*) FROM rooms WHERE hostel_id = NEW.hostel_id AND is_active = TRUE),
      total_capacity = (SELECT SUM(capacity) FROM rooms WHERE hostel_id = NEW.hostel_id AND is_active = TRUE)
  WHERE id = NEW.hostel_id;
END//

CREATE TRIGGER update_hostel_capacity_after_room_delete
AFTER DELETE ON rooms
FOR EACH ROW
BEGIN
  UPDATE hostels 
  SET total_rooms = (SELECT COUNT(*) FROM rooms WHERE hostel_id = OLD.hostel_id AND is_active = TRUE),
      total_capacity = (SELECT SUM(capacity) FROM rooms WHERE hostel_id = OLD.hostel_id AND is_active = TRUE)
  WHERE id = OLD.hostel_id;
END//

-- Trigger to update room occupancy when enrollments are added/updated
CREATE TRIGGER update_room_occupancy_after_enrollment_insert
AFTER INSERT ON boarding_enrollments
FOR EACH ROW
BEGIN
  UPDATE rooms 
  SET current_occupancy = (SELECT COUNT(*) FROM boarding_enrollments 
                          WHERE room_id = NEW.room_id AND status IN ('enrolled', 'checked_in'))
  WHERE id = NEW.room_id;
END//

CREATE TRIGGER update_room_occupancy_after_enrollment_update
AFTER UPDATE ON boarding_enrollments
FOR EACH ROW
BEGIN
  UPDATE rooms 
  SET current_occupancy = (SELECT COUNT(*) FROM boarding_enrollments 
                          WHERE room_id = NEW.room_id AND status IN ('enrolled', 'checked_in'))
  WHERE id = NEW.room_id;
END//

-- Trigger to update boarding fee balance when payments are made
CREATE TRIGGER update_boarding_balance_after_payment_insert
AFTER INSERT ON boarding_payments
FOR EACH ROW
BEGIN
  UPDATE boarding_fee_balances 
  SET paid_amount = (SELECT SUM(amount) FROM boarding_payments 
                     WHERE enrollment_id = NEW.enrollment_id AND status = 'completed'),
      outstanding_balance = total_fee - (SELECT SUM(amount) FROM boarding_payments 
                                        WHERE enrollment_id = NEW.enrollment_id AND status = 'completed'),
      status = CASE 
        WHEN (SELECT SUM(amount) FROM boarding_payments 
              WHERE enrollment_id = NEW.enrollment_id AND status = 'completed') >= total_fee 
        THEN 'paid'
        WHEN (SELECT SUM(amount) FROM boarding_payments 
              WHERE enrollment_id = NEW.enrollment_id AND status = 'completed') > 0 
        THEN 'partial'
        ELSE 'outstanding'
      END
  WHERE enrollment_id = NEW.enrollment_id;
END//

DELIMITER ;

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample hostels
INSERT INTO hostels (name, description, location, gender) VALUES
('Sunrise Hostel', 'Modern hostel for female students', 'Campus East', 'Female'),
('Mountain View Hostel', 'Comfortable accommodation for male students', 'Campus West', 'Male'),
('Riverside Hostel', 'Mixed gender hostel with excellent facilities', 'Campus North', 'Mixed');

-- Insert sample rooms
INSERT INTO rooms (hostel_id, room_number, room_type, capacity, floor_number, description) VALUES
(1, '101', 'Double', 2, 1, 'Ground floor room with garden view'),
(1, '102', 'Single', 1, 1, 'Single occupancy room'),
(1, '201', 'Triple', 3, 2, 'Second floor room with balcony'),
(2, 'A101', 'Double', 2, 1, 'Block A, ground floor'),
(2, 'A102', 'Quad', 4, 1, 'Block A, spacious room'),
(3, '101', 'Single', 1, 1, 'Mixed hostel single room'),
(3, '102', 'Double', 2, 1, 'Mixed hostel double room');

-- Insert sample boarding fees (assuming currencies table exists)
-- Note: You'll need to adjust the currency_id based on your actual currency data
INSERT INTO boarding_fees (hostel_id, room_type, term, academic_year, amount, currency_id) VALUES
(1, 'Single', 'Term 1', '2025', 500.00, 1),
(1, 'Double', 'Term 1', '2025', 400.00, 1),
(1, 'Triple', 'Term 1', '2025', 350.00, 1),
(2, 'Double', 'Term 1', '2025', 450.00, 1),
(2, 'Quad', 'Term 1', '2025', 300.00, 1),
(3, 'Single', 'Term 1', '2025', 550.00, 1),
(3, 'Double', 'Term 1', '2025', 450.00, 1);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SHOW TABLES LIKE '%hostel%';
SHOW TABLES LIKE '%room%';
SHOW TABLES LIKE '%boarding%';

-- Check table structures
DESCRIBE hostels;
DESCRIBE rooms;
DESCRIBE boarding_fees;
DESCRIBE boarding_enrollments;
DESCRIBE boarding_payments;
DESCRIBE boarding_fee_balances;

-- =====================================================
-- API ENDPOINTS TO BE CREATED:
-- =====================================================
-- HOSTELS:
-- POST   /api/boarding/hostels          - Create new hostel
-- GET    /api/boarding/hostels          - Get all hostels
-- GET    /api/boarding/hostels/:id      - Get hostel by ID
-- PUT    /api/boarding/hostels/:id      - Update hostel
-- DELETE /api/boarding/hostels/:id      - Delete hostel
-- GET    /api/boarding/hostels/:id/rooms - Get rooms for hostel
-- GET    /api/boarding/hostels/:id/enrollments - Get enrollments for hostel

-- ROOMS:
-- POST   /api/boarding/rooms            - Create new room
-- GET    /api/boarding/rooms            - Get all rooms
-- GET    /api/boarding/rooms/:id        - Get room by ID
-- PUT    /api/boarding/rooms/:id        - Update room
-- DELETE /api/boarding/rooms/:id        - Delete room
-- GET    /api/boarding/rooms/:id/enrollments - Get enrollments for room

-- BOARDING FEES:
-- POST   /api/boarding/fees             - Create fee structure
-- GET    /api/boarding/fees             - Get all fee structures
-- GET    /api/boarding/fees/:id         - Get fee by ID
-- PUT    /api/boarding/fees/:id         - Update fee structure
-- DELETE /api/boarding/fees/:id         - Delete fee structure

-- ENROLLMENTS:
-- POST   /api/boarding/enrollments      - Enroll student
-- GET    /api/boarding/enrollments      - Get all enrollments
-- GET    /api/boarding/enrollments/:id  - Get enrollment by ID
-- PUT    /api/boarding/enrollments/:id  - Update enrollment
-- DELETE /api/boarding/enrollments/:id  - Cancel enrollment
-- POST   /api/boarding/enrollments/:id/checkin - Check in student
-- POST   /api/boarding/enrollments/:id/checkout - Check out student

-- PAYMENTS:
-- POST   /api/boarding/payments         - Record payment
-- GET    /api/boarding/payments         - Get all payments
-- GET    /api/boarding/payments/:id     - Get payment by ID
-- PUT    /api/boarding/payments/:id     - Update payment
-- DELETE /api/boarding/payments/:id     - Delete payment

-- BALANCES:
-- GET    /api/boarding/balances         - Get all balances
-- GET    /api/boarding/balances/:id     - Get balance by ID
-- GET    /api/boarding/balances/student/:regNumber - Get student balances
-- =====================================================
