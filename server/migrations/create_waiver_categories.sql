-- ==========================================
-- WAIVER CATEGORIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS waiver_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default waiver categories
INSERT INTO waiver_categories (category_name, description) VALUES
('Staff Child', 'Children of school staff members'),
('Scholarship', 'Academic or merit-based scholarships'),
('Financial Hardship', 'Families facing financial difficulties'),
('Special Circumstances', 'Medical, family emergency, or other special cases'),
('Government Program', 'Government-sponsored education programs'),
('Sponsorship', 'External organization sponsorship'),
('Administrative', 'Administrative decision or policy'),
('Other', 'Other reasons not covered above');

-- Create indexes for better performance
CREATE INDEX idx_waiver_categories_active ON waiver_categories(is_active);
CREATE INDEX idx_waiver_categories_name ON waiver_categories(category_name);
