const { pool } = require('../../config/database');

// Get all students with pagination ONLY (no search)
const getAllStudents = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get pagination parameters from query string
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    
    // Get total count of students
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM students s'
    );
    const totalStudents = countResult[0].total;
    const totalPages = Math.ceil(totalStudents / limit);
    
    // Get paginated students with guardian information
    console.log('🔍 Limit and Offset values:', { limit, offset, types: { limit: typeof limit, offset: typeof offset } });
    
    // Use string interpolation instead of parameters for LIMIT/OFFSET
    const [rows] = await connection.execute(`
      SELECT s.*, g.Name as GuardianName, g.Surname as GuardianSurname, g.PhoneNumber as GuardianPhone
      FROM students s
      LEFT JOIN guardians g ON s.RegNumber = g.StudentRegNumber
      ORDER BY s.Name, s.Surname
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    connection.release();
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalStudents: totalStudents,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
};

// Search students by name or registration number
const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    const searchPattern = `%${query.trim()}%`;
    
    const [rows] = await connection.execute(`
      SELECT s.*, g.Name as GuardianName, g.Surname as GuardianSurname, g.PhoneNumber as GuardianPhone,
             gc.name as ClassName, st.name as StreamName
      FROM students s
      LEFT JOIN guardians g ON s.RegNumber = g.StudentRegNumber
      LEFT JOIN enrollments_gradelevel_classes e ON s.RegNumber = e.student_regnumber AND e.status = 'active'
      LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
      LEFT JOIN stream st ON gc.stream_id = st.id
      WHERE s.Name LIKE ? OR s.Surname LIKE ? OR s.RegNumber LIKE ?
      ORDER BY s.Name, s.Surname
      LIMIT 50
    `, [searchPattern, searchPattern, searchPattern]);
    
    connection.release();
    
    res.json({ 
      success: true, 
      data: rows,
      searchQuery: query,
      totalResults: rows.length
    });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ success: false, error: 'Failed to search students' });
  }
};

// Get student by RegNumber
const getStudentByRegNumber = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const connection = await pool.getConnection();
    
    const [studentRows] = await connection.execute(
      'SELECT * FROM students WHERE RegNumber = ?',
      [regNumber]
    );
    
    if (studentRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    const [guardianRows] = await connection.execute(
      'SELECT * FROM guardians WHERE StudentRegNumber = ?',
      [regNumber]
    );
    
    connection.release();
    
    const student = studentRows[0];
    student.guardians = guardianRows;
    
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
};

// Add new student with guardian
const addStudent = async (req, res) => {
  try {
    const { 
      regNumber, name, surname, dateOfBirth, nationalIDNumber, 
      address, gender, active = 'Yes',
      guardianName, guardianSurname, guardianNationalIDNumber, 
      guardianPhoneNumber, relationshipToStudent
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Insert student (removed ImagePath, set Active as default)
      await connection.execute(`
        INSERT INTO students (RegNumber, Name, Surname, DateOfBirth, NationalIDNumber, Address, Gender, Active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [regNumber, name, surname, dateOfBirth, nationalIDNumber, address, gender, active]);
      
      // Insert guardian (removed DateOfBirth, Address, Gender - added relationshipToStudent)
      await connection.execute(`
        INSERT INTO guardians (StudentRegNumber, Name, Surname, NationalIDNumber, PhoneNumber, RelationshipToStudent)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [regNumber, guardianName, guardianSurname, guardianNationalIDNumber, guardianPhoneNumber, relationshipToStudent]);
      
      // Commit transaction
      await connection.commit();
      connection.release();
      
      res.status(201).json({ 
        success: true, 
        message: 'Student and guardian added successfully',
        data: { regNumber, name, surname }
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error adding student:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('RegNumber')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Registration number already exists. Please use a different registration number.',
          errorType: 'duplicate',
          field: 'regNumber'
        });
      } else if (error.sqlMessage.includes('NationalIDNumber')) {
        return res.status(400).json({ 
          success: false, 
          error: 'National ID number already exists. A student with this National ID is already registered.',
          errorType: 'duplicate',
          field: 'nationalIDNumber'
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Duplicate entry detected. Please check your information and try again.',
          errorType: 'duplicate',
          field: 'unknown'
        });
      }
    }
    
    // Handle other database constraint errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid reference data. Please check your selections and try again.',
        errorType: 'reference'
      });
    }
    
    // Handle data too long errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        success: false, 
        error: 'One or more fields contain too much data. Please shorten your entries.',
        errorType: 'validation'
      });
    }
    
    // Generic database error
    res.status(500).json({ 
      success: false, 
      error: 'Database error occurred while adding student. Please try again.',
      errorType: 'database',
      originalError: error.message
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const { 
      name, surname, dateOfBirth, nationalIDNumber, 
      address, gender, active
    } = req.body;
    
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(`
      UPDATE students 
      SET Name = ?, Surname = ?, DateOfBirth = ?, NationalIDNumber = ?, 
          Address = ?, Gender = ?, Active = ?
      WHERE RegNumber = ?
    `, [name, surname, dateOfBirth, nationalIDNumber, address, gender, active, regNumber]);
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: 'Failed to update student' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Delete guardians first (due to foreign key constraint)
      await connection.execute(
        'DELETE FROM guardians WHERE StudentRegNumber = ?',
        [regNumber]
      );
      
      // Delete student
      const [result] = await connection.execute(
        'DELETE FROM students WHERE RegNumber = ?',
        [regNumber]
      );
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      
      // Commit transaction
      await connection.commit();
      connection.release();
      
      res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
};

// Get student balance
const getStudentBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    // Get student details - using RegNumber as the identifier
    const [studentRows] = await connection.execute(
      'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ?',
      [id]
    );
    
    if (studentRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get current balance - using RegNumber to match student_balances
    const [balanceRows] = await connection.execute(
      'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
      [id]
    );
    
    connection.release();
    
    const balance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;
    
    res.json({
      success: true,
      student: studentRows[0],
      balance: balance
    });
    
  } catch (error) {
    console.error('Error getting student balance:', error);
    res.status(500).json({ success: false, error: 'Failed to get student balance' });
  }
};

module.exports = {
  getAllStudents,
  searchStudents,
  getStudentByRegNumber,
  addStudent,
  updateStudent,
  deleteStudent,
  getStudentBalance
};
