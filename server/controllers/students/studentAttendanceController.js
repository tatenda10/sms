const { pool } = require('../../config/database');

class StudentAttendanceController {
  // Get attendance history for a student
  async getStudentAttendanceHistory(req, res) {
    console.log('📅 Student attendance history request:', req.params);
    const connection = await pool.getConnection();
    
    try {
      const { studentId } = req.params;
      const { start_date, end_date, class_id } = req.query;

      // Validate student access
      const [studentCheck] = await connection.execute(
        'SELECT RegNumber FROM students WHERE RegNumber = ?',
        [studentId]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // Build where clause
      let whereClause = 'ar.student_id = ?';
      let params = [studentId];

      if (start_date) {
        whereClause += ' AND ar.attendance_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND ar.attendance_date <= ?';
        params.push(end_date);
      }

      if (class_id) {
        whereClause += ' AND ar.class_id = ?';
        params.push(class_id);
      }

      // Get attendance records
      const [attendance] = await connection.execute(`
        SELECT 
          ar.*,
          gc.name as class_name,
          s.name as stream_name,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ${whereClause}
        ORDER BY ar.attendance_date DESC
      `, params);

      res.json({
        success: true,
        data: attendance
      });

    } catch (error) {
      console.error('Error fetching student attendance history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance history'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance statistics for a student
  async getStudentAttendanceStats(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { studentId } = req.params;
      const { start_date, end_date, class_id } = req.query;

      // Validate student access
      const [studentCheck] = await connection.execute(
        'SELECT RegNumber FROM students WHERE RegNumber = ?',
        [studentId]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // Build where clause
      let whereClause = 'ar.student_id = ?';
      let params = [studentId];

      if (start_date) {
        whereClause += ' AND ar.attendance_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ' AND ar.attendance_date <= ?';
        params.push(end_date);
      }

      if (class_id) {
        whereClause += ' AND ar.class_id = ?';
        params.push(class_id);
      }

      // Get attendance statistics
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          ROUND(
            (SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
            2
          ) as attendance_percentage
        FROM attendance_records ar
        WHERE ${whereClause}
      `, params);

      // Get recent attendance (last 30 days)
      const [recentAttendance] = await connection.execute(`
        SELECT 
          ar.attendance_date,
          ar.status,
          gc.name as class_name
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        WHERE ar.student_id = ? 
        AND ar.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY ar.attendance_date DESC
        LIMIT 30
      `, [studentId]);

      res.json({
        success: true,
        data: {
          statistics: stats[0],
          recent_attendance: recentAttendance
        }
      });

    } catch (error) {
      console.error('Error fetching student attendance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance statistics'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance for a specific date
  async getStudentAttendanceForDate(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { studentId, date } = req.params;

      // Validate student access
      const [studentCheck] = await connection.execute(
        'SELECT RegNumber FROM students WHERE RegNumber = ?',
        [studentId]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // Get attendance for specific date
      const [attendance] = await connection.execute(`
        SELECT 
          ar.*,
          gc.name as class_name,
          s.name as stream_name,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ar.student_id = ? AND ar.attendance_date = ?
      `, [studentId, date]);

      res.json({
        success: true,
        data: attendance[0] || null
      });

    } catch (error) {
      console.error('Error fetching student attendance for date:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance for date'
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new StudentAttendanceController();
