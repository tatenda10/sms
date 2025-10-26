const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class EmployeeController {
  // ==========================================
  // EMPLOYEE MANAGEMENT
  // ==========================================

  // Get all employees with pagination and search
  static async getAllEmployees(req, res) {
    try {
      const { page = 1, limit = 10, search = '', department = '', jobTitle = '', gender = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let searchCondition = 'WHERE e.is_active = TRUE';
      let searchParams = [];

      // Build search conditions
      const conditions = [];
      
      if (search.trim()) {
        conditions.push('(e.full_name LIKE ? OR e.employee_id LIKE ? OR e.id_number LIKE ? OR e.email LIKE ? OR e.phone_number LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (department) {
        conditions.push('e.department_id = ?');
        searchParams.push(department);
      }

      if (jobTitle) {
        conditions.push('e.job_title_id = ?');
        searchParams.push(jobTitle);
      }

      if (gender) {
        conditions.push('e.gender = ?');
        searchParams.push(gender);
      }

      if (conditions.length > 0) {
        searchCondition += ' AND ' + conditions.join(' AND ');
      }

      const connection = await pool.getConnection();

      // Get employees with related data
      const [employees] = await connection.execute(`
        SELECT 
          e.id,
          e.employee_id,
          e.full_name,
          e.id_number,
          e.address,
          e.email,
          e.phone_number,
          e.gender,
          e.hire_date,
          e.is_active,
          e.created_at,
          e.updated_at,
          d.name as department_name,
          jt.title as job_title,
          ba.bank_name,
          ba.account_number,
          ba.currency
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        LEFT JOIN employee_bank_accounts ba ON e.id = ba.employee_id AND ba.is_primary = TRUE
        ${searchCondition}
        ORDER BY e.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, searchParams);

      // Get total count for pagination
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total
        FROM employees e
        ${searchCondition}
      `, searchParams);

      connection.release();

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: employees,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalRecords: total,
          limit: parseInt(limit),
          offset: offset
        }
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch employees' });
    }
  }

  // Search employees
  static async searchEmployees(req, res) {
    try {
      const { query: searchQuery } = req.query;

      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.json({ success: true, data: [] });
      }

      const connection = await pool.getConnection();

      const [employees] = await connection.execute(`
        SELECT 
          e.id,
          e.employee_id,
          e.full_name,
          e.id_number,
          e.email,
          e.phone_number,
          e.gender,
          d.name as department_name,
          jt.title as job_title
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.is_active = TRUE 
        AND (e.full_name LIKE ? OR e.employee_id LIKE ? OR e.id_number LIKE ? OR e.email LIKE ?)
        ORDER BY e.full_name
        LIMIT 20
      `, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);

      connection.release();

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Error searching employees:', error);
      res.status(500).json({ success: false, error: 'Failed to search employees' });
    }
  }

  // Get employee by ID
  static async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const connection = await pool.getConnection();

      // Get employee with all related data
      const [employees] = await connection.execute(`
        SELECT 
          e.*,
          d.name as department_name,
          jt.title as job_title
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.id = ?
      `, [id]);

      if (employees.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      // Get employee's bank accounts
      const [bankAccounts] = await connection.execute(`
        SELECT 
          id,
          bank_name,
          account_number,
          currency,
          is_primary,
          is_active,
          created_at
        FROM employee_bank_accounts
        WHERE employee_id = ?
        ORDER BY is_primary DESC, created_at DESC
      `, [id]);

      connection.release();

      const employee = {
        ...employees[0],
        bankAccounts
      };

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch employee' });
    }
  }

  // Create new employee
  static async createEmployee(req, res) {
    try {
      const {
        employeeId,
        fullName,
        idNumber,
        address,
        email,
        phoneNumber,
        gender,
        departmentId,
        jobTitleId,
        hireDate,
        bankAccounts
      } = req.body;

      // Validation
      if (!fullName || !idNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Full name and ID number are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Check for duplicate employee ID
        if (employeeId) {
          const [existingEmpId] = await connection.execute(
            'SELECT id FROM employees WHERE employee_id = ?',
            [employeeId]
          );

          if (existingEmpId.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              success: false, 
              error: 'Employee ID already exists',
              errorType: 'DUPLICATE_ENTRY',
              field: 'employeeId'
            });
          }
        }

        // Check for duplicate ID number
        const [existingIdNumber] = await connection.execute(
          'SELECT id FROM employees WHERE id_number = ?',
          [idNumber]
        );

        if (existingIdNumber.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'ID number already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'idNumber'
          });
        }

        // Check for duplicate email if provided
        if (email) {
          const [existingEmail] = await connection.execute(
            'SELECT id FROM employees WHERE email = ?',
            [email]
          );

          if (existingEmail.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              success: false, 
              error: 'Email already exists',
              errorType: 'DUPLICATE_ENTRY',
              field: 'email'
            });
          }
        }

        // Generate employee ID if not provided
        let finalEmployeeId = employeeId;
        if (!finalEmployeeId) {
          const [maxId] = await connection.execute(
            'SELECT MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)) as max_num FROM employees WHERE employee_id LIKE ?',
            ['EMP%']
          );
          const nextNum = (maxId[0].max_num || 0) + 1;
          finalEmployeeId = `EMP${nextNum.toString().padStart(4, '0')}`;
        }

        // Insert employee
        const [result] = await connection.execute(`
          INSERT INTO employees (
            employee_id, full_name, id_number, address, email, phone_number, gender,
            department_id, job_title_id, hire_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          finalEmployeeId,
          fullName.trim(),
          idNumber.trim(),
          address?.trim() || null,
          email?.trim() || null,
          phoneNumber?.trim() || null,
          gender || null,
          departmentId || null,
          jobTitleId || null,
          hireDate || null
        ]);

        const newEmployeeId = result.insertId;

        // Insert bank accounts if provided
        if (bankAccounts && Array.isArray(bankAccounts) && bankAccounts.length > 0) {
          for (let i = 0; i < bankAccounts.length; i++) {
            const account = bankAccounts[i];
            if (account.bankName && account.accountNumber) {
              await connection.execute(`
                INSERT INTO employee_bank_accounts (
                  employee_id, bank_name, account_number, currency, is_primary
                ) VALUES (?, ?, ?, ?, ?)
              `, [
                newEmployeeId,
                account.bankName.trim(),
                account.accountNumber.trim(),
                account.currency || 'USD',
                i === 0 // First account is primary by default
              ]);
            }
          }
        }

        await connection.commit();
        connection.release();

        // Log employee creation
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'EMPLOYEE_CREATED',
          tableName: 'employees',
          recordId: newEmployeeId,
          newValues: { employeeId: finalEmployeeId, fullName, idNumber, email },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        // Get the created employee with full details
        const newEmployee = await EmployeeController.getEmployeeData(newEmployeeId);

        res.status(201).json({
          success: true,
          message: 'Employee created successfully',
          data: newEmployee
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('employee_id')) {
          return res.status(400).json({ 
            success: false, 
            error: 'Employee ID already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'employeeId'
          });
        } else if (error.sqlMessage.includes('id_number')) {
          return res.status(400).json({ 
            success: false, 
            error: 'ID number already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'idNumber'
          });
        } else if (error.sqlMessage.includes('email')) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'email'
          });
        }
      }
      
      res.status(500).json({ success: false, error: 'Failed to create employee' });
    }
  }

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const {
        fullName,
        idNumber,
        address,
        email,
        phoneNumber,
        gender,
        departmentId,
        jobTitleId,
        hireDate,
        isActive
      } = req.body;

      // Validation
      if (!fullName || !idNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Full name and ID number are required',
          errorType: 'VALIDATION_ERROR',
          field: 'required_fields'
        });
      }

      const connection = await pool.getConnection();

      try {
        // Check if employee exists
        const [existingEmployee] = await connection.execute('SELECT * FROM employees WHERE id = ?', [id]);
        if (existingEmployee.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Check for ID number conflicts (excluding current employee)
        const [idConflicts] = await connection.execute(
          'SELECT id FROM employees WHERE id_number = ? AND id != ?',
          [idNumber.trim(), id]
        );

        if (idConflicts.length > 0) {
          connection.release();
          return res.status(400).json({ 
            success: false, 
            error: 'ID number already exists',
            errorType: 'DUPLICATE_ENTRY',
            field: 'idNumber'
          });
        }

        // Check for email conflicts if email provided (excluding current employee)
        if (email) {
          const [emailConflicts] = await connection.execute(
            'SELECT id FROM employees WHERE email = ? AND id != ?',
            [email.trim(), id]
          );

          if (emailConflicts.length > 0) {
            connection.release();
            return res.status(400).json({ 
              success: false, 
              error: 'Email already exists',
              errorType: 'DUPLICATE_ENTRY',
              field: 'email'
            });
          }
        }

        // Update employee
        await connection.execute(`
          UPDATE employees 
          SET full_name = ?, id_number = ?, address = ?, email = ?, phone_number = ?, gender = ?,
              department_id = ?, job_title_id = ?, hire_date = ?, is_active = ?
          WHERE id = ?
        `, [
          fullName.trim(),
          idNumber.trim(),
          address?.trim() || null,
          email?.trim() || null,
          phoneNumber?.trim() || null,
          gender || null,
          departmentId || null,
          jobTitleId || null,
          hireDate || null,
          isActive !== false,
          id
        ]);

        connection.release();

        // Log employee update
        await AuditLogger.log({
          userId: req.user ? req.user.id : null,
          action: 'EMPLOYEE_UPDATED',
          tableName: 'employees',
          recordId: parseInt(id),
          newValues: { fullName, idNumber, email, isActive },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        // Get updated employee data
        const updatedEmployee = await EmployeeController.getEmployeeData(id);

        res.json({
          success: true,
          message: 'Employee updated successfully',
          data: updatedEmployee
        });

      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ success: false, error: 'Failed to update employee' });
    }
  }

  // Delete employee (soft delete)
  static async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      
      const connection = await pool.getConnection();

      // Check if employee exists
      const [employee] = await connection.execute('SELECT employee_id, full_name FROM employees WHERE id = ?', [id]);
      if (employee.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      // Soft delete employee
      await connection.execute('UPDATE employees SET is_active = FALSE WHERE id = ?', [id]);

      connection.release();

      // Log employee deletion
      await AuditLogger.log({
        userId: req.user ? req.user.id : null,
        action: 'EMPLOYEE_DELETED',
        tableName: 'employees',
        recordId: parseInt(id),
        newValues: { employeeId: employee[0].employee_id, fullName: employee[0].full_name },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Employee "${employee[0].full_name}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ success: false, error: 'Failed to delete employee' });
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  // Get employee data with all related information
  static async getEmployeeData(employeeId) {
    const connection = await pool.getConnection();

    try {
      // Get employee with related data
      const [employees] = await connection.execute(`
        SELECT 
          e.*,
          d.name as department_name,
          jt.title as job_title
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.id
        WHERE e.id = ?
      `, [employeeId]);

      if (employees.length === 0) {
        return null;
      }

      // Get employee's bank accounts
      const [bankAccounts] = await connection.execute(`
        SELECT 
          id,
          bank_name,
          account_number,
          currency,
          is_primary,
          is_active,
          created_at
        FROM employee_bank_accounts
        WHERE employee_id = ?
        ORDER BY is_primary DESC, created_at DESC
      `, [employeeId]);

      return {
        ...employees[0],
        bankAccounts
      };

    } finally {
      connection.release();
    }
  }
}

module.exports = EmployeeController;
