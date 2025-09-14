const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class HostelController {
  // Create new hostel
  static async createHostel(req, res) {
    const conn = await pool.getConnection();
    try {
      const { name, description, location, gender } = req.body;
      
      if (!name || !gender) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostel name and gender are required' 
        });
      }

      // Validate gender
      if (!['Male', 'Female'].includes(gender)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gender must be Male or Female' 
        });
      }

      await conn.beginTransaction();

      // Check if hostel with same name exists
      const [existing] = await conn.execute(
        'SELECT id FROM hostels WHERE name = ? AND is_active = TRUE',
        [name]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostel with this name already exists' 
        });
      }

      // Create hostel
      const [result] = await conn.execute(
        `INSERT INTO hostels (name, description, location, gender, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, location, gender, req.user.id]
      );

      const hostelId = result.insertId;

      // Log audit event
      await AuditLogger.log({
        action: 'HOSTEL_CREATED',
        table: 'hostels',
        record_id: hostelId,
        user_id: req.user.id,
        details: { name, description, location, gender },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.status(201).json({ 
        success: true, 
        data: { id: hostelId, name, description, location, gender },
        message: 'Hostel created successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating hostel:', error);
      res.status(500).json({ success: false, message: 'Failed to create hostel' });
    } finally {
      conn.release();
    }
  }

  // Get all hostels without pagination
  static async getAllHostels(req, res) {
    try {
      const { search = '', gender = '' } = req.query;

      let whereConditions = ['h.is_active = TRUE'];
      let params = [];

      if (search.trim()) {
        whereConditions.push('(h.name LIKE ? OR h.description LIKE ? OR h.location LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (gender) {
        whereConditions.push('h.gender = ?');
        params.push(gender);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get hostels with room and enrollment counts
      const [hostels] = await pool.execute(`
        SELECT 
          h.*,
          COUNT(DISTINCT r.id) as total_rooms,
          SUM(r.capacity) as total_capacity,
          COUNT(DISTINCT be.id) as total_enrollments
        FROM hostels h
        LEFT JOIN rooms r ON h.id = r.hostel_id AND r.is_active = TRUE
        LEFT JOIN boarding_enrollments be ON h.id = be.hostel_id AND be.status IN ('enrolled', 'checked_in')
        ${whereClause}
        GROUP BY h.id, h.name, h.description, h.location, h.gender, h.total_rooms, h.total_capacity, h.is_active, h.created_at, h.updated_at, h.created_by, h.updated_by
        ORDER BY h.created_at DESC
      `, params);

      res.json({
        success: true,
        data: hostels
      });
    } catch (error) {
      console.error('Error fetching hostels:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hostels' });
    }
  }

  // Get hostel by ID
  static async getHostelById(req, res) {
    try {
      const { id } = req.params;

      const [hostels] = await pool.execute(`
        SELECT 
          h.*,
          COUNT(DISTINCT r.id) as total_rooms,
          SUM(r.capacity) as total_capacity,
          COUNT(DISTINCT be.id) as total_enrollments
        FROM hostels h
        LEFT JOIN rooms r ON h.id = r.hostel_id AND r.is_active = TRUE
        LEFT JOIN boarding_enrollments be ON h.id = be.hostel_id AND be.status IN ('enrolled', 'checked_in')
        WHERE h.id = ? AND h.is_active = TRUE
        GROUP BY h.id
      `, [id]);

      if (hostels.length === 0) {
        return res.status(404).json({ success: false, message: 'Hostel not found' });
      }

      res.json({ success: true, data: hostels[0] });
    } catch (error) {
      console.error('Error fetching hostel:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hostel' });
    }
  }

  // Update hostel
  static async updateHostel(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { name, description, location, gender } = req.body;

      if (!name || !gender) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostel name and gender are required' 
        });
      }

      // Validate gender
      if (!['Male', 'Female'].includes(gender)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gender must be Male or Female' 
        });
      }

      await conn.beginTransaction();

      // Check if hostel exists
      const [existing] = await conn.execute(
        'SELECT id, name FROM hostels WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Hostel not found' });
      }

      // Check if name is being changed and if it conflicts with another hostel
      if (name !== existing[0].name) {
        const [nameConflict] = await conn.execute(
          'SELECT id FROM hostels WHERE name = ? AND id != ? AND is_active = TRUE',
          [name, id]
        );

        if (nameConflict.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Hostel with this name already exists' 
          });
        }
      }

      // Update hostel
      await conn.execute(
        `UPDATE hostels 
         SET name = ?, description = ?, location = ?, gender = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name, description, location, gender, req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'HOSTEL_UPDATED',
        table: 'hostels',
        record_id: id,
        user_id: req.user.id,
        details: { name, description, location, gender },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Hostel updated successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating hostel:', error);
      res.status(500).json({ success: false, message: 'Failed to update hostel' });
    } finally {
      conn.release();
    }
  }

  // Delete hostel (soft delete)
  static async deleteHostel(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      await conn.beginTransaction();

      // Check if hostel exists
      const [existing] = await conn.execute(
        'SELECT id, name FROM hostels WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Hostel not found' });
      }

      // Check if hostel has active enrollments
      const [enrollments] = await conn.execute(
        'SELECT COUNT(*) as count FROM boarding_enrollments WHERE hostel_id = ? AND status IN ("enrolled", "checked_in")',
        [id]
      );

      if (enrollments[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete hostel with active enrollments' 
        });
      }

      // Soft delete hostel
      await conn.execute(
        'UPDATE hostels SET is_active = FALSE, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'HOSTEL_DELETED',
        table: 'hostels',
        record_id: id,
        user_id: req.user.id,
        details: { hostel_name: existing[0].name },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Hostel deleted successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error deleting hostel:', error);
      res.status(500).json({ success: false, message: 'Failed to delete hostel' });
    } finally {
      conn.release();
    }
  }

  // Get rooms for a specific hostel
  static async getHostelRooms(req, res) {
    try {
      const { id } = req.params;
      const { room_type = '', floor = '' } = req.query;

      let whereConditions = ['r.hostel_id = ?', 'r.is_active = TRUE'];
      let params = [id];

      if (room_type) {
        whereConditions.push('r.room_type = ?');
        params.push(room_type);
      }

      if (floor) {
        whereConditions.push('r.floor_number = ?');
        params.push(floor);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get rooms with enrollment details
      const [rooms] = await pool.execute(`
        SELECT 
          r.*,
          COUNT(be.id) as current_enrollments
        FROM rooms r
        LEFT JOIN boarding_enrollments be ON r.id = be.room_id AND be.status IN ('enrolled', 'checked_in')
        ${whereClause}
        GROUP BY r.id
        ORDER BY r.floor_number, r.room_number
      `, params);

      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Error fetching hostel rooms:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hostel rooms' });
    }
  }

  // Get enrollments for a specific hostel
  static async getHostelEnrollments(req, res) {
    try {
      const { id } = req.params;
      const { status = '', term = '', academic_year = '' } = req.query;

      let whereConditions = ['be.hostel_id = ?'];
      let params = [id];

      if (status) {
        whereConditions.push('be.status = ?');
        params.push(status);
      }

      if (term) {
        whereConditions.push('be.term = ?');
        params.push(term);
      }

      if (academic_year) {
        whereConditions.push('be.academic_year = ?');
        params.push(academic_year);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get enrollments with student and room details
      const [enrollments] = await pool.execute(`
        SELECT 
          be.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender as student_gender,
          r.room_number,
          r.room_type,
          h.name as hostel_name
        FROM boarding_enrollments be
        LEFT JOIN students s ON be.student_reg_number = s.RegNumber
        LEFT JOIN rooms r ON be.room_id = r.id
        LEFT JOIN hostels h ON be.hostel_id = h.id
        ${whereClause}
        ORDER BY be.enrollment_date DESC
      `, params);

      res.json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      console.error('Error fetching hostel enrollments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hostel enrollments' });
    }
  }

  // Get billing fees for a specific hostel
  static async getHostelBillingFees(req, res) {
    try {
      const { id } = req.params;

      const [fees] = await pool.execute(`
        SELECT 
          bf.*,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM boarding_fees bf
        LEFT JOIN currencies c ON bf.currency_id = c.id
        WHERE bf.hostel_id = ? AND bf.is_active = TRUE
        ORDER BY bf.term, bf.academic_year
      `, [id]);

      res.json({
        success: true,
        data: fees
      });

    } catch (error) {
      console.error('Error fetching hostel billing fees:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch billing fees' });
    }
  }
}

module.exports = HostelController;
