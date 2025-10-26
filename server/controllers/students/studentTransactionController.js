const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentBalanceService = require('../../services/studentBalanceService');
const AccountBalanceService = require('../../services/accountBalanceService');

class StudentTransactionController {
    // Create a new transaction
    async createTransaction(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const {
                student_reg_number,
                transaction_type,
                amount,
                description,
                term,
                academic_year,
                class_id,
                hostel_id,
                enrollment_id
            } = req.body;

            // Validation
            if (!student_reg_number || !transaction_type || !amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Student registration number, transaction type, amount, and description are required'
                });
            }

            if (!['DEBIT', 'CREDIT'].includes(transaction_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction type must be either DEBIT or CREDIT'
                });
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

            // Create transaction
            const [result] = await conn.execute(
                `INSERT INTO student_transactions 
                 (student_reg_number, transaction_type, amount, description, term, academic_year, 
                  class_id, hostel_id, enrollment_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student_reg_number, transaction_type, amount, description, term || null, 
                 academic_year || null, class_id || null, hostel_id || null, 
                 enrollment_id || null, req.user.id]
            );

            const transactionId = result.insertId;

            // Update student balance
            await StudentBalanceService.updateBalanceOnTransaction(student_reg_number, transaction_type, amount, conn);

            // Create journal entries for double-entry bookkeeping
            const journalEntryId = await this.createJournalEntries(conn, {
                student_reg_number,
                transaction_type,
                amount,
                description,
                term,
                academic_year,
                class_id,
                hostel_id,
                enrollment_id,
                created_by: req.user.id
            });

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId);

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'CREATE',
                    tableName: 'student_transactions',
                    recordId: transactionId,
                    newValues: {
                        student_reg_number,
                        transaction_type,
                        amount,
                        description,
                        term,
                        academic_year,
                        class_id,
                        hostel_id,
                        enrollment_id
                    }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
            }

            await conn.commit();

            res.status(201).json({
                success: true,
                message: 'Transaction created successfully',
                data: { id: transactionId }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error creating transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create transaction',
                error: error.message
            });
        } finally {
            conn.release();
        }
    }

    // Get transaction by ID
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;

            const [transactions] = await pool.execute(
                `SELECT st.*, 
                        gc.name as class_name,
                        h.name as hostel_name
                 FROM student_transactions st
                 LEFT JOIN gradelevel_classes gc ON st.class_id = gc.id
                 LEFT JOIN hostels h ON st.hostel_id = h.id
                 WHERE st.id = ?`,
                [id]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: transactions[0]
            });
        } catch (error) {
            console.error('Error fetching transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction',
                error: error.message
            });
        }
    }

    // Update transaction (for corrections)
    async updateTransaction(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;
            const {
                description,
                notes
            } = req.body;

            // Check if transaction exists
            const [existing] = await conn.execute(
                'SELECT * FROM student_transactions WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Update transaction
            await conn.execute(
                'UPDATE student_transactions SET description = ?, updated_at = NOW() WHERE id = ?',
                [description, id]
            );

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'UPDATE',
                    tableName: 'student_transactions',
                    recordId: id,
                    oldValues: existing[0],
                    newValues: { description }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
            }

            await conn.commit();

            res.json({
                success: true,
                message: 'Transaction updated successfully'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error updating transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update transaction',
                error: error.message
            });
        } finally {
            conn.release();
        }
    }

    // Reverse transaction (for corrections within grace period)
    async reverseTransaction(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;
            const { reason } = req.body;

            // Get transaction details
            const [transactions] = await conn.execute(
                'SELECT * FROM student_transactions WHERE id = ?',
                [id]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            const transaction = transactions[0];

            // Check if within grace period (30 days)
            const transactionDate = new Date(transaction.transaction_date);
            const currentDate = new Date();
            const daysDifference = (currentDate - transactionDate) / (1000 * 60 * 60 * 24);

            if (daysDifference > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction cannot be reversed after 30 days'
                });
            }

            // Create reversal transaction
            const reversalType = transaction.transaction_type === 'DEBIT' ? 'CREDIT' : 'DEBIT';
            const reversalDescription = `Reversal: ${transaction.description} - ${reason || 'Correction'}`;

            const [result] = await conn.execute(
                `INSERT INTO student_transactions 
                 (student_reg_number, transaction_type, amount, description, term, academic_year, 
                  class_id, hostel_id, enrollment_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [transaction.student_reg_number, reversalType, transaction.amount, reversalDescription,
                 transaction.term, transaction.academic_year, transaction.class_id, 
                 transaction.hostel_id, transaction.enrollment_id, req.user.id]
            );

            const reversalId = result.insertId;

            // Update student balance
            await StudentBalanceService.updateBalanceOnTransaction(transaction.student_reg_number, reversalType, transaction.amount, conn);

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'REVERSE',
                    tableName: 'student_transactions',
                    recordId: reversalId,
                    newValues: {
                        original_transaction_id: id,
                        reversal_type: reversalType,
                        amount: transaction.amount,
                        description: reversalDescription,
                        reason
                    }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
            }

            await conn.commit();

            res.json({
                success: true,
                message: 'Transaction reversed successfully',
                data: { reversal_id: reversalId }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error reversing transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reverse transaction',
                error: error.message
            });
        } finally {
            conn.release();
        }
    }

    // Helper method to create transaction (for use by other controllers)
    async createTransactionHelper(student_reg_number, transaction_type, amount, description, options = {}) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const {
                term,
                academic_year,
                class_id,
                hostel_id,
                enrollment_id,
                created_by
            } = options;

            // Create transaction
            const [result] = await conn.execute(
                `INSERT INTO student_transactions 
                 (student_reg_number, transaction_type, amount, description, term, academic_year, 
                  class_id, hostel_id, enrollment_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student_reg_number, transaction_type, amount, description, term || null, 
                 academic_year || null, class_id || null, hostel_id || null, 
                 enrollment_id || null, created_by]
            );

            const transactionId = result.insertId;

            // Update student balance
            await StudentBalanceService.updateBalanceOnTransaction(student_reg_number, transaction_type, amount, conn);

            await conn.commit();
            return transactionId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // Create journal entries for double-entry bookkeeping
    async createJournalEntries(conn, transactionData) {
        try {
            // Get student name
            const [students] = await conn.execute(
                'SELECT Name, Surname FROM students WHERE RegNumber = ?',
                [transactionData.student_reg_number]
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

            // Determine the other account based on transaction type and context
            let otherAccountId;
            let otherAccountDescription;

            if (transactionData.transaction_type === 'CREDIT') {
                // Money coming in - could be various revenue sources
                if (transactionData.description.toLowerCase().includes('tuition')) {
                    const [revenueAccounts] = await conn.execute(
                        'SELECT id FROM chart_of_accounts WHERE code LIKE ? AND type = ? AND name LIKE ? LIMIT 1',
                        ['4%', 'Revenue', '%tuition%']
                    );
                    otherAccountId = revenueAccounts[0]?.id;
                    otherAccountDescription = 'Tuition fees revenue';
                } else if (transactionData.description.toLowerCase().includes('boarding')) {
                    const [revenueAccounts] = await conn.execute(
                        'SELECT id FROM chart_of_accounts WHERE code LIKE ? AND type = ? AND name LIKE ? LIMIT 1',
                        ['4%', 'Revenue', '%boarding%']
                    );
                    otherAccountId = revenueAccounts[0]?.id;
                    otherAccountDescription = 'Boarding fees revenue';
                } else {
                    // Fallback to any revenue account
                    const [fallbackRevenue] = await conn.execute(
                        'SELECT id FROM chart_of_accounts WHERE type = ? LIMIT 1',
                        ['Revenue']
                    );
                    otherAccountId = fallbackRevenue[0]?.id;
                    otherAccountDescription = 'General revenue';
                }
            } else {
                // DEBIT - money going out - could be various expense sources
                if (transactionData.description.toLowerCase().includes('salary') || transactionData.description.toLowerCase().includes('staff')) {
                    const [expenseAccounts] = await conn.execute(
                        'SELECT id FROM chart_of_accounts WHERE code LIKE ? AND type = ? AND name LIKE ? LIMIT 1',
                        ['5%', 'Expense', '%salary%']
                    );
                    otherAccountId = expenseAccounts[0]?.id;
                    otherAccountDescription = 'Salary expense';
                } else {
                    // Fallback to any expense account
                    const [fallbackExpense] = await conn.execute(
                        'SELECT id FROM chart_of_accounts WHERE type = ? LIMIT 1',
                        ['Expense']
                    );
                    otherAccountId = fallbackExpense[0]?.id;
                    otherAccountDescription = 'General expense';
                }
            }

            if (!otherAccountId) {
                throw new Error('Could not determine appropriate account for journal entry');
            }

            // Create journal entry header
            const [journalResult] = await conn.execute(
                `INSERT INTO journal_entries 
                 (journal_id, entry_date, reference, description) 
                 VALUES (?, ?, ?, ?)`,
                [1, new Date(), `ST-${transactionData.student_reg_number}`, `${transactionData.description} - ${student_name} (${transactionData.student_reg_number})`]
            );

            const journalEntryId = journalResult.insertId;

            // Create journal entry lines
            const journalLines = [];

            if (transactionData.transaction_type === 'CREDIT') {
                // Money coming in: DEBIT Cash, CREDIT Revenue
                journalLines.push(
                    {
                        journal_entry_id: journalEntryId,
                        account_id: cashAccountId,
                        debit_amount: transactionData.amount,
                        credit_amount: 0,
                        description: `Payment received - ${student_name} (${transactionData.student_reg_number})`
                    },
                    {
                        journal_entry_id: journalEntryId,
                        account_id: otherAccountId,
                        debit_amount: 0,
                        credit_amount: transactionData.amount,
                        description: `${otherAccountDescription} - ${student_name} (${transactionData.student_reg_number})`
                    }
                );
            } else {
                // DEBIT: Money going out: DEBIT Expense, CREDIT Cash
                journalLines.push(
                    {
                        journal_entry_id: journalEntryId,
                        account_id: otherAccountId,
                        debit_amount: transactionData.amount,
                        credit_amount: 0,
                        description: `${otherAccountDescription} - ${student_name} (${transactionData.student_reg_number})`
                    },
                    {
                        journal_entry_id: journalEntryId,
                        account_id: cashAccountId,
                        debit_amount: 0,
                        credit_amount: transactionData.amount,
                        description: `Payment made - ${student_name} (${transactionData.student_reg_number})`
                    }
                );
            }

            for (const line of journalLines) {
                await conn.execute(
                    `INSERT INTO journal_entry_lines 
                     (journal_entry_id, account_id, debit, credit, description) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [line.journal_entry_id, line.account_id, line.debit_amount, line.credit_amount, line.description]
                );
            }

            console.log(`Created journal entry ${journalEntryId} for student transaction ${transactionData.student_reg_number}`);
            return journalEntryId;
        } catch (error) {
            console.error('Error creating journal entries:', error);
            throw error;
        }
    }
}

module.exports = new StudentTransactionController();
