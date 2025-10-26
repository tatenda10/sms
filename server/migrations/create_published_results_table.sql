-- Create published_results table to manage which terms/years are published
CREATE TABLE published_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  published_by VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_term_year (academic_year, term),
  INDEX idx_published (is_published),
  INDEX idx_academic_year (academic_year),
  INDEX idx_term (term)
);

-- Insert some sample data for testing
INSERT INTO published_results (academic_year, term, is_published, published_at, published_by) VALUES
('2024', 'Term 1', TRUE, NOW(), 'ADMIN'),
('2024', 'Term 2', TRUE, NOW(), 'ADMIN'),
('2024', 'Term 3', FALSE, NULL, NULL),
('2025', 'Term 1', TRUE, NOW(), 'ADMIN'),
('2025', 'Term 2', FALSE, NULL, NULL),
('2025', 'Term 3', FALSE, NULL, NULL);