const { pool } = require('../../config/database');

class PeriodController {
  // Get all periods with optional filtering
  static async getAllPeriods(req, res) {
    try {
      const { status, year, type } = req.query;
      let query = `
        SELECT 
          ap.*,
          u.username as closed_by_user
        FROM accounting_periods ap
        LEFT JOIN users u ON ap.closed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ` AND ap.status = ?`;
        params.push(status);
      }

      if (year) {
        query += ` AND YEAR(ap.start_date) = ?`;
        params.push(year);
      }

      if (type) {
        query += ` AND ap.period_type = ?`;
        params.push(type);
      }

      query += ` ORDER BY ap.start_date DESC`;

      const [periods] = await pool.execute(query, params);
      res.json(periods);
    } catch (error) {
      console.error('Error fetching periods:', error);
      res.status(500).json({ error: 'Failed to fetch periods' });
    }
  }

  // Get a single period by ID
  static async getPeriodById(req, res) {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          ap.*,
          u.username as closed_by_user
        FROM accounting_periods ap
        LEFT JOIN users u ON ap.closed_by = u.id
        WHERE ap.id = ?
      `;
      
      const [periods] = await pool.execute(query, [id]);
      
      if (periods.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }

      res.json(periods[0]);
    } catch (error) {
      console.error('Error fetching period:', error);
      res.status(500).json({ error: 'Failed to fetch period' });
    }
  }

  // Create a new period
  static async createPeriod(req, res) {
    try {
      const { period_name, period_type, start_date, end_date } = req.body;

      // Validate required fields
      if (!period_name || !period_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate period type
      const validTypes = ['monthly', 'quarterly', 'yearly'];
      if (!validTypes.includes(period_type)) {
        return res.status(400).json({ error: 'Invalid period type' });
      }

      // Check for overlapping periods
      const overlapQuery = `
        SELECT id FROM accounting_periods 
        WHERE (start_date <= ? AND end_date >= ?) 
        OR (start_date <= ? AND end_date >= ?)
        OR (start_date >= ? AND end_date <= ?)
      `;
      const [overlaps] = await pool.execute(overlapQuery, [end_date, start_date, end_date, start_date, start_date, end_date]);
      
      if (overlaps.length > 0) {
        return res.status(400).json({ error: 'Period overlaps with existing period' });
      }

      const query = `
        INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status)
        VALUES (?, ?, ?, ?, 'open')
      `;
      
      const [result] = await pool.execute(query, [period_name, period_type, start_date, end_date]);
      
      res.status(201).json({
        id: result.insertId,
        period_name,
        period_type,
        start_date,
        end_date,
        status: 'open'
      });
    } catch (error) {
      console.error('Error creating period:', error);
      res.status(500).json({ error: 'Failed to create period' });
    }
  }

  // Update period status
  static async updatePeriodStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Validate status
      const validStatuses = ['open', 'in_progress', 'closed', 'reopened'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      let query, params;

      if (status === 'closed') {
        query = `
          UPDATE accounting_periods 
          SET status = ?, closed_date = NOW(), closed_by = ?
          WHERE id = ?
        `;
        params = [status, userId, id];
      } else {
        query = `
          UPDATE accounting_periods 
          SET status = ?, closed_date = NULL, closed_by = NULL
          WHERE id = ?
        `;
        params = [status, id];
      }

      const [result] = await pool.execute(query, params);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }

      res.json({ message: 'Period status updated successfully' });
    } catch (error) {
      console.error('Error updating period status:', error);
      res.status(500).json({ error: 'Failed to update period status' });
    }
  }

  // Get current open period
  static async getCurrentPeriod(req, res) {
    try {
      const query = `
        SELECT 
          ap.*,
          u.username as closed_by_user
        FROM accounting_periods ap
        LEFT JOIN users u ON ap.closed_by = u.id
        WHERE ap.status = 'open' 
        AND CURDATE() BETWEEN ap.start_date AND ap.end_date
        ORDER BY ap.start_date DESC
        LIMIT 1
      `;
      
      const [periods] = await pool.execute(query);
      
      if (periods.length === 0) {
        return res.status(404).json({ error: 'No current open period found' });
      }

      res.json(periods[0]);
    } catch (error) {
      console.error('Error fetching current period:', error);
      res.status(500).json({ error: 'Failed to fetch current period' });
    }
  }

  // Get periods by year
  static async getPeriodsByYear(req, res) {
    try {
      const { year } = req.params;
      const query = `
        SELECT 
          ap.*,
          u.username as closed_by_user
        FROM accounting_periods ap
        LEFT JOIN users u ON ap.closed_by = u.id
        WHERE YEAR(ap.start_date) = ?
        ORDER BY ap.start_date ASC
      `;
      
      const [periods] = await pool.execute(query, [year]);
      res.json(periods);
    } catch (error) {
      console.error('Error fetching periods by year:', error);
      res.status(500).json({ error: 'Failed to fetch periods by year' });
    }
  }

  // Delete period (only if not closed)
  static async deletePeriod(req, res) {
    try {
      const { id } = req.params;

      // Check if period exists and is not closed
      const checkQuery = `SELECT status FROM accounting_periods WHERE id = ?`;
      const [periods] = await pool.execute(checkQuery, [id]);
      
      if (periods.length === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }

      if (periods[0].status === 'closed') {
        return res.status(400).json({ error: 'Cannot delete a closed period' });
      }

      const deleteQuery = `DELETE FROM accounting_periods WHERE id = ?`;
      const [result] = await pool.execute(deleteQuery, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Period not found' });
      }

      res.json({ message: 'Period deleted successfully' });
    } catch (error) {
      console.error('Error deleting period:', error);
      res.status(500).json({ error: 'Failed to delete period' });
    }
  }

  // Generate periods for a year (utility method)
  static async generateYearlyPeriods(req, res) {
    try {
      const { year, period_type = 'monthly' } = req.body;

      if (!year) {
        return res.status(400).json({ error: 'Year is required' });
      }

      const periods = [];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      if (period_type === 'monthly') {
        for (let month = 0; month < 12; month++) {
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0); // Last day of month
          
          periods.push({
            period_name: `${monthNames[month]} ${year}`,
            period_type: 'monthly',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          });
        }
      } else if (period_type === 'quarterly') {
        const quarters = [
          { name: 'Q1', months: [0, 1, 2] },
          { name: 'Q2', months: [3, 4, 5] },
          { name: 'Q3', months: [6, 7, 8] },
          { name: 'Q4', months: [9, 10, 11] }
        ];

        quarters.forEach(quarter => {
          const startDate = new Date(year, quarter.months[0], 1);
          const endDate = new Date(year, quarter.months[2] + 1, 0);
          
          periods.push({
            period_name: `${quarter.name} ${year}`,
            period_type: 'quarterly',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          });
        });
      }

      // Insert periods
      const insertQuery = `
        INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status)
        VALUES (?, ?, ?, ?, 'open')
      `;

      for (const period of periods) {
        await pool.execute(insertQuery, [
          period.period_name,
          period.period_type,
          period.start_date,
          period.end_date
        ]);
      }

      res.status(201).json({ 
        message: `Generated ${periods.length} periods for ${year}`,
        periods 
      });
    } catch (error) {
      console.error('Error generating yearly periods:', error);
      res.status(500).json({ error: 'Failed to generate yearly periods' });
    }
  }

  // Auto-generate periods for current year if they don't exist
  // This is called on server startup
  static async autoGenerateCurrentYearPeriods() {
    try {
      const currentYear = new Date().getFullYear();
      
      // Check if periods exist for current year
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM accounting_periods 
        WHERE YEAR(start_date) = ?
      `;
      const [result] = await pool.execute(checkQuery, [currentYear]);
      
      if (result[0].count === 0) {
        console.log(`📅 No accounting periods found for ${currentYear}. Auto-generating...`);
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const insertQuery = `
          INSERT INTO accounting_periods (period_name, period_type, start_date, end_date, status)
          VALUES (?, ?, ?, ?, 'open')
        `;

        let created = 0;
        for (let month = 0; month < 12; month++) {
          const startDate = new Date(currentYear, month, 1);
          const endDate = new Date(currentYear, month + 1, 0);
          
          await pool.execute(insertQuery, [
            `${monthNames[month]} ${currentYear}`,
            'monthly',
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]);
          created++;
        }
        
        console.log(`✅ Auto-generated ${created} accounting periods for ${currentYear}`);
      } else {
        console.log(`✓ Accounting periods for ${currentYear} already exist (${result[0].count} periods)`);
      }
    } catch (error) {
      console.error('❌ Error auto-generating periods:', error);
      // Don't throw - we don't want to crash the server on startup
    }
  }
}

module.exports = PeriodController;
