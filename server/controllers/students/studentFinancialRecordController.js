const { pool } = require('../../config/database');

class StudentFinancialRecordController {
    // Get student financial summary with DR/CR balance
    async getStudentFinancialSummary(req, res) {
        try {
            const { student_reg_number } = req.params;

            // Get student information
            const [studentInfo] = await pool.execute(
                `SELECT s.Name, s.Surname, s.RegNumber
                 FROM students s 
                 WHERE s.RegNumber = ?`,
                [student_reg_number]
            );

            if (studentInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Get fee payments (CREDIT - what student has paid)
            const [feePaymentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_payments,
                    COALESCE(SUM(base_currency_amount), 0) as total_paid_amount,
                    COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) as completed_payments,
                    COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_payments
                 FROM fee_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get boarding fee payments (CREDIT - what student has paid for boarding)
            const [boardingPaymentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_payments,
                    COALESCE(SUM(base_currency_amount), 0) as total_paid_amount,
                    COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) as completed_payments,
                    COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_payments
                 FROM boarding_fees_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get student transactions for DEBIT amounts (what student owes)
            const [debitTransactions] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_debits,
                    COALESCE(SUM(amount), 0) as total_debit_amount
                 FROM student_transactions 
                 WHERE student_reg_number = ? AND transaction_type = 'DEBIT'`,
                [student_reg_number]
            );

            // Get current balance from student_balances table
            const [studentBalance] = await pool.execute(
                `SELECT current_balance, last_updated 
                 FROM student_balances 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            const currentBalance = studentBalance.length > 0 ? studentBalance[0].current_balance : 0;
            const lastUpdated = studentBalance.length > 0 ? studentBalance[0].last_updated : null;

            // Calculate totals for frontend
            const totalDebit = parseFloat(debitTransactions[0].total_debit_amount || 0);
            const totalCredit = parseFloat(feePaymentsSummary[0].total_paid_amount || 0) + 
                               parseFloat(boardingPaymentsSummary[0].total_paid_amount || 0);
            
            // Use the current balance from student_balances table as the authoritative source
            const outstandingBalance = currentBalance;

            const financialData = {
                student_info: studentInfo[0],
                // Frontend expected fields
                total_outstanding: outstandingBalance,
                total_paid: totalCredit,
                total_invoiced: totalDebit,
                balance: currentBalance, // Use the current balance from student_balances table
                // Additional data for reference
                total_debit: totalDebit,
                total_credit: totalCredit,
                currency: 'USD',
                last_updated: lastUpdated || new Date().toISOString()
            };

            res.json({
                success: true,
                data: financialData
            });
        } catch (error) {
            console.error('Error fetching financial summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch financial summary',
                error: error.message
            });
        }
    }

    // Get student transactions with DR/CR columns
    async getStudentTransactions(req, res) {
        try {
            const { student_reg_number } = req.params;
            const { page = 1, limit = 100, start_date, end_date, transaction_type } = req.query;

            const offset = (page - 1) * limit;
            let allTransactions = [];

            // Get fee payments (CREDIT transactions)
            let feePaymentsWhere = 'WHERE fp.student_reg_number = ?';
            let feePaymentsParams = [student_reg_number];

            if (start_date) {
                feePaymentsWhere += ' AND DATE(fp.payment_date) >= ?';
                feePaymentsParams.push(start_date);
            }
            if (end_date) {
                feePaymentsWhere += ' AND DATE(fp.payment_date) <= ?';
                feePaymentsParams.push(end_date);
            }
            if (transaction_type && transaction_type !== 'all' && transaction_type !== 'tuition') {
                feePaymentsWhere += ' AND 1=0'; // Don't include fee payments
            }

            const [feePayments] = await pool.execute(
                `SELECT 
                    fp.id,
                    fp.student_reg_number,
                    'tuition' as fee_type,
                    fp.base_currency_amount as amount,
                    fp.notes,
                    fp.payment_date,
                    fp.created_at,
                    fp.reference_number,
                    fp.payment_method,
                    LOWER(fp.status) as status,
                    'USD' as currency_symbol,
                    'CREDIT' as transaction_type
                 FROM fee_payments fp
                 ${feePaymentsWhere}
                 ORDER BY fp.payment_date DESC`,
                feePaymentsParams
            );

            // Get boarding fee payments (CREDIT transactions)
            let boardingPaymentsWhere = 'WHERE bfp.student_reg_number = ?';
            let boardingPaymentsParams = [student_reg_number];

            if (start_date) {
                boardingPaymentsWhere += ' AND DATE(bfp.payment_date) >= ?';
                boardingPaymentsParams.push(start_date);
            }
            if (end_date) {
                boardingPaymentsWhere += ' AND DATE(bfp.payment_date) <= ?';
                boardingPaymentsParams.push(end_date);
            }
            if (transaction_type && transaction_type !== 'all' && transaction_type !== 'boarding') {
                boardingPaymentsWhere += ' AND 1=0'; // Don't include boarding payments
            }

            const [boardingPayments] = await pool.execute(
                `SELECT 
                    bfp.id,
                    bfp.student_reg_number,
                    'boarding' as fee_type,
                    bfp.base_currency_amount as amount,
                    bfp.notes,
                    bfp.payment_date,
                    bfp.created_at,
                    bfp.reference_number,
                    bfp.payment_method,
                    LOWER(bfp.status) as status,
                    'USD' as currency_symbol,
                    'CREDIT' as transaction_type
                 FROM boarding_fees_payments bfp
                 ${boardingPaymentsWhere}
                 ORDER BY bfp.payment_date DESC`,
                boardingPaymentsParams
            );

            // Get boarding enrollments (DEBIT transactions - invoices)
            let boardingEnrollmentsWhere = 'WHERE be.student_reg_number = ?';
            let boardingEnrollmentsParams = [student_reg_number];

            if (start_date) {
                boardingEnrollmentsWhere += ' AND DATE(be.enrollment_date) >= ?';
                boardingEnrollmentsParams.push(start_date);
            }
            if (end_date) {
                boardingEnrollmentsWhere += ' AND DATE(be.enrollment_date) <= ?';
                boardingEnrollmentsParams.push(end_date);
            }
            if (transaction_type && transaction_type !== 'all' && transaction_type !== 'boarding') {
                boardingEnrollmentsWhere += ' AND 1=0'; // Don't include boarding enrollments
            }

            const [boardingEnrollments] = await pool.execute(
                `SELECT 
                    be.id,
                    be.student_reg_number,
                    'boarding' as fee_type,
                    COALESCE(bf.amount, 0) as amount,
                    CONCAT('BOARDING INVOICE - ', h.name, ' (', be.term, ' ', be.academic_year, ')') as notes,
                    be.enrollment_date as payment_date,
                    be.created_at,
                    CONCAT('BOARDING-', be.id) as reference_number,
                    'Enrollment' as payment_method,
                    'pending' as status,
                    'USD' as currency_symbol,
                    'DEBIT' as transaction_type,
                    be.term,
                    be.academic_year,
                    h.name as hostel_name,
                    NULL as class_name,
                    bf.id as boarding_fee_id,
                    bf.term as boarding_fee_term
                 FROM boarding_enrollments be
                 LEFT JOIN boarding_fees bf ON be.hostel_id = bf.hostel_id 
                    AND (be.term = bf.term OR be.term = REGEXP_REPLACE(bf.term, 'Term\\s*', '') OR CONCAT('Term ', be.term) = bf.term)
                    AND be.academic_year = bf.academic_year 
                    AND bf.is_active = TRUE
                 LEFT JOIN hostels h ON be.hostel_id = h.id
                 ${boardingEnrollmentsWhere}
                 ORDER BY be.enrollment_date DESC`,
                boardingEnrollmentsParams
            );

            // Debug logging for boarding enrollments
            console.log('=== BOARDING ENROLLMENTS DEBUG ===');
            console.log('Student:', student_reg_number);
            console.log('Total boarding enrollments found:', boardingEnrollments.length);
            boardingEnrollments.forEach((enrollment, index) => {
                console.log(`Enrollment ${index + 1}:`, {
                    id: enrollment.id,
                    student_reg_number: enrollment.student_reg_number,
                    amount: enrollment.amount,
                    term: enrollment.term,
                    academic_year: enrollment.academic_year,
                    hostel_name: enrollment.hostel_name,
                    boarding_fee_id: enrollment.boarding_fee_id,
                    boarding_fee_term: enrollment.boarding_fee_term,
                    notes: enrollment.notes
                });
            });
            console.log('=== END BOARDING ENROLLMENTS DEBUG ===');

            // Get class enrollments (DEBIT transactions - invoices)
            let classEnrollmentsWhere = 'WHERE e.student_regnumber = ?';
            let classEnrollmentsParams = [student_reg_number];

            if (start_date) {
                classEnrollmentsWhere += ' AND DATE(CURRENT_TIMESTAMP) >= ?';
                classEnrollmentsParams.push(start_date);
            }
            if (end_date) {
                classEnrollmentsWhere += ' AND DATE(CURRENT_TIMESTAMP) <= ?';
                classEnrollmentsParams.push(end_date);
            }
            if (transaction_type && transaction_type !== 'all' && transaction_type !== 'tuition') {
                classEnrollmentsWhere += ' AND 1=0'; // Don't include class enrollments
            }

            const [classEnrollments] = await pool.execute(
                `SELECT 
                    e.id,
                    e.student_regnumber as student_reg_number,
                    'tuition' as fee_type,
                    COALESCE((
                        SELECT total_amount 
                        FROM invoice_structures 
                        WHERE gradelevel_class_id = e.gradelevel_class_id 
                        ORDER BY academic_year DESC, term DESC 
                        LIMIT 1
                    ), 0) as amount,
                    CONCAT('TUITION INVOICE - ', gc.name, ' (', s.name, ')') as notes,
                    e.enrollment_date as payment_date,
                    e.enrollment_date as created_at,
                    CONCAT('TUITION-', e.id) as reference_number,
                    'Enrollment' as payment_method,
                    'pending' as status,
                    'USD' as currency_symbol,
                    'DEBIT' as transaction_type,
                    CASE 
                        WHEN (
                            SELECT term 
                            FROM invoice_structures 
                            WHERE gradelevel_class_id = e.gradelevel_class_id 
                            ORDER BY academic_year DESC, term DESC 
                            LIMIT 1
                        ) IS NOT NULL THEN
                            REGEXP_REPLACE((
                                SELECT term 
                                FROM invoice_structures 
                                WHERE gradelevel_class_id = e.gradelevel_class_id 
                                ORDER BY academic_year DESC, term DESC 
                                LIMIT 1
                            ), 'Term\\s*', '')
                        ELSE NULL
                    END as term,
                    COALESCE((
                        SELECT academic_year 
                        FROM invoice_structures 
                        WHERE gradelevel_class_id = e.gradelevel_class_id 
                        ORDER BY academic_year DESC, term DESC 
                        LIMIT 1
                    ), NULL) as academic_year,
                    NULL as hostel_name,
                    gc.name as class_name
                 FROM enrollments_gradelevel_classes e
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 ${classEnrollmentsWhere}
                 ORDER BY e.id DESC`,
                classEnrollmentsParams
            );

            // Get student transactions (DEBIT transactions) - exclude those that are already covered by enrollments
            let debitTransactionsWhere = 'WHERE st.student_reg_number = ? AND st.transaction_type = "DEBIT"';
            let debitTransactionsParams = [student_reg_number];

            if (start_date) {
                debitTransactionsWhere += ' AND DATE(st.transaction_date) >= ?';
                debitTransactionsParams.push(start_date);
            }
            if (end_date) {
                debitTransactionsWhere += ' AND DATE(st.transaction_date) <= ?';
                debitTransactionsParams.push(end_date);
            }

            const [debitTransactions] = await pool.execute(
                `SELECT 
                    st.id,
                    st.student_reg_number,
                    CASE 
                        WHEN st.description LIKE '%Boarding%' THEN 'boarding'
                        WHEN st.description LIKE '%Class%' THEN 'tuition'
                        WHEN st.description LIKE '%Transport%' THEN 'transport'
                        WHEN st.description LIKE '%Uniform%' THEN 'uniform'
                        ELSE 'other'
                    END as fee_type,
                    st.amount,
                    st.description as notes,
                    st.transaction_date as payment_date,
                    st.transaction_date as created_at,
                    CONCAT('TRANSACTION-', st.id) as reference_number,
                    'Enrollment' as payment_method,
                    'paid' as status,
                    'USD' as currency_symbol,
                    'DEBIT' as transaction_type,
                    st.term,
                    st.academic_year,
                    NULL as hostel_name,
                    NULL as class_name
                 FROM student_transactions st
                 ${debitTransactionsWhere}
                 AND st.enrollment_id IS NULL  -- Only get transactions not linked to enrollments
                 ORDER BY st.transaction_date DESC`,
                debitTransactionsParams
            );

            // Get student transactions (CREDIT transactions) - includes transport payments and other payments
            let creditTransactionsWhere = 'WHERE st.student_reg_number = ? AND st.transaction_type = "CREDIT"';
            let creditTransactionsParams = [student_reg_number];

            if (start_date) {
                creditTransactionsWhere += ' AND DATE(st.transaction_date) >= ?';
                creditTransactionsParams.push(start_date);
            }
            if (end_date) {
                creditTransactionsWhere += ' AND DATE(st.transaction_date) <= ?';
                creditTransactionsParams.push(end_date);
            }

            const [creditTransactions] = await pool.execute(
                `SELECT 
                    st.id,
                    st.student_reg_number,
                    CASE 
                        WHEN st.description LIKE '%Transport Payment%' THEN 'transport'
                        WHEN st.description LIKE '%Fee Payment%' THEN 'tuition'
                        WHEN st.description LIKE '%Uniform%' THEN 'uniform'
                        WHEN st.description LIKE '%Boarding%' THEN 'boarding'
                        ELSE 'other'
                    END as fee_type,
                    st.amount,
                    st.description as notes,
                    st.transaction_date as payment_date,
                    st.transaction_date as created_at,
                    CONCAT('TRANSACTION-', st.id) as reference_number,
                    'Payment' as payment_method,
                    'paid' as status,
                    'USD' as currency_symbol,
                    'CREDIT' as transaction_type,
                    st.term,
                    st.academic_year,
                    NULL as hostel_name,
                    NULL as class_name
                 FROM student_transactions st
                 ${creditTransactionsWhere}
                 ORDER BY st.transaction_date DESC`,
                creditTransactionsParams
            );

            // Combine all transactions
            allTransactions = [...feePayments, ...boardingPayments, ...boardingEnrollments, ...classEnrollments, ...debitTransactions, ...creditTransactions];
            
            // Remove duplicates based on content similarity
            const seenTransactions = new Set();
            allTransactions = allTransactions.filter(transaction => {
                // Create a unique key for each transaction based on content
                const key = `${transaction.transaction_type}-${transaction.amount}-${transaction.notes?.substring(0, 50)}-${transaction.payment_date}`;
                
                if (seenTransactions.has(key)) {
                    console.log('Removing duplicate transaction:', {
                        id: transaction.id,
                        transaction_type: transaction.transaction_type,
                        amount: transaction.amount,
                        notes: transaction.notes,
                        payment_date: transaction.payment_date
                    });
                    return false;
                }
                
                seenTransactions.add(key);
                return true;
            });
            
            // Sort by date
            allTransactions.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

            // Calculate running balance
            let runningBalance = 0;
            allTransactions = allTransactions.map(t => {
                if (t.transaction_type === 'CREDIT') {
                    runningBalance += parseFloat(t.amount || 0);
                } else if (t.transaction_type === 'DEBIT') {
                    runningBalance -= parseFloat(t.amount || 0);
                }
                return {
                    ...t,
                    running_balance: runningBalance
                };
            });

            // Apply pagination
            const total = allTransactions.length;
            const paginatedTransactions = allTransactions.slice(offset, offset + parseInt(limit));

            // Format transactions to match frontend expectations
            const formattedTransactions = paginatedTransactions.map(t => ({
                id: t.id,
                student_reg_number: t.student_reg_number,
                fee_type: t.fee_type,
                amount: parseFloat(t.amount || 0),
                notes: t.notes,
                payment_date: t.payment_date,
                created_at: t.created_at,
                reference_number: t.reference_number,
                payment_method: t.payment_method,
                status: t.status,
                currency_symbol: t.currency_symbol,
                transaction_type: t.transaction_type, // Add this field
                running_balance: t.running_balance,
                term: t.term,
                academic_year: t.academic_year,
                hostel_name: t.hostel_name,
                class_name: t.class_name
            }));

            res.json({
                success: true,
                data: formattedTransactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching student transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch student transactions',
                error: error.message
            });
        }
    }

    // Get student financial statement (comprehensive report)
    async getStudentFinancialStatement(req, res) {
        try {
            const { student_reg_number } = req.params;
            const { include_transactions = true, limit = 50 } = req.query;

            // Get student information
            const [studentInfo] = await pool.execute(
                `SELECT s.Name, s.Surname, s.RegNumber
                 FROM students s 
                 WHERE s.RegNumber = ?`,
                [student_reg_number]
            );

            if (studentInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Get fee payments summary (CREDIT)
            const [feePaymentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_payments,
                    COALESCE(SUM(base_currency_amount), 0) as total_paid_amount,
                    COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) as completed_payments,
                    COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_payments
                 FROM fee_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get boarding payments summary (CREDIT)
            const [boardingPaymentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_payments,
                    COALESCE(SUM(base_currency_amount), 0) as total_paid_amount,
                    COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) as completed_payments,
                    COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_payments
                 FROM boarding_fees_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get boarding enrollments summary (DEBIT)
            const [boardingEnrollmentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_enrollments,
                    COALESCE(SUM(bf.amount), 0) as total_charged,
                    COUNT(CASE WHEN be.status = 'enrolled' THEN 1 END) as active_enrollments,
                    COUNT(CASE WHEN be.status = 'checked_in' THEN 1 END) as checked_in_enrollments
                 FROM boarding_enrollments be
                 LEFT JOIN boarding_fees bf ON be.hostel_id = bf.hostel_id 
                    AND be.term = bf.term 
                    AND be.academic_year = bf.academic_year 
                    AND bf.is_active = TRUE
                 WHERE be.student_reg_number = ?`,
                [student_reg_number]
            );

            // Get class enrollments summary (DEBIT)
            const [classEnrollmentsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_enrollments,
                    COALESCE(SUM((
                        SELECT total_amount 
                        FROM invoice_structures 
                        WHERE gradelevel_class_id = e.gradelevel_class_id 
                        ORDER BY academic_year DESC, term DESC 
                        LIMIT 1
                    )), 0) as total_charged,
                    COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_enrollments
                 FROM enrollments_gradelevel_classes e
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                 WHERE e.student_regnumber = ?`,
                [student_reg_number]
            );

            // Get debit transactions summary (additional DEBIT)
            const [debitTransactionsSummary] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_debits,
                    COALESCE(SUM(amount), 0) as total_debit_amount
                 FROM student_transactions 
                 WHERE student_reg_number = ? AND transaction_type = 'DEBIT'`,
                [student_reg_number]
            );

            const totalDebit = parseFloat(boardingEnrollmentsSummary[0].total_charged || 0) + 
                              parseFloat(classEnrollmentsSummary[0].total_charged || 0) + 
                              parseFloat(debitTransactionsSummary[0].total_debit_amount || 0);
            const totalCredit = parseFloat(feePaymentsSummary[0].total_paid_amount || 0) + 
                               parseFloat(boardingPaymentsSummary[0].total_paid_amount || 0);
            const outstandingBalance = totalDebit - totalCredit;

            let statement = {
                student_info: studentInfo[0],
                financial_summary: {
                    total_debit: totalDebit,
                    total_credit: totalCredit,
                    outstanding_balance: outstandingBalance,
                    currency: 'USD'
                },
                fee_payments_summary: {
                    total_payments: feePaymentsSummary[0].total_payments,
                    total_paid_amount: parseFloat(feePaymentsSummary[0].total_paid_amount || 0),
                    completed_payments: feePaymentsSummary[0].completed_payments,
                    pending_payments: feePaymentsSummary[0].pending_payments
                },
                boarding_payments_summary: {
                    total_payments: boardingPaymentsSummary[0].total_payments,
                    total_paid_amount: parseFloat(boardingPaymentsSummary[0].total_paid_amount || 0),
                    completed_payments: boardingPaymentsSummary[0].completed_payments,
                    pending_payments: boardingPaymentsSummary[0].pending_payments
                },
                boarding_enrollments_summary: {
                    total_enrollments: boardingEnrollmentsSummary[0].total_enrollments,
                    total_charged: parseFloat(boardingEnrollmentsSummary[0].total_charged || 0),
                    active_enrollments: boardingEnrollmentsSummary[0].active_enrollments,
                    checked_in_enrollments: boardingEnrollmentsSummary[0].checked_in_enrollments
                },
                class_enrollments_summary: {
                    total_enrollments: classEnrollmentsSummary[0].total_enrollments,
                    total_charged: parseFloat(classEnrollmentsSummary[0].total_charged || 0),
                    active_enrollments: classEnrollmentsSummary[0].active_enrollments
                },
                debit_transactions_summary: {
                    total_debits: debitTransactionsSummary[0].total_debits,
                    total_debit_amount: parseFloat(debitTransactionsSummary[0].total_debit_amount || 0)
                },
                generated_at: new Date().toISOString()
            };

            // Include recent transactions if requested
            if (include_transactions === 'true') {
                // Get recent fee payments
                const [recentFeePayments] = await pool.execute(
                    `SELECT 
                        fp.id,
                        'CREDIT' as transaction_type,
                        fp.base_currency_amount as amount,
                        CONCAT('Fee Payment - ', fp.payment_method, ' - Receipt #', fp.receipt_number) as description,
                        fp.payment_date as transaction_date,
                        fp.created_at,
                        NULL as term,
                        NULL as academic_year,
                        NULL as class_name,
                        NULL as hostel_name
                     FROM fee_payments fp
                     WHERE fp.student_reg_number = ?
                     ORDER BY fp.payment_date DESC
                     LIMIT ?`,
                    [student_reg_number, parseInt(limit)]
                );

                // Get recent boarding payments
                const [recentBoardingPayments] = await pool.execute(
                    `SELECT 
                        bfp.id,
                        'CREDIT' as transaction_type,
                        bfp.base_currency_amount as amount,
                        CONCAT('Boarding Payment - ', bfp.payment_method, ' - Receipt #', bfp.receipt_number) as description,
                        bfp.payment_date as transaction_date,
                        bfp.created_at,
                        bfp.term,
                        bfp.academic_year,
                        NULL as class_name,
                        NULL as hostel_name
                     FROM boarding_fees_payments bfp
                     WHERE bfp.student_reg_number = ?
                     ORDER BY bfp.payment_date DESC
                     LIMIT ?`,
                    [student_reg_number, parseInt(limit)]
                );

                // Get recent boarding enrollments (invoices)
                const [recentBoardingEnrollments] = await pool.execute(
                    `SELECT 
                        be.id,
                        'DEBIT' as transaction_type,
                        COALESCE(bf.amount, 0) as amount,
                        CONCAT('BOARDING INVOICE - ', h.name, ' (', be.term, ' ', be.academic_year, ')') as description,
                        be.enrollment_date as transaction_date,
                        be.created_at,
                        be.term,
                        be.academic_year,
                        NULL as class_name,
                        h.name as hostel_name
                     FROM boarding_enrollments be
                     LEFT JOIN boarding_fees bf ON be.hostel_id = bf.hostel_id 
                        AND be.term = bf.term 
                        AND be.academic_year = bf.academic_year 
                        AND bf.is_active = TRUE
                     LEFT JOIN hostels h ON be.hostel_id = h.id
                     WHERE be.student_reg_number = ?
                     ORDER BY be.enrollment_date DESC
                     LIMIT ?`,
                    [student_reg_number, parseInt(limit)]
                );

                // Get recent class enrollments (invoices)
                const [recentClassEnrollments] = await pool.execute(
                    `SELECT 
                        e.id,
                        'DEBIT' as transaction_type,
                        COALESCE((
                            SELECT total_amount 
                            FROM invoice_structures 
                            WHERE gradelevel_class_id = e.gradelevel_class_id 
                            ORDER BY academic_year DESC, term DESC 
                            LIMIT 1
                        ), 0) as amount,
                        CONCAT('TUITION INVOICE - ', gc.name, ' (', s.name, ')') as description,
                        e.enrollment_date as transaction_date,
                        e.enrollment_date as created_at,
                        CASE 
                            WHEN (
                                SELECT term 
                                FROM invoice_structures 
                                WHERE gradelevel_class_id = e.gradelevel_class_id 
                                ORDER BY academic_year DESC, term DESC 
                                LIMIT 1
                            ) IS NOT NULL THEN
                                REGEXP_REPLACE((
                                    SELECT term 
                                    FROM invoice_structures 
                                    WHERE gradelevel_class_id = e.gradelevel_class_id 
                                    ORDER BY academic_year DESC, term DESC 
                                    LIMIT 1
                                ), 'Term\\s*', '')
                            ELSE NULL
                        END as term,
                        COALESCE((
                            SELECT academic_year 
                            FROM invoice_structures 
                            WHERE gradelevel_class_id = e.gradelevel_class_id 
                            ORDER BY academic_year DESC, term DESC 
                            LIMIT 1
                        ), NULL) as academic_year,
                        gc.name as class_name,
                        NULL as hostel_name
                     FROM enrollments_gradelevel_classes e
                     LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                     LEFT JOIN stream s ON gc.stream_id = s.id
                     WHERE e.student_regnumber = ?
                     ORDER BY e.id DESC
                     LIMIT ?`,
                    [student_reg_number, parseInt(limit)]
                );

                // Get recent debit transactions
                const [recentDebitTransactions] = await pool.execute(
                    `SELECT 
                        st.id,
                        'DEBIT' as transaction_type,
                        st.amount,
                        st.description,
                        st.transaction_date,
                        st.transaction_date as created_at,
                        NULL as term,
                        NULL as academic_year,
                        NULL as class_name,
                        NULL as hostel_name
                     FROM student_transactions st
                     WHERE st.student_reg_number = ? AND st.transaction_type = 'DEBIT'
                     ORDER BY st.transaction_date DESC
                     LIMIT ?`,
                    [student_reg_number, parseInt(limit)]
                );

                // Combine and sort recent transactions
                let recentTransactions = [...recentFeePayments, ...recentBoardingPayments, ...recentBoardingEnrollments, ...recentClassEnrollments, ...recentDebitTransactions];
                recentTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

                // Calculate running balance for recent transactions
                let runningBalance = 0;
                statement.recent_transactions = recentTransactions.map(t => {
                    if (t.transaction_type === 'CREDIT') {
                        runningBalance += parseFloat(t.amount || 0);
                    } else if (t.transaction_type === 'DEBIT') {
                        runningBalance -= parseFloat(t.amount || 0);
                    }
                    return {
                        id: t.id,
                        transaction_type: t.transaction_type,
                        debit_amount: t.transaction_type === 'DEBIT' ? parseFloat(t.amount || 0) : 0,
                        credit_amount: t.transaction_type === 'CREDIT' ? parseFloat(t.amount || 0) : 0,
                        description: t.description,
                        term: t.term,
                        academic_year: t.academic_year,
                        class_name: t.class_name,
                        hostel_name: t.hostel_name,
                        transaction_date: t.transaction_date,
                        created_at: t.created_at,
                        running_balance: runningBalance
                    };
                });
            }

            res.json({
                success: true,
                data: statement
            });
        } catch (error) {
            console.error('Error generating financial statement:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate financial statement',
                error: error.message
            });
        }
    }

    // Get student outstanding balance
    async getStudentOutstandingBalance(req, res) {
        try {
            const { student_reg_number } = req.params;

            // Get student info
            const [studentInfo] = await pool.execute(
                `SELECT s.Name, s.Surname, s.RegNumber
                 FROM students s 
                 WHERE s.RegNumber = ?`,
                [student_reg_number]
            );

            // Get fee payments total (CREDIT)
            const [feePaymentsTotal] = await pool.execute(
                `SELECT COALESCE(SUM(base_currency_amount), 0) as total_paid
                 FROM fee_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get boarding payments total (CREDIT)
            const [boardingPaymentsTotal] = await pool.execute(
                `SELECT COALESCE(SUM(base_currency_amount), 0) as total_paid
                 FROM boarding_fees_payments 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            // Get boarding enrollments total (DEBIT)
            const [boardingEnrollmentsTotal] = await pool.execute(
                `SELECT COALESCE(SUM(bf.amount), 0) as total_charged
                 FROM boarding_enrollments be
                 LEFT JOIN boarding_fees bf ON be.hostel_id = bf.hostel_id 
                    AND be.term = bf.term 
                    AND be.academic_year = bf.academic_year 
                    AND bf.is_active = TRUE
                 WHERE be.student_reg_number = ?`,
                [student_reg_number]
            );

            // Get class enrollments total (DEBIT)
            const [classEnrollmentsTotal] = await pool.execute(
                `SELECT COALESCE(SUM((
                    SELECT total_amount 
                    FROM invoice_structures 
                    WHERE gradelevel_class_id = e.gradelevel_class_id 
                    ORDER BY academic_year DESC, term DESC 
                    LIMIT 1
                )), 0) as total_charged
                 FROM enrollments_gradelevel_classes e
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                 WHERE e.student_regnumber = ?`,
                [student_reg_number]
            );

            // Get debit transactions total (additional DEBIT)
            const [debitTransactionsTotal] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total_debit
                 FROM student_transactions 
                 WHERE student_reg_number = ? AND transaction_type = 'DEBIT'`,
                [student_reg_number]
            );

            // Get current balance from student_balances table
            const [studentBalance] = await pool.execute(
                `SELECT current_balance, last_updated 
                 FROM student_balances 
                 WHERE student_reg_number = ?`,
                [student_reg_number]
            );

            const currentBalance = studentBalance.length > 0 ? studentBalance[0].current_balance : 0;
            const lastUpdated = studentBalance.length > 0 ? studentBalance[0].last_updated : null;

            const totalDebit = parseFloat(boardingEnrollmentsTotal[0].total_charged || 0) + 
                              parseFloat(classEnrollmentsTotal[0].total_charged || 0) + 
                              parseFloat(debitTransactionsTotal[0].total_debit || 0);
            const totalCredit = parseFloat(feePaymentsTotal[0].total_paid || 0) + 
                               parseFloat(boardingPaymentsTotal[0].total_paid || 0);
            const outstandingBalance = totalDebit - totalCredit;

            res.json({
                success: true,
                data: {
                    student_info: studentInfo[0] || null,
                    outstanding_balance: outstandingBalance,
                    total_debit: totalDebit,
                    total_credit: totalCredit,
                    current_balance: currentBalance, // From student_balances table
                    last_updated: lastUpdated || new Date(),
                    currency: 'USD'
                }
            });
        } catch (error) {
            console.error('Error fetching outstanding balance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch outstanding balance',
                error: error.message
            });
        }
    }
}

module.exports = new StudentFinancialRecordController();

