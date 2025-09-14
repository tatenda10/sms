-- Create test_marks table
CREATE TABLE IF NOT EXISTS test_marks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_reg_number VARCHAR(20) NOT NULL,
  subject_class_id INT,
  gradelevel_class_id INT NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  test_type ENUM('quiz', 'assignment', 'test', 'exam', 'project') NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((marks_obtained / total_marks) * 100, 2)) STORED,
  test_date DATE NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(10) NOT NULL,
  comments TEXT,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_test_marks_student FOREIGN KEY (student_reg_number) REFERENCES students(RegNumber) ON DELETE CASCADE,
  CONSTRAINT fk_test_marks_subject_class FOREIGN KEY (subject_class_id) REFERENCES subject_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_marks_gradelevel_class FOREIGN KEY (gradelevel_class_id) REFERENCES gradelevel_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_marks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_test_marks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes for better performance
  INDEX idx_test_marks_student (student_reg_number),
  INDEX idx_test_marks_class (gradelevel_class_id),
  INDEX idx_test_marks_subject (subject_class_id),
  INDEX idx_test_marks_date (test_date),
  INDEX idx_test_marks_academic_year (academic_year, term),
  INDEX idx_test_marks_type (test_type)
);

-- Add unique constraint to prevent duplicate test entries for same student, test, and date
ALTER TABLE test_marks ADD CONSTRAINT unique_test_entry 
UNIQUE (student_reg_number, test_name, test_date, subject_class_id);
