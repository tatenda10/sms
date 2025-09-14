const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../../config/database');
const { JWT_SECRET } = require('../../../middleware/auth');
const AuditLogger = require('../../../utils/audit');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      console.log('🔐 Login attempt for username:', username);
      console.log('📝 Request body:', req.body);

      if (!username || !password) {
        console.log('❌ Missing username or password');
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const connection = await pool.getConnection();
      console.log('🔌 Database connection established');
      
      // Get user with role information
      const [users] = await connection.execute(`
        SELECT 
          u.*,
          GROUP_CONCAT(r.name) as roles,
          GROUP_CONCAT(r.id) as role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.username = ? AND u.is_active = 1
        GROUP BY u.id, u.username, u.password, u.is_active, u.last_login, u.created_at, u.updated_at
      `, [username]);

      console.log('🔍 Database query executed');
      console.log('👥 Users found:', users.length);
      console.log('📊 Raw user data:', users);

      connection.release();

      if (users.length === 0) {
        console.log('❌ No user found with username:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      console.log('👤 User found:', { id: user.id, username: user.username, hasPassword: !!user.password });
      console.log('🔑 Stored password hash:', user.password ? user.password.substring(0, 20) + '...' : 'NO PASSWORD');
      console.log('🎭 Roles:', user.roles);
      console.log('🆔 Role IDs:', user.role_ids);
      
      // Enhanced password debugging
      console.log('🔍 Password comparison debugging:');
      console.log('   Input password:', `"${password}"`);
      console.log('   Input password length:', password.length);
      console.log('   Stored hash:', `"${user.password}"`);
      console.log('   Stored hash length:', user.password ? user.password.length : 0);
      console.log('   Stored hash bytes:', Buffer.from(user.password || '', 'utf8').length);
      
      // Check for hidden characters
      const hashBytes = Buffer.from(user.password || '', 'utf8');
      console.log('   Hash byte values:', Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Test hash generation for comparison
      const testHash = await bcrypt.hash(password, 10);
      console.log('   Test hash for input:', `"${testHash}"`);
      console.log('   Test hash matches stored?', testHash === user.password);
      
      // Try to compare with trimmed hash
      const trimmedHash = user.password ? user.password.trim() : '';
      console.log('   Trimmed hash:', `"${trimmedHash}"`);
      console.log('   Trimmed hash length:', trimmedHash.length);

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password validation result:', isValidPassword);
      
      // Try with trimmed hash if original fails
      if (!isValidPassword && trimmedHash !== user.password) {
        const isValidWithTrimmed = await bcrypt.compare(password, trimmedHash);
        console.log('🔐 Password validation with trimmed hash:', isValidWithTrimmed);
      }

      if (!isValidPassword) {
        console.log('❌ Password validation failed');
        // Log failed login attempt
        await AuditLogger.log({
          action: 'LOGIN_FAILED',
          tableName: 'users',
          recordId: user.id,
          newValues: { username },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('✅ Password validated successfully');

      // Update last login
      const updateConnection = await pool.getConnection();
      await updateConnection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
      updateConnection.release();
      console.log('⏰ Last login timestamp updated');

      // Process roles
      const roles = user.roles ? user.roles.split(',') : [];
      const roleIds = user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [];
      console.log('🎭 Processed roles:', roles);
      console.log('🆔 Processed role IDs:', roleIds);

      // Generate JWT token with roles
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          roles: roles,
          roleIds: roleIds
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('🎫 JWT token generated successfully');

      // Log successful login
      await AuditLogger.log({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        tableName: 'users',
        recordId: user.id,
        newValues: { username: user.username, roles },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      console.log('📝 Audit log created for successful login');

      const responseData = {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          roles: roles,
          roleIds: roleIds
        }
      };
      console.log('📤 Sending response:', { ...responseData, token: responseData.token ? 'JWT_TOKEN_PRESENT' : 'NO_TOKEN' });

      res.json(responseData);
    } catch (error) {
      console.error('💥 Login error:', error);
      console.error('🔍 Error stack:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async register(req, res) {
    try {
      const { username, password, roleIds } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const connection = await pool.getConnection();

      // Check if username already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction
      await connection.beginTransaction();

      try {
        // Insert new user
        const [result] = await connection.execute(`
          INSERT INTO users (username, password) 
          VALUES (?, ?)
        `, [username, hashedPassword]);

        const userId = result.insertId;

        // Add roles if provided
        if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
          const roleValues = roleIds.map(roleId => [userId, roleId]);
          await connection.execute(`            INSERT INTO user_roles (user_id, role_id) 
            VALUES ?
          `, [roleValues]);
        }

        await connection.commit();
        connection.release();

        // Log user creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'USER_CREATED',
          tableName: 'users',
          recordId: userId,
          newValues: { username, roleIds },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          message: 'User created successfully',
          userId: userId
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req, res) {
    try {
      const connection = await pool.getConnection();
      const [users] = await connection.execute(`
        SELECT 
          u.id, 
          u.username, 
          u.is_active, 
          u.last_login, 
          u.created_at,
          GROUP_CONCAT(r.name) as roles,
          GROUP_CONCAT(r.id) as role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.id = ?
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at
      `, [req.user.id]);

      connection.release();

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Process roles for the user
      const user = {
        ...users[0],
        roles: users[0].roles ? users[0].roles.split(',') : [],
        roleIds: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : []
      };

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      const connection = await pool.getConnection();
      
      // Get current user password
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValidPassword) {
        connection.release();
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, req.user.id]
      );

      connection.release();

      // Log password change
      await AuditLogger.log({
        userId: req.user.id,
        action: 'PASSWORD_CHANGED',
        tableName: 'users',
        recordId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;

