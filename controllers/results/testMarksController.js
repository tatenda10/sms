const { pool } = require('../../config/database');

class TestMarksController {
  // Add test mark for a student
  async addTestMark(req, res) {
    const conn = await pool.getConnection();
    try {
      const {
        test_id,
        student_reg_number,
        marks_obtained,
        comments
      } = req.body;

      // Validate required fields
      if (!test_id || !student_reg_number || marks_obtained === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: test_id, student_reg_number, marks_obtained'
        });
      }

      // Check if test exists and get total marks
      const [tests] = await conn.execute(
        'SELECT id, total_marks FROM tests WHERE id = ?',
        [test_id]
      );

      if (tests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      const total_marks = tests[0].total_marks;

      // Validate marks_obtained is not greater than total_marks
      if (parseFloat(marks_obtained) > parseFloat(total_marks)) {
        return res.status(400).json({
          success: false,
          message: 'Marks obtained cannot be greater than total marks'
        });
      }

      // Check if marks already exist for this student and test
      const [existingMarks] = await conn.execute(
        'SELECT id FROM test_marks WHERE test_id = ? AND student_reg_number = ?',
        [test_id, student_reg_number]
      );

      if (existingMarks.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Marks already exist for this student and test'
        });
      }

      const [result] = await conn.execute(
        `INSERT INTO test_marks (test_id, student_reg_number, marks_obtained, comments, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [test_id, student_reg_number, marks_obtained, comments || null, 
         req.user?.id || req.employeeId, req.user?.id || req.employeeId]
      );

      res.status(201).json({
        success: true,
        message: 'Test mark added successfully',
        data: {
          id: result.insertId,
          test_id,
          student_reg_number,
          marks_obtained,
          comments
        }
      });

    } catch (error) {
      console.error('Error adding test mark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add test mark'
      });
    } finally {
      conn.release();
    }
  }

  // Bulk add test marks
  async bulkAddTestMarks(req, res) {
    const conn = await pool.getConnection();
    try {
      const { test_id, marks } = req.body;

      if (!test_id || !Array.isArray(marks) || marks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: test_id and marks array'
        });
      }

      // Check if test exists and get total marks
      const [tests] = await conn.execute(
        'SELECT id, total_marks FROM tests WHERE id = ?',
        [test_id]
      );

      if (tests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      const total_marks = tests[0].total_marks;

      // Validate all marks
      for (const mark of marks) {
        if (!mark.student_reg_number || mark.marks_obtained === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each mark must have student_reg_number and marks_obtained'
          });
        }

        if (parseFloat(mark.marks_obtained) > parseFloat(total_marks)) {
          return res.status(400).json({
            success: false,
            message: `Marks obtained for student ${mark.student_reg_number} cannot be greater than total marks`
          });
        }
      }

      // Insert all marks
      const insertPromises = marks.map(mark => 
        conn.execute(
          `INSERT INTO test_marks (test_id, student_reg_number, marks_obtained, comments, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [test_id, mark.student_reg_number, mark.marks_obtained, mark.comments || null,
           req.user?.id || req.employeeId, req.user?.id || req.employeeId]
        )
      );

      await Promise.all(insertPromises);

      res.json({
        success: true,
        message: 'Test marks added successfully',
        data: {
          test_id,
          marks_added: marks.length
        }
      });

    } catch (error) {
      console.error('Error bulk adding test marks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add test marks'
      });
    } finally {
      conn.release();
    }
  }

  // Get test marks by test ID
  async getTestMarksByTest(req, res) {
    const conn = await pool.getConnection();
    try {
      const { test_id } = req.params;

      const [testMarks] = await conn.execute(
        `SELECT tm.*, s.Name as student_name, s.Surname as student_surname,
                t.test_name, t.test_type, t.total_marks, t.test_date, t.academic_year, t.term
         FROM test_marks tm
         LEFT JOIN students s ON tm.student_reg_number = s.RegNumber
         LEFT JOIN tests t ON tm.test_id = t.id
         WHERE tm.test_id = ?
         ORDER BY s.Surname, s.Name`,
        [test_id]
      );

      res.json({
        success: true,
        data: testMarks
      });

    } catch (error) {
      console.error('Error fetching test marks by test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test marks'
      });
    } finally {
      conn.release();
    }
  }

  // Get test marks by student
  async getTestMarksByStudent(req, res) {
    const conn = await pool.getConnection();
    try {
      const { student_reg_number } = req.params;
      const { academic_year, term, test_type } = req.query;

      let query = `
        SELECT tm.*, t.test_name, t.test_type, t.total_marks, t.test_date, t.academic_year, t.term,
               sub.name as subject_name, glc.name as gradelevel_class_name
        FROM test_marks tm
        LEFT JOIN tests t ON tm.test_id = t.id
        LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes glc ON t.gradelevel_class_id = glc.id
        WHERE tm.student_reg_number = ?
      `;

      const params = [student_reg_number];

      if (academic_year) {
        query += ' AND t.academic_year = ?';
        params.push(academic_year);
      }

      if (term) {
        query += ' AND t.term = ?';
        params.push(term);
      }

      if (test_type) {
        query += ' AND t.test_type = ?';
        params.push(test_type);
      }

      query += ' ORDER BY t.test_date DESC, t.created_at DESC';

      const [testMarks] = await conn.execute(query, params);

      res.json({
        success: true,
        data: testMarks
      });

    } catch (error) {
      console.error('Error fetching test marks by student:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test marks'
      });
    } finally {
      conn.release();
    }
  }

  // Get test marks by class
  async getTestMarksByClass(req, res) {
    const conn = await pool.getConnection();
    try {
      const { class_id } = req.params;
      const { class_type, academic_year, term, test_type, student_reg_number } = req.query;

      let query = `
        SELECT tm.*, s.Name as student_name, s.Surname as student_surname,
               t.test_name, t.test_type, t.total_marks, t.test_date, t.academic_year, t.term,
               sub.name as subject_name, glc.name as gradelevel_class_name
        FROM test_marks tm
        LEFT JOIN students s ON tm.student_reg_number = s.RegNumber
        LEFT JOIN tests t ON tm.test_id = t.id
        LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN gradelevel_classes glc ON t.gradelevel_class_id = glc.id
        WHERE 1=1
      `;

      const params = [];

      // Determine which class type to filter by
      if (class_type === 'subject' || !class_type) {
        query += ' AND t.subject_class_id = ?';
        params.push(class_id);
      } else if (class_type === 'gradelevel') {
        query += ' AND t.gradelevel_class_id = ?';
        params.push(class_id);
      }

      if (academic_year) {
        query += ' AND t.academic_year = ?';
        params.push(academic_year);
      }

      if (term) {
        query += ' AND t.term = ?';
        params.push(term);
      }

      if (test_type) {
        query += ' AND t.test_type = ?';
        params.push(test_type);
      }

      if (student_reg_number) {
        query += ' AND tm.student_reg_number = ?';
        params.push(student_reg_number);
      }

      query += ' ORDER BY t.test_date DESC, s.Surname, s.Name';

      const [testMarks] = await conn.execute(query, params);

      res.json({
        success: true,
        data: testMarks
      });

    } catch (error) {
      console.error('Error fetching test marks by class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test marks'
      });
    } finally {
      conn.release();
    }
  }

  // Get test mark by ID
  async getTestMarkById(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      const [testMarks] = await conn.execute(
        `SELECT tm.*, s.Name as student_name, s.Surname as student_surname,
                t.test_name, t.test_type, t.total_marks, t.test_date, t.academic_year, t.term,
                sub.name as subject_name, glc.name as gradelevel_class_name
         FROM test_marks tm
         LEFT JOIN students s ON tm.student_reg_number = s.RegNumber
         LEFT JOIN tests t ON tm.test_id = t.id
         LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
         LEFT JOIN subjects sub ON sc.subject_id = sub.id
         LEFT JOIN gradelevel_classes glc ON t.gradelevel_class_id = glc.id
         WHERE tm.id = ?`,
        [id]
      );

      if (testMarks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test mark not found'
        });
      }

      res.json({
        success: true,
        data: testMarks[0]
      });

    } catch (error) {
      console.error('Error fetching test mark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test mark'
      });
    } finally {
      conn.release();
    }
  }

  // Update test mark
  async updateTestMark(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { marks_obtained, comments } = req.body;

      if (marks_obtained === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: marks_obtained'
        });
      }

      // Check if test mark exists and get test details
      const [existingMarks] = await conn.execute(
        `SELECT tm.*, t.total_marks 
         FROM test_marks tm
         LEFT JOIN tests t ON tm.test_id = t.id
         WHERE tm.id = ?`,
        [id]
      );

      if (existingMarks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test mark not found'
        });
      }

      const total_marks = existingMarks[0].total_marks;

      // Validate marks_obtained is not greater than total_marks
      if (parseFloat(marks_obtained) > parseFloat(total_marks)) {
        return res.status(400).json({
          success: false,
          message: 'Marks obtained cannot be greater than total marks'
        });
      }

      await conn.execute(
        `UPDATE test_marks SET 
         marks_obtained = ?, comments = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [marks_obtained, comments || null, req.user?.id || req.employeeId, id]
      );

      res.json({
        success: true,
        message: 'Test mark updated successfully'
      });

    } catch (error) {
      console.error('Error updating test mark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update test mark'
      });
    } finally {
      conn.release();
    }
  }

  // Delete test mark
  async deleteTestMark(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      // Check if test mark exists
      const [existingMarks] = await conn.execute('SELECT id FROM test_marks WHERE id = ?', [id]);
      if (existingMarks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test mark not found'
        });
      }

      await conn.execute('DELETE FROM test_marks WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Test mark deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting test mark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete test mark'
      });
    } finally {
      conn.release();
    }
  }

  // Get test marks statistics
  async getTestMarksStatistics(req, res) {
    const conn = await pool.getConnection();
    try {
      const { test_id } = req.params;

      const [stats] = await conn.execute(
        `SELECT 
           COUNT(*) as total_students,
           AVG(tm.marks_obtained) as average_marks,
           MIN(tm.marks_obtained) as lowest_marks,
           MAX(tm.marks_obtained) as highest_marks,
           AVG(tm.percentage) as average_percentage,
           t.total_marks
         FROM test_marks tm
         LEFT JOIN tests t ON tm.test_id = t.id
         WHERE tm.test_id = ?`,
        [test_id]
      );

      res.json({
        success: true,
        data: stats[0] || {
          total_students: 0,
          average_marks: 0,
          lowest_marks: 0,
          highest_marks: 0,
          average_percentage: 0,
          total_marks: 0
        }
      });

    } catch (error) {
      console.error('Error fetching test marks statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test marks statistics'
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = new TestMarksController();