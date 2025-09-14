-- =====================================================
-- SPORTS FIXTURES MANAGEMENT SYSTEM
-- =====================================================
-- This file creates all necessary tables for managing sports fixtures
-- and sports announcements in the school management system
-- =====================================================

-- 1. Sports categories (football, basketball, athletics, etc.)
CREATE TABLE IF NOT EXISTS sports_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'fa-futbol',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_sports_categories_name (name),
  INDEX idx_sports_categories_active (is_active)
);

-- 2. Sports teams (school teams for each sport)
CREATE TABLE IF NOT EXISTS sports_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sport_category_id INT NOT NULL,
  description TEXT,
  coach_name VARCHAR(100),
  coach_contact VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sport_category_id) REFERENCES sports_categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_sport (name, sport_category_id),
  INDEX idx_sports_teams_category (sport_category_id),
  INDEX idx_sports_teams_active (is_active)
);

-- 3. Sports fixtures (individual games/events)
CREATE TABLE IF NOT EXISTS sports_fixtures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  sport_category_id INT NOT NULL,
  home_team_id INT,
  away_team_id INT,
  home_team_name VARCHAR(100), -- For external teams
  away_team_name VARCHAR(100), -- For external teams
  venue VARCHAR(200),
  fixture_date DATE NOT NULL,
  fixture_time TIME NOT NULL,
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed') DEFAULT 'scheduled',
  result_home_score INT DEFAULT NULL,
  result_away_score INT DEFAULT NULL,
  result_notes TEXT,
  weather_conditions VARCHAR(100),
  referee_name VARCHAR(100),
  referee_contact VARCHAR(20),
  is_home_game BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sport_category_id) REFERENCES sports_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES sports_teams(id) ON DELETE SET NULL,
  FOREIGN KEY (away_team_id) REFERENCES sports_teams(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_sports_fixtures_category (sport_category_id),
  INDEX idx_sports_fixtures_date (fixture_date),
  INDEX idx_sports_fixtures_status (status),
  INDEX idx_sports_fixtures_teams (home_team_id, away_team_id),
  INDEX idx_sports_fixtures_created (created_at)
);

-- 4. Sports participants (team members and participants)
CREATE TABLE IF NOT EXISTS sports_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  student_id INT,
  employee_id INT,
  participant_name VARCHAR(100), -- For external participants
  participant_contact VARCHAR(20),
  role ENUM('player', 'captain', 'substitute', 'coach', 'manager') DEFAULT 'player',
  jersey_number INT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
 
  INDEX idx_sports_participants_team (team_id),
  INDEX idx_sports_participants_student (student_id),
  INDEX idx_sports_participants_employee (employee_id),
  INDEX idx_sports_participants_active (is_active)
);

-- 5. Sports announcements (sports-specific announcements)
CREATE TABLE IF NOT EXISTS sports_announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type ENUM('fixture', 'result', 'general', 'training', 'meeting') NOT NULL,
  sport_category_id INT,
  team_id INT,
  fixture_id INT,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  start_date DATETIME,
  end_date DATETIME,
  target_audience ENUM('all', 'team_members', 'students', 'employees', 'parents') DEFAULT 'all',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sport_category_id) REFERENCES sports_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES sports_teams(id) ON DELETE SET NULL,
  FOREIGN KEY (fixture_id) REFERENCES sports_fixtures(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_sports_announcements_type (announcement_type),
  INDEX idx_sports_announcements_status (status),
  INDEX idx_sports_announcements_category (sport_category_id),
  INDEX idx_sports_announcements_team (team_id),
  INDEX idx_sports_announcements_fixture (fixture_id),
  INDEX idx_sports_announcements_dates (start_date, end_date),
  INDEX idx_sports_announcements_created (created_at)
);

-- Insert default sports categories
INSERT INTO sports_categories (name, description, icon) VALUES
('Football', 'Soccer/Football matches and tournaments', 'fa-futbol'),
('Basketball', 'Basketball games and competitions', 'fa-basketball-ball'),
('Athletics', 'Track and field events', 'fa-running'),
('Volleyball', 'Volleyball matches and tournaments', 'fa-volleyball-ball'),
('Tennis', 'Tennis matches and competitions', 'fa-table-tennis'),
('Swimming', 'Swimming competitions and events', 'fa-swimmer'),
('Cricket', 'Cricket matches and tournaments', 'fa-baseball'),
('Rugby', 'Rugby matches and competitions', 'fa-football-ball'),
('Netball', 'Netball games and tournaments', 'fa-basketball-ball'),
('Hockey', 'Hockey matches and competitions', 'fa-hockey-puck');

