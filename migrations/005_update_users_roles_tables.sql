-- Migration: 005_update_users_roles_tables.sql
-- Description: Add missing columns to users and roles tables for management functionality

-- Add email column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NULL AFTER username;

-- Add permissions and is_active columns to roles table if they don't exist
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS permissions JSON NULL AFTER description,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER permissions;

-- Update existing roles with default permissions
UPDATE roles SET permissions = JSON_ARRAY('user_view') WHERE name = 'user' AND permissions IS NULL;
UPDATE roles SET permissions = JSON_ARRAY('user_management', 'role_management', 'student_management', 'reports', 'system_settings') WHERE name = 'admin' AND permissions IS NULL;
UPDATE roles SET permissions = JSON_ARRAY('reports') WHERE name = 'auditor' AND permissions IS NULL;

-- Add some default roles with permissions if they don't exist
INSERT IGNORE INTO roles (name, description, permissions, is_active) VALUES 
(
  'Teacher', 
  'Access to student information and academic records',
  JSON_ARRAY('student_view', 'student_edit', 'academic_records', 'attendance'),
  TRUE
),
(
  'Student Management', 
  'Manage student registrations and information',
  JSON_ARRAY('student_management', 'student_view', 'student_create', 'student_edit', 'student_delete'),
  TRUE
),
(
  'User Management', 
  'Manage system users and their permissions',
  JSON_ARRAY('user_view', 'user_create', 'user_edit', 'user_delete'),
  TRUE
),
(
  'Staff', 
  'Basic staff access to student information',
  JSON_ARRAY('student_view', 'attendance'),
  TRUE
),
(
  'Reports', 
  'Generate and view reports',
  JSON_ARRAY('reports'),
  TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Add a comment about the schema updates
-- Note: These changes support the new user and role management system
