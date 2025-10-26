const { pool } = require('../../config/database');

class SportsFixturesController {
  // Get all sports fixtures with pagination and filtering
  static async getAllFixtures(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sport_category_id,
        team_id,
        status,
        date_from,
        date_to,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (sport_category_id) {
        whereConditions.push('sf.sport_category_id = ?');
        queryParams.push(sport_category_id);
      }

      if (team_id) {
        whereConditions.push('(sf.home_team_id = ? OR sf.away_team_id = ?)');
        queryParams.push(team_id, team_id);
      }

      if (status) {
        whereConditions.push('sf.status = ?');
        queryParams.push(status);
      }

      if (date_from) {
        whereConditions.push('sf.fixture_date >= ?');
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push('sf.fixture_date <= ?');
        queryParams.push(date_to);
      }

      if (search) {
        whereConditions.push('(sf.title LIKE ? OR sf.description LIKE ? OR sf.venue LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sports_fixtures sf
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, queryParams);
      const totalFixtures = countResult[0].total;
      const totalPages = Math.ceil(totalFixtures / limit);

      // Get paginated fixtures - use string interpolation for LIMIT/OFFSET
      const query = `
        SELECT 
          sf.id,
          sf.title,
          sf.description,
          sf.venue,
          sf.fixture_date,
          sf.fixture_time,
          sf.status,
          sf.result_home_score,
          sf.result_away_score,
          sf.result_notes,
          sf.weather_conditions,
          sf.referee_name,
          sf.referee_contact,
          sf.is_home_game,
          sf.created_at,
          sf.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          ht.name as home_team_name,
          ht.coach_name as home_team_coach,
          at.name as away_team_name,
          at.coach_name as away_team_coach,
          u.username as created_by_username
        FROM sports_fixtures sf
        LEFT JOIN sports_categories sc ON sf.sport_category_id = sc.id
        LEFT JOIN sports_teams ht ON sf.home_team_id = ht.id
        LEFT JOIN sports_teams at ON sf.away_team_id = at.id
        LEFT JOIN users u ON sf.created_by = u.id
        ${whereClause}
        ORDER BY sf.fixture_date DESC, sf.fixture_time DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [fixtures] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: fixtures,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalFixtures,
          items_per_page: parseInt(limit),
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching sports fixtures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports fixtures'
      });
    }
  }

  // Get fixture by ID
  static async getFixtureById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          sf.id,
          sf.title,
          sf.description,
          sf.venue,
          sf.fixture_date,
          sf.fixture_time,
          sf.status,
          sf.result_home_score,
          sf.result_away_score,
          sf.result_notes,
          sf.weather_conditions,
          sf.referee_name,
          sf.referee_contact,
          sf.is_home_game,
          sf.created_at,
          sf.updated_at,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          ht.name as home_team_name,
          ht.coach_name as home_team_coach,
          at.name as away_team_name,
          at.coach_name as away_team_coach,
          u.username as created_by_username
        FROM sports_fixtures sf
        LEFT JOIN sports_categories sc ON sf.sport_category_id = sc.id
        LEFT JOIN sports_teams ht ON sf.home_team_id = ht.id
        LEFT JOIN sports_teams at ON sf.away_team_id = at.id
        LEFT JOIN users u ON sf.created_by = u.id
        WHERE sf.id = ?
      `;
      
      const [fixtures] = await pool.execute(query, [id]);
      
      if (fixtures.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports fixture not found'
        });
      }
      
      res.json({
        success: true,
        data: fixtures[0]
      });
    } catch (error) {
      console.error('Error fetching sports fixture:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports fixture'
      });
    }
  }

  // Create new sports fixture
  static async createFixture(req, res) {
    try {
      const { 
        title,
        description,
        sport_category_id,
        home_team_id,
        away_team_id,
        home_team_name,
        away_team_name,
        venue,
        fixture_date,
        fixture_time,
        weather_conditions,
        referee_name,
        referee_contact,
        is_home_game = true
      } = req.body;
      
      const created_by = req.user.id;
      
      // Validate required fields
      if (!title || !sport_category_id || !fixture_date || !fixture_time) {
        return res.status(400).json({
          success: false,
          message: 'Title, sport category, fixture date and time are required'
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

      // Validate teams if provided
      if (home_team_id) {
        const [homeTeam] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [home_team_id]
        );
        
        if (homeTeam.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid home team'
          });
        }
      }

      if (away_team_id) {
        const [awayTeam] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [away_team_id]
        );
        
        if (awayTeam.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid away team'
          });
        }
      }
      
      const query = `
        INSERT INTO sports_fixtures (
          title, description, sport_category_id, home_team_id, away_team_id,
          home_team_name, away_team_name, venue, fixture_date, fixture_time,
          weather_conditions, referee_name, referee_contact, is_home_game,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const [result] = await pool.execute(query, [
        title, description, sport_category_id, home_team_id, away_team_id,
        home_team_name, away_team_name, venue, fixture_date, fixture_time,
        weather_conditions, referee_name, referee_contact, is_home_game,
        created_by
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Sports fixture created successfully',
        data: {
          id: result.insertId,
          title,
          sport_category_id,
          fixture_date,
          fixture_time
        }
      });
    } catch (error) {
      console.error('Error creating sports fixture:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sports fixture'
      });
    }
  }

  // Update sports fixture
  static async updateFixture(req, res) {
    try {
      const { id } = req.params;
      const { 
        title,
        description,
        sport_category_id,
        home_team_id,
        away_team_id,
        home_team_name,
        away_team_name,
        venue,
        fixture_date,
        fixture_time,
        status,
        result_home_score,
        result_away_score,
        result_notes,
        weather_conditions,
        referee_name,
        referee_contact,
        is_home_game
      } = req.body;
      
      // Check if fixture exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_fixtures WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports fixture not found'
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

      // Validate teams if being updated
      if (home_team_id) {
        const [homeTeam] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [home_team_id]
        );
        
        if (homeTeam.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid home team'
          });
        }
      }

      if (away_team_id) {
        const [awayTeam] = await pool.execute(
          'SELECT id FROM sports_teams WHERE id = ? AND is_active = true',
          [away_team_id]
        );
        
        if (awayTeam.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid away team'
          });
        }
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (sport_category_id !== undefined) {
        updateFields.push('sport_category_id = ?');
        updateValues.push(sport_category_id);
      }
      if (home_team_id !== undefined) {
        updateFields.push('home_team_id = ?');
        updateValues.push(home_team_id);
      }
      if (away_team_id !== undefined) {
        updateFields.push('away_team_id = ?');
        updateValues.push(away_team_id);
      }
      if (home_team_name !== undefined) {
        updateFields.push('home_team_name = ?');
        updateValues.push(home_team_name);
      }
      if (away_team_name !== undefined) {
        updateFields.push('away_team_name = ?');
        updateValues.push(away_team_name);
      }
      if (venue !== undefined) {
        updateFields.push('venue = ?');
        updateValues.push(venue);
      }
      if (fixture_date !== undefined) {
        updateFields.push('fixture_date = ?');
        updateValues.push(fixture_date);
      }
      if (fixture_time !== undefined) {
        updateFields.push('fixture_time = ?');
        updateValues.push(fixture_time);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      if (result_home_score !== undefined) {
        updateFields.push('result_home_score = ?');
        updateValues.push(result_home_score);
      }
      if (result_away_score !== undefined) {
        updateFields.push('result_away_score = ?');
        updateValues.push(result_away_score);
      }
      if (result_notes !== undefined) {
        updateFields.push('result_notes = ?');
        updateValues.push(result_notes);
      }
      if (weather_conditions !== undefined) {
        updateFields.push('weather_conditions = ?');
        updateValues.push(weather_conditions);
      }
      if (referee_name !== undefined) {
        updateFields.push('referee_name = ?');
        updateValues.push(referee_name);
      }
      if (referee_contact !== undefined) {
        updateFields.push('referee_contact = ?');
        updateValues.push(referee_contact);
      }
      if (is_home_game !== undefined) {
        updateFields.push('is_home_game = ?');
        updateValues.push(is_home_game);
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `
        UPDATE sports_fixtures 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Sports fixture updated successfully'
      });
    } catch (error) {
      console.error('Error updating sports fixture:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports fixture'
      });
    }
  }

  // Delete sports fixture
  static async deleteFixture(req, res) {
    try {
      const { id } = req.params;
      
      // Check if fixture exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_fixtures WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports fixture not found'
        });
      }
      
      // Check if fixture has associated announcements
      const [announcements] = await pool.execute(
        'SELECT COUNT(*) as count FROM sports_announcements WHERE fixture_id = ?',
        [id]
      );
      
      if (announcements[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fixture with associated announcements. Please remove announcements first.'
        });
      }
      
      await pool.execute(
        'DELETE FROM sports_fixtures WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Sports fixture deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sports fixture:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete sports fixture'
      });
    }
  }

  // Get upcoming fixtures
  static async getUpcomingFixtures(req, res) {
    try {
      const { limit = 10, sport_category_id } = req.query;
      
      let whereConditions = ['sf.fixture_date >= CURDATE()', 'sf.status = "scheduled"'];
      let queryParams = [];
      
      if (sport_category_id) {
        whereConditions.push('sf.sport_category_id = ?');
        queryParams.push(sport_category_id);
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      const query = `
        SELECT 
          sf.id,
          sf.title,
          sf.venue,
          sf.fixture_date,
          sf.fixture_time,
          sf.is_home_game,
          sc.name as sport_category_name,
          sc.icon as sport_category_icon,
          ht.name as home_team_name,
          at.name as away_team_name
        FROM sports_fixtures sf
        LEFT JOIN sports_categories sc ON sf.sport_category_id = sc.id
        LEFT JOIN sports_teams ht ON sf.home_team_id = ht.id
        LEFT JOIN sports_teams at ON sf.away_team_id = at.id
        ${whereClause}
        ORDER BY sf.fixture_date ASC, sf.fixture_time ASC
        LIMIT ${parseInt(limit)}
      `;
      
      const [fixtures] = await pool.execute(query, queryParams);
      
      res.json({
        success: true,
        data: fixtures
      });
    } catch (error) {
      console.error('Error fetching upcoming fixtures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming fixtures'
      });
    }
  }
}

module.exports = SportsFixturesController;
