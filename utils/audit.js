const { pool } = require('../config/database');

class AuditLogger {
  static async log({
    userId = null,
    action,
    tableName = null,
    recordId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const connection = await pool.getConnection();
      
      const query = `
        INSERT INTO audit_logs 
        (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(query, [
        userId,
        action,
        tableName,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      ]);
      
      connection.release();
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  static async getAuditLogs(filters = {}) {
    try {
      const connection = await pool.getConnection();
      
      let query = `
        SELECT 
          al.*,
          u.username,
          r.name as role_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.userId) {
        query += ' AND al.user_id = ?';
        params.push(filters.userId);
      }
      
      if (filters.action) {
        query += ' AND al.action = ?';
        params.push(filters.action);
      }
      
      if (filters.tableName) {
        query += ' AND al.table_name = ?';
        params.push(filters.tableName);
      }
      
      if (filters.startDate) {
        query += ' AND al.created_at >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        query += ' AND al.created_at <= ?';
        params.push(filters.endDate);
      }
      
      query += ' ORDER BY al.created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const [rows] = await connection.execute(query, params);
      connection.release();
      
      return rows;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditLogger;
