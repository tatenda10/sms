const { pool } = require('../../config/database');

// Get all guardians
const getAllGuardians = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT g.*, s.Name as StudentName, s.Surname as StudentSurname
      FROM guardians g
      LEFT JOIN students s ON g.StudentRegNumber = s.RegNumber
      ORDER BY g.Name, g.Surname
    `);
    
    connection.release();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guardians' });
  }
};

// Get guardian by ID
const getGuardianById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT g.*, s.Name as StudentName, s.Surname as StudentSurname
      FROM guardians g
      LEFT JOIN students s ON g.StudentRegNumber = s.RegNumber
      WHERE g.GuardianID = ?
    `, [id]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Guardian not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching guardian:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guardian' });
  }
};

// Get guardians by student RegNumber
const getGuardiansByStudent = async (req, res) => {
  try {
    const { studentRegNumber } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM guardians WHERE StudentRegNumber = ?',
      [studentRegNumber]
    );
    
    connection.release();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching guardians for student:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guardians' });
  }
};

// Add new guardian
const addGuardian = async (req, res) => {
  try {
    const { 
      studentRegNumber, name, surname, nationalIDNumber, 
      phoneNumber, relationshipToStudent
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if student exists
    const [studentRows] = await connection.execute(
      'SELECT RegNumber FROM students WHERE RegNumber = ?',
      [studentRegNumber]
    );
    
    if (studentRows.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, error: 'Student not found' });
    }
    
    // Insert guardian (removed dateOfBirth, address, gender - added relationshipToStudent)
    const [result] = await connection.execute(`
      INSERT INTO guardians (StudentRegNumber, Name, Surname, NationalIDNumber, PhoneNumber, RelationshipToStudent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [studentRegNumber, name, surname, nationalIDNumber, phoneNumber, relationshipToStudent]);
    
    connection.release();
    
    res.status(201).json({ 
      success: true, 
      message: 'Guardian added successfully',
      data: { guardianId: result.insertId, name, surname, studentRegNumber }
    });
  } catch (error) {
    console.error('Error adding guardian:', error);
    res.status(500).json({ success: false, error: 'Failed to add guardian' });
  }
};

// Update guardian
const updateGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, surname, nationalIDNumber, 
      phoneNumber, relationshipToStudent
    } = req.body;
    
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(`
      UPDATE guardians 
      SET Name = ?, Surname = ?, NationalIDNumber = ?, 
          PhoneNumber = ?, RelationshipToStudent = ?
      WHERE GuardianID = ?
    `, [name, surname, nationalIDNumber, phoneNumber, relationshipToStudent, id]);
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Guardian not found' });
    }
    
    res.json({ success: true, message: 'Guardian updated successfully' });
  } catch (error) {
    console.error('Error updating guardian:', error);
    res.status(500).json({ success: false, error: 'Failed to update guardian' });
  }
};

// Delete guardian
const deleteGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM guardians WHERE GuardianID = ?',
      [id]
    );
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Guardian not found' });
    }
    
    res.json({ success: true, message: 'Guardian deleted successfully' });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    res.status(500).json({ success: false, error: 'Failed to delete guardian' });
  }
};

module.exports = {
  getAllGuardians,
  getGuardianById,
  getGuardiansByStudent,
  addGuardian,
  updateGuardian,
  deleteGuardian
};
