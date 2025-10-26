-- =====================================================
-- TIMETABLE MANAGEMENT SYSTEM
-- =====================================================
-- This file creates all necessary tables for managing timetables
-- with day-specific periods and special events
-- =====================================================

-- 1. Period templates (main timetable configurations)
CREATE TABLE IF NOT EXISTS period_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL, -- 'Term 1 2025', 'Semester 1 2025'
  description TEXT,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Indexes for better performance
  INDEX idx_template_name (name),
  INDEX idx_template_year_term (academic_year, term),
  INDEX idx_template_active (is_active)
);

-- 2. Day-specific period configurations
CREATE TABLE IF NOT EXISTS period_template_days (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (template_id) REFERENCES period_templates(id) ON DELETE CASCADE,
  
  -- Unique constraint for template-day combination
  UNIQUE KEY unique_template_day (template_id, day_of_week),
  
  -- Indexes
  INDEX idx_template_day_template (template_id),
  INDEX idx_template_day_week (day_of_week)
);

-- 3. Time periods (individual periods within each day)
CREATE TABLE IF NOT EXISTS periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_day_id INT NOT NULL,
  name VARCHAR(50) NOT NULL, -- 'Period 1', 'Assembly', 'Break', 'Lunch'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  period_type ENUM('Teaching', 'Break', 'Assembly', 'Sports', 'Chapel', 'Lunch', 'Other') NOT NULL,
  is_break BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0, -- For ordering periods within a day
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (template_day_id) REFERENCES period_template_days(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_period_template_day (template_day_id),
  INDEX idx_period_type (period_type),
  INDEX idx_period_break (is_break),
  INDEX idx_period_sort (sort_order)
);

-- 4. Main timetable entries (actual class assignments)
CREATE TABLE IF NOT EXISTS timetable_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  subject_class_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  period_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  
  -- Foreign key constraints
  FOREIGN KEY (template_id) REFERENCES period_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_class_id) REFERENCES subject_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  
  -- Unique constraints to prevent conflicts
  UNIQUE KEY unique_teacher_period (template_id, day_of_week, period_id, subject_class_id),
  
  -- Indexes for better performance
  INDEX idx_entry_template (template_id),
  INDEX idx_entry_subject_class (subject_class_id),
  INDEX idx_entry_day (day_of_week),
  INDEX idx_entry_period (period_id),
  INDEX idx_entry_active (is_active)
);

-- 5. Timetable generation logs (track generation history)
CREATE TABLE IF NOT EXISTS timetable_generation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  generation_type ENUM('Auto', 'Manual', 'Import') NOT NULL,
  status ENUM('Success', 'Failed', 'Partial') NOT NULL,
  total_entries INT DEFAULT 0,
  conflicts_found INT DEFAULT 0,
  conflicts_resolved INT DEFAULT 0,
  generation_time_seconds INT DEFAULT 0,
  generated_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (template_id) REFERENCES period_templates(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_log_template (template_id),
  INDEX idx_log_status (status),
  INDEX idx_log_type (generation_type),
  INDEX idx_log_created (created_at)
);

-- 6. Timetable conflicts (track and resolve conflicts)
CREATE TABLE IF NOT EXISTS timetable_conflicts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  conflict_type ENUM('Teacher_Overlap', 'Room_Overlap', 'Student_Overlap', 'Period_Conflict') NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  period_id INT NOT NULL,
  entry1_id INT NOT NULL,
  entry2_id INT NOT NULL,
  description TEXT,
  status ENUM('Open', 'Resolved', 'Ignored') DEFAULT 'Open',
  resolved_by INT,
  resolved_at TIMESTAMP NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (template_id) REFERENCES period_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (entry1_id) REFERENCES timetable_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (entry2_id) REFERENCES timetable_entries(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_conflict_template (template_id),
  INDEX idx_conflict_type (conflict_type),
  INDEX idx_conflict_status (status),
  INDEX idx_conflict_day (day_of_week)
);

-- Insert sample data for testing
INSERT INTO period_templates (name, description, academic_year, term, created_by) VALUES
('Term 1 2025', 'First term timetable for 2025 academic year', '2025', 'Term 1', 1);

-- Get the template ID for sample data
SET @template_id = LAST_INSERT_ID();

-- Insert day configurations
INSERT INTO period_template_days (template_id, day_of_week) VALUES
(@template_id, 'Monday'),
(@template_id, 'Tuesday'),
(@template_id, 'Wednesday'),
(@template_id, 'Thursday'),
(@template_id, 'Friday');

-- Get day IDs for sample periods
SET @monday_id = (SELECT id FROM period_template_days WHERE template_id = @template_id AND day_of_week = 'Monday');
SET @tuesday_id = (SELECT id FROM period_template_days WHERE template_id = @template_id AND day_of_week = 'Tuesday');
SET @wednesday_id = (SELECT id FROM period_template_days WHERE template_id = @template_id AND day_of_week = 'Wednesday');
SET @thursday_id = (SELECT id FROM period_template_days WHERE template_id = @template_id AND day_of_week = 'Thursday');
SET @friday_id = (SELECT id FROM period_template_days WHERE template_id = @template_id AND day_of_week = 'Friday');

-- Monday periods (with Assembly)
INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order) VALUES
(@monday_id, 'Assembly', '08:00:00', '08:30:00', 'Assembly', FALSE, 1),
(@monday_id, 'Period 1', '08:30:00', '09:10:00', 'Teaching', FALSE, 2),
(@monday_id, 'Period 2', '09:10:00', '09:50:00', 'Teaching', FALSE, 3),
(@monday_id, 'Break', '09:50:00', '10:05:00', 'Break', TRUE, 4),
(@monday_id, 'Period 3', '10:05:00', '10:45:00', 'Teaching', FALSE, 5),
(@monday_id, 'Period 4', '10:45:00', '11:25:00', 'Teaching', FALSE, 6),
(@monday_id, 'Break', '11:25:00', '11:40:00', 'Break', TRUE, 7),
(@monday_id, 'Period 5', '11:40:00', '12:20:00', 'Teaching', FALSE, 8),
(@monday_id, 'Period 6', '12:20:00', '13:00:00', 'Teaching', FALSE, 9),
(@monday_id, 'Lunch', '13:00:00', '14:00:00', 'Lunch', TRUE, 10),
(@monday_id, 'Period 7', '14:00:00', '14:40:00', 'Teaching', FALSE, 11),
(@monday_id, 'Period 8', '14:40:00', '15:20:00', 'Teaching', FALSE, 12);

-- Tuesday periods (regular day)
INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order) VALUES
(@tuesday_id, 'Period 1', '08:00:00', '08:40:00', 'Teaching', FALSE, 1),
(@tuesday_id, 'Period 2', '08:40:00', '09:20:00', 'Teaching', FALSE, 2),
(@tuesday_id, 'Break', '09:20:00', '09:35:00', 'Break', TRUE, 3),
(@tuesday_id, 'Period 3', '09:35:00', '10:15:00', 'Teaching', FALSE, 4),
(@tuesday_id, 'Period 4', '10:15:00', '10:55:00', 'Teaching', FALSE, 5),
(@tuesday_id, 'Break', '10:55:00', '11:10:00', 'Break', TRUE, 6),
(@tuesday_id, 'Period 5', '11:10:00', '11:50:00', 'Teaching', FALSE, 7),
(@tuesday_id, 'Period 6', '11:50:00', '12:30:00', 'Teaching', FALSE, 8),
(@tuesday_id, 'Lunch', '12:30:00', '13:30:00', 'Lunch', TRUE, 9),
(@tuesday_id, 'Period 7', '13:30:00', '14:10:00', 'Teaching', FALSE, 10),
(@tuesday_id, 'Period 8', '14:10:00', '14:50:00', 'Teaching', FALSE, 11);

-- Wednesday periods (with Sports)
INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order) VALUES
(@wednesday_id, 'Period 1', '08:00:00', '08:40:00', 'Teaching', FALSE, 1),
(@wednesday_id, 'Period 2', '08:40:00', '09:20:00', 'Teaching', FALSE, 2),
(@wednesday_id, 'Break', '09:20:00', '09:35:00', 'Break', TRUE, 3),
(@wednesday_id, 'Period 3', '09:35:00', '10:15:00', 'Teaching', FALSE, 4),
(@wednesday_id, 'Period 4', '10:15:00', '10:55:00', 'Teaching', FALSE, 5),
(@wednesday_id, 'Break', '10:55:00', '11:10:00', 'Break', TRUE, 6),
(@wednesday_id, 'Period 5', '11:10:00', '11:50:00', 'Teaching', FALSE, 7),
(@wednesday_id, 'Period 6', '11:50:00', '12:30:00', 'Teaching', FALSE, 8),
(@wednesday_id, 'Lunch', '12:30:00', '13:30:00', 'Lunch', TRUE, 9),
(@wednesday_id, 'Sports', '13:30:00', '14:30:00', 'Sports', TRUE, 10),
(@wednesday_id, 'Period 7', '14:30:00', '15:10:00', 'Teaching', FALSE, 11),
(@wednesday_id, 'Period 8', '15:10:00', '15:50:00', 'Teaching', FALSE, 12);

-- Thursday periods (regular day)
INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order) VALUES
(@thursday_id, 'Period 1', '08:00:00', '08:40:00', 'Teaching', FALSE, 1),
(@thursday_id, 'Period 2', '08:40:00', '09:20:00', 'Teaching', FALSE, 2),
(@thursday_id, 'Break', '09:20:00', '09:35:00', 'Break', TRUE, 3),
(@thursday_id, 'Period 3', '09:35:00', '10:15:00', 'Teaching', FALSE, 4),
(@thursday_id, 'Period 4', '10:15:00', '10:55:00', 'Teaching', FALSE, 5),
(@thursday_id, 'Break', '10:55:00', '11:10:00', 'Break', TRUE, 6),
(@thursday_id, 'Period 5', '11:10:00', '11:50:00', 'Teaching', FALSE, 7),
(@thursday_id, 'Period 6', '11:50:00', '12:30:00', 'Teaching', FALSE, 8),
(@thursday_id, 'Lunch', '12:30:00', '13:30:00', 'Lunch', TRUE, 9),
(@thursday_id, 'Period 7', '13:30:00', '14:10:00', 'Teaching', FALSE, 10),
(@thursday_id, 'Period 8', '14:10:00', '14:50:00', 'Teaching', FALSE, 11);

-- Friday periods (with Chapel)
INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order) VALUES
(@friday_id, 'Chapel', '08:00:00', '08:30:00', 'Chapel', TRUE, 1),
(@friday_id, 'Period 1', '08:30:00', '09:10:00', 'Teaching', FALSE, 2),
(@friday_id, 'Period 2', '09:10:00', '09:50:00', 'Teaching', FALSE, 3),
(@friday_id, 'Break', '09:50:00', '10:05:00', 'Break', TRUE, 4),
(@friday_id, 'Period 3', '10:05:00', '10:45:00', 'Teaching', FALSE, 5),
(@friday_id, 'Period 4', '10:45:00', '11:25:00', 'Teaching', FALSE, 6),
(@friday_id, 'Break', '11:25:00', '11:40:00', 'Break', TRUE, 7),
(@friday_id, 'Period 5', '11:40:00', '12:20:00', 'Teaching', FALSE, 8),
(@friday_id, 'Period 6', '12:20:00', '13:00:00', 'Teaching', FALSE, 9),
(@friday_id, 'Lunch', '13:00:00', '14:00:00', 'Lunch', TRUE, 10),
(@friday_id, 'Period 7', '14:00:00', '14:40:00', 'Teaching', FALSE, 11),
(@friday_id, 'Period 8', '14:40:00', '15:20:00', 'Teaching', FALSE, 12);
