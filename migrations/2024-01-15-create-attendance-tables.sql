-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    marked_by INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (class_id) REFERENCES gradelevel_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(RegNumber) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate attendance for same student on same date
    UNIQUE KEY unique_attendance (class_id, student_id, attendance_date),
    
    -- Indexes for better query performance
    INDEX idx_class_date (class_id, attendance_date),
    INDEX idx_student_date (student_id, attendance_date),
    INDEX idx_marked_by (marked_by),
    INDEX idx_attendance_date (attendance_date)
);

-- Create attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    auto_mark_absent_after_hours INT DEFAULT 2,
    require_excuse_for_absence BOOLEAN DEFAULT TRUE,
    send_absence_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES gradelevel_classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_settings (class_id)
);

-- Insert default settings for existing classes
INSERT INTO attendance_settings (class_id, auto_mark_absent_after_hours, require_excuse_for_absence, send_absence_notifications)
SELECT id, 2, TRUE, TRUE
FROM gradelevel_classes
WHERE id NOT IN (SELECT class_id FROM attendance_settings);
