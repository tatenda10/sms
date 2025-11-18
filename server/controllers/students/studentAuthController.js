const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { JWT_SECRET } = require('../../middleware/auth');

class StudentAuthController {
  // Student login
  static async login(req, res) {
    const conn = await pool.getConnection();
    try {
      let { regNumber, password } = req.body;

      if (!regNumber || !password) {
        return res.status(400).json({
          success: false,
          message: 'Registration number and password are required'
        });
      }

      // Trim whitespace from registration number
      regNumber = regNumber.trim();
      
      console.log('🔍 Student login attempt:', { 
        regNumber: regNumber, 
        regNumberLength: regNumber.length,
        passwordLength: password ? password.length : 0 
      });

      // Find student by registration number using case-insensitive comparison
      // Try exact match first (in case it matches exactly)
      let [students] = await conn.execute(
        'SELECT * FROM students WHERE RegNumber = ?',
        [regNumber]
      );

      // If not found, try case-insensitive match
      if (students.length === 0) {
        console.log('⚠️ Exact match not found, trying case-insensitive...');
        [students] = await conn.execute(
          'SELECT * FROM students WHERE LOWER(TRIM(RegNumber)) = LOWER(?)',
          [regNumber]
        );
      }

      if (students.length === 0) {
        console.log('❌ Student not found for regNumber:', regNumber);
        // Try to find similar registration numbers for debugging
        const [similar] = await conn.execute(
          'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber LIKE ? LIMIT 5',
          [`%${regNumber.substring(0, Math.min(3, regNumber.length))}%`]
        );
        if (similar.length > 0) {
          console.log('💡 Similar registration numbers found:', similar.map(s => s.RegNumber));
        }
        return res.status(401).json({
          success: false,
          message: 'Invalid registration number or student not found'
        });
      }
      
      console.log('✅ Student found:', { 
        regNumber: students[0].RegNumber, 
        inputRegNumber: regNumber,
        hasPassword: !!students[0].password 
      });

      const student = students[0];

      // Check if this is first login (no password set)
      if (!student.password) {
        // For first login, use registration number as temporary password (case-insensitive)
        const passwordTrimmed = password.trim();
        const studentRegNumberTrimmed = student.RegNumber.trim();
        // Compare case-insensitively
        if (passwordTrimmed.toLowerCase() !== studentRegNumberTrimmed.toLowerCase()) {
          console.log('❌ First login password mismatch:', {
            entered: passwordTrimmed,
            expected: studentRegNumberTrimmed
          });
          return res.status(401).json({
            success: false,
            message: 'First login detected. Please use your registration number as password to set up your account.',
            isFirstLogin: true
          });
        }

        // Generate JWT token for first login
        const token = jwt.sign(
          {
            studentId: student.id,
            regNumber: student.RegNumber,
            fullName: `${student.Name} ${student.Surname}`,
            userType: 'student',
            isFirstLogin: true
          },
          JWT_SECRET,
          { expiresIn: '1h' } // Shorter expiry for first login
        );

        // Remove sensitive data
        const { password: _, ...studentData } = student;

        return res.json({
          success: true,
          message: 'First login successful. Please set your password.',
          token,
          student: studentData,
          isFirstLogin: true
        });
      }

      // Regular login - verify password
      const isPasswordValid = await bcrypt.compare(password, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          studentId: student.id,
          regNumber: student.RegNumber,
          fullName: `${student.Name} ${student.Surname}`,
          userType: 'student'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove sensitive data
      const { password: _, ...studentData } = student;

      res.json({
        success: true,
        message: 'Login successful',
        token,
        student: studentData
      });

    } catch (error) {
      console.error('Student login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      conn.release();
    }
  }

  // Get student profile
  static async getProfile(req, res) {
    const conn = await pool.getConnection();
    try {
      const { regNumber } = req.student;

      const [students] = await conn.execute(
        'SELECT * FROM students WHERE RegNumber = ?',
        [regNumber]
      );

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const student = students[0];
      const { password, ...studentData } = student;

      res.json({
        success: true,
        student: studentData
      });

    } catch (error) {
      console.error('Get student profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      conn.release();
    }
  }

  // Change password
  static async changePassword(req, res) {
    const conn = await pool.getConnection();
    try {
      const { currentPassword, newPassword } = req.body;
      const { regNumber } = req.student;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get current student data
      const [students] = await conn.execute(
        'SELECT password FROM students WHERE RegNumber = ?',
        [regNumber]
      );

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const student = students[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await conn.execute(
        'UPDATE students SET password = ? WHERE RegNumber = ?',
        [hashedNewPassword, regNumber]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      conn.release();
    }
  }

  // Set initial password (for first login)
  static async setInitialPassword(req, res) {
    const conn = await pool.getConnection();
    try {
      console.log('🔐 Set initial password request:', {
        body: req.body,
        student: req.student,
        headers: req.headers
      });
      
      const { newPassword } = req.body;
      const { regNumber } = req.student;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await conn.execute(
        'UPDATE students SET password = ? WHERE RegNumber = ?',
        [hashedPassword, regNumber]
      );

      res.json({
        success: true,
        message: 'Password set successfully'
      });

    } catch (error) {
      console.error('Set initial password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = StudentAuthController;
