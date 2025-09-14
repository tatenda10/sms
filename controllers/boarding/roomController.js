const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class RoomController {
  // Create new room
  static async createRoom(req, res) {
    const conn = await pool.getConnection();
    try {
      const { hostel_id, room_number, room_type, capacity, floor_number, description } = req.body;
      
      if (!hostel_id || !room_number || !room_type || !capacity) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostel ID, room number, room type, and capacity are required' 
        });
      }

      // Validate capacity
      if (capacity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Capacity must be at least 1' 
        });
      }

      await conn.beginTransaction();

      // Check if hostel exists
      const [hostel] = await conn.execute(
        'SELECT id, name FROM hostels WHERE id = ? AND is_active = TRUE',
        [hostel_id]
      );

      if (hostel.length === 0) {
        return res.status(404).json({ success: false, message: 'Hostel not found' });
      }

      // Check if room number already exists in this hostel
      const [existing] = await conn.execute(
        'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ? AND is_active = TRUE',
        [hostel_id, room_number]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Room number already exists in this hostel' 
        });
      }

      // Create room
      const [result] = await conn.execute(
        `INSERT INTO rooms (hostel_id, room_number, room_type, capacity, floor_number, description, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [hostel_id, room_number, room_type, capacity, floor_number || 1, description, req.user.id]
      );

      const roomId = result.insertId;

      // Log audit event
      await AuditLogger.log({
        action: 'ROOM_CREATED',
        table: 'rooms',
        record_id: roomId,
        user_id: req.user.id,
        details: { hostel_id, room_number, room_type, capacity, floor_number, description },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.status(201).json({ 
        success: true, 
        data: { id: roomId, hostel_id, room_number, room_type, capacity, floor_number, description },
        message: 'Room created successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating room:', error);
      res.status(500).json({ success: false, message: 'Failed to create room' });
    } finally {
      conn.release();
    }
  }

  // Get all rooms with pagination and search
  static async getAllRooms(req, res) {
    try {
      const { page = 1, limit = 10, search = '', hostel_id = '', room_type = '', floor = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = ['r.is_active = TRUE'];
      let params = [];

      if (search.trim()) {
        whereConditions.push('(r.room_number LIKE ? OR r.description LIKE ? OR h.name LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (hostel_id) {
        whereConditions.push('r.hostel_id = ?');
        params.push(hostel_id);
      }

      if (room_type) {
        whereConditions.push('r.room_type = ?');
        params.push(room_type);
      }

      if (floor) {
        whereConditions.push('r.floor_number = ?');
        params.push(floor);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get rooms with hostel and enrollment details
      const [rooms] = await pool.execute(`
        SELECT 
          r.*,
          h.name as hostel_name,
          h.gender as hostel_gender,
          COUNT(be.id) as current_enrollments
        FROM rooms r
        LEFT JOIN hostels h ON r.hostel_id = h.id
        LEFT JOIN boarding_enrollments be ON r.id = be.room_id AND be.status IN ('enrolled', 'checked_in')
        ${whereClause}
        GROUP BY r.id
        ORDER BY h.name, r.floor_number, r.room_number
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count for pagination
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM rooms r
        LEFT JOIN hostels h ON r.hostel_id = h.id
        ${whereClause}
      `, params);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: rooms,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRooms: total,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
  }

  // Get room by ID
  static async getRoomById(req, res) {
    try {
      const { id } = req.params;

      const [rooms] = await pool.execute(`
        SELECT 
          r.*,
          h.name as hostel_name,
          h.gender as hostel_gender,
          COUNT(be.id) as current_enrollments
        FROM rooms r
        LEFT JOIN hostels h ON r.hostel_id = h.id
        LEFT JOIN boarding_enrollments be ON r.id = be.room_id AND be.status IN ('enrolled', 'checked_in')
        WHERE r.id = ? AND r.is_active = TRUE
        GROUP BY r.id
      `, [id]);

      if (rooms.length === 0) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      res.json({ success: true, data: rooms[0] });
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch room' });
    }
  }

  // Update room
  static async updateRoom(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { room_number, room_type, capacity, floor_number, description } = req.body;

      if (!room_number || !room_type || !capacity) {
        return res.status(400).json({ 
          success: false, 
          message: 'Room number, room type, and capacity are required' 
        });
      }

      // Validate capacity
      if (capacity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Capacity must be at least 1' 
        });
      }

      await conn.beginTransaction();

      // Check if room exists and get current details
      const [existing] = await conn.execute(
        'SELECT id, hostel_id, room_number FROM rooms WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      const currentRoom = existing[0];

      // Check if room number is being changed and if it conflicts with another room in the same hostel
      if (room_number !== currentRoom.room_number) {
        const [nameConflict] = await conn.execute(
          'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ? AND id != ? AND is_active = TRUE',
          [currentRoom.hostel_id, room_number, id]
        );

        if (nameConflict.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Room number already exists in this hostel' 
          });
        }
      }

      // Check if new capacity is less than current occupancy
      const [enrollments] = await conn.execute(
        'SELECT COUNT(*) as count FROM boarding_enrollments WHERE room_id = ? AND status IN ("enrolled", "checked_in")',
        [id]
      );

      if (capacity < enrollments[0].count) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot reduce capacity below current occupancy (${enrollments[0].count} students)` 
        });
      }

      // Update room
      await conn.execute(
        `UPDATE rooms 
         SET room_number = ?, room_type = ?, capacity = ?, floor_number = ?, description = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [room_number, room_type, capacity, floor_number || 1, description, req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'ROOM_UPDATED',
        table: 'rooms',
        record_id: id,
        user_id: req.user.id,
        details: { room_number, room_type, capacity, floor_number, description },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Room updated successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating room:', error);
      res.status(500).json({ success: false, message: 'Failed to update room' });
    } finally {
      conn.release();
    }
  }

  // Delete room (soft delete)
  static async deleteRoom(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      await conn.beginTransaction();

      // Check if room exists
      const [existing] = await conn.execute(
        'SELECT id, room_number, hostel_id FROM rooms WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      // Check if room has active enrollments
      const [enrollments] = await conn.execute(
        'SELECT COUNT(*) as count FROM boarding_enrollments WHERE room_id = ? AND status IN ("enrolled", "checked_in")',
        [id]
      );

      if (enrollments[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete room with active enrollments' 
        });
      }

      // Soft delete room
      await conn.execute(
        'UPDATE rooms SET is_active = FALSE, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'ROOM_DELETED',
        table: 'rooms',
        record_id: id,
        user_id: req.user.id,
        details: { room_number: existing[0].room_number, hostel_id: existing[0].hostel_id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({ 
        success: true, 
        message: 'Room deleted successfully' 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error deleting room:', error);
      res.status(500).json({ success: false, message: 'Failed to delete room' });
    } finally {
      conn.release();
    }
  }

  // Get enrollments for a specific room
  static async getRoomEnrollments(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = ['be.room_id = ?'];
      let params = [id];

      if (status) {
        whereConditions.push('be.status = ?');
        params.push(status);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get enrollments with student and hostel details
      const [enrollments] = await pool.execute(`
        SELECT 
          be.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender as student_gender,
          h.name as hostel_name,
          r.room_number,
          r.room_type
        FROM boarding_enrollments be
        LEFT JOIN students s ON be.student_reg_number = s.RegNumber
        LEFT JOIN hostels h ON be.hostel_id = h.id
        LEFT JOIN rooms r ON be.room_id = r.id
        ${whereClause}
        ORDER BY be.enrollment_date DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count for pagination
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM boarding_enrollments be
        ${whereClause}
      `, params);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: enrollments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEnrollments: total,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching room enrollments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch room enrollments' });
    }
  }

  // Get available rooms for a hostel
  static async getAvailableRooms(req, res) {
    try {
      const { hostel_id } = req.params;
      const { room_type = '', floor = '' } = req.query;

      let whereConditions = ['r.hostel_id = ?', 'r.is_active = TRUE'];
      let params = [hostel_id];

      if (room_type) {
        whereConditions.push('r.room_type = ?');
        params.push(room_type);
      }

      if (floor) {
        whereConditions.push('r.floor_number = ?');
        params.push(floor);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get rooms with availability status
      const [rooms] = await pool.execute(`
        SELECT 
          r.*,
          COUNT(be.id) as current_enrollments,
          (r.capacity - COUNT(be.id)) as available_spaces,
          CASE 
            WHEN COUNT(be.id) < r.capacity THEN 'available'
            ELSE 'full'
          END as availability_status
        FROM rooms r
        LEFT JOIN boarding_enrollments be ON r.id = be.room_id AND be.status IN ('enrolled', 'checked_in')
        ${whereClause}
        GROUP BY r.id
        HAVING available_spaces > 0
        ORDER BY r.floor_number, r.room_number
      `, params);

      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch available rooms' });
    }
  }
}

module.exports = RoomController;
