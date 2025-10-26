const { pool } = require('../../config/database');

class TestsController {
  // Create a new test
  async createTest(req, res) {
    const conn = await pool.getConnection();
    try {
      console.log('🔍 Create Test - Request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Create Test - User info:', { userId: req.user?.id, employeeId: req.employeeId, employeeNumber: req.employeeNumber });
      
      const {
        test_name,
        test_type,
        total_marks,
        test_date,
        academic_year,
        term,
        subject_class_id,
        description,
        instructions
      } = req.body;

      // Log each field to see what's missing
      console.log('📝 Field validation:');
      console.log('  test_name:', test_name, test_name ? '✓' : '❌');
      console.log('  test_type:', test_type, test_type ? '✓' : '❌');
      console.log('  total_marks:', total_marks, total_marks ? '✓' : '❌');
      console.log('  test_date:', test_date, test_date ? '✓' : '❌');
      console.log('  academic_year:', academic_year, academic_year ? '✓' : '❌');
      console.log('  term:', term, term ? '✓' : '❌');
      console.log('  subject_class_id:', subject_class_id, subject_class_id ? '✓' : '❌');

      // Validate required fields
      if (!test_name || !test_type || !total_marks || !test_date || !academic_year || !term || !subject_class_id) {
        console.log('❌ Missing required fields detected');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          details: {
            test_name: !!test_name,
            test_type: !!test_type,
            total_marks: !!total_marks,
            test_date: !!test_date,
            academic_year: !!academic_year,
            term: !!term,
            subject_class_id: !!subject_class_id
          }
        });
      }

      const [result] = await conn.execute(
        `INSERT INTO tests (test_name, test_type, total_marks, test_date, academic_year, term, 
         subject_class_id, description, instructions, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [test_name, test_type, total_marks, test_date, academic_year, term, 
         subject_class_id, description || null, instructions || null, 
         req.user?.id || req.employeeId, req.user?.id || req.employeeId]
      );

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: {
          id: result.insertId,
          test_name,
          test_type,
          total_marks,
          test_date,
          academic_year,
          term,
          subject_class_id,
          description,
          instructions
        }
      });

    } catch (error) {
      console.error('Error creating test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test'
      });
    } finally {
      conn.release();
    }
  }

  // Get all tests with optional filters
  async getTests(req, res) {
    const conn = await pool.getConnection();
    try {
      const { subject_class_id, academic_year, term, test_type, created_by } = req.query;

      let query = `
        SELECT t.*, 
               sc.subject_id, sub.name as subject_name,
               u.username as created_by_name
        FROM tests t
        LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE 1=1
      `;

      const params = [];

      if (subject_class_id) {
        query += ' AND t.subject_class_id = ?';
        params.push(subject_class_id);
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

      if (created_by) {
        query += ' AND t.created_by = ?';
        params.push(created_by);
      }

      query += ' ORDER BY t.test_date DESC, t.created_at DESC';

      const [tests] = await conn.execute(query, params);

      res.json({
        success: true,
        data: tests
      });

    } catch (error) {
      console.error('Error fetching tests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tests'
      });
    } finally {
      conn.release();
    }
  }

  // Get test by ID
  async getTestById(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      const [tests] = await conn.execute(
        `SELECT t.*, 
                sc.subject_id, sub.name as subject_name,
                u.username as created_by_name
         FROM tests t
         LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
         LEFT JOIN subjects sub ON sc.subject_id = sub.id
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = ?`,
        [id]
      );

      if (tests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      res.json({
        success: true,
        data: tests[0]
      });

    } catch (error) {
      console.error('Error fetching test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test'
      });
    } finally {
      conn.release();
    }
  }

  // Update test
  async updateTest(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const {
        test_name,
        test_type,
        total_marks,
        test_date,
        academic_year,
        term,
        subject_class_id,
        description,
        instructions
      } = req.body;

      // Check if test exists
      const [existingTests] = await conn.execute('SELECT id FROM tests WHERE id = ?', [id]);
      if (existingTests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      await conn.execute(
        `UPDATE tests SET 
         test_name = ?, test_type = ?, total_marks = ?, test_date = ?, 
         academic_year = ?, term = ?, subject_class_id = ?,
         description = ?, instructions = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [test_name, test_type, total_marks, test_date, academic_year, term, 
         subject_class_id, description || null, instructions || null,
         req.user?.id || req.employeeId, id]
      );

      res.json({
        success: true,
        message: 'Test updated successfully'
      });

    } catch (error) {
      console.error('Error updating test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update test'
      });
    } finally {
      conn.release();
    }
  }

  // Delete test
  async deleteTest(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      // Check if test exists
      const [existingTests] = await conn.execute('SELECT id FROM tests WHERE id = ?', [id]);
      if (existingTests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      // Delete test (this will cascade delete test marks due to foreign key constraint)
      await conn.execute('DELETE FROM tests WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Test deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete test'
      });
    } finally {
      conn.release();
    }
  }

  // Get tests by class
  async getTestsByClass(req, res) {
    const conn = await pool.getConnection();
    try {
      const { class_id } = req.params;
      const { academic_year, term, test_type } = req.query;

      let query = `
        SELECT t.*, 
               sc.subject_id, sub.name as subject_name,
               u.username as created_by_name
        FROM tests t
        LEFT JOIN subject_classes sc ON t.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.subject_class_id = ?
      `;

      const params = [class_id];

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

      const [tests] = await conn.execute(query, params);

      res.json({
        success: true,
        data: tests
      });

    } catch (error) {
      console.error('Error fetching tests by class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tests'
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = new TestsController();