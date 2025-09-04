const bcrypt = require('bcryptjs');
const { pool } = require('../../../config/database');
const AuditLogger = require('../../../utils/audit');

class UserController {
  // Get all users with pagination and search
  static async getAllUsers(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      const connection = await pool.getConnection();

      // Build search condition
      let searchCondition = '';
      let searchParams = [];
      
      if (search.trim()) {
        searchCondition = `
          WHERE (u.username LIKE ? OR 
                 EXISTS (
                   SELECT 1 FROM user_roles ur2 
                   JOIN roles r2 ON ur2.role_id = r2.id 
                   WHERE ur2.user_id = u.id AND r2.name LIKE ?
                 ))
        `;
        const searchTerm = `%${search.trim()}%`;
        searchParams = [searchTerm, searchTerm];
      }

      // Get users with their roles
      const [users] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
          GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${searchCondition}
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, searchParams);

      // Get total count for pagination
      const [countResult] = await connection.execute(`
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${searchCondition}
      `, searchParams);

      connection.release();

      // Process users data
      const processedUsers = users.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        roleIds: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [],
        lastLogin: user.last_login
      }));

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: processedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  }

  // Search users
  static async searchUsers(req, res) {
    try {
      const query = req.query.query || '';
      
      if (!query.trim()) {
        return res.json({ success: true, data: [], totalResults: 0 });
      }

      const connection = await pool.getConnection();

      const [users] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
          GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE (u.username LIKE ? OR 
               EXISTS (
                 SELECT 1 FROM user_roles ur2 
                 JOIN roles r2 ON ur2.role_id = r2.id 
                 WHERE ur2.user_id = u.id AND r2.name LIKE ?
               ))
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT 50
      `, [`%${query}%`, `%${query}%`]);

      connection.release();

      // Process users data
      const processedUsers = users.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        roleIds: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [],
        lastLogin: user.last_login
      }));

      res.json({
        success: true,
        data: processedUsers,
        totalResults: users.length
      });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ success: false, error: 'Failed to search users' });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      const [users] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
          GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ?
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at, u.updated_at
      `, [id]);

      connection.release();

      if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const user = {
        ...users[0],
        roles: users[0].roles ? users[0].roles.split(',') : [],
        roleIds: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : [],
        lastLogin: users[0].last_login
      };

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const { username, password, roles, isActive } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username and password are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if username already exists
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );

        if (existingUsers.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists. Please choose a different username.',
            errorType: 'DUPLICATE_ENTRY',
            field: 'username'
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await connection.beginTransaction();

        // Insert new user
        const [result] = await connection.execute(`
          INSERT INTO users (username, password, is_active) 
          VALUES (?, ?, ?)
        `, [username, hashedPassword, isActive !== false]);

        const userId = result.insertId;

        // Add roles if provided
        if (roles && Array.isArray(roles) && roles.length > 0) {
          // Validate role IDs exist
          const placeholders = roles.map(() => '?').join(',');
          const [validRoles] = await connection.execute(
            `SELECT id FROM roles WHERE id IN (${placeholders})`,
            roles
          );

          if (validRoles.length !== roles.length) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              success: false, 
              error: 'One or more role IDs are invalid',
              errorType: 'VALIDATION_ERROR',
              field: 'roles'
            });
          }

          // Insert user roles
          for (const roleId of roles) {
            await connection.execute(
              'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
              [userId, roleId]
            );
          }
        }

        await connection.commit();

        // Get the created user with roles
        const [newUser] = await connection.execute(`
          SELECT 
            u.id,
            u.username,
            u.is_active,
            u.last_login,
            u.created_at,
            u.updated_at,
            GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
            GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = ?
          GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at, u.updated_at
        `, [userId]);

        connection.release();

        // Process user data
        const userData = {
          ...newUser[0],
          roles: newUser[0].roles ? newUser[0].roles.split(',') : [],
          roleIds: newUser[0].role_ids ? newUser[0].role_ids.split(',').map(id => parseInt(id)) : []
        };

        // Log user creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'USER_CREATED',
          tableName: 'users',
          recordId: userId,
          newValues: { username, roles, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: userData
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists. Please choose a different username.',
            errorType: 'DUPLICATE_ENTRY',
            field: 'username'
          });
        }
      }
      
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, password, roles, isActive } = req.body;

      // Validation
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username is required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if user exists
        const [existingUsers] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUsers.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check for sysadmin protection
        if (existingUsers[0].username === 'sysadmin') {
          connection.release();
          return res.status(403).json({ 
            success: false, 
            error: 'System administrator account cannot be modified',
            errorType: 'FORBIDDEN_OPERATION'
          });
        }

        // Check for username conflicts (excluding current user)
        const [conflicts] = await connection.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, id]
        );

        if (conflicts.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists. Please choose a different username.',
            errorType: 'DUPLICATE_ENTRY',
            field: 'username'
          });
        }

        await connection.beginTransaction();

        // Update user basic info
        let updateQuery = 'UPDATE users SET username = ?, is_active = ?';
        let updateParams = [username, isActive !== false];

        // Include password if provided
        if (password && password.trim()) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateQuery += ', password = ?';
          updateParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await connection.execute(updateQuery, updateParams);

        // Update roles if provided
        if (roles && Array.isArray(roles)) {
          // Remove existing roles
          await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);

          // Add new roles
          if (roles.length > 0) {
            // Validate role IDs exist
            const placeholders = roles.map(() => '?').join(',');
            const [validRoles] = await connection.execute(
              `SELECT id FROM roles WHERE id IN (${placeholders})`,
              roles
            );

            if (validRoles.length !== roles.length) {
              await connection.rollback();
              connection.release();
              return res.status(400).json({ 
                success: false, 
                error: 'One or more role IDs are invalid',
                errorType: 'VALIDATION_ERROR',
                field: 'roles'
              });
            }

            // Insert new roles
            for (const roleId of roles) {
              await connection.execute(
                'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                [id, roleId]
              );
            }
          }
        }

        await connection.commit();

        // Get updated user with roles
        const [updatedUser] = await connection.execute(`
          SELECT 
            u.id,
            u.username,
            u.is_active,
            u.last_login,
            u.created_at,
            u.updated_at,
            GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
            GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = ?
          GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at, u.updated_at
        `, [id]);

        connection.release();

        const userData = {
          ...updatedUser[0],
          roles: updatedUser[0].roles ? updatedUser[0].roles.split(',') : [],
          roleIds: updatedUser[0].role_ids ? updatedUser[0].role_ids.split(',').map(id => parseInt(id)) : []
        };

        // Log user update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'USER_UPDATED',
          tableName: 'users',
          recordId: parseInt(id),
          newValues: { username, roles, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'User updated successfully',
          data: userData
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  }

  // Toggle user activation status
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      // Get current user status and username
      const [users] = await connection.execute('SELECT is_active, username FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Check if user is sysadmin
      if (users[0].username === 'sysadmin') {
        connection.release();
        return res.status(403).json({ 
          success: false, 
          error: 'System administrator account cannot be deactivated',
          errorType: 'FORBIDDEN_OPERATION'
        });
      }

      const newStatus = !users[0].is_active;

      // Update status
      await connection.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
      connection.release();

      // Log status change
      await AuditLogger.log({
        userId: req.user ? req.user.id : null,
        action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        tableName: 'users',
        recordId: parseInt(id),
        newValues: { is_active: newStatus },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        isActive: newStatus
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent deletion of current user
      if (req.user && req.user.id == id) {
        return res.status(400).json({ 
          success: false, 
          error: 'You cannot delete your own account' 
        });
      }

      const connection = await pool.getConnection();

      // Check if user is sysadmin
      const [userCheck] = await connection.execute(
        'SELECT username FROM users WHERE id = ?',
        [id]
      );

      if (userCheck.length > 0 && userCheck[0].username === 'sysadmin') {
        connection.release();
        return res.status(403).json({ 
          success: false, 
          error: 'System administrator account cannot be deleted',
          errorType: 'FORBIDDEN_OPERATION'
        });
      }

      // Check if user exists
      const [users] = await connection.execute('SELECT username FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const username = users[0].username;

      await connection.beginTransaction();

      try {
        // Delete user roles first (due to foreign key constraint)
        await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
        
        // Delete user
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        
        await connection.commit();
        connection.release();

        // Log user deletion
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'USER_DELETED',
          tableName: 'users',
          recordId: parseInt(id),
          oldValues: { username },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  }
}

module.exports = UserController;
