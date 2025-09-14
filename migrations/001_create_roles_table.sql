-- Migration: 001_create_roles_table.sql
-- Description: Create roles table for user role management

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (name, description) VALUES 
('admin', 'Administrator with full system access'),
('user', 'Regular user with limited access'),
('auditor', 'Auditor with read-only access to audit logs');
