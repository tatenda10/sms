-- Create students table
CREATE TABLE students (
    RegNumber VARCHAR(10) PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    Surname VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    NationalIDNumber VARCHAR(20) UNIQUE,
    Address VARCHAR(100),
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female', 'Other')),
    Active VARCHAR(255) DEFAULT 'Yes',
    ImagePath VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create guardians table
CREATE TABLE guardians (
    GuardianID INT AUTO_INCREMENT PRIMARY KEY,
    StudentRegNumber VARCHAR(10) NOT NULL,
    Name VARCHAR(50) NOT NULL,
    Surname VARCHAR(50) NOT NULL,
    DateOfBirth DATE,
    NationalIDNumber VARCHAR(20) UNIQUE,
    Address VARCHAR(100),
    PhoneNumber VARCHAR(20),
    Gender VARCHAR(255) CHECK (Gender IN ('Male', 'Female', 'Other')),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentRegNumber) REFERENCES students(RegNumber) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_students_name ON students(Name, Surname);
CREATE INDEX idx_students_regnumber ON students(RegNumber);
CREATE INDEX idx_guardians_student ON guardians(StudentRegNumber);
CREATE INDEX idx_guardians_name ON guardians(Name, Surname);

-- Insert sample data (optional)
-- INSERT INTO students (RegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, Gender, Active) VALUES
-- ('ST001', 'John', 'Doe', '2010-05-15', 'ID123456789', '123 Main St', 'Male', 'Yes'),
-- ('ST002', 'Jane', 'Smith', '2009-08-22', 'ID987654321', '456 Oak Ave', 'Female', 'Yes');

-- INSERT INTO guardians (StudentRegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, PhoneNumber, Gender) VALUES
-- ('ST001', 'Robert', 'Doe', '1980-03-10', 'GID111111111', '123 Main St', '+1234567890', 'Male'),
-- ('ST002', 'Mary', 'Smith', '1982-07-15', 'GID222222222', '456 Oak Ave', '+1234567891', 'Female');
