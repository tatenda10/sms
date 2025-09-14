const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class StudentBalanceController {
    // Get student balance
    async getStudentBalance(req, res) {
        try {
            const { student_reg_number } = req.params;

            const [balances] = await pool.execute(
                'SELECT * FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            if (balances.length === 0) {
                // Create balance record if it doesn't exist
                await pool.execute(
                    'INSERT INTO student_balances (student_reg_number, current_balance) VALUES (?, 0.00)',
                    [student_reg_number]
                );
                
                return res.json({
                    success: true,
                    data: {
                        student_reg_number,
                        current_balance: 0.00,
                        last_updated: new Date()
                    }
                });
            }

            res.json({
                success: true,
                data: balances[0]
            });
        } catch (error) {
            console.error('Error fetching student balance:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch student balance',
                error: error.message 
            });
        }
    }

    // Update student balance
    async updateStudentBalance(student_reg_number, amount) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Check if balance record exists
            const [existing] = await conn.execute(
                'SELECT * FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            if (existing.length === 0) {
                // Create new balance record
                await conn.execute(
                    'INSERT INTO student_balances (student_reg_number, current_balance) VALUES (?, ?)',
                    [student_reg_number, amount]
                );
            } else {
                // Update existing balance
                await conn.execute(
                    'UPDATE student_balances SET current_balance = current_balance + ?, last_updated = NOW() WHERE student_reg_number = ?',
                    [amount, student_reg_number]
                );
            }

            await conn.commit();
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // Get student statement (transaction history)
    async getStudentStatement(req, res) {
        try {
            const { student_reg_number } = req.params;
            const { page = 1, limit = 50, start_date, end_date } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE student_reg_number = ?';
            let params = [student_reg_number];

            if (start_date) {
                whereClause += ' AND transaction_date >= ?';
                params.push(start_date);
            }

            if (end_date) {
                whereClause += ' AND transaction_date <= ?';
                params.push(end_date);
            }

            // Get total count
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM student_transactions ${whereClause}`,
                params
            );

            const totalRecords = countResult[0].total;

            // Get transactions
            const [transactions] = await pool.execute(
                `SELECT st.*, 
                        gc.name as class_name,
                        h.name as hostel_name
                 FROM student_transactions st
                 LEFT JOIN gradelevel_classes gc ON st.class_id = gc.id
                 LEFT JOIN hostels h ON st.hostel_id = h.id
                 ${whereClause}
                 ORDER BY st.transaction_date DESC, st.id DESC
                 LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            // Get current balance
            const [balanceResult] = await pool.execute(
                'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
                [student_reg_number]
            );

            const currentBalance = balanceResult.length > 0 ? balanceResult[0].current_balance : 0.00;

            res.json({
                success: true,
                data: {
                    student_reg_number,
                    current_balance: currentBalance,
                    transactions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalRecords,
                        totalPages: Math.ceil(totalRecords / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching student statement:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch student statement',
                error: error.message 
            });
        }
    }

    // Get balance summary by term/year
    async getBalanceSummary(req, res) {
        try {
            const { student_reg_number } = req.params;
            const { term, academic_year } = req.query;

            let whereClause = 'WHERE student_reg_number = ?';
            let params = [student_reg_number];

            if (term) {
                whereClause += ' AND term = ?';
                params.push(term);
            }

            if (academic_year) {
                whereClause += ' AND academic_year = ?';
                params.push(academic_year);
            }

            // Get summary by term/year
            const [summary] = await pool.execute(
                `SELECT 
                    term,
                    academic_year,
                    SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as total_debits,
                    SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits,
                    SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE -amount END) as net_amount
                 FROM student_transactions 
                 ${whereClause}
                 GROUP BY term, academic_year
                 ORDER BY academic_year DESC, term`,
                params
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error fetching balance summary:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch balance summary',
                error: error.message 
            });
        }
    }
}

module.exports = new StudentBalanceController();
