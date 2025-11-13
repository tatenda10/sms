const { pool } = require('../config/database');

class StudentBalanceService {
    /**
     * Update student balance when a transaction is created
     * @param {string} student_reg_number - Student registration number
     * @param {string} transaction_type - 'DEBIT' or 'CREDIT'
     * @param {number} amount - Transaction amount
     * @param {object} conn - Database connection (optional, will create new if not provided)
     */
    static async updateBalanceOnTransaction(student_reg_number, transaction_type, amount, conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            // Calculate balance change
            const balanceChange = transaction_type === 'CREDIT' ? amount : -amount;

            // Check if student has a balance record
            const [existingBalance] = await conn.execute(
                'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            if (existingBalance.length > 0) {
                // Update existing balance
                await conn.execute(
                    `UPDATE student_balances 
                     SET current_balance = current_balance + ?, 
                         last_updated = CURRENT_TIMESTAMP 
                     WHERE student_reg_number = ?`,
                    [balanceChange, student_reg_number]
                );
            } else {
                // Create new balance record
                await conn.execute(
                    'INSERT INTO student_balances (student_reg_number, current_balance) VALUES (?, ?)',
                    [student_reg_number, balanceChange]
                );
            }

            console.log(`Updated balance for student ${student_reg_number}: ${transaction_type} ${amount} (change: ${balanceChange})`);
        } catch (error) {
            console.error('Error updating student balance:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Update student balance when a transaction is updated
     * @param {string} student_reg_number - Student registration number
     * @param {string} old_transaction_type - Old transaction type
     * @param {number} old_amount - Old transaction amount
     * @param {string} new_transaction_type - New transaction type
     * @param {number} new_amount - New transaction amount
     * @param {object} conn - Database connection (optional)
     */
    static async updateBalanceOnTransactionUpdate(student_reg_number, old_transaction_type, old_amount, new_transaction_type, new_amount, conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            // Remove old transaction effect
            const oldBalanceChange = old_transaction_type === 'CREDIT' ? old_amount : -old_amount;
            
            // Add new transaction effect
            const newBalanceChange = new_transaction_type === 'CREDIT' ? new_amount : -new_amount;
            
            // Net change
            const netChange = newBalanceChange - oldBalanceChange;

            await conn.execute(
                `UPDATE student_balances 
                 SET current_balance = current_balance + ?, 
                     last_updated = CURRENT_TIMESTAMP 
                 WHERE student_reg_number = ?`,
                [netChange, student_reg_number]
            );

            console.log(`Updated balance for student ${student_reg_number}: net change ${netChange} (old: ${old_transaction_type} ${old_amount}, new: ${new_transaction_type} ${new_amount})`);
        } catch (error) {
            console.error('Error updating student balance on transaction update:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Update student balance when a transaction is deleted
     * @param {string} student_reg_number - Student registration number
     * @param {string} transaction_type - Transaction type
     * @param {number} amount - Transaction amount
     * @param {object} conn - Database connection (optional)
     */
    static async updateBalanceOnTransactionDelete(student_reg_number, transaction_type, amount, conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            // Ensure balance record exists
            await this.ensureBalanceRecord(student_reg_number, conn);

            // Reverse the transaction effect
            // When creating: CREDIT decreases balance (paid), DEBIT increases balance (owed)
            // When deleting: Reverse the effect
            // CREDIT deletion: balance should increase (they no longer get credit)
            // DEBIT deletion: balance should decrease (they no longer owe)
            const balanceChange = transaction_type === 'CREDIT' ? amount : -amount;

            await conn.execute(
                `UPDATE student_balances 
                 SET current_balance = current_balance + ?, 
                     last_updated = CURRENT_TIMESTAMP 
                 WHERE student_reg_number = ?`,
                [balanceChange, student_reg_number]
            );

            console.log(`Updated balance for student ${student_reg_number}: reversed ${transaction_type} ${amount} (change: ${balanceChange})`);
        } catch (error) {
            console.error('Error updating student balance on transaction delete:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Get current balance for a student
     * @param {string} student_reg_number - Student registration number
     * @returns {Promise<number>} Current balance
     */
    static async getCurrentBalance(student_reg_number) {
        const conn = await pool.getConnection();
        try {
            const [balance] = await conn.execute(
                'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            return balance.length > 0 ? balance[0].current_balance : 0;
        } catch (error) {
            console.error('Error getting student balance:', error);
            throw error;
        } finally {
            conn.release();
        }
    }

    /**
     * Ensure student has a balance record (create if doesn't exist)
     * @param {string} student_reg_number - Student registration number
     * @param {object} conn - Database connection (optional)
     */
    static async ensureBalanceRecord(student_reg_number, conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            const [existing] = await conn.execute(
                'SELECT student_reg_number FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            if (existing.length === 0) {
                await conn.execute(
                    'INSERT INTO student_balances (student_reg_number, current_balance) VALUES (?, 0.00)',
                    [student_reg_number]
                );
                console.log(`Created balance record for student: ${student_reg_number}`);
            }
        } catch (error) {
            console.error('Error ensuring balance record:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Recalculate balance for a student from all transactions
     * @param {string} student_reg_number - Student registration number
     * @param {object} conn - Database connection (optional)
     */
    static async recalculateBalance(student_reg_number, conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            // Get all transactions for the student
            const [transactions] = await conn.execute(
                'SELECT transaction_type, amount FROM student_transactions WHERE student_reg_number = ?',
                [student_reg_number]
            );

            // Calculate total balance
            let totalBalance = 0;
            for (const transaction of transactions) {
                if (transaction.transaction_type === 'CREDIT') {
                    totalBalance += parseFloat(transaction.amount);
                } else {
                    totalBalance -= parseFloat(transaction.amount);
                }
            }

            // Update or create balance record
            await conn.execute(
                `INSERT INTO student_balances (student_reg_number, current_balance, last_updated) 
                 VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON DUPLICATE KEY UPDATE 
                     current_balance = VALUES(current_balance),
                     last_updated = CURRENT_TIMESTAMP`,
                [student_reg_number, totalBalance]
            );

            console.log(`Recalculated balance for student ${student_reg_number}: ${totalBalance}`);
            return totalBalance;
        } catch (error) {
            console.error('Error recalculating student balance:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }
}

module.exports = StudentBalanceService;
