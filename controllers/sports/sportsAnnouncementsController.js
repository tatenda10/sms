const { pool } = require('../../config/database');

class SportsAnnouncementsController {
  // Get all sports announcements with pagination and filtering
  static async getAllAnnouncements(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        announcement_type,
        sport_category_id,
        team_id,
        status = 'published',
        priority,
        target_audience,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (announcement_type) {
        whereConditions.push('sa.announcement_type = ?');
        queryParams.push(announcement_type);
      }

      if (sport_category_id) {
        whereConditions.push('sa.sport_category_id = ?');
        queryParams.push(sport_category_id);
      }

      if (team_id) {
        whereConditions.push('sa.team_id = ?');
        queryParams.push(team_id);
      }

      if (status) {
        whereConditions.push('sa.status = ?');
        queryParams.push(status);
      }

      if (priority) {
        whereConditions.push('sa.priority = ?');
        queryParams.push(priority);
      }

      if (target_audience) {
        whereConditions.push('sa.target_audience = ?');
        queryParams.push(target_audience);
      }

      if (search) {
        whereConditions.push('(sa.title LIKE ? OR sa.content LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sports_announcements sa
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, queryParams);
      const totalAnnouncements = countResult[0].total;
      const totalPages = Math.ceil(totalAnnouncements / limit);

      // Get paginated announcements - use string interpolation for LIMIT/OFFSET
      const query = `
        SELECT 
          sa.id,
          sa.title,
          sa.content,
          sa.announcement_type,
          sa.priority,
          sa.status,
          sa.start_date,
          sa.end_date,
          sa.target_audience,
          sa.created_at,
          sa.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          st.name as team_name,
          sf.title as fixture_title,
          sf.fixture_date,
          u.username as created_by_username
        FROM sports_announcements sa
        LEFT JOIN sports_categories sc ON sa.sport_category_id = sc.id
        LEFT JOIN sports_teams st ON sa.team_id = st.id
        LEFT JOIN sports_fixtures sf ON sa.fixture_id = sf.id
        LEFT JOIN users u ON sa.created_by = u.id
        ${whereClause}
        ORDER BY 
          CASE sa.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          sa.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [announcements] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: announcements,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalAnnouncements,
          items_per_page: parseInt(limit),
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching sports announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports announcements'
      });
    }
  }

  // Get announcement by ID
  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          sa.id,
          sa.title,
          sa.content,
          sa.announcement_type,
          sa.priority,
          sa.status,
          sa.start_date,
          sa.end_date,
          sa.target_audience,
          sa.created_at,
          sa.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          st.name as team_name,
          sf.title as fixture_title,
          sf.fixture_date,
          u.username as created_by_username
        FROM sports_announcements sa
        LEFT JOIN sports_categories sc ON sa.sport_category_id = sc.id
        LEFT JOIN sports_teams st ON sa.team_id = st.id
        LEFT JOIN sports_fixtures sf ON sa.fixture_id = sf.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.id = ?
      `;
      
      const [announcements] = await pool.execute(query, [id]);
      
      if (announcements.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports announcement not found'
        });
      }
      
      res.json({
        success: true,
        data: announcements[0]
      });
    } catch (error) {
      console.error('Error fetching sports announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports announcement'
      });
    }
  }

  // Create new sports announcement
  static async createAnnouncement(req, res) {
    try {
      const { 
        title,
        content,
        announcement_type,
        sport_category_id,
        team_id,
        fixture_id,
        priority = 'medium',
        status = 'draft',
        start_date,
        end_date,
        target_audience = 'all'
      } = req.body;
      
      const created_by = req.user.id;
      
      // Validate required fields
      if (!title || !content || !announcement_type) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and announcement type are required'
        });
      }

      // Validate sport category if provided
      if (sport_category_id) {
        const [category] = await pool.execute(
          'SELECT id FROM sports_categories WHERE id = ? AND is_active = true',
          [sport_category_id]
        );
        
        if (category.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid sport category'
          });
        }
      }

      // Validate team if provided
      if (team_id) {
        const [team] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [team_id]
        );
        
        if (team.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid team'
          });
        }
      }

      // Validate fixture if provided
      if (fixture_id) {
        const [fixture] = await pool.execute(
          'SELECT id FROM sports_fixtures WHERE id = ?',
          [fixture_id]
        );
        
        if (fixture.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid fixture'
          });
        }
      }
      
      const query = `
        INSERT INTO sports_announcements (
          title, content, announcement_type, sport_category_id, team_id, fixture_id,
          priority, status, start_date, end_date, target_audience, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const [result] = await pool.execute(query, [
        title, content, announcement_type, sport_category_id, team_id, fixture_id,
        priority, status, start_date, end_date, target_audience, created_by
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Sports announcement created successfully',
        data: {
          id: result.insertId,
          title,
          announcement_type,
          priority,
          status
        }
      });
    } catch (error) {
      console.error('Error creating sports announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sports announcement'
      });
    }
  }

  // Update sports announcement
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { 
        title,
        content,
        announcement_type,
        sport_category_id,
        team_id,
        fixture_id,
        priority,
        status,
        start_date,
        end_date,
        target_audience
      } = req.body;
      
      // Check if announcement exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_announcements WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports announcement not found'
        });
      }

      // Validate sport category if being updated
      if (sport_category_id) {
        const [category] = await pool.execute(
          'SELECT id FROM sports_categories WHERE id = ? AND is_active = true',
          [sport_category_id]
        );
        
        if (category.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid sport category'
          });
        }
      }

      // Validate team if being updated
      if (team_id) {
        const [team] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [team_id]
        );
        
        if (team.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid team'
          });
        }
      }

      // Validate fixture if being updated
      if (fixture_id) {
        const [fixture] = await pool.execute(
          'SELECT id FROM sports_fixtures WHERE id = ?',
          [fixture_id]
        );
        
        if (fixture.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid fixture'
          });
        }
      }
      
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
      if (sport_category_id !== undefined) {
        updateFields.push('sport_category_id = ?');
        updateValues.push(sport_category_id);
      }
      if (team_id !== undefined) {
        updateFields.push('team_id = ?');
        updateValues.push(team_id);
      }
      if (fixture_id !== undefined) {
        updateFields.push('fixture_id = ?');
        updateValues.push(fixture_id);
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
      if (target_audience !== undefined) {
        updateFields.push('target_audience = ?');
        updateValues.push(target_audience);
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `
        UPDATE sports_announcements 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Sports announcement updated successfully'
      });
    } catch (error) {
      console.error('Error updating sports announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports announcement'
      });
    }
  }

  // Delete sports announcement
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;
      
      // Check if announcement exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_announcements WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports announcement not found'
        });
      }
      
      await pool.execute(
        'DELETE FROM sports_announcements WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Sports announcement deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sports announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete sports announcement'
      });
    }
  }

  // Get dashboard sports announcements (published, within date range)
  static async getDashboardAnnouncements(req, res) {
    try {
      const { limit = 5, sport_category_id } = req.query;

      let whereConditions = [
        'sa.status = "published"',
        '(sa.start_date IS NULL OR sa.start_date <= NOW())',
        '(sa.end_date IS NULL OR sa.end_date >= NOW())'
      ];

      let queryParams = [];

      if (sport_category_id) {
        whereConditions.push('sa.sport_category_id = ?');
        queryParams.push(sport_category_id);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const query = `
        SELECT 
          sa.id,
          sa.title,
          sa.content,
          sa.announcement_type,
          sa.priority,
          sa.target_audience,
          sa.created_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          st.name as team_name,
          sf.title as fixture_title,
          u.username as created_by_username
        FROM sports_announcements sa
        LEFT JOIN sports_categories sc ON sa.sport_category_id = sc.id
        LEFT JOIN sports_teams st ON sa.team_id = st.id
        LEFT JOIN sports_fixtures sf ON sa.fixture_id = sf.id
        LEFT JOIN users u ON sa.created_by = u.id
        ${whereClause}
        ORDER BY 
          CASE sa.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          sa.created_at DESC
        LIMIT ${parseInt(limit)}
      `;

      const [announcements] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: announcements
      });
    } catch (error) {
      console.error('Error fetching dashboard sports announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard sports announcements'
      });
    }
  }
}

module.exports = SportsAnnouncementsController;
