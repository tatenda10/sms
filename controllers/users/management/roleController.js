const { pool } = require('../../../config/database');
const AuditLogger = require('../../../utils/audit');

class RoleController {
  // Get all roles with pagination and search
  static async getAllRoles(req, res) {
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
        searchCondition = 'WHERE (r.name LIKE ? OR r.description LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        searchParams = [searchTerm, searchTerm];
      }

      // Get roles with user count
      const [roles] = await connection.execute(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        ${searchCondition}
        GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, searchParams);

      // Get total count for pagination
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM roles r
        ${searchCondition}
      `, searchParams);

      connection.release();

      // Process roles data
      const processedRoles = roles.map(role => ({
        ...role,
        permissions: [], // No permissions in current schema
        userCount: parseInt(role.user_count),
        isActive: true // Default to active since no is_active column
      }));

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: processedRoles,
        pagination: {
          currentPage: page,
          totalPages,
          totalRoles: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch roles' });
    }
  }

  // Search roles
  static async searchRoles(req, res) {
    try {
      const query = req.query.query || '';
      
      if (!query.trim()) {
        return res.json({ success: true, data: [], totalResults: 0 });
      }

      const connection = await pool.getConnection();

      const [roles] = await connection.execute(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE (r.name LIKE ? OR r.description LIKE ?)
        GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
        ORDER BY r.created_at DESC
        LIMIT 50
      `, [`%${query}%`, `%${query}%`]);

      connection.release();

      // Process roles data
      const processedRoles = roles.map(role => ({
        ...role,
        permissions: [], // No permissions in current schema
        userCount: parseInt(role.user_count),
        isActive: true // Default to active since no is_active column
      }));

      res.json({
        success: true,
        data: processedRoles,
        totalResults: roles.length
      });
    } catch (error) {
      console.error('Error searching roles:', error);
      res.status(500).json({ success: false, error: 'Failed to search roles' });
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      const [roles] = await connection.execute(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.id = ?
        GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
      `, [id]);

      connection.release();

      if (roles.length === 0) {
        return res.status(404).json({ success: false, error: 'Role not found' });
      }

      const role = {
        ...roles[0],
        permissions: [], // No permissions in current schema
        userCount: parseInt(roles[0].user_count),
        isActive: true // Default to active since no is_active column
      };

      res.json({ success: true, data: role });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch role' });
    }
  }

  // Get users assigned to a role
  static async getRoleUsers(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      // Check if role exists
      const [roleCheck] = await connection.execute('SELECT name FROM roles WHERE id = ?', [id]);
      if (roleCheck.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'Role not found' });
      }

      // Get users with this role
      const [users] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.is_active,
          u.last_login,
          u.created_at
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = ?
        ORDER BY u.username
      `, [id]);

      connection.release();

      res.json({
        success: true,
        data: {
          roleName: roleCheck[0].name,
          users: users.map(user => ({
            ...user,
            isActive: Boolean(user.is_active),
            lastLogin: user.last_login
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching role users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch role users' });
    }
  }

  // Create new role
  static async createRole(req, res) {
    try {
      const { name, description } = req.body;

      // Validation
      if (!name || !description) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role name and description are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if role name already exists
        const [existingRoles] = await connection.execute(
          'SELECT id FROM roles WHERE name = ?',
          [name.trim()]
        );

        if (existingRoles.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Role name already exists. Please choose a different name.',
            errorType: 'DUPLICATE_ENTRY',
            field: 'name'
          });
        }

        // Insert new role
        const [result] = await connection.execute(`
          INSERT INTO roles (name, description) 
          VALUES (?, ?)
        `, [name.trim(), description.trim()]);

        const roleId = result.insertId;

        // Get the created role
        const [newRole] = await connection.execute(`
          SELECT 
            r.id,
            r.name,
            r.description,
            r.created_at,
            r.updated_at,
            COUNT(DISTINCT ur.user_id) as user_count
          FROM roles r
          LEFT JOIN user_roles ur ON r.id = ur.role_id
          WHERE r.id = ?
          GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
        `, [roleId]);

        connection.release();

        const roleData = {
          ...newRole[0],
          permissions: [], // No permissions in current schema
          userCount: 0,
          isActive: true // Default to active since no is_active column
        };

        // Log role creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'ROLE_CREATED',
          tableName: 'roles',
          recordId: roleId,
          newValues: { name, description },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          message: 'Role created successfully',
          data: roleData
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating role:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          error: 'Role name already exists. Please choose a different name.',
          errorType: 'DUPLICATE_ENTRY',
          field: 'name'
        });
      }
      
      res.status(500).json({ success: false, error: 'Failed to create role' });
    }
  }

  // Update role
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validation
      if (!name || !description) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role name and description are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if role exists
        const [existingRoles] = await connection.execute('SELECT name FROM roles WHERE id = ?', [id]);
        if (existingRoles.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Role not found' });
        }

        // Check for name conflicts (excluding current role)
        const [conflicts] = await connection.execute(
          'SELECT id FROM roles WHERE name = ? AND id != ?',
          [name.trim(), id]
        );

        if (conflicts.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Role name already exists. Please choose a different name.',
            errorType: 'DUPLICATE_ENTRY',
            field: 'name'
          });
        }

        // Update role
        await connection.execute(`
          UPDATE roles 
          SET name = ?, description = ?
          WHERE id = ?
        `, [name.trim(), description.trim(), id]);

        // Get updated role with user count
        const [updatedRole] = await connection.execute(`
          SELECT 
            r.id,
            r.name,
            r.description,
            r.created_at,
            r.updated_at,
            COUNT(DISTINCT ur.user_id) as user_count
          FROM roles r
          LEFT JOIN user_roles ur ON r.id = ur.role_id
          WHERE r.id = ?
          GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
        `, [id]);

        connection.release();

        const roleData = {
          ...updatedRole[0],
          permissions: [], // No permissions in current schema
          userCount: parseInt(updatedRole[0].user_count),
          isActive: true // Default to active since no is_active column
        };

        // Log role update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'ROLE_UPDATED',
          tableName: 'roles',
          recordId: parseInt(id),
          newValues: { name, description },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Role updated successfully',
          data: roleData
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ success: false, error: 'Failed to update role' });
    }
  }

  // Toggle role status (not available - no is_active column)
  static async toggleRoleStatus(req, res) {
    res.status(400).json({ 
      success: false, 
      error: 'Role status toggle not available in current schema' 
    });
  }

  // Delete role
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      // Check if role exists and get user count
      const [roles] = await connection.execute(`
        SELECT 
          r.name,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.id = ?
        GROUP BY r.id, r.name
      `, [id]);
      
      if (roles.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'Role not found' });
      }

      const role = roles[0];
      const userCount = parseInt(role.user_count);

      // Prevent deletion if role is assigned to users
      if (userCount > 0) {
        connection.release();
        return res.status(400).json({ 
          success: false, 
          error: `Cannot delete role '${role.name}' because it is assigned to ${userCount} user(s). Please remove the role from all users first.`,
          errorType: 'ROLE_IN_USE',
          field: 'users'
        });
      }

      await connection.beginTransaction();

      try {
        // Delete role (user_roles will be automatically deleted due to foreign key CASCADE)
        await connection.execute('DELETE FROM roles WHERE id = ?', [id]);
        
        await connection.commit();
        connection.release();

        // Log role deletion
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'ROLE_DELETED',
          tableName: 'roles',
          recordId: parseInt(id),
          oldValues: { name: role.name },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: `Role '${role.name}' deleted successfully`
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ success: false, error: 'Failed to delete role' });
    }
  }

  // Get available permissions (simplified - no permissions in current schema)
  static async getAvailablePermissions(req, res) {
    try {
      // Return empty permissions array since we don't have permissions in current schema
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
    }
  }
}

module.exports = RoleController;
