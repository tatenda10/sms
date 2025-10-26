const { pool } = require('../../config/database');

class StudentAnnouncementsController {
  // Get announcements for students
  static async getStudentAnnouncements(req, res) {
    try {
      const { regNumber } = req.student;
      
      console.log('📢 Getting announcements for student:', regNumber);
      
      // Get student's department/stream information
      const [studentInfo] = await pool.execute(
        `SELECT 
          s.RegNumber,
          s.Name,
          s.Surname,
          gc.stream_id,
          st.name as stream_name,
          st.stage as stream_stage
        FROM students s
        LEFT JOIN enrollments_gradelevel_classes egc ON s.RegNumber = egc.student_regnumber
        LEFT JOIN gradelevel_classes gc ON egc.gradelevel_class_id = gc.id
        LEFT JOIN stream st ON gc.stream_id = st.id
        WHERE s.RegNumber = ? AND egc.status = 'active'
        LIMIT 1`,
        [regNumber]
      );
      
      if (studentInfo.length === 0) {
        return res.json({ 
          success: true, 
          data: [],
          message: 'No student information found'
        });
      }
      
      const student = studentInfo[0];
      
      // Get announcements that are relevant to this student
      const [announcements] = await pool.execute(
        `SELECT 
          a.id,
          a.title,
          a.content,
          a.announcement_type,
          a.priority,
          a.target_type,
          a.target_value,
          a.start_date,
          a.end_date,
          a.status,
          a.created_at,
          a.updated_at,
          emp.employee_id,
          emp.full_name as created_by_name
        FROM announcements a
        LEFT JOIN employees emp ON a.created_by = emp.employee_id
        WHERE a.status = 'published' 
          AND a.announcement_type = 'student'
          AND (a.target_type = 'all' 
               OR (a.target_type = 'specific' AND a.target_value = ?))
          AND (a.start_date IS NULL OR a.start_date <= NOW())
          AND (a.end_date IS NULL OR a.end_date >= NOW())
        ORDER BY a.priority DESC, a.created_at DESC`,
        [student.stream_id]
      );
      
      console.log('✅ Found announcements:', announcements.length);
      
      res.json({ 
        success: true, 
        data: announcements,
        count: announcements.length
      });
    } catch (error) {
      console.error('❌ Error fetching student announcements:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch announcements' 
      });
    }
  }

  // Get announcement by ID
  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;
      const { regNumber } = req.student;
      
      console.log('📢 Getting announcement by ID:', id, 'for student:', regNumber);
      
      const [announcements] = await pool.execute(
        `SELECT 
          a.id,
          a.title,
          a.content,
          a.announcement_type,
          a.priority,
          a.target_type,
          a.target_value,
          a.start_date,
          a.end_date,
          a.status,
          a.created_at,
          a.updated_at,
          emp.employee_id,
          emp.full_name as created_by_name
        FROM announcements a
        LEFT JOIN employees emp ON a.created_by = emp.employee_id
        WHERE a.id = ? AND a.status = 'published' AND a.announcement_type = 'student'`,
        [id]
      );
      
      if (announcements.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }
      
      res.json({ 
        success: true, 
        data: announcements[0]
      });
    } catch (error) {
      console.error('❌ Error fetching announcement by ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch announcement' 
      });
    }
  }
}

module.exports = StudentAnnouncementsController;
