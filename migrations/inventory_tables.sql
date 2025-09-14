-- Inventory Module Database Schema
-- This migration creates tables for managing school inventory, uniforms, and student issues

-- 1. Inventory Categories Table
CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'faBoxes',
    color VARCHAR(20) DEFAULT 'blue',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    location VARCHAR(100),
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE RESTRICT
);

-- 3. Uniform Issues Table
CREATE TABLE IF NOT EXISTS uniform_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    student_reg_number VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    issue_date DATE NOT NULL,
    payment_status ENUM('pending', 'paid', 'partial') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'bank_transfer', 'check', 'mobile_money') DEFAULT 'cash',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    issued_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 4. Uniform Payments Table
CREATE TABLE IF NOT EXISTS uniform_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'check', 'mobile_money') NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES uniform_issues(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Insert default categories
INSERT INTO inventory_categories (name, icon, color, description) VALUES
('Uniforms', 'faTshirt', 'blue', 'School uniforms for all students'),
('Books', 'faBook', 'green', 'Textbooks and educational materials'),
('Lab Equipment', 'faFlask', 'purple', 'Science laboratory equipment and supplies'),
('Sports Equipment', 'faFutbol', 'orange', 'Sports gear and athletic equipment'),
('Art Supplies', 'faPalette', 'pink', 'Art and craft materials'),
('Cleaning Supplies', 'faBroom', 'gray', 'Cleaning and maintenance supplies'),
('IT Equipment', 'faLaptop', 'indigo', 'Computers and technology equipment'),
('Kitchen Supplies', 'faUtensils', 'red', 'Kitchen and cafeteria supplies'),
('Building Supplies', 'faBuilding', 'gray', 'Construction and maintenance materials');

