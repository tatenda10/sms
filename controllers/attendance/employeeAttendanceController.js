const { pool } = require('../../config/database');

class EmployeeAttendanceController {
  // Mark attendance for a class
  async markAttendance(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { class_id, date, records } = req.body;
      const employee_id = req.employeeId;

      // Validate required fields
      if (!class_id || !date || !records || !Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: class_id, date, and records array'
        });
      }

      // Validate date format
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Check if date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (attendanceDate > today) {
        return res.status(400).json({
          success: false,
          error: 'Cannot mark attendance for future dates'
        });
      }

      // Validate that employee teaches this class
      const [classCheck] = await connection.execute(`
        SELECT gc.id 
        FROM gradelevel_classes gc
        JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
        WHERE gc.id = ? AND e.id = ?
      `, [class_id, employee_id]);

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not authorized to mark attendance for this class'
        });
      }

      // Check for existing attendance records for this date and class
      const [existingRecords] = await connection.execute(
        'SELECT student_id, id FROM attendance_records WHERE class_id = ? AND attendance_date = ?',
        [class_id, date]
      );

      const existingStudentIds = existingRecords.map(record => record.student_id);
      const existingRecordMap = new Map(existingRecords.map(record => [record.student_id, record.id]));

      // Validate students are enrolled in this class
      const studentIds = records.map(record => record.student_id);
      const placeholders = studentIds.map(() => '?').join(',');
      
      const [enrolledStudents] = await connection.execute(
        `SELECT DISTINCT s.RegNumber 
         FROM students s 
         INNER JOIN enrollments_gradelevel_classes ge ON s.RegNumber = ge.student_regnumber 
         WHERE ge.gradelevel_class_id = ? AND s.RegNumber IN (${placeholders})`,
        [class_id, ...studentIds]
      );

      const validStudentIds = enrolledStudents.map(student => student.RegNumber);
      const invalidStudents = studentIds.filter(id => !validStudentIds.includes(id));
      
      if (invalidStudents.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid students not enrolled in this class: ${invalidStudents.join(', ')}`
        });
      }

      // Validate attendance records
      const validRecords = records.filter(record => 
        record.student_id && 
        (record.status === 'present' || record.status === 'absent')
      );

      if (validRecords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid attendance records provided'
        });
      }

      // Start transaction
      await connection.beginTransaction();

      try {
        const newRecords = [];
        const updatedRecords = [];

        // Process each record - either insert new or update existing
        for (const record of validRecords) {
          if (existingRecordMap.has(record.student_id)) {
            // Update existing record
            await connection.execute(
              'UPDATE attendance_records SET status = ?, notes = ?, marked_by = ? WHERE id = ?',
              [record.status, record.notes || null, employee_id, existingRecordMap.get(record.student_id)]
            );
            updatedRecords.push(record);
          } else {
            // Insert new record
            await connection.execute(
              'INSERT INTO attendance_records (class_id, student_id, attendance_date, status, marked_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
              [
                class_id,
                record.student_id,
                date,
                record.status,
                employee_id,
                record.notes || null
              ]
            );
            newRecords.push(record);
          }
        }

        // Commit transaction
        await connection.commit();

        // Calculate summary
        const presentCount = validRecords.filter(r => r.status === 'present').length;
        const absentCount = validRecords.filter(r => r.status === 'absent').length;

        res.json({
          success: true,
          message: `Attendance processed successfully - ${newRecords.length} new records, ${updatedRecords.length} updated`,
          data: {
            class_id,
            date,
            total_students: validRecords.length,
            present: presentCount,
            absent: absentCount,
            new_records: newRecords.length,
            updated_records: updatedRecords.length,
            marked_by: req.employeeName,
            marked_at: new Date().toISOString()
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error marking attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while marking attendance'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance for a class on specific date
  async getClassAttendance(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { classId, date } = req.params;
      const employee_id = req.employeeId;

      // Validate access
      const [classCheck] = await connection.execute(`
        SELECT gc.id 
        FROM gradelevel_classes gc
        JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
        WHERE gc.id = ? AND e.id = ?
      `, [classId, employee_id]);

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not authorized to view attendance for this class'
        });
      }

      const [attendance] = await connection.execute(`
        SELECT 
          ar.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.Gender,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN students s ON ar.student_id = s.RegNumber
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ar.class_id = ? AND ar.attendance_date = ?
        ORDER BY ar.created_at ASC
      `, [classId, date]);

      res.json({
        success: true,
        data: attendance
      });

    } catch (error) {
      console.error('Error fetching class attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance history for a class
  async getClassAttendanceHistory(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { classId } = req.params;
      const { start_date, end_date, page = 1, limit = 50 } = req.query;
      const employee_id = req.employeeId;

      // Validate access
      const [classCheck] = await connection.execute(`
        SELECT gc.id 
        FROM gradelevel_classes gc
        JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
        WHERE gc.id = ? AND e.id = ?
      `, [classId, employee_id]);

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Build date filter
      let dateFilter = '';
      let params = [classId];
      
      if (start_date && end_date) {
        dateFilter = 'AND ar.attendance_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      } else if (start_date) {
        dateFilter = 'AND ar.attendance_date >= ?';
        params.push(start_date);
      } else if (end_date) {
        dateFilter = 'AND ar.attendance_date <= ?';
        params.push(end_date);
      }

      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM attendance_records ar
        WHERE ar.class_id = ? ${dateFilter}
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
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN students s ON ar.student_id = s.RegNumber
        LEFT JOIN employees e ON ar.marked_by = e.id
        WHERE ar.class_id = ? ${dateFilter}
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
      console.error('Error fetching attendance history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance history'
      });
    } finally {
      connection.release();
    }
  }

  // Get attendance statistics for a class
  async getAttendanceStats(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { classId } = req.params;
      const { start_date, end_date } = req.query;
      const employee_id = req.employeeId;

      // Validate access
      const [classCheck] = await connection.execute(`
        SELECT gc.id 
        FROM gradelevel_classes gc
        JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
        WHERE gc.id = ? AND e.id = ?
      `, [classId, employee_id]);

      if (classCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Build date filter
      let dateFilter = '';
      let params = [classId];
      
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

      // Get statistics
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
          COUNT(DISTINCT attendance_date) as total_days
        FROM attendance_records 
        WHERE class_id = ? ${dateFilter}
      `, params);

      const totalRecords = stats[0].total_records;
      const presentCount = stats[0].present_count;
      const absentCount = stats[0].absent_count;
      const totalDays = stats[0].total_days;
      const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          total_records: totalRecords,
          total_days: totalDays,
          present_count: presentCount,
          absent_count: absentCount,
          attendance_rate: parseFloat(attendanceRate)
        }
      });

    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching attendance statistics'
      });
    } finally {
      connection.release();
    }
  }

  // Update attendance record
  async updateAttendanceRecord(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { recordId } = req.params;
      const { status, notes } = req.body;
      const employee_id = req.employeeId;

      // Validate status
      if (!status || !['present', 'absent'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be present or absent'
        });
      }

      // Find the attendance record and validate access
      const [attendanceRecord] = await connection.execute(`
        SELECT ar.*, gc.homeroom_teacher_employee_number
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
        WHERE ar.id = ?
      `, [recordId]);

      if (attendanceRecord.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }

      // Get employee's employee_id to compare
      const [employeeData] = await connection.execute(
        'SELECT employee_id FROM employees WHERE id = ?',
        [employee_id]
      );

      if (employeeData.length === 0 || attendanceRecord[0].homeroom_teacher_employee_number !== employeeData[0].employee_id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not authorized to update this attendance record'
        });
      }

      // Update the record
      await connection.execute(
        'UPDATE attendance_records SET status = ?, notes = ? WHERE id = ?',
        [status, notes || null, recordId]
      );

      res.json({
        success: true,
        message: 'Attendance record updated successfully'
      });

    } catch (error) {
      console.error('Error updating attendance record:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while updating attendance record'
      });
    } finally {
      connection.release();
    }
  }

  // Get student attendance history
  async getStudentAttendanceHistory(req, res) {
    const connection = await pool.getConnection();
    
    try {
      const { studentId } = req.params;
      const { class_id, start_date, end_date } = req.query;
      const employee_id = req.employeeId;

      // If class_id is provided, validate access
      if (class_id) {
        const [classCheck] = await connection.execute(`
          SELECT gc.id 
          FROM gradelevel_classes gc
          JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
          WHERE gc.id = ? AND e.id = ?
        `, [class_id, employee_id]);

        if (classCheck.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      // Build where clause
      let whereClause = 'ar.student_id = ?';
      let params = [studentId];

      if (class_id) {
        whereClause += ' AND ar.class_id = ?';
        params.push(class_id);
      }

      // Build date filter
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

      const [attendance] = await connection.execute(`
        SELECT 
          ar.*,
          gc.name as class_name,
          gc.stream_name,
          e.full_name as marked_by_name
        FROM attendance_records ar
        LEFT JOIN gradelevel_classes gc ON ar.class_id = gc.id
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
        error: 'Internal server error while fetching student attendance history'
      });
    } finally {
      connection.release();
    }
  }

  // Helper method to get enrolled students
  async getEnrolledStudents(class_id) {
    const connection = await pool.getConnection();
    try {
      const [students] = await connection.execute(`
        SELECT s.RegNumber, s.Name, s.Surname
        FROM students s
        INNER JOIN enrollments_gradelevel_classes egc ON s.RegNumber = egc.student_regnumber
        WHERE egc.gradelevel_class_id = ? AND egc.status = 'active'
        ORDER BY s.Name, s.Surname
      `, [class_id]);
      return students;
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      return [];
    } finally {
      connection.release();
    }
  }
}

module.exports = new EmployeeAttendanceController();