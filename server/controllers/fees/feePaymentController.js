const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentTransactionController = require('../students/studentTransactionController');
const AccountBalanceService = require('../../services/accountBalanceService');

class FeePaymentController {
	// Process fee payment
	async processPayment(req, res) {
		const conn = await pool.getConnection();
		try {
			await conn.beginTransaction();

			const {
				student_reg_number,
				payment_amount,
				payment_currency,
				exchange_rate = 1.0,
				payment_method,
				payment_date,
				reference_number,
				notes
			} = req.body;

			// Validation
			if (!student_reg_number || !payment_amount || !payment_currency || !payment_method) {
				return res.status(400).json({
					success: false,
					message: 'Student registration number, payment amount, currency, and payment method are required'
				});
			}

			// Normalize payment method to match allowed values
			const allowedPaymentMethods = new Set(['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Other']);
			const incoming = (payment_method || '').toString().trim();
			const lower = incoming.toLowerCase();
			let normalizedPaymentMethod = incoming;
			if (lower === 'bank' || lower === 'bank transfer' || lower === 'bank_transfer') {
				normalizedPaymentMethod = 'Bank Transfer';
			} else if (lower === 'cash') {
				normalizedPaymentMethod = 'Cash';
			} else if (lower === 'cheque' || lower === 'check') {
				normalizedPaymentMethod = 'Cheque';
			} else if (lower === 'mobile money' || lower === 'mobile_money' || lower === 'momo' || lower === 'mpesa') {
				normalizedPaymentMethod = 'Mobile Money';
			} else if (!allowedPaymentMethods.has(incoming)) {
				normalizedPaymentMethod = 'Other';
			}

			// Check if student exists
			const [students] = await conn.execute(
				'SELECT RegNumber FROM students WHERE RegNumber = ?',
				[student_reg_number]
			);

			if (students.length === 0) {
				return res.status(400).json({
					success: false,
					message: 'Student not found'
				});
			}

			// Calculate base currency amount
			const base_currency_amount = payment_amount * exchange_rate;

		// Use reference number as receipt number
		const receipt_number = reference_number || `FP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`;

		// Check if a transaction already exists for this receipt number to prevent duplicates
		const [existingTransaction] = await conn.execute(
			`SELECT id FROM student_transactions 
			 WHERE student_reg_number = ? 
			 AND description LIKE ? 
			 AND transaction_type = 'CREDIT'`,
			[student_reg_number, `%Receipt #${receipt_number}%`]
		);

		if (existingTransaction.length > 0) {
			await conn.rollback();
			conn.release();
			return res.status(400).json({
				success: false,
				message: `A payment with receipt number ${receipt_number} already exists for this student`
			});
		}

		// Create payment record
		const [result] = await conn.execute(
			`INSERT INTO fee_payments 
			 (student_reg_number, payment_amount, payment_currency, exchange_rate, 
			  base_currency_amount, payment_method, payment_date, receipt_number, 
			  reference_number, notes, created_by) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[student_reg_number, payment_amount, payment_currency, exchange_rate,
			 base_currency_amount, normalizedPaymentMethod, payment_date || new Date(), 
			 receipt_number, reference_number || null, notes || null, req.user.id]
		);

		const paymentId = result.insertId;

		// Create CREDIT transaction and link it to the journal entry (will be set after journal creation)
		const transactionId = await StudentTransactionController.createTransactionHelper(
			student_reg_number,
			'CREDIT',
			base_currency_amount,
			`Fee Payment - Receipt #${receipt_number}`,
			{
				created_by: req.user.id,
				payment_id: paymentId
			}
		);

			// Create journal entries for double-entry bookkeeping
			const journalEntryData = {
				student_reg_number,
				payment_amount,
				payment_currency,
				exchange_rate,
				base_currency_amount,
				payment_method: normalizedPaymentMethod,
				payment_date: payment_date || new Date(),
				receipt_number,
				reference_number,
				notes,
				created_by: req.user.id
			};
			
		const journalEntryId = await FeePaymentController.createJournalEntries(conn, journalEntryData);
		
		// Link the transaction to the journal entry
		await conn.execute(
			'UPDATE student_transactions SET journal_entry_id = ? WHERE id = ?',
			[journalEntryId, transactionId]
		);
		
		// Update account balances (use payment currency for balance updates)
			// Determine currency ID from payment_currency
			let currencyIdForBalance = 1;
			if (payment_currency) {
				if (typeof payment_currency === 'number') {
					currencyIdForBalance = payment_currency;
				} else {
					const [currency] = await conn.execute(
						'SELECT id FROM currencies WHERE code = ? OR id = ? LIMIT 1',
						[payment_currency, payment_currency]
					);
					if (currency.length > 0) {
						currencyIdForBalance = currency[0].id;
					}
				}
			}
			await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currencyIdForBalance);

			// Log audit event
			try {
				await AuditLogger.log({
					userId: req.user.id,
					action: 'CREATE',
					tableName: 'fee_payments',
					recordId: paymentId,
					newValues: {
						student_reg_number,
						payment_amount,
						payment_currency,
						exchange_rate,
						base_currency_amount,
						payment_method: normalizedPaymentMethod,
						payment_date,
						receipt_number,
						reference_number,
						notes
					}
				});
			} catch (auditError) {
				console.error('Audit logging failed:', auditError);
			}

			await conn.commit();

			res.status(201).json({
				success: true,
				message: 'Payment processed successfully',
				data: {
					id: paymentId,
					receipt_number,
					base_currency_amount
				}
			});
		} catch (error) {
			await conn.rollback();
			console.error('Error processing payment:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to process payment',
				error: error.message
			});
		} finally {
			conn.release();
		}
	}

	// Get payment by ID
	async getPaymentById(req, res) {
		try {
			const { id } = req.params;

			const [payments] = await pool.execute(
				`SELECT fp.*, c.name as currency_name
				 FROM fee_payments fp
				 LEFT JOIN currencies c ON fp.payment_currency = c.id
				 WHERE fp.id = ?`,
				[id]
			);

			if (payments.length === 0) {
				return res.status(404).json({
					success: false,
					message: 'Payment not found'
				});
			}

			res.json({
				success: true,
				data: payments[0]
			});
		} catch (error) {
			console.error('Error fetching payment:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to fetch payment',
				error: error.message
			});
		}
	}

	// Get payments by student
	async getPaymentsByStudent(req, res) {
		try {
			const { student_reg_number } = req.params;
			const { page = 1, limit = 50, start_date, end_date } = req.query;
			const offset = (page - 1) * limit;

			let whereClause = 'WHERE fp.student_reg_number = ?';
			let params = [student_reg_number];

			if (start_date) {
				whereClause += ' AND fp.payment_date >= ?';
				params.push(start_date);
			}

			if (end_date) {
				whereClause += ' AND fp.payment_date <= ?';
				params.push(end_date);
			}

			// Get total count
			const [countResult] = await pool.execute(
				`SELECT COUNT(*) as total FROM fee_payments fp ${whereClause}`,
				params
			);

			const totalRecords = countResult[0].total;

			// Get payments
			const [payments] = await pool.execute(
				`SELECT fp.*, c.name as currency_name
				 FROM fee_payments fp
				 LEFT JOIN currencies c ON fp.payment_currency = c.id
				 ${whereClause}
				 ORDER BY fp.payment_date DESC, fp.id DESC
				 LIMIT ? OFFSET ?`,
				[...params, parseInt(limit), offset]
			);

			res.json({
				success: true,
				data: {
					student_reg_number,
					payments,
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total: totalRecords,
						totalPages: Math.ceil(totalRecords / limit)
					}
				}
			});
		} catch (error) {
			console.error('Error fetching student payments:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to fetch student payments',
				error: error.message
			});
		}
	}

	// Refund payment
	async refundPayment(req, res) {
		const conn = await pool.getConnection();
		try {
			await conn.beginTransaction();

			const { id } = req.params;
			const { refund_amount, reason } = req.body;

			// Get payment details
			const [payments] = await conn.execute(
				'SELECT * FROM fee_payments WHERE id = ?',
				[id]
			);

			if (payments.length === 0) {
				return res.status(404).json({
					success: false,
					message: 'Payment not found'
				});
			}

			const payment = payments[0];

			if (payment.status === 'Refunded') {
				return res.status(400).json({
					success: false,
					message: 'Payment has already been refunded'
				});
			}

			// Validate refund amount
			if (refund_amount > payment.base_currency_amount) {
				return res.status(400).json({
					success: false,
					message: 'Refund amount cannot exceed original payment amount'
				});
			}

			// Update payment status
			await conn.execute(
				'UPDATE fee_payments SET status = ? WHERE id = ?',
				['Refunded', id]
			);

			// Create DEBIT transaction for refund
			await StudentTransactionController.createTransactionHelper(
				payment.student_reg_number,
				'DEBIT',
				refund_amount,
				`Payment Refund - Receipt #${payment.receipt_number} - ${reason || 'Refund'}`,
				{
					created_by: req.user.id
				}
			);

			// Create journal entries for refund (reverse the original entry)
			const refundJournalData = {
				student_reg_number: payment.student_reg_number,
				refund_amount,
				receipt_number: payment.receipt_number,
				reason,
				created_by: req.user.id
			};
			
			await FeePaymentController.createRefundJournalEntries(conn, refundJournalData);

			// Log audit event
			try {
				await AuditLogger.log({
					userId: req.user.id,
					action: 'REFUND',
					tableName: 'fee_payments',
					recordId: id,
					newValues: {
						refund_amount,
						reason,
						status: 'Refunded'
					}
				});
			} catch (auditError) {
				console.error('Audit logging failed:', auditError);
			}

			await conn.commit();

			res.json({
				success: true,
				message: 'Payment refunded successfully',
				data: { refund_amount }
			});
		} catch (error) {
			await conn.rollback();
			console.error('Error refunding payment:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to refund payment',
				error: error.message
			});
		} finally {
			conn.release();
		}
	}

	// Generate receipt number
	async generateReceiptNumber(conn) {
		const [result] = await conn.execute(
			'SELECT COUNT(*) as count FROM fee_payments WHERE DATE(created_at) = CURDATE()'
		);
		
		const count = result[0].count + 1;
		const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		
		return `FP${date}-${count.toString().padStart(4, '0')}`;
	}

	// Get payment summary by student
	async getPaymentSummary(req, res) {
		try {
			const { student_reg_number } = req.params;

			// Get payment summary
			const [summary] = await pool.execute(
				`SELECT 
					COUNT(*) as total_payments,
					SUM(base_currency_amount) as total_paid,
					SUM(CASE WHEN status = 'Completed' THEN base_currency_amount ELSE 0 END) as completed_payments,
					SUM(CASE WHEN status = 'Refunded' THEN base_currency_amount ELSE 0 END) as refunded_amount
				 FROM fee_payments 
				 WHERE student_reg_number = ?`,
				[student_reg_number]
			);

			res.json({
				success: true,
				data: summary[0]
			});
		} catch (error) {
			console.error('Error fetching payment summary:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to fetch payment summary',
				error: error.message
			});
		}
	}

	// Create journal entries for double-entry bookkeeping
	static async createJournalEntries(conn, paymentData) {
		try {
			// Get student name
			const [students] = await conn.execute(
				'SELECT Name, Surname FROM students WHERE RegNumber = ?',
				[paymentData.student_reg_number]
			);

			if (students.length === 0) {
				throw new Error('Student not found');
			}

			const student_name = `${students[0].Name} ${students[0].Surname}`;

			// Get Cash account (usually account 83 - Cash on Hand)
		const [cashAccounts] = await conn.execute(
			'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
			['1000', 'Asset']
		);

			if (cashAccounts.length === 0) {
				throw new Error('Cash account not found in chart of accounts');
			}

			const cashAccountId = cashAccounts[0].id;

		// Get Tuition Fees Revenue account
		const [revenueAccounts] = await conn.execute(
			'SELECT id FROM chart_of_accounts WHERE code LIKE ? AND type = ? AND name LIKE ? LIMIT 1',
			['4%', 'Revenue', '%tuition%']
		);

			if (revenueAccounts.length === 0) {
				// Fallback to any revenue account
				const [fallbackRevenue] = await conn.execute(
					'SELECT id FROM chart_of_accounts WHERE type = ? LIMIT 1',
					['Revenue']
				);
				
				if (fallbackRevenue.length === 0) {
					throw new Error('Revenue account not found in chart of accounts');
				}
				
				revenueAccounts[0] = fallbackRevenue[0];
			}

		const revenueAccountId = revenueAccounts[0].id;

		// Get or create journal for fee payments
		let journalId = 6; // Try Fees Journal (ID: 6) first
		const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
		if (journalCheck.length === 0) {
			// Try to find any existing journal
			const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
			if (anyJournal.length > 0) {
				journalId = anyJournal[0].id;
			} else {
				// Create Fees Journal if no journals exist
				const [journalResult] = await conn.execute(
					'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
					['Fees Journal', 'Journal for fee payment transactions', 1]
				);
				journalId = journalResult.insertId;
			}
		}

		// Create journal entry header
		const [journalResult] = await conn.execute(
			`INSERT INTO journal_entries 
			 (journal_id, entry_date, reference, description) 
			 VALUES (?, ?, ?, ?)`,
			[journalId, paymentData.payment_date, paymentData.receipt_number, `Tuition Fee Payment - ${student_name} (${paymentData.student_reg_number})`]
		);

			const journalEntryId = journalResult.insertId;

			// Get currency_id - payment_currency might be ID or code
			let currencyId = 1; // Default to 1
			if (paymentData.payment_currency) {
				if (typeof paymentData.payment_currency === 'number') {
					currencyId = paymentData.payment_currency;
				} else {
					// Try to find currency by code
					const [currency] = await conn.execute(
						'SELECT id FROM currencies WHERE code = ? OR id = ? LIMIT 1',
						[paymentData.payment_currency, paymentData.payment_currency]
					);
					if (currency.length > 0) {
						currencyId = currency[0].id;
					}
				}
			}

			// Create journal entry lines
			const journalLines = [
				// Debit: Cash/Bank (in payment currency)
				{
					journal_entry_id: journalEntryId,
					account_id: cashAccountId,
					debit_amount: paymentData.base_currency_amount,
					credit_amount: 0,
					description: `Payment received for tuition fees - ${student_name} (${paymentData.student_reg_number})`
				},
				// Credit: Tuition Fees Revenue (in payment currency)
				{
					journal_entry_id: journalEntryId,
					account_id: revenueAccountId,
					debit_amount: 0,
					credit_amount: paymentData.base_currency_amount,
					description: `Tuition fees revenue - ${student_name} (${paymentData.student_reg_number})`
				}
			];

			for (const line of journalLines) {
				await conn.execute(
					`INSERT INTO journal_entry_lines 
					 (journal_entry_id, account_id, debit, credit, currency_id, description) 
					 VALUES (?, ?, ?, ?, ?, ?)`,
					[line.journal_entry_id, line.account_id, line.debit_amount, line.credit_amount, currencyId, line.description]
				);
			}

			console.log(`Created journal entry ${journalEntryId} for tuition payment ${paymentData.receipt_number}`);
			return journalEntryId;
		} catch (error) {
			console.error('Error creating journal entries:', error);
			throw error;
		}
	}

	// Create journal entries for refund (reverse the original entry)
	static async createRefundJournalEntries(conn, refundData) {
		try {
			// Get student name
			const [students] = await conn.execute(
				'SELECT Name, Surname FROM students WHERE RegNumber = ?',
				[refundData.student_reg_number]
			);

			if (students.length === 0) {
				throw new Error('Student not found');
			}

			const student_name = `${students[0].Name} ${students[0].Surname}`;

			// Get Cash account (usually account 83 - Cash on Hand)
		const [cashAccounts] = await conn.execute(
			'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ? LIMIT 1',
			['1000', 'Asset']
		);

			if (cashAccounts.length === 0) {
				throw new Error('Cash account not found in chart of accounts');
			}

			const cashAccountId = cashAccounts[0].id;

		// Get Tuition Fees Revenue account
		const [revenueAccounts] = await conn.execute(
			'SELECT id FROM chart_of_accounts WHERE code LIKE ? AND type = ? AND name LIKE ? LIMIT 1',
			['4%', 'Revenue', '%tuition%']
		);

			if (revenueAccounts.length === 0) {
				// Fallback to any revenue account
				const [fallbackRevenue] = await conn.execute(
					'SELECT id FROM chart_of_accounts WHERE type = ? LIMIT 1',
					['Revenue']
				);
				
				if (fallbackRevenue.length === 0) {
					throw new Error('Revenue account not found in chart of accounts');
				}
				
				revenueAccounts[0] = fallbackRevenue[0];
			}

		const revenueAccountId = revenueAccounts[0].id;

		// Get or create journal for fee payments
		let journalId = 6; // Try Fees Journal (ID: 6) first
		const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
		if (journalCheck.length === 0) {
			// Try to find any existing journal
			const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
			if (anyJournal.length > 0) {
				journalId = anyJournal[0].id;
			} else {
				// Create Fees Journal if no journals exist
				const [journalResult] = await conn.execute(
					'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
					['Fees Journal', 'Journal for fee payment transactions', 1]
				);
				journalId = journalResult.insertId;
			}
		}

		// Create journal entry header
		const [journalResult] = await conn.execute(
			`INSERT INTO journal_entries 
			 (journal_id, entry_date, reference, description) 
			 VALUES (?, ?, ?, ?)`,
			[journalId, new Date(), `REFUND-${refundData.receipt_number}`, `Tuition Fee Refund - ${student_name} (${refundData.student_reg_number}) - ${refundData.reason || 'Refund'}`]
		);

			const journalEntryId = journalResult.insertId;

			// Get currency_id (default to 1 for refunds)
			const currencyId = 1; // Refunds typically use base currency

			// Create journal entry lines (reverse of original entry)
			const journalLines = [
				// Debit: Tuition Fees Revenue (reducing revenue)
				{
					journal_entry_id: journalEntryId,
					account_id: revenueAccountId,
					debit_amount: refundData.refund_amount,
					credit_amount: 0,
					description: `Tuition fees refund - ${student_name} (${refundData.student_reg_number})`
				},
				// Credit: Cash/Bank (cash going out)
				{
					journal_entry_id: journalEntryId,
					account_id: cashAccountId,
					debit_amount: 0,
					credit_amount: refundData.refund_amount,
					description: `Refund payment - ${student_name} (${refundData.student_reg_number})`
				}
			];

			for (const line of journalLines) {
				await conn.execute(
					`INSERT INTO journal_entry_lines 
					 (journal_entry_id, account_id, debit, credit, currency_id, description) 
					 VALUES (?, ?, ?, ?, ?, ?)`,
					[line.journal_entry_id, line.account_id, line.debit_amount, line.credit_amount, currencyId, line.description]
				);
			}

			console.log(`Created refund journal entry ${journalEntryId} for refund ${refundData.receipt_number}`);
		} catch (error) {
			console.error('Error creating refund journal entries:', error);
			throw error;
		}
	}

}

module.exports = new FeePaymentController();
