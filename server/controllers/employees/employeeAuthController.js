const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { JWT_SECRET } = require('../../middleware/auth');
const AuditLogger = require('../../utils/audit');

class EmployeeAuthController {
  /**
   * Employee login - handles both first-time password setup and regular login
   */
  static async login(req, res) {
    try {
      const { employeeNumber, password } = req.body;
      console.log('🔐 Employee login attempt for employee number:', employeeNumber);

      if (!employeeNumber || !password) {
        return res.status(400).json({ 
          error: 'Employee number and password are required' 
        });
      }

      const connection = await pool.getConnection();
      
      // Get employee with department and job title information
      const [employees] = await connection.execute(`
        SELECT 
          e.*,
          d.name as department_name,
          jt.title as job_title
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.employee_id = ? AND e.is_active = 1
      `, [employeeNumber]);

      connection.release();

      if (employees.length === 0) {
        console.log('❌ No active employee found with employee number:', employeeNumber);
        return res.status(401).json({ 
          error: 'Invalid employee number or employee is inactive' 
        });
      }

      const employee = employees[0];
      console.log('👤 Employee found:', { 
        id: employee.id, 
        employee_id: employee.employee_id, 
        full_name: employee.full_name,
        password_set: employee.password_set 
      });

      // Check if this is first-time login (no password set)
      if (!employee.password_set || !employee.password) {
        console.log('🆕 First-time login detected, password setup required');
        return res.status(200).json({
          message: 'First-time login - password setup required',
          requiresPasswordSetup: true,
          employee: {
            id: employee.id,
            employee_id: employee.employee_id,
            full_name: employee.full_name,
            department_name: employee.department_name,
            job_title: employee.job_title
          }
        });
      }

      // Validate password for existing users
      console.log('🔑 Validating password for existing employee');
      const isValidPassword = await bcrypt.compare(password, employee.password);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for employee:', employeeNumber);
        
        // Log failed login attempt
        await AuditLogger.log({
          action: 'EMPLOYEE_LOGIN_FAILED',
          tableName: 'employees',
          recordId: employee.id,
          newValues: { employee_id: employeeNumber },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        return res.status(401).json({ 
          error: 'Invalid password' 
        });
      }

      console.log('✅ Password validated successfully');

      // Update last login
      const updateConnection = await pool.getConnection();
      await updateConnection.execute(
        'UPDATE employees SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [employee.id]
      );
      updateConnection.release();
      console.log('⏰ Last login timestamp updated');

      // Generate JWT token
      const token = jwt.sign(
        { 
          employeeId: employee.id, 
          employeeNumber: employee.employee_id,
          fullName: employee.full_name,
          department: employee.department_name,
          jobTitle: employee.job_title,
          userType: 'employee'
        },
        JWT_SECRET,
        { expiresIn: '8h' } // Shorter expiry for employees
      );
      console.log('🎫 JWT token generated successfully');

      // Log successful login
      await AuditLogger.log({
        userId: employee.id,
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        tableName: 'employees',
        recordId: employee.id,
        newValues: { 
          employee_id: employee.employee_id, 
          full_name: employee.full_name 
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      const responseData = {
        message: 'Login successful',
        token,
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          department_name: employee.department_name,
          job_title: employee.job_title,
          last_login: employee.last_login
        }
      };

      console.log('✅ Employee login successful');
      res.json(responseData);

    } catch (error) {
      console.error('❌ Employee login error:', error);
      res.status(500).json({ 
        error: 'Internal server error during employee login' 
      });
    }
  }

  /**
   * Set password for first-time employee login
   */
  static async setPassword(req, res) {
    try {
      const { employeeId, password, confirmPassword } = req.body;
      console.log('🔐 Setting password for employee ID:', employeeId);

      if (!employeeId || !password || !confirmPassword) {
        return res.status(400).json({ 
          error: 'Employee ID, password, and confirmation are required' 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          error: 'Password and confirmation do not match' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      const connection = await pool.getConnection();
      
      // Verify employee exists and is active
      const [employees] = await connection.execute(`
        SELECT id, employee_id, full_name, password_set 
        FROM employees 
        WHERE id = ? AND is_active = 1
      `, [employeeId]);

      if (employees.length === 0) {
        connection.release();
        return res.status(404).json({ 
          error: 'Employee not found or inactive' 
        });
      }

      const employee = employees[0];

      // Check if password is already set
      if (employee.password_set) {
        connection.release();
        return res.status(400).json({ 
          error: 'Password has already been set for this employee' 
        });
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('🔐 Password hashed successfully');

      // Update employee with password
      await connection.execute(`
        UPDATE employees 
        SET password = ?, 
            password_set = TRUE,
            password_created_at = CURRENT_TIMESTAMP,
            password_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hashedPassword, employeeId]);

      connection.release();
      console.log('✅ Password set successfully for employee:', employee.employee_id);

      // Log password setup
      await AuditLogger.log({
        userId: employee.id,
        action: 'EMPLOYEE_PASSWORD_SET',
        tableName: 'employees',
        recordId: employee.id,
        newValues: { 
          employee_id: employee.employee_id,
          password_set: true 
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Password set successfully. You can now login with your employee number and password.',
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          full_name: employee.full_name
        }
      });

    } catch (error) {
      console.error('❌ Set password error:', error);
      res.status(500).json({ 
        error: 'Internal server error while setting password' 
      });
    }
  }

  /**
   * Change password for existing employees
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const employeeId = req.employeeId; // From JWT token

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          error: 'Current password, new password, and confirmation are required' 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          error: 'New password and confirmation do not match' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      const connection = await pool.getConnection();
      
      // Get current password
      const [employees] = await connection.execute(`
        SELECT id, employee_id, password 
        FROM employees 
        WHERE id = ? AND is_active = 1
      `, [employeeId]);

      if (employees.length === 0) {
        connection.release();
        return res.status(404).json({ 
          error: 'Employee not found' 
        });
      }

      const employee = employees[0];

      // Verify current password
      const isValidCurrentPassword = await bcrypt.compare(currentPassword, employee.password);
      if (!isValidCurrentPassword) {
        connection.release();
        return res.status(401).json({ 
          error: 'Current password is incorrect' 
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await connection.execute(`
        UPDATE employees 
        SET password = ?, 
            password_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hashedNewPassword, employeeId]);

      connection.release();
      console.log('✅ Password changed successfully for employee:', employee.employee_id);

      // Log password change
      await AuditLogger.log({
        userId: employee.id,
        action: 'EMPLOYEE_PASSWORD_CHANGED',
        tableName: 'employees',
        recordId: employee.id,
        newValues: { 
          employee_id: employee.employee_id 
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ 
        error: 'Internal server error while changing password' 
      });
    }
  }

  /**
   * Get employee profile (protected route)
   */
  static async getProfile(req, res) {
    try {
      const employeeId = req.employeeId; // From JWT token

      const connection = await pool.getConnection();
      
      const [employees] = await connection.execute(`
        SELECT 
          e.id,
          e.employee_id,
          e.full_name,
          e.email,
          e.phone_number,
          e.address,
          e.hire_date,
          e.last_login,
          e.password_created_at,
          d.name as department_name,
          jt.title as job_title
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.id = ? AND e.is_active = 1
      `, [employeeId]);

      connection.release();

      if (employees.length === 0) {
        return res.status(404).json({ 
          error: 'Employee profile not found' 
        });
      }

      const employee = employees[0];
      
      res.json({
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          email: employee.email,
          phone_number: employee.phone_number,
          address: employee.address,
          hire_date: employee.hire_date,
          last_login: employee.last_login,
          password_created_at: employee.password_created_at,
          department_name: employee.department_name,
          job_title: employee.job_title
        }
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({ 
        error: 'Internal server error while fetching profile' 
      });
    }
  }
}

module.exports = EmployeeAuthController;