const bcrypt = require('bcryptjs');
const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class UserController {
  static async getAllUsers(req, res) {
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
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at
        ORDER BY u.created_at DESC
      `);

      // Process roles for each user
      const processedUsers = users.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        role_ids: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : []
      }));

      connection.release();

      res.json({
        message: 'Users retrieved successfully',
        users: processedUsers,
        count: processedUsers.length
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

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
          GROUP_CONCAT(r.name) as roles,
          GROUP_CONCAT(r.id) as role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.id = ?
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at
      `, [id]);

      connection.release();

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Process roles for the user
      const user = {
        ...users[0],
        roles: users[0].roles ? users[0].roles.split(',') : [],
        role_ids: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : []
      };

      res.json({
        message: 'User retrieved successfully',
        user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createUser(req, res) {
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
          await connection.execute(`
            INSERT INTO user_roles (user_id, role_id) 
            VALUES ?
          `, [roleValues]);
        }

        await connection.commit();
        connection.release();

        // Log user creation
        await AuditLogger.log({
          userId: req.user.id,
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
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, roleIds, isActive } = req.body;

      const connection = await pool.getConnection();

      // Get current user data
      const [currentUsers] = await connection.execute(`
        SELECT u.username, u.is_active,
               GROUP_CONCAT(ur.role_id) as current_role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = ?
        GROUP BY u.id, u.username, u.is_active
      `, [id]);

      if (currentUsers.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      const currentUser = currentUsers[0];
      const currentRoleIds = currentUser.current_role_ids ? 
        currentUser.current_role_ids.split(',').map(id => parseInt(id)) : [];

      // Check if username already exists (if changing username)
      if (username && username !== currentUser.username) {
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, id]
        );

        if (existingUsers.length > 0) {
          connection.release();
          return res.status(400).json({ error: 'Username already exists' });
        }
      }

      // Start transaction
      await connection.beginTransaction();

      try {
        // Update user
        const updateFields = [];
        const updateValues = [];

        if (username !== undefined) {
          updateFields.push('username = ?');
          updateValues.push(username);
        }

        if (isActive !== undefined) {
          updateFields.push('is_active = ?');
          updateValues.push(isActive);
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          await connection.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          );
        }

        // Update roles if provided
        if (roleIds !== undefined) {
          // Remove existing roles
          await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
          
          // Add new roles
          if (Array.isArray(roleIds) && roleIds.length > 0) {
            const roleValues = roleIds.map(roleId => [id, roleId]);
            await connection.execute(`
              INSERT INTO user_roles (user_id, role_id) 
              VALUES ?
            `, [roleValues]);
          }
        }

        await connection.commit();
        connection.release();

        // Log user update
        await AuditLogger.log({
          userId: req.user.id,
          action: 'USER_UPDATED',
          tableName: 'users',
          recordId: parseInt(id),
          oldValues: { username: currentUser.username, roleIds: currentRoleIds, isActive: currentUser.is_active },
          newValues: { username, roleIds, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({ message: 'User updated successfully' });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const connection = await pool.getConnection();

      // Get current user data
      const [currentUsers] = await connection.execute(`
        SELECT u.username,
               GROUP_CONCAT(r.name) as roles
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ?
        GROUP BY u.id, u.username
      `, [id]);

      if (currentUsers.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user (cascade will handle user_roles)
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      connection.release();

      // Log user deletion
      await AuditLogger.log({
        userId: req.user.id,
        action: 'USER_DELETED',
        tableName: 'users',
        recordId: parseInt(id),
        oldValues: currentUsers[0],
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRoles(req, res) {
    try {
      const connection = await pool.getConnection();
      const [roles] = await connection.execute(`
        SELECT id, name, description, created_at 
        FROM roles 
        ORDER BY name
      `);

      connection.release();

      res.json({
        message: 'Roles retrieved successfully',
        roles,
        count: roles.length
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserRoles(req, res) {
    try {
      const { userId } = req.params;
      const connection = await pool.getConnection();
      
      const [roles] = await connection.execute(`
        SELECT r.id, r.name, r.description, ur.created_at as assigned_at
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
        ORDER BY r.name
      `, [userId]);

      connection.release();

      res.json({
        message: 'User roles retrieved successfully',
        roles,
        count: roles.length
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        return res.status(400).json({ error: 'Role ID is required' });
      }

      const connection = await pool.getConnection();

      // Check if user exists
      const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if role exists
      const [roles] = await connection.execute('SELECT id FROM roles WHERE id = ?', [roleId]);
      if (roles.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Role not found' });
      }

      // Check if user already has this role
      const [existingRoles] = await connection.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );

      if (existingRoles.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'User already has this role' });
      }

      // Add role to user
      await connection.execute(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId]
      );

      connection.release();

      // Log role assignment
      await AuditLogger.log({
        userId: req.user.id,
        action: 'ROLE_ASSIGNED',
        tableName: 'user_roles',
        recordId: null,
        newValues: { userId, roleId },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Role assigned successfully' });
    } catch (error) {
      console.error('Add user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeUserRole(req, res) {
    try {
      const { userId, roleId } = req.params;

      const connection = await pool.getConnection();

      // Check if user-role relationship exists
      const [existingRoles] = await connection.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );

      if (existingRoles.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User-role relationship not found' });
      }

      // Remove role from user
      await connection.execute(
        'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );

      connection.release();

      // Log role removal
      await AuditLogger.log({
        userId: req.user.id,
        action: 'ROLE_REMOVED',
        tableName: 'user_roles',
        recordId: null,
        oldValues: { userId, roleId },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Role removed successfully' });
    } catch (error) {
      console.error('Remove user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
