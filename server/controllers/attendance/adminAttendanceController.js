const { pool } = require('../../config/database');

class AdminAttendanceController {
  // Get all attendance records with filters
  async getAllAttendanceRecords(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { 
        class_id, 
        student_id, 
        date, 
        status, 
        start_date, 
        end_date,
        page = 1, 
        limit = 50 
      } = req.query;

      // Build where clause
      let whereClause = '1=1';
      let params = [];
      
      if (class_id) {
        whereClause += ' AND ar.class_id = ?';
        params.push(class_id);
      }
      if (student_id) {
        whereClause += ' AND ar.student_id = ?';
        params.push(student_id);
      }
      if (status) {
        whereClause += ' AND ar.status = ?';
        params.push(status);
      }
      if (date) {
        whereClause += ' AND ar.attendance_date = ?';
        params.push(date);
      }
      
      // Date range filter
      if (start_date && end_date) {
        whereClause += ' AND ar.attendance_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      } else if (start_date) {
        whereClause += ' AND ar.attendance_date >= ?';
        params.push(start_date);
      } else if (end_date) {
        whereClause += ' AND ar.attendance_date <= ?';
        params.push(end_date);
      }

      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM attendance_records ar
        WHERE ${whereClause}
      `, params);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Get attendance records
      const [attendance] = await connection.execute(`
        SELECT 
          ar.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender,
          gc.name as class_name,
          gc.stream_name,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN students s ON ar.student_id = s.RegNumber
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ${whereClause}
        ORDER BY ar.attendance_date DESC, ar.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        data: attendance,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      });

    } catch (error) {
      console.error('Error fetching attendance records:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance records'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance statistics dashboard
  async getAttendanceStats(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { class_id, start_date, end_date } = req.query;

      // Build date filter
      let dateFilter = '';
      let params = [];
      
      if (start_date && end_date) {
        dateFilter = 'AND attendance_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      } else if (start_date) {
        dateFilter = 'AND attendance_date >= ?';
        params.push(start_date);
      } else if (end_date) {
        dateFilter = 'AND attendance_date <= ?';
        params.push(end_date);
      }

      let classFilter = '';
      if (class_id) {
        classFilter = 'AND class_id = ?';
        params.push(class_id);
      }

      // Get overall statistics
      const [overallStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
          COUNT(DISTINCT attendance_date) as total_days
        FROM attendance_records 
        WHERE 1=1 ${dateFilter} ${classFilter}
      `, params);

      const totalRecords = overallStats[0].total_records;
      const presentCount = overallStats[0].present_count;
      const absentCount = overallStats[0].absent_count;
      const totalDays = overallStats[0].total_days;
      const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

      // Get today's statistics
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await this.getTodayStats(connection, today, class_id);

      // Get class-wise statistics if no specific class
      let classStats = [];
      if (!class_id) {
        classStats = await this.getClassWiseStats(connection, dateFilter, params);
      }

      res.json({
        success: true,
        data: {
          overall: {
            total_records: totalRecords,
            total_days: totalDays,
            present_count: presentCount,
            absent_count: absentCount,
            attendance_rate: parseFloat(attendanceRate)
          },
          today: todayStats,
          class_wise: classStats
        }
      });

    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance statistics'
      });
    } finally {
      connection.release();
    }
  }

  // Get today's attendance statistics
  async getTodayStats(connection, date, class_id = null) {
    try {
      let whereClause = 'attendance_date = ?';
      let params = [date];

      if (class_id) {
        whereClause += ' AND class_id = ?';
        params.push(class_id);
      }

      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendance_records 
        WHERE ${whereClause}
      `, params);

      const totalRecords = stats[0].total_records;
      const presentCount = stats[0].present_count;
      const absentCount = stats[0].absent_count;
      const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

      return {
        date,
        total_records: totalRecords,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_rate: parseFloat(attendanceRate)
      };
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return {
        date,
        total_records: 0,
        present_count: 0,
        absent_count: 0,
        attendance_rate: 0
      };
    }
  }

  // Get class-wise statistics
  async getClassWiseStats(connection, dateFilter, params) {
    try {
      const [classStats] = await connection.execute(`
        SELECT 
          ar.class_id,
          gc.name as class_name,
          gc.stream_name,
          COUNT(*) as total_records,
          SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        WHERE 1=1 ${dateFilter}
        GROUP BY ar.class_id, gc.name, gc.stream_name
        ORDER BY total_records DESC
      `, params);

      return classStats.map(stat => ({
        class_id: stat.class_id,
        class_name: stat.class_name,
        stream_name: stat.stream_name,
        total_records: parseInt(stat.total_records),
        present_count: parseInt(stat.present_count),
        absent_count: parseInt(stat.absent_count),
        attendance_rate: stat.total_records > 0 ? 
          ((stat.present_count / stat.total_records) * 100).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('Error fetching class-wise stats:', error);
      return [];
    }
  }

  // Generate attendance reports
  async generateAttendanceReport(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { 
        class_id, 
        start_date, 
        end_date, 
        format = 'json',
        group_by = 'date'
      } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'start_date and end_date are required'
        });
      }

      // Build where clause
      let whereClause = 'ar.attendance_date BETWEEN ? AND ?';
      let params = [start_date, end_date];

      if (class_id) {
        whereClause += ' AND ar.class_id = ?';
        params.push(class_id);
      }

      let reportData;

      switch (group_by) {
        case 'date':
          reportData = await this.generateDateWiseReport(connection, whereClause, params);
          break;
        case 'student':
          reportData = await this.generateStudentWiseReport(connection, whereClause, params);
          break;
        case 'class':
          reportData = await this.generateClassWiseReport(connection, whereClause, params);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid group_by parameter. Use: date, student, or class'
          });
      }

      if (format === 'csv') {
        // Generate CSV format
        const csv = this.convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${start_date}_to_${end_date}.csv"`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data: reportData,
        meta: {
          start_date,
          end_date,
          class_id: class_id || 'all',
          group_by,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while generating attendance report'
      });
    } finally {
      connection.release();
    }
  }

  // Generate date-wise report
  async generateDateWiseReport(connection, whereClause, params) {
    const [report] = await connection.execute(`
      SELECT 
        ar.attendance_date as date,
        ar.class_id,
        gc.name as class_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance_records ar
      LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
      WHERE ${whereClause}
      GROUP BY ar.attendance_date, ar.class_id, gc.name
      ORDER BY ar.attendance_date ASC
    `, params);

    return report.map(item => ({
      date: item.date,
      class_id: item.class_id,
      class_name: item.class_name,
      total_records: parseInt(item.total_records),
      present_count: parseInt(item.present_count),
      absent_count: parseInt(item.absent_count),
      attendance_rate: item.total_records > 0 ? 
        ((item.present_count / item.total_records) * 100).toFixed(2) : 0
    }));
  }

  // Generate student-wise report
  async generateStudentWiseReport(connection, whereClause, params) {
    const [report] = await connection.execute(`
      SELECT 
        ar.student_id,
        s.Name as student_name,
        s.Surname as student_surname,
        ar.class_id,
        gc.name as class_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance_records ar
      LEFT JOIN students s ON ar.student_id = s.RegNumber
      LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
      WHERE ${whereClause}
      GROUP BY ar.student_id, ar.class_id, s.Name, s.Surname, gc.name
      ORDER BY s.Name ASC
    `, params);

    return report.map(item => ({
      student_id: item.student_id,
      student_name: `${item.student_name} ${item.student_surname}`,
      class_id: item.class_id,
      class_name: item.class_name,
      total_records: parseInt(item.total_records),
      present_count: parseInt(item.present_count),
      absent_count: parseInt(item.absent_count),
      attendance_rate: item.total_records > 0 ? 
        ((item.present_count / item.total_records) * 100).toFixed(2) : 0
    }));
  }

  // Generate class-wise report
  async generateClassWiseReport(connection, whereClause, params) {
    const [report] = await connection.execute(`
      SELECT 
        ar.class_id,
        gc.name as class_name,
        gc.stream_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance_records ar
      LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
      WHERE ${whereClause}
      GROUP BY ar.class_id, gc.name, gc.stream_name
      ORDER BY gc.name ASC
    `, params);

    return report.map(item => ({
      class_id: item.class_id,
      class_name: item.class_name,
      stream_name: item.stream_name,
      total_records: parseInt(item.total_records),
      present_count: parseInt(item.present_count),
      absent_count: parseInt(item.absent_count),
      attendance_rate: item.total_records > 0 ? 
        ((item.present_count / item.total_records) * 100).toFixed(2) : 0
    }));
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Update attendance settings for a class
  async updateAttendanceSettings(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { classId } = req.params;
      const { 
        auto_mark_absent_after_hours, 
        require_excuse_for_absence, 
        send_absence_notifications 
      } = req.body;

      // Check if class exists
      const [classExists] = await connection.execute(
        'SELECT id FROM gradelevel_classes WHERE id = ?',
        [classId]
      );

      if (classExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Class not found'
        });
      }

      // Find or create settings
      const [existingSettings] = await connection.execute(
        'SELECT * FROM attendance_settings WHERE class_id = ?',
        [classId]
      );

      if (existingSettings.length === 0) {
        // Create new settings
        await connection.execute(
          'INSERT INTO attendance_settings (class_id, auto_mark_absent_after_hours, require_excuse_for_absence, send_absence_notifications) VALUES (?, ?, ?, ?)',
          [
            classId,
            auto_mark_absent_after_hours || 2,
            require_excuse_for_absence !== undefined ? require_excuse_for_absence : true,
            send_absence_notifications !== undefined ? send_absence_notifications : true
          ]
        );
      } else {
        // Update existing settings
        await connection.execute(
          'UPDATE attendance_settings SET auto_mark_absent_after_hours = ?, require_excuse_for_absence = ?, send_absence_notifications = ? WHERE class_id = ?',
          [
            auto_mark_absent_after_hours !== undefined ? auto_mark_absent_after_hours : existingSettings[0].auto_mark_absent_after_hours,
            require_excuse_for_absence !== undefined ? require_excuse_for_absence : existingSettings[0].require_excuse_for_absence,
            send_absence_notifications !== undefined ? send_absence_notifications : existingSettings[0].send_absence_notifications,
            classId
          ]
        );
      }

      res.json({
        success: true,
        message: 'Attendance settings updated successfully'
      });

    } catch (error) {
      console.error('Error updating attendance settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while updating attendance settings'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance settings for a class
  async getAttendanceSettings(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { classId } = req.params;

      const [settings] = await connection.execute(`
        SELECT 
          as.*,
          gc.name as class_name,
          gc.stream_name
        FROM attendance_settings as
        LEFT JOIN gradelevel_classes gc ON as.class_id = gc.id
        WHERE as.class_id = ?
      `, [classId]);

      if (settings.length === 0) {
        // Return default settings
        const [classInfo] = await connection.execute(
          'SELECT id, name, stream_name FROM gradelevel_classes WHERE id = ?',
          [classId]
        );

        if (classInfo.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Class not found'
          });
        }

        return res.json({
          success: true,
          data: {
            class_id: classId,
            class_name: classInfo[0].name,
            stream_name: classInfo[0].stream_name,
            auto_mark_absent_after_hours: 2,
            require_excuse_for_absence: true,
            send_absence_notifications: true,
            is_default: true
          }
        });
      }

      res.json({
        success: true,
        data: settings[0]
      });

    } catch (error) {
      console.error('Error fetching attendance settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance settings'
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new AdminAttendanceController();