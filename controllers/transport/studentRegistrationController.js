const { pool } = require('../../config/database');
const StudentTransactionController = require('../students/studentTransactionController');

class StudentRegistrationController {
  // Get all student registrations
  static async getAllRegistrations(req, res) {
    try {
      const { page = 1, limit = 10, search = '', route_id = '', status = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (CONCAT(s.Name, \' \', s.Surname) LIKE ? OR s.RegNumber LIKE ? OR tr.route_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (route_id) {
        whereClause += ' AND str.route_id = ?';
        params.push(route_id);
      }
      
      if (status !== '') {
        whereClause += ' AND str.is_active = ?';
        params.push(status === 'active');
      }
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM student_transport_registrations str
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // Get registrations with pagination - use string interpolation for LIMIT/OFFSET
      const queryParams = params.length > 0 ? [...params] : [];
      const [registrations] = await pool.execute(
        `SELECT 
           str.*,
           CONCAT(s.Name, ' ', s.Surname) as student_name,
           s.RegNumber as student_number,
           s.Gender,
           s.Active,
           tr.route_name,
           tr.route_code,
           tr.weekly_fee as route_weekly_fee,
           tr.currency as route_currency
         FROM student_transport_registrations str
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         ${whereClause}
         ORDER BY s.Name, s.Surname, str.start_date DESC
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        queryParams
      );
      
      res.json({
        success: true,
        data: registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching student registrations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student registrations',
        error: error.message
      });
    }
  }
  
  // Get registration by ID
  static async getRegistrationById(req, res) {
    try {
      const { id } = req.params;
      
      const [registrations] = await pool.execute(
        `SELECT 
           str.*,
           CONCAT(s.Name, ' ', s.Surname) as student_name,
           s.RegNumber as student_number,
           s.Gender,
           s.Active,
           tr.route_name,
           tr.route_code,
           tr.weekly_fee as route_weekly_fee,
           tr.currency as route_currency
         FROM student_transport_registrations str
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         WHERE str.id = ?`,
        [id]
      );
      
      if (registrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student registration not found'
        });
      }
      
      res.json({
        success: true,
        data: registrations[0]
      });
      
    } catch (error) {
      console.error('Error fetching student registration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student registration',
        error: error.message
      });
    }
  }
  
  // Register student for transport
  static async registerStudent(req, res) {
    try {
      const {
        student_reg_number,
        route_id,
        pickup_point,
        dropoff_point,
        start_date,
        end_date,
        weekly_fee,
        currency = 'USD'
      } = req.body;
      
      // Validate required fields
      if (!student_reg_number || !route_id || !start_date || !weekly_fee) {
        return res.status(400).json({
          success: false,
          message: 'Student registration number, route ID, start date, and weekly fee are required'
        });
      }
      
      // Check if student is already registered for this route
      const [existingRegistrations] = await pool.execute(
        `SELECT id FROM student_transport_registrations 
         WHERE student_reg_number = ? AND route_id = ? AND is_active = TRUE`,
        [student_reg_number, route_id]
      );
      
      if (existingRegistrations.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Student is already registered for this route'
        });
      }
      
      // Check if route exists and is active
      const [routes] = await pool.execute(
        'SELECT id, weekly_fee, currency FROM transport_routes WHERE id = ? AND is_active = TRUE',
        [route_id]
      );
      
      if (routes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Route not found or inactive'
        });
      }
      
      const route = routes[0];
      
      // Use route's weekly fee if not specified
      const finalWeeklyFee = weekly_fee || route.weekly_fee;
      const finalCurrency = currency || route.currency;
      
      // Log all values before database insert
      console.log('🔍 Backend received values:');
      console.log('  student_reg_number:', student_reg_number);
      console.log('  route_id:', route_id);
      console.log('  pickup_point:', pickup_point);
      console.log('  dropoff_point:', dropoff_point);
      console.log('  start_date:', start_date);
      console.log('  end_date:', end_date);
      console.log('  weekly_fee:', weekly_fee);
      console.log('  currency:', currency);
      console.log('  route.weekly_fee:', route.weekly_fee);
      console.log('  route.currency:', route.currency);
      console.log('  finalWeeklyFee:', finalWeeklyFee);
      console.log('  finalCurrency:', finalCurrency);
      
      // Prepare parameters array - convert empty strings to null
      const insertParams = [
        student_reg_number, 
        route_id, 
        pickup_point || route.pickup_point || null, 
        dropoff_point || route.dropoff_point || null, 
        start_date, 
        end_date || null, 
        finalWeeklyFee, 
        finalCurrency
      ];
      
      console.log('🔍 Database insert parameters:', insertParams);
      console.log('🔍 Parameter types:', insertParams.map(p => typeof p));
      
      // Start transaction for registration and student transaction
      const conn = await pool.getConnection();
      await conn.beginTransaction();
      
      try {
        // Create registration
        const [result] = await conn.execute(
          `INSERT INTO student_transport_registrations (
            student_reg_number, route_id, pickup_point, dropoff_point, 
            registration_date, start_date, end_date, weekly_fee, currency
          ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
          insertParams
        );
        
        const registrationId = result.insertId;
        
        // Create DEBIT transaction for transport registration (student owes money)
        await StudentTransactionController.createTransactionHelper(
          student_reg_number,
          'DEBIT',
          parseFloat(finalWeeklyFee),
          `TRANSPORT REGISTRATION - Route: ${route.route_name || 'Unknown Route'}`,
          {
            created_by: req.user.id
          }
        );
        
        await conn.commit();
        
        res.status(201).json({
          success: true,
          message: 'Student registered for transport successfully',
          data: {
            id: registrationId,
            student_reg_number,
            route_id,
            weekly_fee: finalWeeklyFee,
            currency: finalCurrency
          }
        });
        
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
      
    } catch (error) {
      console.error('Error registering student for transport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register student for transport',
        error: error.message
      });
    }
  }
  
  // Update registration
  static async updateRegistration(req, res) {
    try {
      const { id } = req.params;
      const {
        pickup_point,
        dropoff_point,
        end_date,
        weekly_fee,
        currency,
        is_active
      } = req.body;
      
      // Check if registration exists
      const [existingRegistrations] = await pool.execute(
        'SELECT id FROM student_transport_registrations WHERE id = ?',
        [id]
      );
      
      if (existingRegistrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student registration not found'
        });
      }
      
      // Update registration
      await pool.execute(
        `UPDATE student_transport_registrations SET 
          pickup_point = COALESCE(?, pickup_point),
          dropoff_point = COALESCE(?, dropoff_point),
          end_date = COALESCE(?, end_date),
          weekly_fee = COALESCE(?, weekly_fee),
          currency = COALESCE(?, currency),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [pickup_point, dropoff_point, end_date, weekly_fee, currency, is_active, id]
      );
      
      res.json({
        success: true,
        message: 'Student registration updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating student registration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student registration',
        error: error.message
      });
    }
  }
  
  // Delete registration completely
  static async deleteRegistration(req, res) {
    try {
      const { id } = req.params;
      
      // Check if registration exists and get details
      const [existingRegistrations] = await pool.execute(
        `SELECT str.*, s.Name, s.Surname, tr.route_name 
         FROM student_transport_registrations str
         JOIN students s ON str.student_reg_number = s.RegNumber
         JOIN transport_routes tr ON str.route_id = tr.id
         WHERE str.id = ?`,
        [id]
      );
      
      if (existingRegistrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student registration not found'
        });
      }
      
      const registration = existingRegistrations[0];
      
      // Start transaction for deletion and student transaction reversal
      const conn = await pool.getConnection();
      await conn.beginTransaction();
      
      try {
        // Create CREDIT transaction to reverse the original DEBIT (student no longer owes money)
        await StudentTransactionController.createTransactionHelper(
          registration.student_reg_number,
          'CREDIT',
          parseFloat(registration.weekly_fee),
          `TRANSPORT REGISTRATION DELETED - Route: ${registration.route_name || 'Unknown Route'}`,
          {
            created_by: req.user.id
          }
        );
        
        // Delete the registration completely
        await conn.execute(
          'DELETE FROM student_transport_registrations WHERE id = ?',
          [id]
        );
        
        await conn.commit();
        
        res.json({
          success: true,
          message: 'Student registration deleted successfully'
        });
        
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
      
    } catch (error) {
      console.error('Error deleting student registration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student registration',
        error: error.message
      });
    }
  }

  // Deactivate registration (kept for backward compatibility)
  static async deactivateRegistration(req, res) {
    try {
      const { id } = req.params;
      
      // Check if registration exists
      const [existingRegistrations] = await pool.execute(
        'SELECT id FROM student_transport_registrations WHERE id = ?',
        [id]
      );
      
      if (existingRegistrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student registration not found'
        });
      }
      
      // Deactivate registration
      await pool.execute(
        'UPDATE student_transport_registrations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Student registration deactivated successfully'
      });
      
    } catch (error) {
      console.error('Error deactivating student registration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate student registration',
        error: error.message
      });
    }
  }
  
  // Get registration summary
  static async getRegistrationSummary(req, res) {
    try {
      const [summary] = await pool.execute(
        `SELECT 
           COUNT(DISTINCT str.id) as total_registrations,
           COUNT(DISTINCT CASE WHEN str.is_active = TRUE THEN str.id END) as active_registrations,
           COUNT(DISTINCT str.student_reg_number) as unique_students,
           COUNT(DISTINCT str.route_id) as routes_used,
           SUM(CASE WHEN str.is_active = TRUE THEN str.weekly_fee ELSE 0 END) as total_weekly_fees
         FROM student_transport_registrations str`
      );
      
      res.json({
        success: true,
        data: summary[0]
      });
      
    } catch (error) {
      console.error('Error fetching registration summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registration summary',
        error: error.message
      });
    }
  }
}

module.exports = StudentRegistrationController;
