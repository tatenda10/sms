const { pool } = require('../../config/database');

const generalLedgerController = {
  // Get all journal entries with pagination and filtering
  async getAllEntries(req, res) {
    try {
      const { page = 1, limit = 10, search = '', startDate = '', endDate = '', transactionType = '', accountId } = req.query;
      const offset = (page - 1) * limit;

      // Build base query for student transactions
      let studentQuery = `
        SELECT 
          'student_transaction' as source,
          st.id,
          st.student_reg_number as account_id,
          CASE 
            WHEN st.transaction_type = 'DEBIT' THEN st.amount
            ELSE 0
          END as debit_amount,
          CASE 
            WHEN st.transaction_type = 'CREDIT' THEN st.amount
            ELSE 0
          END as credit_amount,
          st.description,
          st.transaction_date,
          st.created_at,
          'System' as created_by,
          st.transaction_type,
          st.student_reg_number,
          '' as payment_method,
          '' as receipt_number,
          '' as reference_number,
          0 as currency_id,
          0 as exchange_rate
        FROM student_transactions st
        WHERE 1=1
      `;

      // Build base query for fee payments
      let feeQuery = `
        SELECT 
          'fee_payment' as source,
          fp.id,
          fp.student_reg_number as account_id,
          fp.base_currency_amount as debit_amount,
          0 as credit_amount,
          CONCAT('Fee Payment - ', fp.receipt_number) as description,
          fp.payment_date as transaction_date,
          fp.created_at,
          'System' as created_by,
          'CREDIT' as transaction_type,
          fp.student_reg_number,
          fp.payment_method,
          fp.receipt_number,
          fp.reference_number,
          fp.payment_currency as currency_id,
          fp.exchange_rate
        FROM fee_payments fp
        WHERE 1=1
      `;

      // Build base query for journal entries
      let journalQuery = `
        SELECT 
          'journal_entry' as source,
          jel.journal_entry_id as id,
          jel.account_id,
          jel.debit as debit_amount,
          jel.credit as credit_amount,
          jel.description,
          je.entry_date as transaction_date,
          jel.created_at,
          'System' as created_by,
          CASE 
            WHEN jel.debit > 0 THEN 'DEBIT'
            WHEN jel.credit > 0 THEN 'CREDIT'
            ELSE 'NEUTRAL'
          END as transaction_type,
          '' as student_reg_number,
          '' as payment_method,
          '' as receipt_number,
          je.reference as reference_number,
          jel.currency_id,
          jel.exchange_rate
        FROM journal_entry_lines jel
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = ?
      `;

      const params = [];
      const journalParams = accountId ? [accountId] : [];

      // Add search conditions
      if (search) {
        studentQuery += ` AND st.description LIKE ?`;
        feeQuery += ` AND (fp.receipt_number LIKE ? OR fp.reference_number LIKE ?)`;
        journalQuery += ` AND (jel.description LIKE ? OR je.description LIKE ?)`;
        params.push(`%${search}%`);
        params.push(`%${search}%`, `%${search}%`);
        journalParams.push(`%${search}%`, `%${search}%`);
      }

      // Add date filters
      if (startDate) {
        studentQuery += ` AND DATE(st.transaction_date) >= ?`;
        feeQuery += ` AND DATE(fp.payment_date) >= ?`;
        journalQuery += ` AND DATE(je.entry_date) >= ?`;
        params.push(startDate);
        params.push(startDate);
        journalParams.push(startDate);
      }

      if (endDate) {
        studentQuery += ` AND DATE(st.transaction_date) <= ?`;
        feeQuery += ` AND DATE(fp.payment_date) <= ?`;
        journalQuery += ` AND DATE(je.entry_date) <= ?`;
        params.push(endDate);
        params.push(endDate);
        journalParams.push(endDate);
      }

      // Add transaction type filter
      if (transactionType) {
        studentQuery += ` AND st.transaction_type = ?`;
        feeQuery += ` AND 'CREDIT' = ?`;
        journalQuery += ` AND CASE WHEN jel.debit > 0 THEN 'DEBIT' WHEN jel.credit > 0 THEN 'CREDIT' ELSE 'NEUTRAL' END = ?`;
        params.push(transactionType);
        params.push(transactionType);
        journalParams.push(transactionType);
      }

      // Execute queries
      const [studentTransactions] = await pool.execute(studentQuery, params);
      const [feePayments] = await pool.execute(feeQuery, params);
      const [journalEntries] = accountId ? await pool.execute(journalQuery, journalParams) : [[]];

      // Combine all results
      let allEntries = [...studentTransactions, ...feePayments, ...journalEntries];

      // Sort by transaction date (most recent first)
      allEntries.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

      const totalRecords = allEntries.length;

      // Apply pagination
      const paginatedEntries = allEntries.slice(offset, offset + parseInt(limit));

      console.log('📋 Enhanced journal entries:', paginatedEntries.length);
      if (paginatedEntries.length > 0) {
        console.log('📋 First enhanced entry sample:', paginatedEntries[0]);
      }

      res.json({
        success: true,
        data: paginatedEntries,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch journal entries',
        error: error.message
      });
    }
  },

  // Get account balances
  async getAccountBalances(req, res) {
    try {
      const [balances] = await pool.execute(`
        SELECT 
          ab.account_id,
          ab.currency_id,
          ab.balance,
          ab.as_of_date,
          coa.code as account_code,
          coa.name as account_name,
          coa.type as account_type,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM account_balances ab
        LEFT JOIN chart_of_accounts coa ON ab.account_id = coa.id
        LEFT JOIN currencies c ON ab.currency_id = c.id
        ORDER BY coa.code, c.name
      `);

      res.json({
        success: true,
        data: balances
      });
    } catch (error) {
      console.error('Error fetching account balances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account balances',
        error: error.message
      });
    }
  },

  // Get transaction summary (trial balance)
  async getTransactionSummary(req, res) {
    try {
      // Get summary from student transactions
      const [studentSummary] = await pool.execute(`
        SELECT 
          'student_transactions' as source,
          COUNT(*) as total_transactions,
          SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits
        FROM student_transactions
      `);

      // Get summary from fee payments
      const [feeSummary] = await pool.execute(`
        SELECT 
          'fee_payments' as source,
          COUNT(*) as total_transactions,
          SUM(base_currency_amount) as total_debits,
          0 as total_credits
        FROM fee_payments
      `);

      // Get summary from journal entries
      const [journalSummary] = await pool.execute(`
        SELECT 
          'journal_entries' as source,
          COUNT(*) as total_transactions,
          SUM(debit) as total_debits,
          SUM(credit) as total_credits
        FROM journal_entry_lines
      `);

      const summary = {
        student_transactions: studentSummary[0] || { total_transactions: 0, total_debits: 0, total_credits: 0 },
        fee_payments: feeSummary[0] || { total_transactions: 0, total_debits: 0, total_credits: 0 },
        journal_entries: journalSummary[0] || { total_transactions: 0, total_debits: 0, total_credits: 0 }
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction summary',
        error: error.message
      });
    }
  },

  // Get currencies for balance display
  async getCurrencies(req, res) {
    try {
      const [currencies] = await pool.execute(
        'SELECT * FROM currencies WHERE is_active = 1 ORDER BY name'
      );

      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch currencies',
        error: error.message
      });
    }
  },

  // Get a single entry by ID
  async getEntryById(req, res) {
    try {
      const { id } = req.params;

      // Try to find in student transactions
      const [studentTransactions] = await pool.execute(
        'SELECT * FROM student_transactions WHERE id = ?',
        [id]
      );

      if (studentTransactions.length > 0) {
        return res.json({
          success: true,
          data: studentTransactions[0]
        });
      }

      // Try to find in fee payments
      const [feePayments] = await pool.execute(
        'SELECT * FROM fee_payments WHERE id = ?',
        [id]
      );

      if (feePayments.length > 0) {
        return res.json({
          success: true,
          data: feePayments[0]
        });
      }

      // Try to find in journal entries
      const [journalEntries] = await pool.execute(
        'SELECT * FROM journal_entry_lines WHERE id = ?',
        [id]
      );

      if (journalEntries.length > 0) {
        return res.json({
          success: true,
          data: journalEntries[0]
        });
      }

      res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    } catch (error) {
      console.error('Error fetching entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entry',
        error: error.message
      });
    }
  },

  // Get journal entries for a specific account
  async getJournalEntriesForAccount(req, res) {
    try {
      const { accountId } = req.params;
      const { page = 1, limit = 10, search = '', startDate = '', endDate = '', transactionType = '' } = req.query;
      
      // Convert to numbers to ensure proper calculation
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Debug logging
      console.log('🔍 Debug - Raw query parameters:', { page, limit, search, startDate, endDate, transactionType });
      console.log('🔍 Debug - Parsed numbers:', { pageNum, limitNum, offset });
      console.log('🔍 Debug - accountId:', accountId);
      console.log('🔍 Debug - accountId type:', typeof accountId);

      // Build WHERE clause
      let whereClause = 'WHERE jel.account_id = ?';
      let params = [parseInt(accountId)];

      if (search) {
        whereClause += ' AND (jel.description LIKE ? OR je.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (startDate) {
        whereClause += ' AND DATE(je.entry_date) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND DATE(je.entry_date) <= ?';
        params.push(endDate);
      }

      if (transactionType) {
        if (transactionType === 'DEBIT') {
          whereClause += ' AND jel.debit > 0';
        } else if (transactionType === 'CREDIT') {
          whereClause += ' AND jel.credit > 0';
        }
      }

      // Get total count
      console.log('🔍 Debug - Count query params:', params);
      console.log('🔍 Debug - Count WHERE clause:', whereClause);
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM journal_entry_lines jel
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        ${whereClause}
      `;
      
      console.log('🔍 Debug - Count SQL Query:', countQuery);
      
      const [countResult] = await pool.query(countQuery, params);

      const totalRecords = countResult[0].total;
      console.log('🔍 Debug - Total records found:', totalRecords);

      // Get journal entries
      const finalParams = [...params, limitNum, offset];
      console.log('🔍 Debug - Final query params:', finalParams);
      console.log('🔍 Debug - Final WHERE clause:', whereClause);
      console.log('🔍 Debug - LIMIT and OFFSET values:', { limitNum, offset });
      
      // Use query instead of execute to avoid parameter binding issues
      const query = `
        SELECT 
           jel.id,
           jel.journal_entry_id,
           jel.account_id,
           jel.debit,
           jel.credit,
           jel.description,
           je.entry_date as transaction_date,
           je.reference,
           je.description as journal_description,
           CASE 
             WHEN jel.debit > 0 THEN 'DEBIT'
             WHEN jel.credit > 0 THEN 'CREDIT'
             ELSE 'NEUTRAL'
           END as transaction_type,
           coa.code as account_code,
           coa.name as account_name
         FROM journal_entry_lines jel
         LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
         LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
         ${whereClause}
         ORDER BY je.entry_date DESC, jel.id DESC
         LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('🔍 Debug - Final SQL Query:', query);
      
      const [entries] = await pool.query(query, params);

      // Format the response
      const formattedEntries = entries.map(entry => ({
        id: entry.id,
        journal_entry_id: entry.journal_entry_id,
        account_id: entry.account_id,
        debit_amount: entry.debit,
        credit_amount: entry.credit,
        description: entry.description || entry.journal_description,
        transaction_date: entry.transaction_date,
        reference: entry.reference,
        transaction_type: entry.transaction_type,
        account_code: entry.account_code,
        account_name: entry.account_name
      }));

      res.json({
        success: true,
        data: formattedEntries,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(totalRecords / limitNum),
          total_records: totalRecords,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error fetching journal entries for account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch journal entries',
        error: error.message
      });
    }
  }
};

module.exports = generalLedgerController;
