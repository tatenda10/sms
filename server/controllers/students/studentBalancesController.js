const { pool } = require('../../config/database');
const StudentTransactionController = require('./studentTransactionController');

class StudentBalancesController {
    // Get all students with outstanding debts (negative balances)
    async getAllStudentsWithDebts(req, res) {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const offset = (page - 1) * limit;

            // Build search conditions
            let whereConditions = ['sb.current_balance < 0'];
            let params = [];

            if (search && search.trim() !== '') {
                whereConditions.push('(s.Name LIKE ? OR s.Surname LIKE ? OR s.RegNumber LIKE ?)');
                const searchTerm = `%${search.trim()}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Get students with outstanding debts
            const [students] = await pool.execute(`
                SELECT 
                    s.RegNumber,
                    s.Name,
                    s.Surname,
                    s.Gender,
                    sb.current_balance,
                    sb.last_updated,
                    (SELECT COUNT(*) FROM student_transactions st WHERE st.student_reg_number = s.RegNumber) as transaction_count,
                    (SELECT MAX(transaction_date) FROM student_transactions st WHERE st.student_reg_number = s.RegNumber) as last_transaction_date
                FROM students s
                INNER JOIN student_balances sb ON s.RegNumber = sb.student_reg_number
                ${whereClause}
                ORDER BY sb.current_balance ASC, s.Name, s.Surname
                LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
            `, params);

            // Get total count for pagination
            const [countResult] = await pool.execute(`
                SELECT COUNT(*) as total
                FROM students s
                INNER JOIN student_balances sb ON s.RegNumber = sb.student_reg_number
                ${whereClause}
            `, params);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / parseInt(limit));

            // Get total outstanding debt
            const [totalDebtResult] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_students_with_debt,
                    COALESCE(SUM(ABS(sb.current_balance)), 0) as total_outstanding_debt
                FROM students s
                INNER JOIN student_balances sb ON s.RegNumber = sb.student_reg_number
                WHERE sb.current_balance < 0
            `);

            const summary = totalDebtResult[0];

            res.json({
                success: true,
                data: students,
                summary: {
                    total_students_with_debt: summary.total_students_with_debt,
                    total_outstanding_debt: parseFloat(summary.total_outstanding_debt),
                    total_students: total
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalStudents: total,
                    limit: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPreviousPage: parseInt(page) > 1
                }
            });

        } catch (error) {
            console.error('Error fetching students with debts:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch students with outstanding debts',
                error: error.message 
            });
        }
    }

    // Get outstanding debt summary
    async getOutstandingDebtSummary(req, res) {
        try {
            // Get total outstanding debt
            const [summaryResult] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_students_with_debt,
                    COALESCE(SUM(ABS(sb.current_balance)), 0) as total_outstanding_debt,
                    COALESCE(AVG(ABS(sb.current_balance)), 0) as average_debt_per_student,
                    COALESCE(MAX(ABS(sb.current_balance)), 0) as highest_debt
                FROM students s
                INNER JOIN student_balances sb ON s.RegNumber = sb.student_reg_number
                WHERE sb.current_balance < 0
            `);

            // Get debt distribution by amount ranges
            const [debtDistribution] = await pool.execute(`
                SELECT 
                    CASE 
                        WHEN ABS(sb.current_balance) < 100 THEN 'Under $100'
                        WHEN ABS(sb.current_balance) < 500 THEN '$100 - $500'
                        WHEN ABS(sb.current_balance) < 1000 THEN '$500 - $1,000'
                        WHEN ABS(sb.current_balance) < 2000 THEN '$1,000 - $2,000'
                        ELSE 'Over $2,000'
                    END as debt_range,
                    COUNT(*) as student_count,
                    COALESCE(SUM(ABS(sb.current_balance)), 0) as total_amount
                FROM students s
                INNER JOIN student_balances sb ON s.RegNumber = sb.student_reg_number
                WHERE sb.current_balance < 0
                GROUP BY 
                    CASE 
                        WHEN ABS(sb.current_balance) < 100 THEN 'Under $100'
                        WHEN ABS(sb.current_balance) < 500 THEN '$100 - $500'
                        WHEN ABS(sb.current_balance) < 1000 THEN '$500 - $1,000'
                        WHEN ABS(sb.current_balance) < 2000 THEN '$1,000 - $2,000'
                        ELSE 'Over $2,000'
                    END
            `);

            const summary = summaryResult[0];

            res.json({
                success: true,
                data: {
                    total_students_with_debt: summary.total_students_with_debt,
                    total_outstanding_debt: parseFloat(summary.total_outstanding_debt),
                    average_debt_per_student: parseFloat(summary.average_debt_per_student),
                    highest_debt: parseFloat(summary.highest_debt),
                    debt_distribution: debtDistribution
                }
            });

        } catch (error) {
            console.error('Error fetching outstanding debt summary:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch outstanding debt summary',
                error: error.message 
            });
        }
    }

    // Manual balance adjustment
    async manualBalanceAdjustment(req, res) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const { student_id, adjustment_type, amount, description, reference } = req.body;
            
            // Validate required fields
            if (!student_id || !adjustment_type || !amount || !description) {
                return res.status(400).json({ 
                    error: 'Missing required fields: student_id, adjustment_type, amount, description' 
                });
            }
            
            if (!['debit', 'credit'].includes(adjustment_type)) {
                return res.status(400).json({ 
                    error: 'adjustment_type must be either "debit" or "credit"' 
                });
            }
            
            if (parseFloat(amount) <= 0) {
                return res.status(400).json({ 
                    error: 'Amount must be greater than 0' 
                });
            }
            
            // Get student details - using RegNumber as the identifier
            const [students] = await connection.execute(
                'SELECT RegNumber, Name, Surname FROM students WHERE RegNumber = ?',
                [student_id]
            );
            
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }
            
            const student = students[0];
            
            // Get current balance - using RegNumber to match student_balances
            const [balanceRows] = await connection.execute(
                'SELECT current_balance FROM student_balances WHERE student_reg_number = ?',
                [student_id]
            );
            
            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;
            
            // Calculate new balance
            const adjustmentAmount = parseFloat(amount);
            const newBalance = adjustment_type === 'debit' 
                ? currentBalance - adjustmentAmount  // Debit increases what student owes (more negative)
                : currentBalance + adjustmentAmount; // Credit decreases what student owes (less negative)
            
            // Generate reference if not provided
            const finalReference = reference || `MBU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            // Update student balance
            if (balanceRows.length > 0) {
                await connection.execute(
                    'UPDATE student_balances SET current_balance = ?, last_updated = NOW() WHERE student_reg_number = ?',
                    [newBalance, student_id]
                );
            } else {
                await connection.execute(
                    'INSERT INTO student_balances (student_reg_number, current_balance, last_updated) VALUES (?, ?, NOW())',
                    [student_id, newBalance]
                );
            }
            
            // Create student transaction record
            const transactionType = adjustment_type.toUpperCase();
            const transactionDescription = `MANUAL BALANCE ADJUSTMENT - ${description} - ${finalReference}`;
            
            await connection.execute(`
                INSERT INTO student_transactions (
                    student_reg_number, transaction_type, amount, description, 
                    term, academic_year, transaction_date, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())
            `, [
                student.RegNumber,
                transactionType,
                adjustmentAmount,
                transactionDescription,
                null, // term
                null, // academic_year
                req.user?.id || 1 // created_by
            ]);
            
            await connection.commit();
            
            res.json({
                message: 'Balance adjustment recorded successfully',
                data: {
                    student_id,
                    student_name: `${student.Name} ${student.Surname}`,
                    registration_number: student.RegNumber,
                    adjustment_type,
                    amount: adjustmentAmount,
                    reference: finalReference
                }
            });
            
        } catch (error) {
            await connection.rollback();
            console.error('Error in manual balance adjustment:', error);
            res.status(500).json({ 
                error: 'Failed to process balance adjustment',
                details: error.message 
            });
        } finally {
            connection.release();
        }
    }
}

module.exports = new StudentBalancesController();
