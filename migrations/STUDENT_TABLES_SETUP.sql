-- =====================================================
-- STUDENT MANAGEMENT SYSTEM - TABLE CREATION
-- =====================================================
-- Run these queries in your MySQL database to create the student and guardian tables
-- =====================================================

-- 1. Create students table
CREATE TABLE students (
    RegNumber VARCHAR(10) PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    Surname VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    NationalIDNumber VARCHAR(20) UNIQUE,
    Address VARCHAR(100),
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female')),
    Active VARCHAR(255) DEFAULT 'Yes',
    ImagePath VARCHAR(255) NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create guardians table
CREATE TABLE guardians (
    GuardianID INT AUTO_INCREMENT PRIMARY KEY,
    StudentRegNumber VARCHAR(10) NOT NULL,
    Name VARCHAR(50) NOT NULL,
    Surname VARCHAR(50) NOT NULL,
    DateOfBirth DATE NULL,
    NationalIDNumber VARCHAR(20),
    Address VARCHAR(100) NULL,
    PhoneNumber VARCHAR(20) NOT NULL,
    Gender VARCHAR(255) NULL,
    RelationshipToStudent VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentRegNumber) REFERENCES students(RegNumber) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Create indexes for better performance
CREATE INDEX idx_students_name ON students(Name, Surname);
CREATE INDEX idx_students_regnumber ON students(RegNumber);
CREATE INDEX idx_guardians_student ON guardians(StudentRegNumber);
CREATE INDEX idx_guardians_name ON guardians(Name, Surname);

-- 4. Optional: Insert sample data for testing
-- Uncomment the lines below if you want to add sample data

/*
INSERT INTO students (RegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, Gender, Active) VALUES
('ST001', 'John', 'Doe', '2010-05-15', 'ID123456789', '123 Main St', 'Male', 'Yes'),
('ST002', 'Jane', 'Smith', '2009-08-22', 'ID987654321', '456 Oak Ave', 'Female', 'Yes'),
('ST003', 'Michael', 'Johnson', '2011-03-10', 'ID456789123', '789 Pine Rd', 'Male', 'Yes');

INSERT INTO guardians (StudentRegNumber, Name, Surname, NationalIDNumber, PhoneNumber, RelationshipToStudent) VALUES
('ST001', 'Robert', 'Doe', 'GID111111111', '+1234567890', 'Father'),
('ST002', 'Mary', 'Smith', 'GID222222222', '+1234567891', 'Mother'),
('ST003', 'David', 'Johnson', 'GID333333333', '+1234567892', 'Father');
*/

-- 5. Verify tables were created
SHOW TABLES;
DESCRIBE students;
DESCRIBE guardians;

-- =====================================================
-- API ENDPOINTS AVAILABLE:
-- =====================================================
-- POST   /api/students          - Add new student with guardian
-- GET    /api/students          - Get all students
-- GET    /api/students/:regNumber - Get student by registration number
-- PUT    /api/students/:regNumber - Update student
-- DELETE /api/students/:regNumber - Delete student
-- GET    /api/students/:regNumber/guardians - Get guardians for a student
-- POST   /api/students/:regNumber/guardians - Add guardian for a student
-- PUT    /api/students/guardians/:id - Update guardian
-- DELETE /api/students/guardians/:id - Delete guardian
-- GET    /api/students/guardians - Get all guardians
-- GET    /api/students/guardians/:id - Get guardian by ID
-- =====================================================
