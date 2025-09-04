const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class BankAccountController {
  // ==========================================
  // BANK ACCOUNT MANAGEMENT
  // ==========================================

  // Get all bank accounts for an employee
  static async getEmployeeBankAccounts(req, res) {
    try {
      const { employeeId } = req.params;
      
      const connection = await pool.getConnection();

      // Check if employee exists
      const [employee] = await connection.execute(
        'SELECT id, full_name FROM employees WHERE id = ? AND is_active = TRUE',
        [employeeId]
      );

      if (employee.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      // Get bank accounts
      const [bankAccounts] = await connection.execute(`
        SELECT 
          id,
          bank_name,
          account_number,
          currency,
          is_primary,
          is_active,
          created_at,
          updated_at
        FROM employee_bank_accounts
        WHERE employee_id = ?
        ORDER BY is_primary DESC, created_at DESC
      `, [employeeId]);

      connection.release();

      res.json({
        success: true,
        data: {
          employee: employee[0],
          bankAccounts
        }
      });
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bank accounts' });
    }
  }

  // Get single bank account
  static async getBankAccountById(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      const [bankAccounts] = await connection.execute(`
        SELECT 
          ba.*,
          e.full_name as employee_name,
          e.employee_id
        FROM employee_bank_accounts ba
        JOIN employees e ON ba.employee_id = e.id
        WHERE ba.id = ?
      `, [id]);

      connection.release();

      if (bankAccounts.length === 0) {
        return res.status(404).json({ success: false, error: 'Bank account not found' });
      }

      res.json({
        success: true,
        data: bankAccounts[0]
      });
    } catch (error) {
      console.error('Error fetching bank account:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bank account' });
    }
  }

  // Create new bank account
  static async createBankAccount(req, res) {
    try {
      const { employeeId } = req.params;
      const { bankName, accountNumber, currency, isPrimary } = req.body;

      // Validation
      if (!bankName || !accountNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Bank name and account number are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Check if employee exists
        const [employee] = await connection.execute(
          'SELECT id, full_name FROM employees WHERE id = ? AND is_active = TRUE',
          [employeeId]
        );

        if (employee.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Check for duplicate account
        const [existing] = await connection.execute(
          'SELECT id FROM employee_bank_accounts WHERE employee_id = ? AND account_number = ? AND bank_name = ?',
          [employeeId, accountNumber.trim(), bankName.trim()]
        );

        if (existing.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Bank account already exists for this employee',
            errorType: 'DUPLICATE_ENTRY',
            field: 'accountNumber'
          });
        }

        // If setting as primary, remove primary flag from other accounts
        if (isPrimary) {
          await connection.execute(
            'UPDATE employee_bank_accounts SET is_primary = FALSE WHERE employee_id = ?',
            [employeeId]
          );
        }

        // Check if this will be the first account (auto-primary)
        const [accountCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM employee_bank_accounts WHERE employee_id = ?',
          [employeeId]
        );

        const shouldBePrimary = isPrimary || accountCount[0].count === 0;

        // Insert new bank account
        const [result] = await connection.execute(`
          INSERT INTO employee_bank_accounts (
            employee_id, bank_name, account_number, currency, is_primary
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          employeeId,
          bankName.trim(),
          accountNumber.trim(),
          currency || 'USD',
          shouldBePrimary
        ]);

        const bankAccountId = result.insertId;

        // Get the created bank account
        const [newAccount] = await connection.execute(`
          SELECT 
            id,
            bank_name,
            account_number,
            currency,
            is_primary,
            is_active,
            created_at,
            updated_at
          FROM employee_bank_accounts
          WHERE id = ?
        `, [bankAccountId]);

        await connection.commit();
        connection.release();

        // Log bank account creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'BANK_ACCOUNT_CREATED',
          tableName: 'employee_bank_accounts',
          recordId: bankAccountId,
          newValues: { 
            employeeId, 
            bankName: bankName.trim(), 
            accountNumber: accountNumber.trim(),
            currency: currency || 'USD',
            isPrimary: shouldBePrimary
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          message: 'Bank account created successfully',
          data: newAccount[0]
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating bank account:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          error: 'Bank account already exists for this employee',
          errorType: 'DUPLICATE_ENTRY',
          field: 'accountNumber'
        });
      }
      
      res.status(500).json({ success: false, error: 'Failed to create bank account' });
    }
  }

  // Update bank account
  static async updateBankAccount(req, res) {
    try {
      const { id } = req.params;
      const { bankName, accountNumber, currency, isPrimary, isActive } = req.body;

      // Validation
      if (!bankName || !accountNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Bank name and account number are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Check if bank account exists
        const [existingAccount] = await connection.execute(
          'SELECT * FROM employee_bank_accounts WHERE id = ?',
          [id]
        );

        if (existingAccount.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ success: false, error: 'Bank account not found' });
        }

        const employeeId = existingAccount[0].employee_id;

        // Check for duplicate account (excluding current account)
        const [duplicates] = await connection.execute(
          'SELECT id FROM employee_bank_accounts WHERE employee_id = ? AND account_number = ? AND bank_name = ? AND id != ?',
          [employeeId, accountNumber.trim(), bankName.trim(), id]
        );

        if (duplicates.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'Bank account already exists for this employee',
            errorType: 'DUPLICATE_ENTRY',
            field: 'accountNumber'
          });
        }

        // If setting as primary, remove primary flag from other accounts
        if (isPrimary) {
          await connection.execute(
            'UPDATE employee_bank_accounts SET is_primary = FALSE WHERE employee_id = ? AND id != ?',
            [employeeId, id]
          );
        }

        // Update bank account
        await connection.execute(`
          UPDATE employee_bank_accounts 
          SET bank_name = ?, account_number = ?, currency = ?, is_primary = ?, is_active = ?
          WHERE id = ?
        `, [
          bankName.trim(),
          accountNumber.trim(),
          currency || 'USD',
          isPrimary || false,
          isActive !== false,
          id
        ]);

        // Get updated bank account
        const [updatedAccount] = await connection.execute(`
          SELECT 
            id,
            bank_name,
            account_number,
            currency,
            is_primary,
            is_active,
            created_at,
            updated_at
          FROM employee_bank_accounts
          WHERE id = ?
        `, [id]);

        await connection.commit();
        connection.release();

        // Log bank account update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'BANK_ACCOUNT_UPDATED',
          tableName: 'employee_bank_accounts',
          recordId: parseInt(id),
          newValues: { bankName, accountNumber, currency, isPrimary, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Bank account updated successfully',
          data: updatedAccount[0]
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
      res.status(500).json({ success: false, error: 'Failed to update bank account' });
    }
  }

  // Delete bank account
  static async deleteBankAccount(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Check if bank account exists
        const [bankAccount] = await connection.execute(
          'SELECT * FROM employee_bank_accounts WHERE id = ?',
          [id]
        );

        if (bankAccount.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ success: false, error: 'Bank account not found' });
        }

        const employeeId = bankAccount[0].employee_id;
        const isPrimary = bankAccount[0].is_primary;

        // Delete bank account
        await connection.execute('DELETE FROM employee_bank_accounts WHERE id = ?', [id]);

        // If deleted account was primary, set another account as primary
        if (isPrimary) {
          const [otherAccounts] = await connection.execute(
            'SELECT id FROM employee_bank_accounts WHERE employee_id = ? ORDER BY created_at LIMIT 1',
            [employeeId]
          );

          if (otherAccounts.length > 0) {
            await connection.execute(
              'UPDATE employee_bank_accounts SET is_primary = TRUE WHERE id = ?',
              [otherAccounts[0].id]
            );
          }
        }

        await connection.commit();
        connection.release();

        // Log bank account deletion
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'BANK_ACCOUNT_DELETED',
          tableName: 'employee_bank_accounts',
          recordId: parseInt(id),
          newValues: { 
            bankName: bankAccount[0].bank_name,
            accountNumber: bankAccount[0].account_number,
            employeeId
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Bank account deleted successfully'
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ success: false, error: 'Failed to delete bank account' });
    }
  }

  // Set bank account as primary
  static async setPrimaryAccount(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Check if bank account exists
        const [bankAccount] = await connection.execute(
          'SELECT employee_id FROM employee_bank_accounts WHERE id = ?',
          [id]
        );

        if (bankAccount.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ success: false, error: 'Bank account not found' });
        }

        const employeeId = bankAccount[0].employee_id;

        // Remove primary flag from all accounts for this employee
        await connection.execute(
          'UPDATE employee_bank_accounts SET is_primary = FALSE WHERE employee_id = ?',
          [employeeId]
        );

        // Set this account as primary
        await connection.execute(
          'UPDATE employee_bank_accounts SET is_primary = TRUE WHERE id = ?',
          [id]
        );

        await connection.commit();
        connection.release();

        // Log primary account change
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'PRIMARY_ACCOUNT_CHANGED',
          tableName: 'employee_bank_accounts',
          recordId: parseInt(id),
          newValues: { employeeId, isPrimary: true },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Primary account updated successfully'
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error setting primary account:', error);
      res.status(500).json({ success: false, error: 'Failed to set primary account' });
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  // Get supported currencies
  static async getSupportedCurrencies(req, res) {
    try {
      const currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
      ];

      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch currencies' });
    }
  }
}

module.exports = BankAccountController;
