const { pool } = require('../../config/database');

class EmployeeClassController {
  // Get all classes assigned to an employee
  static async getEmployeeClasses(req, res) {
    try {
      console.log('📚 Getting classes for employee:', req.employeeId);
      
      const { employeeId } = req.params;
      
      // Get subject classes assigned to this employee
      const [subjectClasses] = await pool.execute(`
        SELECT 
          sc.id,
          sc.subject_id,
          sc.stream_id,
          sc.gradelevel_class_id,
          sc.room_id,
          sc.capacity,
          'subject' as class_type,
          s.name as stream_name,
          s.stage as stream_stage,
          sub.code as subject_code,
          sub.name as subject_name,
          gc.name as gradelevel_class_name
        FROM subject_classes sc
        JOIN stream s ON sc.stream_id = s.id
        JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id
        WHERE sc.employee_number = (
          SELECT employee_id FROM employees WHERE id = ?
        )
        ORDER BY s.name, sub.name, gc.name
      `, [employeeId]);

      // Get grade-level classes where this employee is the homeroom teacher
      const [gradelevelClasses] = await pool.execute(`
        SELECT 
          gc.id,
          gc.stream_id,
          gc.name,
          gc.capacity,
          gc.id as gradelevel_class_id,
          'gradelevel' as class_type,
          s.name as stream_name,
          s.stage as stream_stage,
          NULL as subject_code,
          NULL as subject_name,
          gc.name as gradelevel_class_name,
          NULL as room_name
        FROM gradelevel_classes gc
        JOIN stream s ON gc.stream_id = s.id
        WHERE gc.homeroom_teacher_employee_number = (
          SELECT employee_id FROM employees WHERE id = ?
        )
        ORDER BY s.name, gc.name
      `, [employeeId]);

      console.log('📚 Subject classes found:', subjectClasses.length);
      console.log('📚 Grade-level classes found:', gradelevelClasses.length);

      // Combine both types of classes
      const allClasses = [
        ...subjectClasses.map(cls => ({ ...cls, class_type: 'Subject Class' })),
        ...gradelevelClasses.map(cls => ({ ...cls, class_type: 'Grade-Level Class' }))
      ];

      res.json({
        success: true,
        data: allClasses,
        summary: {
          total_classes: allClasses.length,
          subject_classes: subjectClasses.length,
          gradelevel_classes: gradelevelClasses.length
        }
      });

    } catch (error) {
      console.error('Error fetching employee classes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee classes',
        error: error.message
      });
    }
  }
}

module.exports = EmployeeClassController;
