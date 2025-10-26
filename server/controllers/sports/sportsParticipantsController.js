const { pool } = require('../../config/database');

class SportsParticipantsController {
  // Get all sports participants with pagination and filtering
  static async getAllParticipants(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        team_id,
        role,
        active_only = 'true',
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (team_id) {
        whereConditions.push('sp.team_id = ?');
        queryParams.push(team_id);
      }

      if (role) {
        whereConditions.push('sp.role = ?');
        queryParams.push(role);
      }

      if (active_only === 'true') {
        whereConditions.push('sp.is_active = ?');
        queryParams.push(true);
      }

      if (search) {
        whereConditions.push('(sp.participant_name LIKE ? OR s.Name LIKE ? OR s.Surname LIKE ? OR e.full_name LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sports_participants sp
        LEFT JOIN students s ON sp.student_id = s.RegNumber
        LEFT JOIN employees e ON sp.employee_id = e.id
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, queryParams);
      const totalParticipants = countResult[0].total;
      const totalPages = Math.ceil(totalParticipants / limit);

      // Get paginated participants - use string interpolation for LIMIT/OFFSET
      const query = `
        SELECT 
          sp.id,
          sp.participant_name,
          sp.participant_contact,
          sp.role,
          sp.jersey_number,
          sp.is_active,
          sp.joined_date,
          sp.created_at,
          sp.updated_at,
          st.name as team_name,
          sc.name as sport_category_name,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          e.full_name as employee_name,
          e.id as employee_id
        FROM sports_participants sp
        LEFT JOIN sports_teams st ON sp.team_id = st.id
        LEFT JOIN sports_categories sc ON st.sport_category_id = sc.id
        LEFT JOIN students s ON sp.student_id = s.RegNumber
        LEFT JOIN employees e ON sp.employee_id = e.id
        ${whereClause}
        ORDER BY st.name, sp.role, sp.jersey_number, sp.participant_name
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [participants] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: participants,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalParticipants,
          items_per_page: parseInt(limit),
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching sports participants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports participants'
      });
    }
  }

  // Get participant by ID
  static async getParticipantById(req, res) {
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
          sp.created_at,
          sp.updated_at,
          st.name as team_name,
          sc.name as sport_category_name,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          e.full_name as employee_name,
          e.id as employee_id
        FROM sports_participants sp
        LEFT JOIN sports_teams st ON sp.team_id = st.id
        LEFT JOIN sports_categories sc ON st.sport_category_id = sc.id
        LEFT JOIN students s ON sp.student_id = s.RegNumber
        LEFT JOIN employees e ON sp.employee_id = e.id
        WHERE sp.id = ?
      `;
      
      const [participants] = await pool.execute(query, [id]);
      
      if (participants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports participant not found'
        });
      }
      
      res.json({
        success: true,
        data: participants[0]
      });
    } catch (error) {
      console.error('Error fetching sports participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports participant'
      });
    }
  }

  // Create new sports participant
  static async createParticipant(req, res) {
    try {
      const { 
        team_id,
        student_id,
        employee_id,
        participant_name,
        participant_contact,
        role = 'player',
        jersey_number
      } = req.body;
      
      // Validate required fields
      if (!team_id || (!student_id && !employee_id && !participant_name)) {
        return res.status(400).json({
          success: false,
          message: 'Team ID and either student ID, employee ID, or participant name is required'
        });
      }

      // Check if team exists
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

      // Validate student if provided
      if (student_id) {
        const [student] = await pool.execute(
          'SELECT RegNumber FROM students WHERE RegNumber = ?',
          [student_id]
        );
        
        if (student.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid student ID'
          });
        }

        // Check if student is already in this team
        const [existingStudent] = await pool.execute(
          'SELECT id FROM sports_participants WHERE team_id = ? AND student_id = ? AND is_active = true',
          [team_id, student_id]
        );
        
        if (existingStudent.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Student is already a member of this team'
          });
        }
      }

      // Validate employee if provided
      if (employee_id) {
        const [employee] = await pool.execute(
          'SELECT id FROM employees WHERE id = ?',
          [employee_id]
        );
        
        if (employee.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid employee ID'
          });
        }

        // Check if employee is already in this team
        const [existingEmployee] = await pool.execute(
          'SELECT id FROM sports_participants WHERE team_id = ? AND employee_id = ? AND is_active = true',
          [team_id, employee_id]
        );
        
        if (existingEmployee.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Employee is already a member of this team'
          });
        }
      }

      // Check jersey number uniqueness within team
      if (jersey_number) {
        const [existingJersey] = await pool.execute(
          'SELECT id FROM sports_participants WHERE team_id = ? AND jersey_number = ? AND is_active = true',
          [team_id, jersey_number]
        );
        
        if (existingJersey.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Jersey number already taken in this team'
          });
        }
      }
      
      const query = `
        INSERT INTO sports_participants (
          team_id, student_id, employee_id, participant_name, 
          participant_contact, role, jersey_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const [result] = await pool.execute(query, [
        team_id, student_id, employee_id, participant_name,
        participant_contact, role, jersey_number
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Sports participant added successfully',
        data: {
          id: result.insertId,
          team_id,
          role,
          jersey_number
        }
      });
    } catch (error) {
      console.error('Error creating sports participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add sports participant'
      });
    }
  }

  // Update sports participant
  static async updateParticipant(req, res) {
    try {
      const { id } = req.params;
      const { 
        participant_name,
        participant_contact,
        role,
        jersey_number,
        is_active
      } = req.body;
      
      // Check if participant exists
      const [existing] = await pool.execute(
        'SELECT team_id FROM sports_participants WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports participant not found'
        });
      }

      const team_id = existing[0].team_id;

      // Check jersey number uniqueness within team (if being updated)
      if (jersey_number) {
        const [existingJersey] = await pool.execute(
          'SELECT id FROM sports_participants WHERE team_id = ? AND jersey_number = ? AND is_active = true AND id != ?',
          [team_id, jersey_number, id]
        );
        
        if (existingJersey.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Jersey number already taken in this team'
          });
        }
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (participant_name !== undefined) {
        updateFields.push('participant_name = ?');
        updateValues.push(participant_name);
      }
      if (participant_contact !== undefined) {
        updateFields.push('participant_contact = ?');
        updateValues.push(participant_contact);
      }
      if (role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }
      if (jersey_number !== undefined) {
        updateFields.push('jersey_number = ?');
        updateValues.push(jersey_number);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `
        UPDATE sports_participants 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Sports participant updated successfully'
      });
    } catch (error) {
      console.error('Error updating sports participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports participant'
      });
    }
  }

  // Delete sports participant (soft delete)
  static async deleteParticipant(req, res) {
    try {
      const { id } = req.params;
      
      // Check if participant exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_participants WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports participant not found'
        });
      }
      
      // Soft delete by setting is_active to false
      await pool.execute(
        'UPDATE sports_participants SET is_active = false, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Sports participant removed successfully'
      });
    } catch (error) {
      console.error('Error deleting sports participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove sports participant'
      });
    }
  }

  // Get participants by team
  static async getParticipantsByTeam(req, res) {
    try {
      const { team_id } = req.params;
      const { role, active_only = 'true' } = req.query;
      
      let whereConditions = ['sp.team_id = ?'];
      let queryParams = [team_id];
      
      if (role) {
        whereConditions.push('sp.role = ?');
        queryParams.push(role);
      }
      
      if (active_only === 'true') {
        whereConditions.push('sp.is_active = ?');
        queryParams.push(true);
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
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
        ${whereClause}
        ORDER BY sp.role, sp.jersey_number, sp.participant_name
      `;
      
      const [participants] = await pool.execute(query, queryParams);
      
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

module.exports = SportsParticipantsController;
