const { pool } = require('../config/database');

class AnnouncementsController {
  // Get all announcements with pagination and filtering
  static async getAllAnnouncements(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        status = 'published',
        target_type,
        priority,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let baseQueryParams = [];

      // Build WHERE conditions
      if (type) {
        whereConditions.push('a.announcement_type = ?');
        baseQueryParams.push(type);
      }

      if (status) {
        whereConditions.push('a.status = ?');
        baseQueryParams.push(status);
      }

      if (target_type) {
        whereConditions.push('a.target_type = ?');
        baseQueryParams.push(target_type);
      }

      if (priority) {
        whereConditions.push('a.priority = ?');
        baseQueryParams.push(priority);
      }

      if (search) {
        whereConditions.push('(a.title LIKE ? OR a.content LIKE ?)');
        baseQueryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM announcements a 
        ${whereClause}
      `;
      const [countResult] = await pool.execute(countQuery, baseQueryParams);
      const total = countResult[0].total;

      // Get announcements with user info - use string interpolation for LIMIT/OFFSET
      const announcementsQuery = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.announcement_type,
          a.target_type,
          a.target_value,
          a.priority,
          a.status,
          a.start_date,
          a.end_date,
          a.created_at,
          a.updated_at,
          u.username as created_by_username,
          CASE 
            WHEN a.announcement_type = 'student' AND a.target_type = 'specific' THEN gc.name
            WHEN a.announcement_type = 'employee' AND a.target_type = 'specific' THEN d.name
            ELSE 'All'
          END as target_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN gradelevel_classes gc ON a.announcement_type = 'student' AND a.target_type = 'specific' AND a.target_value = gc.id
        LEFT JOIN departments d ON a.announcement_type = 'employee' AND a.target_type = 'specific' AND a.target_value = d.id
        ${whereClause}
        ORDER BY 
          CASE a.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          a.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [announcements] = await pool.execute(announcementsQuery, baseQueryParams);

      res.json({
        announcements,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  }

  // Get announcement by ID
  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          a.*,
          u.username as created_by_username,
          CASE 
            WHEN a.announcement_type = 'student' AND a.target_type = 'specific' THEN gc.name
            WHEN a.announcement_type = 'employee' AND a.target_type = 'specific' THEN d.name
            ELSE 'All'
          END as target_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN gradelevel_classes gc ON a.announcement_type = 'student' AND a.target_type = 'specific' AND a.target_value = gc.id
        LEFT JOIN departments d ON a.announcement_type = 'employee' AND a.target_type = 'specific' AND a.target_value = d.id
        WHERE a.id = ?
      `;

      const [announcements] = await pool.execute(query, [id]);

      if (announcements.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      res.json(announcements[0]);

    } catch (error) {
      console.error('Error fetching announcement:', error);
      res.status(500).json({ error: 'Failed to fetch announcement' });
    }
  }

  // Create new announcement
  static async createAnnouncement(req, res) {
    try {
      console.log('📢 Creating announcement with data:', req.body);
      
      const {
        title,
        content,
        announcement_type,
        target_type = 'all',
        target_value = null,
        priority = 'medium',
        status = 'draft',
        start_date = null,
        end_date = null
      } = req.body;

      const created_by = req.user.id; // From authentication middleware
      
      console.log('📢 Parsed data:', {
        title, content, announcement_type, target_type, target_value,
        priority, status, start_date, end_date, created_by
      });

      // Validate required fields
      if (!title || !content || !announcement_type) {
        return res.status(400).json({ 
          error: 'Title, content, and announcement type are required' 
        });
      }

      // Validate announcement type
      if (!['student', 'employee'].includes(announcement_type)) {
        return res.status(400).json({ 
          error: 'Announcement type must be either "student" or "employee"' 
        });
      }

      // Validate target type
      if (!['all', 'specific'].includes(target_type)) {
        return res.status(400).json({ 
          error: 'Target type must be either "all" or "specific"' 
        });
      }

      // If target_type is specific, target_value is required
      if (target_type === 'specific' && !target_value) {
        return res.status(400).json({ 
          error: 'Target value is required when target type is specific' 
        });
      }

      // Validate priority
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ 
          error: 'Priority must be one of: low, medium, high, urgent' 
        });
      }

      // Validate status
      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({ 
          error: 'Status must be one of: draft, published, archived' 
        });
      }

      // No date validation - allow any dates

      const insertQuery = `
        INSERT INTO announcements (
          title, content, announcement_type, target_type, target_value,
          priority, status, start_date, end_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(insertQuery, [
        title, content, announcement_type, target_type, target_value,
        priority, status, start_date, end_date, created_by
      ]);

      // Get the created announcement
      const [newAnnouncement] = await pool.execute(
        'SELECT * FROM announcements WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Announcement created successfully',
        announcement: newAnnouncement[0]
      });

    } catch (error) {
      console.error('📢 Error creating announcement:', error);
      console.error('📢 Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  }

  // Update announcement
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        announcement_type,
        target_type,
        target_value,
        priority,
        status,
        start_date,
        end_date
      } = req.body;

      // Check if announcement exists
      const [existing] = await pool.execute(
        'SELECT * FROM announcements WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }

      if (content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(content);
      }

      if (announcement_type !== undefined) {
        updateFields.push('announcement_type = ?');
        updateValues.push(announcement_type);
      }

      if (target_type !== undefined) {
        updateFields.push('target_type = ?');
        updateValues.push(target_type);
      }

      if (target_value !== undefined) {
        updateFields.push('target_value = ?');
        updateValues.push(target_value);
      }

      if (priority !== undefined) {
        updateFields.push('priority = ?');
        updateValues.push(priority);
      }

      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (start_date !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(start_date);
      }

      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(end_date);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updateValues.push(id);

      const updateQuery = `
        UPDATE announcements 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await pool.execute(updateQuery, updateValues);

      // Get updated announcement
      const [updatedAnnouncement] = await pool.execute(
        'SELECT * FROM announcements WHERE id = ?',
        [id]
      );

      res.json({
        message: 'Announcement updated successfully',
        announcement: updatedAnnouncement[0]
      });

    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  }

  // Delete announcement
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      // Check if announcement exists
      const [existing] = await pool.execute(
        'SELECT * FROM announcements WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);

      res.json({ message: 'Announcement deleted successfully' });

    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  }

  // Get target options (classes for students, departments for employees)
  static async getTargetOptions(req, res) {
    try {
      const { type } = req.params;

      if (type === 'student') {
        // Get classes (same approach as gradelevelClassController)
        const [classes] = await pool.execute(`
          SELECT gc.id, gc.name, s.name as stream_name
          FROM gradelevel_classes gc 
          LEFT JOIN stream s ON gc.stream_id = s.id
          ORDER BY s.name, gc.name
        `);
        console.log('📢 Classes found:', classes);
        res.json({ options: classes });
      } else if (type === 'employee') {
        // Get departments
        const [departments] = await pool.execute(`
          SELECT id, name
          FROM departments 
          WHERE is_active = 1
          ORDER BY name
        `);
        res.json({ options: departments });
      } else {
        res.status(400).json({ error: 'Invalid type. Must be "student" or "employee"' });
      }

    } catch (error) {
      console.error('Error fetching target options:', error);
      res.status(500).json({ error: 'Failed to fetch target options' });
    }
  }

  // Get dashboard announcements (published, within date range)
  static async getDashboardAnnouncements(req, res) {
    try {
      const { type, limit = 5 } = req.query;

      let whereConditions = [
        'a.status = "published"',
        '(a.start_date IS NULL OR a.start_date <= NOW())',
        '(a.end_date IS NULL OR a.end_date >= NOW())'
      ];

      let queryParams = [];

      if (type) {
        whereConditions.push('a.announcement_type = ?');
        queryParams.push(type);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.announcement_type,
          a.target_type,
          a.priority,
          a.created_at,
          u.username as created_by_username,
          CASE 
            WHEN a.announcement_type = 'student' AND a.target_type = 'specific' THEN gc.name
            WHEN a.announcement_type = 'employee' AND a.target_type = 'specific' THEN d.name
            ELSE 'All'
          END as target_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN gradelevel_classes gc ON a.announcement_type = 'student' AND a.target_type = 'specific' AND a.target_value = gc.id
        LEFT JOIN departments d ON a.announcement_type = 'employee' AND a.target_type = 'specific' AND a.target_value = d.id
        ${whereClause}
        ORDER BY 
          CASE a.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          a.created_at DESC
        LIMIT ?
      `;

      queryParams.push(parseInt(limit));
      const [announcements] = await pool.execute(query, queryParams);

      res.json({ announcements });

    } catch (error) {
      console.error('Error fetching dashboard announcements:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard announcements' });
    }
  }

  // Get employee announcements (filtered for employees only)
  static async getEmployeeAnnouncements(req, res) {
    try {
      console.log('📢 Getting employee announcements');
      console.log('👤 Employee from token:', req.employee);
      
      const { 
        page = 1, 
        limit = 10, 
        priority,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [
        'a.announcement_type = "employee"',
        'a.status = "published"',
        '(a.start_date IS NULL OR a.start_date <= NOW())',
        '(a.end_date IS NULL OR a.end_date >= NOW())'
      ];
      let queryParams = [];

      // Filter by employee department if target_type is specific
      if (req.employee && req.employee.department_id) {
        whereConditions.push('(a.target_type = "all" OR (a.target_type = "specific" AND a.target_value = ?))');
        queryParams.push(req.employee.department_id);
      }

      if (priority) {
        whereConditions.push('a.priority = ?');
        queryParams.push(priority);
      }

      if (search) {
        whereConditions.push('(a.title LIKE ? OR a.content LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM announcements a 
        ${whereClause}
      `;
      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;

      // Get announcements with user info
      const announcementsQuery = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.announcement_type,
          a.target_type,
          a.target_value,
          a.priority,
          a.status,
          a.start_date,
          a.end_date,
          a.created_at,
          a.updated_at,
          u.username as created_by_username,
          CASE 
            WHEN a.target_type = 'specific' THEN d.name
            ELSE 'All Employees'
          END as target_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN departments d ON a.target_type = 'specific' AND a.target_value = d.id
        ${whereClause}
        ORDER BY 
          CASE a.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          a.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [announcements] = await pool.execute(announcementsQuery, queryParams);

      console.log('📢 Found announcements:', announcements.length);

      res.json({
        success: true,
        announcements,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching employee announcements:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch employee announcements' 
      });
    }
  }
}

module.exports = AnnouncementsController;
