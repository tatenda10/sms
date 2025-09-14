const AuditLogger = require('../../utils/audit');

class AuditController {
  static async getAuditLogs(req, res) {
    try {
      const {
        userId,
        action,
        tableName,
        startDate,
        endDate,
        limit = 100
      } = req.query;

      const filters = {
        userId: userId ? parseInt(userId) : null,
        action,
        tableName,
        startDate,
        endDate,
        limit: parseInt(limit)
      };

      const logs = await AuditLogger.getAuditLogs(filters);
      
      res.json({
        message: 'Audit logs retrieved successfully',
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAuditLogById(req, res) {
    try {
      const { id } = req.params;
      const { pool } = require('../../config/database');
      
      const connection = await pool.getConnection();
      const [logs] = await connection.execute(`
        SELECT 
          al.*,
          u.username,
          r.name as role_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE al.id = ?
      `, [id]);

      connection.release();

      if (logs.length === 0) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      res.json({
        message: 'Audit log retrieved successfully',
        log: logs[0]
      });
    } catch (error) {
      console.error('Get audit log by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAuditStats(req, res) {
    try {
      const { pool } = require('../../config/database');
      const connection = await pool.getConnection();

      // Get total count
      const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
      
      // Get count by action
      const [actionStats] = await connection.execute(`
        SELECT action, COUNT(*) as count 
        FROM audit_logs 
        GROUP BY action 
        ORDER BY count DESC
      `);

      // Get count by user
      const [userStats] = await connection.execute(`
        SELECT u.username, COUNT(al.id) as count 
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        GROUP BY al.user_id, u.username
        ORDER BY count DESC
        LIMIT 10
      `);

      // Get recent activity (last 7 days)
      const [recentActivity] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      connection.release();

      res.json({
        message: 'Audit statistics retrieved successfully',
        stats: {
          totalLogs: totalCount[0].count,
          actionStats,
          userStats,
          recentActivity: recentActivity[0].count
        }
      });
    } catch (error) {
      console.error('Get audit stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async exportAuditLogs(req, res) {
    try {
      const {
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      const filters = {
        startDate,
        endDate
      };

      const logs = await AuditLogger.getAuditLogs(filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = 'ID,User,Role,Action,Table,Record ID,IP Address,User Agent,Created At\n';
        const csvData = logs.map(log => 
          `${log.id},"${log.username || 'N/A'}","${log.role_name || 'N/A'}","${log.action}","${log.table_name || 'N/A'}","${log.record_id || 'N/A'}","${log.ip_address || 'N/A'}","${log.user_agent || 'N/A'}","${log.created_at}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        res.send(csvHeaders + csvData);
      } else {
        // Return JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
        res.json(logs);
      }
    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuditController;
