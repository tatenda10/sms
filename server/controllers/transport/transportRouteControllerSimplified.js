const { pool } = require('../../config/database');

class TransportRouteController {
  // Get all routes with basic info
  static async getAllRoutes(req, res) {
    try {
      const { page = 1, limit = 10, search = '', active = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (route_name LIKE ? OR route_code LIKE ? OR pickup_point LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (active !== '') {
        whereClause += ' AND is_active = ?';
        params.push(active === 'true');
      }
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM transport_routes ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // Get routes with pagination
      const queryParams = params.length > 0 ? [...params] : [];
      console.log('🔍 Query params:', queryParams);
      console.log('🔍 Where clause:', whereClause);
      console.log('🔍 Limit:', limit, 'Offset:', offset);
      
      const [routes] = await pool.execute(
        `SELECT * FROM transport_routes 
         ${whereClause}
         ORDER BY route_name
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        queryParams
      );
      
      res.json({
        success: true,
        data: routes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching transport routes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transport routes',
        error: error.message
      });
    }
  }
  
  // Get route by ID
  static async getRouteById(req, res) {
    try {
      const { id } = req.params;
      
      const [routes] = await pool.execute(
        'SELECT * FROM transport_routes WHERE id = ?',
        [id]
      );
      
      if (routes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transport route not found'
        });
      }
      
      res.json({
        success: true,
        data: routes[0]
      });
      
    } catch (error) {
      console.error('Error fetching transport route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transport route',
        error: error.message
      });
    }
  }
  
  // Create new route
  static async createRoute(req, res) {
    try {
      const {
        route_name,
        route_code,
        pickup_point,
        dropoff_point,
        weekly_fee,
        currency = 'USD'
      } = req.body;
      
      // Validate required fields
      if (!route_name || !route_code || !pickup_point || !dropoff_point || !weekly_fee) {
        return res.status(400).json({
          success: false,
          message: 'Route name, code, pickup point, dropoff point, and weekly fee are required'
        });
      }
      
      // Check if route code already exists
      const [existingRoutes] = await pool.execute(
        'SELECT id FROM transport_routes WHERE route_code = ?',
        [route_code]
      );
      
      if (existingRoutes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Route code already exists'
        });
      }
      
      // Create route
      const [result] = await pool.execute(
        `INSERT INTO transport_routes (
          route_name, route_code, pickup_point, dropoff_point, weekly_fee, currency
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [route_name, route_code, pickup_point, dropoff_point, weekly_fee, currency]
      );
      
      res.status(201).json({
        success: true,
        message: 'Transport route created successfully',
        data: {
          id: result.insertId,
          route_name,
          route_code,
          pickup_point,
          dropoff_point,
          weekly_fee,
          currency
        }
      });
      
    } catch (error) {
      console.error('Error creating transport route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transport route',
        error: error.message
      });
    }
  }
  
  // Update route
  static async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const {
        route_name,
        route_code,
        pickup_point,
        dropoff_point,
        weekly_fee,
        currency,
        is_active
      } = req.body;
      
      // Check if route exists
      const [existingRoutes] = await pool.execute(
        'SELECT id FROM transport_routes WHERE id = ?',
        [id]
      );
      
      if (existingRoutes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transport route not found'
        });
      }
      
      // Check if route code already exists (excluding current route)
      if (route_code) {
        const [duplicateRoutes] = await pool.execute(
          'SELECT id FROM transport_routes WHERE route_code = ? AND id != ?',
          [route_code, id]
        );
        
        if (duplicateRoutes.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Route code already exists'
          });
        }
      }
      
      // Update route
      await pool.execute(
        `UPDATE transport_routes SET 
          route_name = COALESCE(?, route_name),
          route_code = COALESCE(?, route_code),
          pickup_point = COALESCE(?, pickup_point),
          dropoff_point = COALESCE(?, dropoff_point),
          weekly_fee = COALESCE(?, weekly_fee),
          currency = COALESCE(?, currency),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [route_name, route_code, pickup_point, dropoff_point, weekly_fee, currency, is_active, id]
      );
      
      res.json({
        success: true,
        message: 'Transport route updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating transport route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transport route',
        error: error.message
      });
    }
  }
  
  // Delete route
  static async deleteRoute(req, res) {
    try {
      const { id } = req.params;
      
      // Check if route has active student registrations
      const [registrations] = await pool.execute(
        'SELECT COUNT(*) as count FROM student_transport_registrations WHERE route_id = ? AND is_active = TRUE',
        [id]
      );
      
      if (registrations[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete route with active student registrations'
        });
      }
      
      // Delete route
      await pool.execute('DELETE FROM transport_routes WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'Transport route deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting transport route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transport route',
        error: error.message
      });
    }
  }
  
  // Get route statistics
  static async getRouteStats(req, res) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
           tr.id,
           tr.route_name,
           tr.route_code,
           tr.weekly_fee,
           tr.currency,
           COUNT(DISTINCT str.id) as total_students,
           COUNT(DISTINCT CASE WHEN str.is_active = TRUE THEN str.id END) as active_students,
           COUNT(DISTINCT CASE WHEN tf.status = 'Paid' THEN tf.id END) as paid_weeks,
           COUNT(DISTINCT CASE WHEN tf.status = 'Pending' THEN tf.id END) as pending_weeks,
           COUNT(DISTINCT CASE WHEN tf.status = 'Overdue' THEN tf.id END) as overdue_weeks
         FROM transport_routes tr
         LEFT JOIN student_transport_registrations str ON tr.id = str.route_id
         LEFT JOIN transport_fees tf ON str.id = tf.student_registration_id
         WHERE tr.is_active = TRUE
         GROUP BY tr.id
         ORDER BY tr.route_name`
      );
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Error fetching route statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch route statistics',
        error: error.message
      });
    }
  }
}

module.exports = TransportRouteController;
