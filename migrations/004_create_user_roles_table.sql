-- Migration: 004_create_user_roles_table.sql
-- Description: Create user_roles junction table for many-to-many relationship between users and roles

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Migrate existing user-role relationships to the new junction table
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, u.role_id 
FROM users u 
WHERE u.role_id IS NOT NULL;

-- Add a comment to the users table about the role_id column being deprecated
-- Note: We'll keep the role_id column for backward compatibility but it will be phased out
