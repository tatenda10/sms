-- Migration: 006_add_boarding_roles.sql
-- Description: Add boarding management roles required for boarding facilities functionality

-- Add boarding management roles if they don't exist
INSERT IGNORE INTO roles (name, description, permissions, is_active) VALUES 
(
  'BOARDING_MANAGEMENT', 
  'Full access to boarding facilities management including hostels, rooms, enrollments, and payments',
  JSON_ARRAY('boarding_management', 'boarding_view', 'boarding_create', 'boarding_edit', 'boarding_delete'),
  TRUE
),
(
  'BOARDING_VIEW', 
  'Read-only access to boarding facilities information',
  JSON_ARRAY('boarding_view'),
  TRUE
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Verify the roles were created
SELECT id, name, description, is_active FROM roles WHERE name IN ('BOARDING_MANAGEMENT', 'BOARDING_VIEW');
