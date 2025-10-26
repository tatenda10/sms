const { pool } = require('../../config/database');

class StudentResultsAnalyticsController {
  // Get academic performance overview
  async getAcademicPerformanceOverview(req, res) {
    try {
      const { year, term, class_id, subject_id } = req.query;
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      if (year) {
        whereClause += ' AND r.academic_year = ?';
        params.push(year);
      }
      
      if (term) {
        whereClause += ' AND r.term = ?';
        params.push(term);
      }
      
      if (class_id) {
        whereClause += ' AND gc.id = ?';
        params.push(class_id);
      }
      
      if (subject_id) {
        whereClause += ' AND s.id = ?';
        params.push(subject_id);
      }

      // Get overall performance metrics
      const [overview] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT r.reg_number) as total_students,
          COUNT(r.id) as total_exam_records,
          COALESCE(AVG(r.total_mark), 0) as average_marks,
          COALESCE(MAX(r.total_mark), 0) as highest_marks,
          COALESCE(MIN(r.total_mark), 0) as lowest_marks,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 4.0 THEN 1 END) as excellent_performance,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 3.0 AND COALESCE(r.points, 0) < 4.0 THEN 1 END) as good_performance,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 2.0 AND COALESCE(r.points, 0) < 3.0 THEN 1 END) as average_performance,
          COUNT(CASE WHEN COALESCE(r.points, 0) < 2.0 THEN 1 END) as poor_performance
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects s ON sc.subject_id = s.id
        ${whereClause}
      `, params);

      // Get performance by class
      const [performanceByClass] = await pool.execute(`
        SELECT 
          gc.id as class_id,
          gc.name as class_name,
          s.name as stream_name,
          COUNT(DISTINCT r.reg_number) as students_count,
          COUNT(r.id) as exam_records,
          COALESCE(AVG(r.total_mark), 0) as average_marks,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 4.0 THEN 1 END) as excellent_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 3.0 AND COALESCE(r.points, 0) < 4.0 THEN 1 END) as good_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 2.0 AND COALESCE(r.points, 0) < 3.0 THEN 1 END) as average_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) < 2.0 THEN 1 END) as poor_count
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        ${whereClause}
        GROUP BY gc.id, gc.name, s.name
        ORDER BY average_marks DESC
      `, params);

      // Get performance by subject
      const [performanceBySubject] = await pool.execute(`
        SELECT 
          s.id as subject_id,
          s.name as subject_name,
          COUNT(DISTINCT r.reg_number) as students_count,
          COUNT(r.id) as exam_records,
          COALESCE(AVG(r.total_mark), 0) as average_marks,
          COALESCE(MAX(r.total_mark), 0) as highest_marks,
          COALESCE(MIN(r.total_mark), 0) as lowest_marks,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 4.0 THEN 1 END) as excellent_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 3.0 AND COALESCE(r.points, 0) < 4.0 THEN 1 END) as good_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 2.0 AND COALESCE(r.points, 0) < 3.0 THEN 1 END) as average_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) < 2.0 THEN 1 END) as poor_count
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream str ON gc.stream_id = str.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects s ON sc.subject_id = s.id
        ${whereClause}
        GROUP BY s.id, s.name
        ORDER BY average_marks DESC
      `, params);

      const overviewData = overview[0];
      const totalRecords = parseInt(overviewData.total_exam_records);
      
      res.json({
        success: true,
        data: {
          overview: {
            total_students: parseInt(overviewData.total_students),
            total_exam_records: totalRecords,
            average_marks: parseFloat(overviewData.average_marks).toFixed(2),
            highest_marks: parseFloat(overviewData.highest_marks),
            lowest_marks: parseFloat(overviewData.lowest_marks),
            performance_distribution: {
              excellent: totalRecords > 0 ? ((parseInt(overviewData.excellent_performance) / totalRecords) * 100).toFixed(1) : 0,
              good: totalRecords > 0 ? ((parseInt(overviewData.good_performance) / totalRecords) * 100).toFixed(1) : 0,
              average: totalRecords > 0 ? ((parseInt(overviewData.average_performance) / totalRecords) * 100).toFixed(1) : 0,
              poor: totalRecords > 0 ? ((parseInt(overviewData.poor_performance) / totalRecords) * 100).toFixed(1) : 0
            }
          },
          performance_by_class: performanceByClass.map(cls => ({
            ...cls,
            average_marks: parseFloat(cls.average_marks).toFixed(2),
            students_count: parseInt(cls.students_count),
            exam_records: parseInt(cls.exam_records),
            excellent_count: parseInt(cls.excellent_count),
            good_count: parseInt(cls.good_count),
            average_count: parseInt(cls.average_count),
            poor_count: parseInt(cls.poor_count)
          })),
          performance_by_subject: performanceBySubject.map(subj => ({
            ...subj,
            average_marks: parseFloat(subj.average_marks).toFixed(2),
            students_count: parseInt(subj.students_count),
            exam_records: parseInt(subj.exam_records),
            highest_marks: parseFloat(subj.highest_marks),
            lowest_marks: parseFloat(subj.lowest_marks),
            excellent_count: parseInt(subj.excellent_count),
            good_count: parseInt(subj.good_count),
            average_count: parseInt(subj.average_count),
            poor_count: parseInt(subj.poor_count)
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching academic performance overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch academic performance overview',
        error: error.message
      });
    }
  }

  // Get grade distribution analysis
  async getGradeDistributionAnalysis(req, res) {
    try {
      const { year, term, class_id, subject_id } = req.query;
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      if (year) {
        whereClause += ' AND r.academic_year = ?';
        params.push(year);
      }
      
      if (term) {
        whereClause += ' AND r.term = ?';
        params.push(term);
      }
      
      if (class_id) {
        whereClause += ' AND r.gradelevel_class_id = ?';
        params.push(class_id);
      }
      
      if (subject_id) {
        whereClause += ' AND r.subject_class_id = ?';
        params.push(subject_id);
      }

      // Get total count for percentage calculation
      const [totalCountResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM results r
        ${whereClause}
      `, params);
      
      const totalCount = totalCountResult[0].total;
      
      // Test query first
      const [testQuery] = await pool.execute(`
        SELECT 
          COALESCE(r.grade, 'Ungraded') as grade,
          COALESCE(r.points, 0) as points,
          COUNT(r.id) as count
        FROM results r
        WHERE r.academic_year = ?
        GROUP BY COALESCE(r.grade, 'Ungraded'), COALESCE(r.points, 0)
        ORDER BY COALESCE(r.points, 0) DESC
      `, [year]);
      console.log('Test query result:', testQuery);
      
      // Get grade distribution using existing grade column in results table
      console.log('Main query WHERE clause:', whereClause);
      console.log('Main query params:', [...params, totalCount]);
      
      const [gradeDistribution] = await pool.execute(`
        SELECT 
          COALESCE(r.grade, 'Ungraded') as grade,
          COALESCE(r.points, 0) as points,
          COUNT(r.id) as count,
          ROUND((COUNT(r.id) * 100.0 / ?), 2) as percentage
        FROM results r
        ${whereClause}
        GROUP BY COALESCE(r.grade, 'Ungraded'), COALESCE(r.points, 0)
        ORDER BY COALESCE(r.points, 0) DESC
      `, [totalCount, ...params]);
      
      console.log('Main query result:', gradeDistribution);
      
      res.json({
        success: true,
        data: {
          grade_distribution: gradeDistribution.map(grade => ({
            ...grade,
            count: parseInt(grade.count),
            percentage: parseFloat(grade.percentage)
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching grade distribution analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grade distribution analysis',
        error: error.message
      });
    }
  }

  // Get student performance trends
  async getStudentPerformanceTrends(req, res) {
    try {
      const { year, class_id, subject_id, period = 'monthly' } = req.query;
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      if (year) {
        whereClause += ' AND r.academic_year = ?';
        params.push(year);
      }
      
      if (class_id) {
        whereClause += ' AND gc.id = ?';
        params.push(class_id);
      }
      
      if (subject_id) {
        whereClause += ' AND s.id = ?';
        params.push(subject_id);
      }

      // For results table, we'll use academic_year and term for trends
      // Since results don't have individual test dates, we'll group by term
      const [trends] = await pool.execute(`
        SELECT 
          CONCAT(r.academic_year, '-', r.term) as period_label,
          COUNT(DISTINCT r.reg_number) as students_count,
          COUNT(r.id) as exam_records,
          COALESCE(AVG(r.total_mark), 0) as average_marks,
          COALESCE(MAX(r.total_mark), 0) as highest_marks,
          COALESCE(MIN(r.total_mark), 0) as lowest_marks,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 4.0 THEN 1 END) as excellent_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 3.0 AND COALESCE(r.points, 0) < 4.0 THEN 1 END) as good_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) >= 2.0 AND COALESCE(r.points, 0) < 3.0 THEN 1 END) as average_count,
          COUNT(CASE WHEN COALESCE(r.points, 0) < 2.0 THEN 1 END) as poor_count
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects s ON sc.subject_id = s.id
        ${whereClause}
        GROUP BY r.academic_year, r.term
        ORDER BY r.academic_year, r.term
      `, params);

      res.json({
        success: true,
        data: {
          trends: trends.map(trend => ({
            ...trend,
            average_marks: parseFloat(trend.average_marks).toFixed(2),
            students_count: parseInt(trend.students_count),
            exam_records: parseInt(trend.exam_records),
            highest_marks: parseFloat(trend.highest_marks),
            lowest_marks: parseFloat(trend.lowest_marks),
            excellent_count: parseInt(trend.excellent_count),
            good_count: parseInt(trend.good_count),
            average_count: parseInt(trend.average_count),
            poor_count: parseInt(trend.poor_count)
          })),
          period_type: 'term'
        }
      });
    } catch (error) {
      console.error('Error fetching student performance trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student performance trends',
        error: error.message
      });
    }
  }

  // Get top and bottom performers
  async getTopBottomPerformers(req, res) {
    try {
      const { year, term, class_id, subject_id, limit = 10, page = 1 } = req.query;
      
      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      if (year) {
        whereClause += ' AND r.academic_year = ?';
        params.push(year);
      }
      
      if (term) {
        whereClause += ' AND r.term = ?';
        params.push(term);
      }
      
      if (class_id) {
        whereClause += ' AND gc.id = ?';
        params.push(class_id);
      }
      
      if (subject_id) {
        whereClause += ' AND s.id = ?';
        params.push(subject_id);
      }

      // Get top performers
      const [topPerformers] = await pool.execute(`
        SELECT 
          r.reg_number,
          st.Name as FirstName,
          st.Surname as LastName,
          gc.name as class_name,
          s.name as stream_name,
          sub.name as subject_name,
          AVG(r.total_mark) as average_marks,
          COUNT(r.id) as exam_count,
          MAX(r.total_mark) as highest_marks
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        ${whereClause}
        GROUP BY r.reg_number, st.Name, st.Surname, gc.name, s.name, sub.name
        HAVING exam_count >= 1
        ORDER BY average_marks DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `, params);

      // Get bottom performers
      const [bottomPerformers] = await pool.execute(`
        SELECT 
          r.reg_number,
          st.Name as FirstName,
          st.Surname as LastName,
          gc.name as class_name,
          s.name as stream_name,
          sub.name as subject_name,
          AVG(r.total_mark) as average_marks,
          COUNT(r.id) as exam_count,
          MAX(r.total_mark) as highest_marks
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN stream s ON gc.stream_id = s.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        ${whereClause}
        GROUP BY r.reg_number, st.Name, st.Surname, gc.name, s.name, sub.name
        HAVING exam_count >= 1
        ORDER BY average_marks ASC
        LIMIT ${limitNum} OFFSET ${offset}
      `, params);

      // Get total count for pagination
      const [totalCountResult] = await pool.execute(`
        SELECT COUNT(DISTINCT r.reg_number) as total
        FROM results r
        JOIN students st ON r.reg_number = st.RegNumber
        LEFT JOIN enrollments_gradelevel_classes e ON e.student_regnumber = st.RegNumber AND e.status = 'active'
        LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
        LEFT JOIN subject_classes sc ON r.subject_class_id = sc.id
        LEFT JOIN subjects sub ON sc.subject_id = sub.id
        ${whereClause}
      `, params);
      
      const totalCount = totalCountResult[0].total;
      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        data: {
          top_performers: topPerformers.map(student => ({
            ...student,
            average_marks: parseFloat(student.average_marks).toFixed(2),
            exam_count: parseInt(student.exam_count),
            highest_marks: parseFloat(student.highest_marks),
            full_name: `${student.FirstName} ${student.LastName}`
          })),
          bottom_performers: bottomPerformers.map(student => ({
            ...student,
            average_marks: parseFloat(student.average_marks).toFixed(2),
            exam_count: parseInt(student.exam_count),
            highest_marks: parseFloat(student.highest_marks),
            full_name: `${student.FirstName} ${student.LastName}`
          }))
        },
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: limitNum,
          has_next_page: pageNum < totalPages,
          has_previous_page: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching top and bottom performers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top and bottom performers',
        error: error.message
      });
    }
  }

}

module.exports = new StudentResultsAnalyticsController();