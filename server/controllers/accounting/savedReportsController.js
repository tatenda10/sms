const { pool } = require('../../config/database');

class SavedReportsController {
  /**
   * Save a financial report
   */
  static async saveReport(req, res) {
    const conn = await pool.getConnection();
    
    try {
      const {
        report_type,
        report_name,
        report_description,
        period_id,
        period_name,
        period_start_date,
        period_end_date,
        report_data,
        report_summary,
        currency_id,
        notes,
        tags
      } = req.body;

      // Validate required fields
      if (!report_type || !report_name || !report_data) {
        return res.status(400).json({
          success: false,
          error: 'Report type, name, and data are required'
        });
      }

      // Validate report type
      const validTypes = ['trial_balance', 'income_statement', 'cash_flow_statement', 'balance_sheet'];
      if (!validTypes.includes(report_type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      await conn.beginTransaction();

      // Check if report name already exists for this type
      const [existing] = await conn.execute(
        'SELECT id FROM saved_financial_reports WHERE report_type = ? AND report_name = ?',
        [report_type, report_name]
      );

      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: `A ${report_type} report with name "${report_name}" already exists. Please use a different name.`
        });
      }

      // Insert the saved report
      const [result] = await conn.execute(
        `INSERT INTO saved_financial_reports (
          report_type, report_name, report_description,
          period_id, period_name, period_start_date, period_end_date,
          report_data, report_summary, currency_id, created_by, notes, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          report_type,
          report_name,
          report_description || null,
          period_id || null,
          period_name || null,
          period_start_date || null,
          period_end_date || null,
          JSON.stringify(report_data),
          report_summary ? JSON.stringify(report_summary) : null,
          currency_id || 1,
          req.user?.id || 1,
          notes || null,
          tags || null
        ]
      );

      await conn.commit();

      res.status(201).json({
        success: true,
        message: 'Report saved successfully',
        data: {
          id: result.insertId,
          report_type,
          report_name
        }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error saving report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save report',
        details: error.message
      });
    } finally {
      conn.release();
    }
  }

  /**
   * Get all saved reports (with optional filtering)
   */
  static async getAllReports(req, res) {
    try {
      console.log('📊 Fetching saved reports - Query params:', req.query);
      
      const { 
        report_type, 
        period_id, 
        search,
        page = 1,
        limit = 50
      } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (report_type) {
        whereClause += ' AND sfr.report_type = ?';
        params.push(report_type);
      }

      if (period_id) {
        whereClause += ' AND sfr.period_id = ?';
        params.push(period_id);
      }

      if (search) {
        whereClause += ' AND (sfr.report_name LIKE ? OR sfr.report_description LIKE ? OR sfr.tags LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM saved_financial_reports sfr ${whereClause}`,
        params
      );

      const total = countResult[0].total;
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      const offset = (parsedPage - 1) * parsedLimit;

      console.log('Query params:', { limit: parsedLimit, offset, params });

      // Get reports (without full report_data for performance) - use string interpolation for LIMIT/OFFSET
      const [reports] = await pool.execute(
        `SELECT 
          sfr.id,
          sfr.report_type,
          sfr.report_name,
          sfr.report_description,
          sfr.period_id,
          sfr.period_name,
          sfr.period_start_date,
          sfr.period_end_date,
          sfr.report_summary,
          sfr.currency_id,
          sfr.saved_at,
          sfr.notes,
          sfr.tags,
          u.username as created_by_username,
          c.code as currency_code,
          c.symbol as currency_symbol
        FROM saved_financial_reports sfr
        LEFT JOIN users u ON sfr.created_by = u.id
        LEFT JOIN currencies c ON sfr.currency_id = c.id
        ${whereClause}
        ORDER BY sfr.saved_at DESC
        LIMIT ${parsedLimit} OFFSET ${offset}`,
        params
      );

      // Parse JSON fields (MySQL returns JSON columns as objects, but check if string first)
      const formattedReports = reports.map(report => ({
        ...report,
        report_summary: typeof report.report_summary === 'string' 
          ? JSON.parse(report.report_summary) 
          : report.report_summary
      }));

      console.log(`✅ Found ${formattedReports.length} saved reports (Total: ${total})`);

      res.json({
        success: true,
        data: {
          reports: formattedReports,
          pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            pages: Math.ceil(total / parsedLimit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching saved reports:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch saved reports',
        details: error.message
      });
    }
  }

  /**
   * Get a specific saved report by ID
   */
  static async getReportById(req, res) {
    try {
      const { id } = req.params;

      const [reports] = await pool.execute(
        `SELECT 
          sfr.*,
          u.username as created_by_username,
          c.code as currency_code,
          c.symbol as currency_symbol
        FROM saved_financial_reports sfr
        LEFT JOIN users u ON sfr.created_by = u.id
        LEFT JOIN currencies c ON sfr.currency_id = c.id
        WHERE sfr.id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      const report = reports[0];

      // Parse JSON fields (MySQL returns JSON columns as objects, but check if string first)
      const formattedReport = {
        ...report,
        report_data: typeof report.report_data === 'string' 
          ? JSON.parse(report.report_data) 
          : report.report_data,
        report_summary: report.report_summary 
          ? (typeof report.report_summary === 'string' 
              ? JSON.parse(report.report_summary) 
              : report.report_summary)
          : null
      };

      res.json({
        success: true,
        data: formattedReport
      });

    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report',
        details: error.message
      });
    }
  }

  /**
   * Delete a saved report
   */
  static async deleteReport(req, res) {
    try {
      const { id } = req.params;

      const [result] = await pool.execute(
        'DELETE FROM saved_financial_reports WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete report',
        details: error.message
      });
    }
  }

  /**
   * Get report types summary (count by type)
   */
  static async getReportsSummary(req, res) {
    try {
      const [summary] = await pool.execute(`
        SELECT 
          report_type,
          COUNT(*) as count,
          MAX(saved_at) as latest_saved
        FROM saved_financial_reports
        GROUP BY report_type
        ORDER BY report_type
      `);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error fetching reports summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reports summary',
        details: error.message
      });
    }
  }
}

module.exports = SavedReportsController;

