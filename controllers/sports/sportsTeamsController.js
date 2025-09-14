const { pool } = require('../../config/database');

class SportsTeamsController {
  // Get all sports teams with pagination and filtering
  static async getAllTeams(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sport_category_id,
        active_only = 'true',
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (sport_category_id) {
        whereConditions.push('st.sport_category_id = ?');
        queryParams.push(sport_category_id);
      }

      if (active_only === 'true') {
        whereConditions.push('st.is_active = ?');
        queryParams.push(true);
      }

      if (search) {
        whereConditions.push('(st.name LIKE ? OR st.description LIKE ? OR st.coach_name LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sports_teams st
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, queryParams);
      const totalTeams = countResult[0].total;
      const totalPages = Math.ceil(totalTeams / limit);

      // Get paginated teams - use string interpolation for LIMIT/OFFSET
      const query = `
        SELECT 
          st.id,
          st.name,
          st.description,
          st.coach_name,
          st.coach_contact,
          st.is_active,
          st.created_at,
          st.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          COUNT(sp.id) as participant_count
        FROM sports_teams st
        LEFT JOIN sports_categories sc ON st.sport_category_id = sc.id
        LEFT JOIN sports_participants sp ON st.id = sp.team_id AND sp.is_active = true
        ${whereClause}
        GROUP BY st.id, sc.name, sc.icon
        ORDER BY st.name ASC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [teams] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: teams,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalTeams,
          items_per_page: parseInt(limit),
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching sports teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports teams'
      });
    }
  }

  // Get team by ID
  static async getTeamById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          st.id,
          st.name,
          st.description,
          st.coach_name,
          st.coach_contact,
          st.is_active,
          st.created_at,
          st.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon
        FROM sports_teams st
        LEFT JOIN sports_categories sc ON st.sport_category_id = sc.id
        WHERE st.id = ?
      `;
      
      const [teams] = await pool.execute(query, [id]);
      
      if (teams.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports team not found'
        });
      }
      
      res.json({
        success: true,
        data: teams[0]
      });
    } catch (error) {
      console.error('Error fetching sports team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports team'
      });
    }
  }

  // Create new sports team
  static async createTeam(req, res) {
    try {
      const { 
        name, 
        sport_category_id, 
        description, 
        coach_name, 
        coach_contact 
      } = req.body;
      
      // Validate required fields
      if (!name || !sport_category_id) {
        return res.status(400).json({
          success: false,
          message: 'Team name and sport category are required'
        });
      }

      // Check if sport category exists
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
      
      // Check if team name already exists for this sport
      const [existing] = await pool.execute(
        'SELECT id FROM sports_teams WHERE name = ? AND sport_category_id = ?',
        [name, sport_category_id]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Team with this name already exists for this sport'
        });
      }
      
      const query = `
        INSERT INTO sports_teams (name, sport_category_id, description, coach_name, coach_contact, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      const [result] = await pool.execute(query, [
        name, 
        sport_category_id, 
        description, 
        coach_name, 
        coach_contact
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Sports team created successfully',
        data: {
          id: result.insertId,
          name,
          sport_category_id,
          description,
          coach_name,
          coach_contact
        }
      });
    } catch (error) {
      console.error('Error creating sports team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sports team'
      });
    }
  }

  // Update sports team
  static async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        sport_category_id, 
        description, 
        coach_name, 
        coach_contact, 
        is_active 
      } = req.body;
      
      // Check if team exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_teams WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports team not found'
        });
      }
      
      // Check if sport category exists (if being updated)
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
      
      // Check if new name conflicts with existing team
      if (name) {
        const [conflict] = await pool.execute(
          'SELECT id FROM sports_teams WHERE name = ? AND sport_category_id = ? AND id != ?',
          [name, sport_category_id || (await pool.execute('SELECT sport_category_id FROM sports_teams WHERE id = ?', [id]))[0][0].sport_category_id, id]
        );
        
        if (conflict.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Team with this name already exists for this sport'
          });
        }
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (sport_category_id !== undefined) {
        updateFields.push('sport_category_id = ?');
        updateValues.push(sport_category_id);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (coach_name !== undefined) {
        updateFields.push('coach_name = ?');
        updateValues.push(coach_name);
      }
      if (coach_contact !== undefined) {
        updateFields.push('coach_contact = ?');
        updateValues.push(coach_contact);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `
        UPDATE sports_teams 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Sports team updated successfully'
      });
    } catch (error) {
      console.error('Error updating sports team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports team'
      });
    }
  }

  // Delete sports team (soft delete)
  static async deleteTeam(req, res) {
    try {
      const { id } = req.params;
      
      // Check if team exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_teams WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports team not found'
        });
      }
      
      // Check if team has active participants
      const [participants] = await pool.execute(
        'SELECT COUNT(*) as count FROM sports_participants WHERE team_id = ? AND is_active = true',
        [id]
      );
      
      if (participants[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete team with active participants. Please remove participants first.'
        });
      }
      
      // Soft delete by setting is_active to false
      await pool.execute(
        'UPDATE sports_teams SET is_active = false, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Sports team deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sports team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete sports team'
      });
    }
  }

  // Get team participants
  static async getTeamParticipants(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          sp.id,
          sp.participant_name,
          sp.participant_contact,
          sp.role,
          sp.jersey_number,
          sp.is_active,
          sp.joined_date,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          e.full_name as employee_name,
          e.id as employee_id
        FROM sports_participants sp
        LEFT JOIN students s ON sp.student_id = s.RegNumber
        LEFT JOIN employees e ON sp.employee_id = e.id
        WHERE sp.team_id = ?
        ORDER BY sp.role, sp.jersey_number, sp.participant_name
      `;
      
      const [participants] = await pool.execute(query, [id]);
      
      res.json({
        success: true,
        data: participants
      });
    } catch (error) {
      console.error('Error fetching team participants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team participants'
      });
    }
  }
}

module.exports = SportsTeamsController;
