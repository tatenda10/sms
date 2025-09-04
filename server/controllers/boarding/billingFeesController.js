const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class BillingFeesController {
  // Create new billing fee structure
  static async createBillingFee(req, res) {
    const conn = await pool.getConnection();
    try {
      const { 
        hostel_id, 
        term, 
        academic_year, 
        amount, 
        currency_id
      } = req.body;

      // Validate required fields
      if (!hostel_id || !term || !academic_year || !amount || !currency_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostel ID, term, academic year, amount, and currency ID are required' 
        });
      }

      await conn.beginTransaction();

      // Check if hostel exists
      const [hostel] = await conn.execute(
        'SELECT id FROM hostels WHERE id = ? AND is_active = TRUE',
        [hostel_id]
      );

      if (hostel.length === 0) {
        return res.status(404).json({ success: false, message: 'Hostel not found' });
      }

      // Check if currency exists
      const [currency] = await conn.execute(
        'SELECT id FROM currencies WHERE id = ?',
        [currency_id]
      );

      if (currency.length === 0) {
        return res.status(404).json({ success: false, message: 'Currency not found' });
      }

      // Check if fee structure already exists for this combination
      const [existingFee] = await conn.execute(
        'SELECT id FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND is_active = TRUE',
        [hostel_id, term, academic_year]
      );

      if (existingFee.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Fee structure already exists for this hostel, term, and academic year' 
        });
      }

      // Create billing fee
      const [result] = await conn.execute(
        `INSERT INTO boarding_fees 
         (hostel_id, term, academic_year, amount, currency_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [hostel_id, term, academic_year, amount, currency_id, req.user.id]
      );

      const feeId = result.insertId;

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_FEE_CREATED',
        table: 'boarding_fees',
        record_id: feeId,
        user_id: req.user.id,
        details: { 
          hostel_id, 
          term, 
          academic_year, 
          amount, 
          currency_id 
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.status(201).json({
        success: true,
        message: 'Billing fee structure created successfully',
        data: { id: feeId }
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error creating billing fee:', error);
      res.status(500).json({ success: false, message: 'Failed to create billing fee structure' });
    } finally {
      conn.release();
    }
  }

  // Get all billing fees for a hostel
  static async getHostelBillingFees(req, res) {
    try {
      const { hostelId } = req.params;

      const [fees] = await pool.execute(`
        SELECT 
          bf.*,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM boarding_fees bf
        LEFT JOIN currencies c ON bf.currency_id = c.id
        WHERE bf.hostel_id = ? AND bf.is_active = TRUE
        ORDER BY bf.term, bf.academic_year
      `, [hostelId]);

      res.json({
        success: true,
        data: fees
      });

    } catch (error) {
      console.error('Error fetching hostel billing fees:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch billing fees' });
    }
  }

  // Get all billing fees
  static async getAllBillingFees(req, res) {
    try {
      const [fees] = await pool.execute(`
        SELECT 
          bf.*,
          h.name as hostel_name,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM boarding_fees bf
        LEFT JOIN hostels h ON bf.hostel_id = h.id
        LEFT JOIN currencies c ON bf.currency_id = c.id
        WHERE bf.is_active = TRUE
        ORDER BY h.name, bf.term, bf.academic_year
      `);

      res.json({
        success: true,
        data: fees
      });

    } catch (error) {
      console.error('Error fetching billing fees:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch billing fees' });
    }
  }

  // Get billing fee by ID
  static async getBillingFeeById(req, res) {
    try {
      const { id } = req.params;

      const [fees] = await pool.execute(`
        SELECT 
          bf.*,
          h.name as hostel_name,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM boarding_fees bf
        LEFT JOIN hostels h ON bf.hostel_id = h.id
        LEFT JOIN currencies c ON bf.currency_id = c.id
        WHERE bf.id = ? AND bf.is_active = TRUE
      `, [id]);

      if (fees.length === 0) {
        return res.status(404).json({ success: false, message: 'Billing fee not found' });
      }

      res.json({
        success: true,
        data: fees[0]
      });

    } catch (error) {
      console.error('Error fetching billing fee:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch billing fee' });
    }
  }

  // Update billing fee
  static async updateBillingFee(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { 
        term, 
        academic_year, 
        amount, 
        currency_id
      } = req.body;

      // Validate required fields
      if (!term || !academic_year || !amount || !currency_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Term, academic year, amount, and currency ID are required' 
        });
      }

      await conn.beginTransaction();

      // Check if billing fee exists
      const [existingFee] = await conn.execute(
        'SELECT hostel_id FROM boarding_fees WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existingFee.length === 0) {
        return res.status(404).json({ success: false, message: 'Billing fee not found' });
      }

      const hostelId = existingFee[0].hostel_id;

      // Check if currency exists
      const [currency] = await conn.execute(
        'SELECT id FROM currencies WHERE id = ?',
        [currency_id]
      );

      if (currency.length === 0) {
        return res.status(404).json({ success: false, message: 'Currency not found' });
      }

      // Check if fee structure already exists for this combination (excluding current record)
      const [duplicateFee] = await conn.execute(
        'SELECT id FROM boarding_fees WHERE hostel_id = ? AND term = ? AND academic_year = ? AND id != ? AND is_active = TRUE',
        [hostelId, term, academic_year, id]
      );

      if (duplicateFee.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Fee structure already exists for this hostel, term, and academic year' 
        });
      }

      // Update billing fee
      await conn.execute(
        `UPDATE boarding_fees 
         SET term = ?, academic_year = ?, amount = ?, currency_id = ?, updated_by = ?
         WHERE id = ?`,
        [term, academic_year, amount, currency_id, req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_FEE_UPDATED',
        table: 'boarding_fees',
        record_id: id,
        user_id: req.user.id,
        details: { 
          hostel_id: hostelId,
          term, 
          academic_year, 
          amount, 
          currency_id 
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({
        success: true,
        message: 'Billing fee structure updated successfully'
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error updating billing fee:', error);
      res.status(500).json({ success: false, message: 'Failed to update billing fee structure' });
    } finally {
      conn.release();
    }
  }

  // Delete billing fee (soft delete)
  static async deleteBillingFee(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      await conn.beginTransaction();

      // Check if billing fee exists
      const [existingFee] = await conn.execute(
        'SELECT hostel_id FROM boarding_fees WHERE id = ? AND is_active = TRUE',
        [id]
      );

      if (existingFee.length === 0) {
        return res.status(404).json({ success: false, message: 'Billing fee not found' });
      }

      const hostelId = existingFee[0].hostel_id;

      // Soft delete billing fee
      await conn.execute(
        'UPDATE boarding_fees SET is_active = FALSE, updated_by = ? WHERE id = ?',
        [req.user.id, id]
      );

      // Log audit event
      await AuditLogger.log({
        action: 'BOARDING_FEE_DELETED',
        table: 'boarding_fees',
        record_id: id,
        user_id: req.user.id,
        details: { hostel_id: hostelId },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();

      res.json({
        success: true,
        message: 'Billing fee structure deleted successfully'
      });

    } catch (error) {
      await conn.rollback();
      console.error('Error deleting billing fee:', error);
      res.status(500).json({ success: false, message: 'Failed to delete billing fee structure' });
    } finally {
      conn.release();
    }
  }
}

module.exports = BillingFeesController;
