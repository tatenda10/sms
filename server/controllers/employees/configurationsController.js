const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class ConfigurationsController {
  // ==========================================
  // DEPARTMENTS MANAGEMENT
  // ==========================================

  // Get all departments
  static async getAllDepartments(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let searchCondition = '';
      let searchParams = [];

      if (search.trim()) {
        searchCondition = 'WHERE (d.name LIKE ? OR d.description LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        searchParams = [searchTerm, searchTerm];
      }

      const connection = await pool.getConnection();

      // Get departments with employee count
      const [departments] = await connection.execute(`
        SELECT 
          d.id,
          d.name,
          d.description,
          d.is_active,
          d.created_at,
          d.updated_at,
          COUNT(DISTINCT e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
        ${searchCondition}
        GROUP BY d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at
        ORDER BY d.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, searchParams);

      // Get total count for pagination
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM departments d
        ${searchCondition}
      `, searchParams);

      connection.release();

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: departments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalRecords: total,
          limit: parseInt(limit),
          offset: offset
        }
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch departments' });
    }
  }

  // Create new department
  static async createDepartment(req, res) {
    try {
      const { name, description, isActive } = req.body;

      // Validation
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Department name is required',
          errorType: 'VALIDATION_ERROR',
          field: 'name'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check for duplicate department name
        const [existing] = await connection.execute(
          'SELECT id FROM departments WHERE name = ?',
          [name.trim()]
        );

        if (existing.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Department name already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'name'
          });
        }

        // Insert new department
        const [result] = await connection.execute(`
          INSERT INTO departments (name, description, is_active) 
          VALUES (?, ?, ?)
        `, [name.trim(), description?.trim() || null, isActive !== false]);

        const departmentId = result.insertId;

        // Get the created department
        const [newDepartment] = await connection.execute(`
          SELECT 
            d.id,
            d.name,
            d.description,
            d.is_active,
            d.created_at,
            d.updated_at,
            COUNT(DISTINCT e.id) as employee_count
          FROM departments d
          LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
          WHERE d.id = ?
          GROUP BY d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at
        `, [departmentId]);

        connection.release();

        // Log department creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'DEPARTMENT_CREATED',
          tableName: 'departments',
          recordId: departmentId,
          newValues: { name, description, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          message: 'Department created successfully',
          data: newDepartment[0]
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating department:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          error: 'Department name already exists',
          errorType: 'DUPLICATE_ENTRY',
          field: 'name'
        });
      }
      
      res.status(500).json({ success: false, error: 'Failed to create department' });
    }
  }

  // Update department
  static async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      // Validation
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Department name is required',
          errorType: 'VALIDATION_ERROR',
          field: 'name'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if department exists
        const [existingDept] = await connection.execute('SELECT * FROM departments WHERE id = ?', [id]);
        if (existingDept.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Department not found' });
        }

        // Check for name conflicts (excluding current department)
        const [conflicts] = await connection.execute(
          'SELECT id FROM departments WHERE name = ? AND id != ?',
          [name.trim(), id]
        );

        if (conflicts.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Department name already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'name'
          });
        }

        // Update department
        await connection.execute(`
          UPDATE departments 
          SET name = ?, description = ?, is_active = ?
          WHERE id = ?
        `, [name.trim(), description?.trim() || null, isActive !== false, id]);

        // Get updated department with employee count
        const [updatedDepartment] = await connection.execute(`
          SELECT 
            d.id,
            d.name,
            d.description,
            d.is_active,
            d.created_at,
            d.updated_at,
            COUNT(DISTINCT e.id) as employee_count
          FROM departments d
          LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
          WHERE d.id = ?
          GROUP BY d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at
        `, [id]);

        connection.release();

        // Log department update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'DEPARTMENT_UPDATED',
          tableName: 'departments',
          recordId: parseInt(id),
          newValues: { name, description, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Department updated successfully',
          data: updatedDepartment[0]
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({ success: false, error: 'Failed to update department' });
    }
  }

  // Delete department
  static async deleteDepartment(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      try {
        // Check if department exists
        const [department] = await connection.execute('SELECT name FROM departments WHERE id = ?', [id]);
        if (department.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Department not found' });
        }

        // Check if department has employees
        const [employees] = await connection.execute(
          'SELECT COUNT(*) as count FROM employees WHERE department_id = ? AND is_active = TRUE',
          [id]
        );

        if (employees[0].count > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: `Cannot delete department "${department[0].name}" because it has ${employees[0].count} active employee(s)`,
            errorType: 'CONSTRAINT_VIOLATION'
          });
        }

        // Delete department
        await connection.execute('DELETE FROM departments WHERE id = ?', [id]);

        connection.release();

        // Log department deletion
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'DEPARTMENT_DELETED',
          tableName: 'departments',
          recordId: parseInt(id),
          newValues: { name: department[0].name },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: `Department "${department[0].name}" deleted successfully`
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ success: false, error: 'Failed to delete department' });
    }
  }

  // ==========================================
  // JOB TITLES MANAGEMENT
  // ==========================================

  // Get all job titles
  static async getAllJobTitles(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let searchCondition = '';
      let searchParams = [];

      if (search.trim()) {
        searchCondition = 'WHERE (jt.title LIKE ? OR jt.description LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        searchParams = [searchTerm, searchTerm];
      }

      const connection = await pool.getConnection();

      // Get job titles with employee count
      const [jobTitles] = await connection.execute(`
        SELECT 
          jt.id,
          jt.title,
          jt.description,
          jt.is_active,
          jt.created_at,
          jt.updated_at,
          COUNT(DISTINCT e.id) as employee_count
        FROM job_titles jt
        LEFT JOIN employees e ON jt.id = e.job_title_id AND e.is_active = TRUE
        ${searchCondition}
        GROUP BY jt.id, jt.title, jt.description, jt.is_active, jt.created_at, jt.updated_at
        ORDER BY jt.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, searchParams);

      // Get total count for pagination
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM job_titles jt
        ${searchCondition}
      `, searchParams);

      connection.release();

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: jobTitles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalRecords: total,
          limit: parseInt(limit),
          offset: offset
        }
      });
    } catch (error) {
      console.error('Error fetching job titles:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch job titles' });
    }
  }

  // Create new job title
  static async createJobTitle(req, res) {
    try {
      const { title, description, isActive } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({ 
          success: false, 
          error: 'Job title is required',
          errorType: 'VALIDATION_ERROR',
          field: 'title'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check for duplicate job title
        const [existing] = await connection.execute(
          'SELECT id FROM job_titles WHERE title = ?',
          [title.trim()]
        );

        if (existing.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Job title already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'title'
          });
        }

        // Insert new job title
        const [result] = await connection.execute(`
          INSERT INTO job_titles (title, description, is_active) 
          VALUES (?, ?, ?)
        `, [title.trim(), description?.trim() || null, isActive !== false]);

        const titleId = result.insertId;

        // Get the created job title
        const [newTitle] = await connection.execute(`
          SELECT 
            jt.id,
            jt.title,
            jt.description,
            jt.is_active,
            jt.created_at,
            jt.updated_at,
            COUNT(DISTINCT e.id) as employee_count
          FROM job_titles jt
          LEFT JOIN employees e ON jt.id = e.job_title_id AND e.is_active = TRUE
          WHERE jt.id = ?
          GROUP BY jt.id, jt.title, jt.description, jt.is_active, jt.created_at, jt.updated_at
        `, [titleId]);

        connection.release();

        // Log job title creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'JOB_TITLE_CREATED',
          tableName: 'job_titles',
          recordId: titleId,
          newValues: { title, description, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          message: 'Job title created successfully',
          data: newTitle[0]
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating job title:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          error: 'Job title already exists',
          errorType: 'DUPLICATE_ENTRY',
          field: 'title'
        });
      }
      
      res.status(500).json({ success: false, error: 'Failed to create job title' });
    }
  }

  // Update job title
  static async updateJobTitle(req, res) {
    try {
      const { id } = req.params;
      const { title, description, isActive } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({ 
          success: false, 
          error: 'Job title is required',
          errorType: 'VALIDATION_ERROR',
          field: 'title'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if job title exists
        const [existingTitle] = await connection.execute('SELECT * FROM job_titles WHERE id = ?', [id]);
        if (existingTitle.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Job title not found' });
        }

        // Check for title conflicts (excluding current title)
        const [conflicts] = await connection.execute(
          'SELECT id FROM job_titles WHERE title = ? AND id != ?',
          [title.trim(), id]
        );

        if (conflicts.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Job title already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'title'
          });
        }

        // Update job title
        await connection.execute(`
          UPDATE job_titles 
          SET title = ?, description = ?, is_active = ?
          WHERE id = ?
        `, [title.trim(), description?.trim() || null, isActive !== false, id]);

        // Get updated job title with employee count
        const [updatedTitle] = await connection.execute(`
          SELECT 
            jt.id,
            jt.title,
            jt.description,
            jt.is_active,
            jt.created_at,
            jt.updated_at,
            COUNT(DISTINCT e.id) as employee_count
          FROM job_titles jt
          LEFT JOIN employees e ON jt.id = e.job_title_id AND e.is_active = TRUE
          WHERE jt.id = ?
          GROUP BY jt.id, jt.title, jt.description, jt.is_active, jt.created_at, jt.updated_at
        `, [id]);

        connection.release();

        // Log job title update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'JOB_TITLE_UPDATED',
          tableName: 'job_titles',
          recordId: parseInt(id),
          newValues: { title, description, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Job title updated successfully',
          data: updatedTitle[0]
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating job title:', error);
      res.status(500).json({ success: false, error: 'Failed to update job title' });
    }
  }

  // Delete job title
  static async deleteJobTitle(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      try {
        // Check if job title exists
        const [jobTitle] = await connection.execute('SELECT title FROM job_titles WHERE id = ?', [id]);
        if (jobTitle.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Job title not found' });
        }

        // Check if job title has employees
        const [employees] = await connection.execute(
          'SELECT COUNT(*) as count FROM employees WHERE job_title_id = ? AND is_active = TRUE',
          [id]
        );

        if (employees[0].count > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: `Cannot delete job title "${jobTitle[0].title}" because it has ${employees[0].count} active employee(s)`,
            errorType: 'CONSTRAINT_VIOLATION'
          });
        }

        // Delete job title
        await connection.execute('DELETE FROM job_titles WHERE id = ?', [id]);

        connection.release();

        // Log job title deletion
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'JOB_TITLE_DELETED',
          tableName: 'job_titles',
          recordId: parseInt(id),
          newValues: { title: jobTitle[0].title },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: `Job title "${jobTitle[0].title}" deleted successfully`
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting job title:', error);
      res.status(500).json({ success: false, error: 'Failed to delete job title' });
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  // Get all active departments and job titles for dropdowns
  static async getActiveConfigurations(req, res) {
    try {
      const connection = await pool.getConnection();

      const [departments] = await connection.execute(`
        SELECT id, name 
        FROM departments 
        WHERE is_active = TRUE 
        ORDER BY name
      `);

      const [jobTitles] = await connection.execute(`
        SELECT id, title as name
        FROM job_titles 
        WHERE is_active = TRUE 
        ORDER BY title
      `);

      connection.release();

      res.json({
        success: true,
        data: {
          departments,
          jobTitles
        }
      });
    } catch (error) {
      console.error('Error fetching active configurations:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch configurations' });
    }
  }
}

module.exports = ConfigurationsController;
