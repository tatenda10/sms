const { pool } = require('../../config/database');

class StudentEnrollmentController {
  // Get subject classes that a student is enrolled in
  static async getStudentSubjectClasses(req, res) {
    try {
      const { regNumber } = req.student;
      
      console.log('📚 Getting subject classes for student:', regNumber);
      
      const [enrollments] = await pool.execute(
        `SELECT 
          e.id as enrollment_id,
          e.subject_class_id,
          e.status as enrollment_status,
          e.created_at as enrolled_at,
          sub.code as subject_code,
          sub.name as subject_name,
          gc.name as gradelevel_class_name,
          st.name as stream_name,
          st.stage as stream_stage,
          emp.employee_id,
          emp.full_name as teacher_name
        FROM enrollments_subject_classes e 
        JOIN subject_classes sc ON e.subject_class_id = sc.id 
        JOIN subjects sub ON sc.subject_id = sub.id 
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id 
        LEFT JOIN stream st ON sc.stream_id = st.id
        LEFT JOIN employees emp ON sc.employee_number = emp.employee_id
        WHERE e.student_regnumber = ? AND e.status = 'active'
        ORDER BY st.name, sub.name, gc.name`,
        [regNumber]
      );
      
      console.log('✅ Found subject classes:', enrollments.length);
      
      res.json({ 
        success: true, 
        data: enrollments,
        count: enrollments.length
      });
    } catch (error) {
      console.error('❌ Error fetching student subject classes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch subject classes' 
      });
    }
  }

  // Get tests for a specific subject class
  static async getTestsForSubjectClass(req, res) {
    try {
      const { subjectClassId } = req.params;
      const { regNumber } = req.student;
      
      console.log('📝 Getting tests for subject class:', subjectClassId, 'student:', regNumber);
      
      // First verify the student is enrolled in this subject class
      const [enrollmentCheck] = await pool.execute(
        `SELECT id FROM enrollments_subject_classes 
         WHERE student_regnumber = ? AND subject_class_id = ? AND status = 'active'`,
        [regNumber, subjectClassId]
      );
      
      if (enrollmentCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this subject class'
        });
      }
      
      // Get tests for this subject class with marks information
      const [tests] = await pool.execute(
        `SELECT 
          t.id,
          t.test_name,
          t.test_type,
          t.total_marks,
          t.test_date,
          t.academic_year,
          t.term,
          t.description,
          t.instructions,
          t.created_at,
          tm.marks_obtained,
          tm.percentage,
          tm.comments,
          CASE WHEN tm.id IS NOT NULL THEN 1 ELSE 0 END as has_marks
        FROM tests t
        LEFT JOIN test_marks tm ON t.id = tm.test_id AND tm.student_reg_number = ?
        WHERE t.subject_class_id = ?
        ORDER BY t.test_date DESC, t.created_at DESC`,
        [regNumber, subjectClassId]
      );
      
      console.log('✅ Found tests:', tests.length);
      
      res.json({ 
        success: true, 
        data: tests,
        count: tests.length
      });
    } catch (error) {
      console.error('❌ Error fetching tests for subject class:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tests' 
      });
    }
  }

  // Get test marks for a specific test
  static async getTestMarks(req, res) {
    try {
      const { testId } = req.params;
      const { regNumber } = req.student;
      
      console.log('📊 Getting test marks for test:', testId, 'student:', regNumber);
      
      // Get the test details and verify student has access
      const [testDetails] = await pool.execute(
        `SELECT 
          t.id,
          t.test_name,
          t.test_type,
          t.total_marks,
          t.test_date,
          t.academic_year,
          t.term,
          t.subject_class_id,
          sub.name as subject_name,
          gc.name as gradelevel_class_name
        FROM tests t
        JOIN subject_classes sc ON t.subject_class_id = sc.id
        JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id
        WHERE t.id = ?`,
        [testId]
      );
      
      if (testDetails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }
      
      // Verify student is enrolled in this subject class
      const [enrollmentCheck] = await pool.execute(
        `SELECT id FROM enrollments_subject_classes 
         WHERE student_regnumber = ? AND subject_class_id = ? AND status = 'active'`,
        [regNumber, testDetails[0].subject_class_id]
      );
      
      if (enrollmentCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this subject class'
        });
      }
      
      // Get test marks for this student
      const [marks] = await pool.execute(
        `SELECT 
          tm.id,
          tm.marks_obtained,
          tm.percentage,
          tm.comments,
          tm.created_at,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          t.total_marks
        FROM test_marks tm
        JOIN students s ON tm.student_reg_number = s.RegNumber
        JOIN tests t ON tm.test_id = t.id
        WHERE tm.test_id = ? AND tm.student_reg_number = ?
        ORDER BY tm.created_at DESC`,
        [testId, regNumber]
      );
      
      console.log('✅ Found test marks:', marks.length);
      
      res.json({ 
        success: true, 
        data: {
          test: testDetails[0],
          marks: marks
        }
      });
    } catch (error) {
      console.error('❌ Error fetching test marks:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch test marks' 
      });
    }
  }
}

module.exports = StudentEnrollmentController;
