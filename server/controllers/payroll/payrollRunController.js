const { pool } = require('../../config/database');

class PayrollRunController {
  // Run payroll for a specific period
  static async runPayroll(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        pay_period,
        pay_date,
        bank_account_id,
        payment_method,
        reference,
        notes
      } = req.body;

      const created_by = req.user.id;

      // Validate required fields
      if (!pay_period || !pay_date || !bank_account_id) {
        return res.status(400).json({
          success: false,
          message: 'Pay period, pay date, and bank account are required'
        });
      }

      // Get pending payslips for the period
      const [pendingPayslips] = await connection.execute(
        `SELECT p.*, e.full_name as employee_name, e.employee_id as employee_number
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         WHERE p.pay_period = ? AND p.status = 'pending'`,
        [pay_period]
      );

      if (pendingPayslips.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pending payslips found for the specified period'
        });
      }

      // Calculate total amount
      const totalAmount = pendingPayslips.reduce((sum, payslip) => sum + parseFloat(payslip.net_pay), 0);

      // Create payroll run record
      const [payrollRunResult] = await connection.execute(
        `INSERT INTO payroll_runs (
          pay_period, pay_date, bank_account_id, payment_method,
          reference, total_amount, employee_count, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pay_period, pay_date, bank_account_id, payment_method, reference, totalAmount, pendingPayslips.length, notes, created_by]
      );

      const payrollRunId = payrollRunResult.insertId;

      // Process each payslip
      for (const payslip of pendingPayslips) {
        // Update payslip status to processed
        await connection.execute(
          'UPDATE payslips SET status = ? WHERE id = ?',
          ['processed', payslip.id]
        );

        // Add to payroll run details
        await connection.execute(
          `INSERT INTO payroll_run_details (
            payroll_run_id, payslip_id, amount, currency
          ) VALUES (?, ?, ?, ?)`,
          [payrollRunId, payslip.id, payslip.net_pay, payslip.currency]
        );

        // Create bank transaction for salary payment (only for bank transfers)
        if (payslip.payment_method === 'bank') {
          await connection.execute(
            `INSERT INTO bank_transactions (
              bank_account_id, transaction_type, amount, currency,
              description, reference, transaction_date, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bank_account_id,
              'withdrawal',
              payslip.net_pay,
              payslip.currency,
              `Salary payment - ${payslip.employee_name}`,
              reference || `PAY-${pay_period}`,
              pay_date,
              created_by
            ]
          );
        }

        // Create journal entries for accounting
        const journalEntryId = await PayrollRunController.createPayrollJournalEntries(
          connection,
          payslip,
          bank_account_id,
          pay_date,
          reference,
          created_by
        );

        // Update account balances after journal entries
        await PayrollRunController.updateAccountBalances(
          connection,
          payslip,
          bank_account_id,
          journalEntryId
        );
      }

      // Update payroll run status to completed
      await connection.execute(
        'UPDATE payroll_runs SET status = ? WHERE id = ?',
        ['completed', payrollRunId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Payroll processed successfully',
        data: {
          payroll_run_id: payrollRunId,
          payslips_processed: pendingPayslips.length,
          total_amount: totalAmount,
          pay_period,
          pay_date
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error running payroll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payroll',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Create journal entries for payroll
  static async createPayrollJournalEntries(connection, payslip, bankAccountId, payDate, reference, createdBy) {
    try {
      // Get or create journal entry
      const [journalResult] = await connection.execute(
        `INSERT INTO journal_entries (
          journal_id, entry_date, reference, description, created_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [5, payDate, reference || `PAY-${payslip.pay_period}`, `Payroll - ${payslip.employee_name}`, createdBy]
      );

      const journalEntryId = journalResult.insertId;

      // Get account IDs (you'll need to set up these accounts in your chart of accounts)
      const [salaryExpenseAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code = '5001' AND name LIKE '%Salary%' LIMIT 1"
      );

      const [payeAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code = '2201' AND name LIKE '%PAYE%' LIMIT 1"
      );

      const [nhifAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code = '2202' AND name LIKE '%NHIF%' LIMIT 1"
      );

      const [nssfAccount] = await connection.execute(
        "SELECT id FROM chart_of_accounts WHERE code = '2203' AND name LIKE '%NSSF%' LIMIT 1"
      );

      // Create journal entry lines
      const entries = [];

      // Debit: Salary Expense
      if (salaryExpenseAccount.length > 0) {
        entries.push({
          account_id: salaryExpenseAccount[0].id,
          debit: payslip.total_earnings,
          credit: 0,
          description: `Salary expense - ${payslip.employee_name}`
        });
      }

      // Credit: Bank Account (for bank transfers) or Cash Account (for cash payments)
      if (payslip.payment_method === 'bank') {
        entries.push({
          account_id: bankAccountId,
          debit: 0,
          credit: payslip.net_pay,
          description: `Salary payment - ${payslip.employee_name}`
        });
      } else {
        // For cash payments, credit cash account
        const [cashAccount] = await connection.execute(
          "SELECT id FROM chart_of_accounts WHERE code = '1001' AND name LIKE '%Cash%' LIMIT 1"
        );
        
        if (cashAccount.length > 0) {
          entries.push({
            account_id: cashAccount[0].id,
            debit: 0,
            credit: payslip.net_pay,
            description: `Cash salary payment - ${payslip.employee_name}`
          });
        }
      }

      // Credit: Tax Liabilities (if deductions exist)
      if (payslip.total_deductions > 0) {
        // Get deductions from payslip_deductions table
        const [deductions] = await connection.execute(
          'SELECT * FROM payslip_deductions WHERE payslip_id = ?',
          [payslip.id]
        );

        for (const deduction of deductions) {
          let accountId = null;

          // Map deduction labels to accounts
          if (deduction.label.toLowerCase().includes('paye')) {
            accountId = payeAccount.length > 0 ? payeAccount[0].id : null;
          } else if (deduction.label.toLowerCase().includes('nhif')) {
            accountId = nhifAccount.length > 0 ? nhifAccount[0].id : null;
          } else if (deduction.label.toLowerCase().includes('nssf')) {
            accountId = nssfAccount.length > 0 ? nssfAccount[0].id : null;
          }

          if (accountId) {
            entries.push({
              account_id: accountId,
              debit: 0,
              credit: deduction.amount,
              description: `${deduction.label} - ${payslip.employee_name}`
            });
          }
        }
      }

      // Get currency ID from payslip currency
      const [currencyResult] = await connection.execute(
        `SELECT id FROM currencies WHERE code = ? LIMIT 1`,
        [payslip.currency]
      );
      
      const currencyId = currencyResult.length > 0 ? currencyResult[0].id : 1; // Default to USD if not found

      // Insert journal entry lines
      for (const entry of entries) {
        await connection.execute(
          `INSERT INTO journal_entry_lines (
            journal_entry_id, account_id, debit, credit, description, currency_id
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [journalEntryId, entry.account_id, entry.debit, entry.credit, entry.description, currencyId]
        );
      }

      return journalEntryId;

    } catch (error) {
      console.error('Error creating payroll journal entries:', error);
      throw error;
    }
  }

  // Update account balances after journal entries
  static async updateAccountBalances(connection, payslip, bankAccountId, journalEntryId) {
    try {
      // Get all journal entry lines for this journal entry
      const [journalLines] = await connection.execute(
        `SELECT jel.* 
         FROM journal_entry_lines jel
         WHERE jel.journal_entry_id = ?`,
        [journalEntryId]
      );

      // Get currency ID from payslip currency
      const [currencyResult] = await connection.execute(
        `SELECT id FROM currencies WHERE code = ? LIMIT 1`,
        [payslip.currency]
      );
      
      const currencyId = currencyResult.length > 0 ? currencyResult[0].id : 1; // Default to USD if not found

      // Update balances for each account
      for (const line of journalLines) {
        const balanceChange = parseFloat(line.debit) - parseFloat(line.credit);
        
        // Get current balance for this account and currency
        const [currentBalance] = await connection.execute(
          `SELECT id, balance FROM account_balances 
           WHERE account_id = ? AND currency_id = ? 
           ORDER BY as_of_date DESC LIMIT 1`,
          [line.account_id, currencyId]
        );

        let newBalance;
        if (currentBalance.length > 0) {
          // Update existing balance
          newBalance = parseFloat(currentBalance[0].balance) + balanceChange;
          await connection.execute(
            `UPDATE account_balances 
             SET balance = ?, as_of_date = CURRENT_DATE 
             WHERE id = ?`,
            [newBalance, currentBalance[0].id]
          );
        } else {
          // Create new balance record
          newBalance = balanceChange;
          await connection.execute(
            `INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) 
             VALUES (?, ?, ?, CURRENT_DATE)`,
            [line.account_id, currencyId, newBalance]
          );
        }

        console.log(`Updated balance for account ${line.account_id}: ${balanceChange} (new balance: ${newBalance})`);
      }

    } catch (error) {
      console.error('Error updating account balances:', error);
      throw error;
    }
  }

  // Get payroll runs
  static async getPayrollRuns(req, res) {
    try {
      const {
        pay_period,
        status,
        page = 1,
        limit = 10
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (pay_period) {
        whereClause += ' AND pr.pay_period = ?';
        params.push(pay_period);
      }

      if (status) {
        whereClause += ' AND pr.status = ?';
        params.push(status);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM payroll_runs pr
         ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      // Get payroll runs
      const [payrollRuns] = await pool.execute(
        `SELECT pr.*, ba.name as bank_account_name
         FROM payroll_runs pr
         LEFT JOIN bank_accounts ba ON pr.bank_account_id = ba.id
         ${whereClause}
         ORDER BY pr.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        data: payrollRuns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching payroll runs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll runs',
        error: error.message
      });
    }
  }

  // Get payroll run details
  static async getPayrollRunDetails(req, res) {
    try {
      const { id } = req.params;

      const [payrollRun] = await pool.execute(
        `SELECT pr.*, ba.name as bank_account_name
         FROM payroll_runs pr
         LEFT JOIN bank_accounts ba ON pr.bank_account_id = ba.id
         WHERE pr.id = ?`,
        [id]
      );

      if (payrollRun.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payroll run not found'
        });
      }

      const [details] = await pool.execute(
        `SELECT prd.*, p.employee_name, p.employee_number, p.total_earnings, p.total_deductions
         FROM payroll_run_details prd
         JOIN payslips p ON prd.payslip_id = p.id
         WHERE prd.payroll_run_id = ?`,
        [id]
      );

      res.json({
        success: true,
        data: {
          ...payrollRun[0],
          details
        }
      });

    } catch (error) {
      console.error('Error fetching payroll run details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll run details',
        error: error.message
      });
    }
  }
}

module.exports = PayrollRunController;
