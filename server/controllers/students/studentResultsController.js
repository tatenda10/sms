const { pool } = require('../../config/database');

class StudentResultsController {
  // Get student results by year and term with balance check
  static async getStudentResults(req, res) {
    const conn = await pool.getConnection();
    try {
      const { regNumber } = req.student;
      const { academic_year, term } = req.query;

      // Validate required parameters
      if (!academic_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'Academic year and term are required'
        });
      }

      // Convert term format from "Term 1" to "1" to match database
      let dbTerm = term;
      if (term.startsWith('Term ')) {
        dbTerm = term.replace('Term ', '');
      }
      
      console.log('🔍 Original term:', term, 'Converted to:', dbTerm);

      // First check if student has DR balance (debit balance)
      const [balanceResult] = await conn.execute(
        'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
        [regNumber]
      );

      const currentBalance = balanceResult.length > 0 ? balanceResult[0].current_balance : 0;
      
      // If student has DR balance (negative balance), deny access
      if (currentBalance < 0) {
        return res.status(403).json({
          success: false,
          message: 'You cannot view results due to outstanding balance. Please clear your account balance first.',
          current_balance: currentBalance,
          access_denied: true
        });
      }

      // Check if this term/year is published (use original term format for published_results table)
      const [publishedCheck] = await conn.execute(
        'SELECT is_published FROM published_results WHERE academic_year = ? AND term = ?',
        [academic_year, term]
      );

      if (publishedCheck.length === 0 || !publishedCheck[0].is_published) {
        return res.status(403).json({
          success: false,
          message: 'Results for this term and year are not yet published.',
          access_denied: true
        });
      }

      // Get student's results for the specified year and term
      // First get basic results like the existing results controller
      const [results] = await conn.execute(
        `SELECT 
          r.id,
          r.reg_number,
          r.subject_class_id,
          r.gradelevel_class_id,
          r.academic_year,
          r.term,
          r.total_mark,
          r.grade,
          r.points,
          r.created_at,
          r.updated_at,
          s.name as subject_name,
          CONCAT(s.name, ' - ', gc.name) as subject_class_name,
          gc.name as gradelevel_class_name
        FROM results r
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects s ON sc.subject_id = s.id
        LEFT JOIN gradelevel_classes gc ON r.gradelevel_class_id = gc.id
        WHERE r.reg_number = ? 
          AND r.academic_year = ? 
          AND r.term = ?
        ORDER BY s.name`,
        [regNumber, academic_year, dbTerm]
      );

      console.log('📊 Found results for student:', results.length);
      console.log('📊 Sample result:', results[0]);

      // Get paper marks and coursework marks for each result (like existing results controller)
      for (let result of results) {
        // Get paper marks
        const [paperMarks] = await conn.execute(
          `SELECT pm.*, p.name as paper_name 
           FROM paper_marks pm
           LEFT JOIN papers p ON pm.paper_id = p.id
           WHERE pm.result_id = ?`,
          [result.id]
        );
        result.paper_marks = paperMarks;

        // Get coursework mark
        const [coursework] = await conn.execute(
          `SELECT coursework_mark 
           FROM mid_term_coursework 
           WHERE reg_number = ? AND subject_class_id = ? AND gradelevel_class_id = ? AND academic_year = ? AND term = ?`,
          [result.reg_number, result.subject_class_id, result.gradelevel_class_id, result.academic_year, dbTerm]
        );
        result.coursework_mark = coursework.length > 0 ? coursework[0].coursework_mark : null;
      }

      console.log('📊 Results with paper marks and coursework:', results.length);
      console.log('📊 Sample result with coursework:', results[0]);

      // Get student's class position for this term (using same approach as existing results controller)
      const [allClassResults] = await conn.execute(
        `SELECT r.reg_number, SUM(r.total_mark) as total_marks
         FROM results r
         WHERE r.gradelevel_class_id = (
           SELECT gradelevel_class_id 
           FROM results 
           WHERE reg_number = ? 
             AND academic_year = ? 
             AND term = ? 
           LIMIT 1
         )
           AND r.academic_year = ? 
           AND r.term = ?
         GROUP BY r.reg_number
         ORDER BY total_marks DESC`,
        [regNumber, academic_year, dbTerm, academic_year, dbTerm]
      );

      console.log('📊 All class results for position calculation:', allClassResults);

      // Calculate positions manually (like existing results controller)
      let currentPosition = 1;
      let currentMark = null;
      let studentPosition = null;

      for (let i = 0; i < allClassResults.length; i++) {
        const result = allClassResults[i];
        
        if (currentMark !== null && currentMark !== result.total_marks) {
          currentPosition = i + 1;
        }
        
        currentMark = result.total_marks;
        
        if (result.reg_number === regNumber) {
          studentPosition = {
            reg_number: result.reg_number,
            position: currentPosition,
            total_marks: result.total_marks
          };
          break;
        }
      }

      console.log('📊 Student position calculated:', studentPosition);

      // Get student's stream position if applicable
      let streamPosition = null;
      
      if (studentPosition) {
        // Get the stream_id for this student's gradelevel class
        const [streamInfo] = await conn.execute(
          `SELECT gc.stream_id, s.name as stream_name
           FROM gradelevel_classes gc
           LEFT JOIN stream s ON gc.stream_id = s.id
           WHERE gc.id = ?`,
          [results[0]?.gradelevel_class_id]
        );
        
        if (streamInfo.length > 0 && streamInfo[0].stream_id) {
          // Get all students in the same stream for position calculation
          const [streamResults] = await conn.execute(
            `SELECT r.reg_number, SUM(r.total_mark) as total_marks
             FROM results r
             JOIN gradelevel_classes gc ON r.gradelevel_class_id = gc.id
             WHERE gc.stream_id = ? 
               AND r.academic_year = ? 
               AND r.term = ?
             GROUP BY r.reg_number
             ORDER BY total_marks DESC`,
            [streamInfo[0].stream_id, academic_year, dbTerm]
          );
          
          console.log('📊 Stream results for position calculation:', streamResults);
          
          // Calculate stream position manually
          let currentStreamPosition = 1;
          let currentStreamMark = null;
          
          for (let i = 0; i < streamResults.length; i++) {
            const result = streamResults[i];
            
            if (currentStreamMark !== null && currentStreamMark !== result.total_marks) {
              currentStreamPosition = i + 1;
            }
            
            currentStreamMark = result.total_marks;
            
            if (result.reg_number === regNumber) {
              streamPosition = {
                reg_number: result.reg_number,
                stream_position: currentStreamPosition,
                total_marks: result.total_marks,
                stream_name: streamInfo[0].stream_name
              };
              break;
            }
          }
          
          console.log('📊 Student stream position calculated:', streamPosition);
        }
      }

      res.json({
        success: true,
        data: {
          student_reg_number: regNumber,
          academic_year,
          term, // Return original term format for display
          current_balance: currentBalance,
          results: results,
          class_position: studentPosition ? studentPosition.position : null,
          stream_position: streamPosition ? streamPosition.stream_position : null,
          total_subjects: results.length
        }
      });

    } catch (error) {
      console.error('Error fetching student results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student results'
      });
    } finally {
      conn.release();
    }
  }

  // Get available academic years and terms for student
  static async getAvailablePeriods(req, res) {
    const conn = await pool.getConnection();
    try {
      const { regNumber } = req.student;

      // Get all academic years and terms where student has results AND the term/year is published
      const [periods] = await conn.execute(
        `SELECT DISTINCT 
          r.academic_year, 
          r.term,
          COUNT(r.id) as result_count,
          pr.is_published,
          pr.published_at
        FROM results r
        JOIN published_results pr ON (r.academic_year = pr.academic_year AND CONCAT('Term ', r.term) = pr.term)
        WHERE r.reg_number = ? 
          AND pr.is_published = true
        GROUP BY r.academic_year, r.term, pr.is_published, pr.published_at
        ORDER BY r.academic_year DESC, r.term DESC`,
        [regNumber]
      );

      // Convert term format for display (1 -> Term 1)
      const formattedPeriods = periods.map(period => ({
        ...period,
        term: `Term ${period.term}`
      }));

      res.json({
        success: true,
        data: formattedPeriods
      });

    } catch (error) {
      console.error('Error fetching available periods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available periods'
      });
    } finally {
      conn.release();
    }
  }

  // Get student's balance status
  static async getBalanceStatus(req, res) {
    const conn = await pool.getConnection();
    try {
      const { regNumber } = req.student;

      const [balanceResult] = await conn.execute(
        'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
        [regNumber]
      );

      const currentBalance = balanceResult.length > 0 ? balanceResult[0].current_balance : 0;
      const canViewResults = currentBalance >= 0;

      res.json({
        success: true,
        data: {
          current_balance: currentBalance,
          can_view_results: canViewResults,
          balance_status: currentBalance >= 0 ? 'CREDIT' : 'DEBIT'
        }
      });

    } catch (error) {
      console.error('Error fetching balance status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch balance status'
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = StudentResultsController;