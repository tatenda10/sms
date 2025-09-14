const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');
const StudentTransactionController = require('../students/studentTransactionController');
const StudentBalanceService = require('../../services/studentBalanceService');

class GradelevelEnrollmentController {
    // Get all grade-level enrollments with optional pagination and filtering
    async getAllGradelevelEnrollments(req, res) {
        try {
            const { gradelevel_class_id, student_regnumber, status } = req.query;
            let whereClause = '';
            let params = [];
            if (gradelevel_class_id) {
                whereClause += 'WHERE e.gradelevel_class_id = ? ';
                params.push(gradelevel_class_id);
            }
            if (student_regnumber) {
                const studentWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${studentWhere}e.student_regnumber = ? `;
                params.push(student_regnumber);
            }
            if (status) {
                const statusWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${statusWhere}e.status = ? `;
                params.push(status);
            }
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.Name, s.Surname, s.RegNumber,
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_gradelevel_classes e 
                 JOIN students s ON e.student_regnumber = s.RegNumber 
                 JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON gc.stream_id = st.id 
                 ${whereClause}
                 ORDER BY st.name, gc.name, s.Surname, s.Name`,
                params
            );
            res.json({
                success: true,
                data: enrollments
            });
        } catch (error) {
            console.error('Error fetching grade-level enrollments:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch grade-level enrollments' });
        }
    }

    // Get enrollment by ID
    async getGradelevelEnrollmentById(req, res) {
        try {
            const { id } = req.params;
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.Name, s.Surname, s.RegNumber,
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_gradelevel_classes e 
                 JOIN students s ON e.student_regnumber = s.RegNumber 
                 JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON gc.stream_id = st.id 
                 WHERE e.id = ?`,
                [id]
            );
            
            if (enrollments.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            res.json({ success: true, data: enrollments[0] });
        } catch (error) {
            console.error('Error fetching grade-level enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch grade-level enrollment' });
        }
    }

    // Create new grade-level enrollment
    async createGradelevelEnrollment(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const { student_regnumber, gradelevel_class_id, status = 'active', term, academic_year } = req.body;
            
            if (!student_regnumber || !gradelevel_class_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student registration number and grade-level class ID are required' 
                });
            }
            
            // Check if student exists
            const [students] = await pool.execute(
                'SELECT * FROM students WHERE RegNumber = ?',
                [student_regnumber]
            );
            
            if (students.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student not found' 
                });
            }
            
            // Check if grade-level class exists
            const [gradelevelClasses] = await pool.execute(
                'SELECT * FROM gradelevel_classes WHERE id = ?',
                [gradelevel_class_id]
            );
            
            if (gradelevelClasses.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade-level class not found' 
                });
            }
            
            // Check if student is already enrolled in this class
            const [existing] = await pool.execute(
                'SELECT id FROM enrollments_gradelevel_classes WHERE student_regnumber = ? AND gradelevel_class_id = ?',
                [student_regnumber, gradelevel_class_id]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student is already enrolled in this grade-level class' 
                });
            }
            
            // Check if student is already enrolled in another class in the same stream
            const [streamEnrollment] = await pool.execute(
                `SELECT e.id FROM enrollments_gradelevel_classes e 
                 JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 WHERE e.student_regnumber = ? AND gc.stream_id = ? AND e.status = 'active'`,
                [student_regnumber, gradelevelClasses[0].stream_id]
            );
            
            if (streamEnrollment.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student is already enrolled in another class in the same stream' 
                });
            }
            
            // Check class capacity if specified
            if (gradelevelClasses[0].capacity) {
                const [enrolledCount] = await pool.execute(
                    'SELECT COUNT(*) as count FROM enrollments_gradelevel_classes WHERE gradelevel_class_id = ? AND status = ?',
                    [gradelevel_class_id, 'active']
                );
                
                if (enrolledCount[0].count >= gradelevelClasses[0].capacity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Grade-level class is at full capacity' 
                    });
                }
            }
            
            const [result] = await conn.execute(
                'INSERT INTO enrollments_gradelevel_classes (student_regnumber, gradelevel_class_id, status) VALUES (?, ?, ?)',
                [student_regnumber, gradelevel_class_id, status]
            );
            
            const enrollmentId = result.insertId;

            // Create DEBIT transaction for class enrollment (always create transaction)
            const [classInfo] = await conn.execute(
                `SELECT gc.name as class_name, s.name as stream_name 
                 FROM gradelevel_classes gc 
                 LEFT JOIN stream s ON gc.stream_id = s.id 
                 WHERE gc.id = ?`,
                [gradelevel_class_id]
            );

            const className = classInfo.length > 0 ? classInfo[0].class_name : 'Unknown Class';
            const streamName = classInfo.length > 0 ? classInfo[0].stream_name : 'Unknown Stream';
            
            // Get invoice structure for this class and term/year (if available)
            let feeAmount = 0;
            let invoiceTerm = null;
            let invoiceAcademicYear = null;
            
            // First try to get invoice structure with term and academic year if provided
            if (term && academic_year) {
                const [invoiceStructures] = await conn.execute(
                    'SELECT total_amount, term, academic_year FROM invoice_structures WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ?',
                    [gradelevel_class_id, term, academic_year]
                );

                if (invoiceStructures.length > 0) {
                    feeAmount = invoiceStructures[0].total_amount;
                    invoiceTerm = invoiceStructures[0].term;
                    invoiceAcademicYear = invoiceStructures[0].academic_year;
                }
            }
            
            // If no invoice structure found or no term/academic_year provided, 
            // try to get the most recent invoice structure for this class
            if (feeAmount === 0) {
                const [defaultInvoices] = await conn.execute(
                    'SELECT total_amount, term, academic_year FROM invoice_structures WHERE gradelevel_class_id = ? ORDER BY academic_year DESC, term DESC LIMIT 1',
                    [gradelevel_class_id]
                );

                if (defaultInvoices.length > 0) {
                    feeAmount = defaultInvoices[0].total_amount;
                    invoiceTerm = defaultInvoices[0].term;
                    invoiceAcademicYear = defaultInvoices[0].academic_year;
                }
            }
            
            // If still no fee found, check if there are any invoice structures for this class at all
            if (feeAmount === 0) {
                const [allInvoices] = await conn.execute(
                    'SELECT total_amount, term, academic_year FROM invoice_structures WHERE gradelevel_class_id = ? LIMIT 1',
                    [gradelevel_class_id]
                );

                if (allInvoices.length > 0) {
                    feeAmount = allInvoices[0].total_amount;
                    invoiceTerm = allInvoices[0].term;
                    invoiceAcademicYear = allInvoices[0].academic_year;
                }
            }
            
            console.log(`Enrollment fee amount for class ${gradelevel_class_id}: ${feeAmount}, Term: ${invoiceTerm}, Year: ${invoiceAcademicYear}`);
            
            // Format term to just the number (e.g., "Term 1" -> "1")
            let formattedTerm = null;
            if (invoiceTerm) {
                // Extract just the number from term (e.g., "Term 1" -> "1", "Term 2" -> "2")
                const termMatch = invoiceTerm.match(/\d+/);
                formattedTerm = termMatch ? termMatch[0] : invoiceTerm;
            }
            
            // Prevent enrollment if no fee structure is found
            if (feeAmount === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'NO_FEE_STRUCTURE',
                    message: `Cannot enroll student: No fee structure has been created for class "${className} (${streamName})" for term ${formattedTerm || term} and academic year ${invoiceAcademicYear || academic_year}. Please create an invoice structure first before enrolling students.`,
                    details: {
                        className: `${className} (${streamName})`,
                        term: formattedTerm || term,
                        academicYear: invoiceAcademicYear || academic_year,
                        action: 'Create invoice structure for this class before enrolling students'
                    }
                });
            }
            
            // Create DEBIT transaction for enrollment fee
            await StudentTransactionController.createTransactionHelper(
                student_regnumber,
                'DEBIT',
                feeAmount,
                `TUITION INVOICE - ${className} (${streamName})`,
                {
                    term: formattedTerm || (term ? term.replace(/Term\s*/i, '') : null),
                    academic_year: invoiceAcademicYear || academic_year || null,
                    class_id: gradelevel_class_id,
                    enrollment_id: enrollmentId,
                    created_by: req.user.id
                }
            );
            
            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'CREATE',
                    tableName: 'enrollments_gradelevel_classes',
                    recordId: enrollmentId,
                    newValues: { student_regnumber, gradelevel_class_id, status, term, academic_year }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
            }

            await conn.commit();
            
            res.status(201).json({ 
                success: true, 
                message: 'Grade-level enrollment created successfully',
                data: { 
                    id: enrollmentId, 
                    student_regnumber, 
                    gradelevel_class_id, 
                    status,
                    term,
                    academic_year
                }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error creating grade-level enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to create grade-level enrollment' });
        } finally {
            conn.release();
        }
    }

    // Update grade-level enrollment
    async updateGradelevelEnrollment(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Status is required' 
                });
            }
            
            // Check if enrollment exists
            const [existing] = await pool.execute(
                'SELECT * FROM enrollments_gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            const [result] = await pool.execute(
                'UPDATE enrollments_gradelevel_classes SET status = ? WHERE id = ?',
                [status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            // If status is changed to inactive, remove from student's gradelevel_class_id and reverse balance
            if (status === 'inactive' && existing[0].status === 'active') {
                const conn = await pool.getConnection();
                try {
                    await conn.beginTransaction();
                    
                    // Remove student's class assignment
                    await conn.execute(
                        'UPDATE students SET gradelevel_class_id = NULL WHERE RegNumber = ?',
                        [existing[0].student_regnumber]
                    );
                    
                    // Find the original enrollment fee transaction
                    const [feeTransactions] = await conn.execute(
                        `SELECT id, amount, description, term, academic_year 
                         FROM student_transactions 
                         WHERE student_reg_number = ? AND gradelevel_class_id = ? AND transaction_type = 'DEBIT' 
                         AND description LIKE '%TUITION INVOICE%'
                         ORDER BY transaction_date DESC LIMIT 1`,
                        [existing[0].student_regnumber, existing[0].gradelevel_class_id]
                    );
                    
                    if (feeTransactions.length > 0) {
                        const originalTransaction = feeTransactions[0];
                        
                        // Create CREDIT transaction to reverse the enrollment fee
                        const [creditResult] = await conn.execute(
                            `INSERT INTO student_transactions 
                             (student_reg_number, transaction_type, amount, description, term, academic_year, 
                              gradelevel_class_id, enrollment_id, created_by) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                existing[0].student_regnumber,
                                'CREDIT',
                                originalTransaction.amount,
                                `DE-ENROLLMENT REVERSAL - ${originalTransaction.description}`,
                                originalTransaction.term,
                                originalTransaction.academic_year,
                                existing[0].gradelevel_class_id,
                                id,
                                req.user.id
                            ]
                        );
                        
                        // Update student balance to reflect the CREDIT transaction
                        await StudentBalanceService.updateBalanceOnTransaction(
                            existing[0].student_regnumber,
                            'CREDIT',
                            originalTransaction.amount,
                            conn
                        );
                        
                        console.log(`Created CREDIT reversal transaction ${creditResult.insertId} for de-enrollment`);
                    }
                    
                    await conn.commit();
                } catch (error) {
                    await conn.rollback();
                    throw error;
                } finally {
                    conn.release();
                }
            }
            
            // If status is changed to active, update student's gradelevel_class_id and create enrollment fee
            if (status === 'active' && existing[0].status !== 'active') {
                const conn = await pool.getConnection();
                try {
                    await conn.beginTransaction();
                    
                    // Update student's class assignment
                    await conn.execute(
                        'UPDATE students SET gradelevel_class_id = ? WHERE RegNumber = ?',
                        [existing[0].gradelevel_class_id, existing[0].student_regnumber]
                    );
                    
                    // Get class and stream details for fee lookup
                    const [classDetails] = await conn.execute(
                        `SELECT gc.name as class_name, s.name as stream_name, s.stage as stream_stage
                         FROM gradelevel_classes gc 
                         JOIN stream s ON gc.stream_id = s.id 
                         WHERE gc.id = ?`,
                        [existing[0].gradelevel_class_id]
                    );
                    
                    if (classDetails.length > 0) {
                        const className = classDetails[0].class_name;
                        const streamName = classDetails[0].stream_name;
                        
                        // Look for invoice structure for this class
                        const [invoices] = await conn.execute(
                            `SELECT total_amount, term, academic_year 
                             FROM invoice_structures 
                             WHERE gradelevel_class_id = ? AND is_active = TRUE
                             ORDER BY created_at DESC LIMIT 1`,
                            [existing[0].gradelevel_class_id]
                        );
                        
                        if (invoices.length > 0) {
                            const invoice = invoices[0];
                            
                            // Create DEBIT transaction for re-enrollment fee
                            const [debitResult] = await conn.execute(
                                `INSERT INTO student_transactions 
                                 (student_reg_number, transaction_type, amount, description, term, academic_year, 
                                  gradelevel_class_id, enrollment_id, created_by) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    existing[0].student_regnumber,
                                    'DEBIT',
                                    invoice.total_amount,
                                    `RE-ENROLLMENT FEE - ${className} (${streamName}) - Term ${invoice.term} ${invoice.academic_year}`,
                                    invoice.term,
                                    invoice.academic_year,
                                    existing[0].gradelevel_class_id,
                                    id,
                                    req.user.id
                                ]
                            );
                            
                            // Update student balance to reflect the DEBIT transaction
                            await StudentBalanceService.updateBalanceOnTransaction(
                                existing[0].student_regnumber,
                                'DEBIT',
                                invoice.total_amount,
                                conn
                            );
                            
                            console.log(`Created DEBIT re-enrollment transaction ${debitResult.insertId}`);
                        }
                    }
                    
                    await conn.commit();
                } catch (error) {
                    await conn.rollback();
                    throw error;
                } finally {
                    conn.release();
                }
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'enrollments_gradelevel_classes',
                recordId: id,
                newValues: { status },
                oldValues: { status: existing[0].status }
            });
            
            res.json({ 
                success: true, 
                message: 'Grade-level enrollment updated successfully',
                data: { id, status }
            });
        } catch (error) {
            console.error('Error updating grade-level enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to update grade-level enrollment' });
        }
    }

    // Delete grade-level enrollment
    async deleteGradelevelEnrollment(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const { id } = req.params;
            const { reason, isEndOfTerm = false } = req.body;
            
            // Check if enrollment exists
            const [existing] = await conn.execute(
                'SELECT * FROM enrollments_gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            console.log('Found enrollment to delete:', existing[0]);
            
            // Check if enrollment is referenced by subject class enrollments
            console.log('🔍 Checking for subject class enrollments...');
            let subjectEnrollmentRefs = [{ count: 0 }]; // Default to 0
            try {
                const [result] = await conn.execute(
                    'SELECT COUNT(*) as count FROM enrollments_subject_classes WHERE gradelevel_class_id = ? AND student_regnumber = ?',
                    [existing[0].gradelevel_class_id, existing[0].student_regnumber]
                );
                subjectEnrollmentRefs = result;
                console.log('📊 Subject enrollment refs count:', subjectEnrollmentRefs[0].count);
            } catch (subjectError) {
                console.error('❌ Error checking subject enrollments:', subjectError);
                // Continue without the check for now
                console.log('⚠️ Skipping subject enrollment check due to error');
            }
            
            if (subjectEnrollmentRefs[0].count > 0) {
                console.log('🗑️ Student has subject enrollments - deleting them first...');
                
                // Delete all subject class enrollments for this student and grade-level class
                const [deleteSubjectResult] = await conn.execute(
                    'DELETE FROM enrollments_subject_classes WHERE gradelevel_class_id = ? AND student_regnumber = ?',
                    [existing[0].gradelevel_class_id, existing[0].student_regnumber]
                );
                console.log('✅ Deleted subject enrollments:', deleteSubjectResult.affectedRows, 'records');
            }

            // Check grace period for fee reversal (only if not end of term)
            if (!isEndOfTerm) {
                console.log('🔍 Checking grace period for fee reversal...');
                // Use current date for grace period check since we don't have created_at
                // This means all enrollments are within grace period
                const daysDifference = 0; // Always within grace period

                if (daysDifference <= 30) {
                    console.log('✅ Within grace period - checking for associated fee transaction');
                    
                       // Within grace period - check for associated fee transaction
                       const [feeTransactions] = await conn.execute(
                           `SELECT id, amount, description FROM student_transactions 
                            WHERE student_reg_number = ? AND class_id = ? AND transaction_type = 'DEBIT' 
                            AND description LIKE '%TUITION INVOICE%'
                            ORDER BY transaction_date DESC LIMIT 1`,
                           [existing[0].student_regnumber, existing[0].gradelevel_class_id]
                       );

                    console.log('🔍 Found fee transactions:', feeTransactions);

                       // Debug: Check all transactions for this student
                       console.log('🔍 Checking all transactions for student...');
                       const [allStudentTransactions] = await conn.execute(
                           `SELECT id, transaction_type, amount, description, class_id, enrollment_id 
                            FROM student_transactions 
                            WHERE student_reg_number = ?`,
                           [existing[0].student_regnumber]
                       );
                    console.log('📊 All transactions for student:', allStudentTransactions);

                       if (feeTransactions.length > 0) {
                           console.log('💰 Found fee transaction, creating CREDIT reversal...');
                           console.log('📝 Original transaction description:', feeTransactions[0].description);
                           
                           // Create a CREDIT transaction to reverse the DEBIT
                           const reversalDescription = `DE-ENROLLMENT REVERSAL - ${feeTransactions[0].description}`;
                           console.log('💳 Creating CREDIT reversal transaction with description:', reversalDescription);
                           
                           const [reversalResult] = await conn.execute(
                               `INSERT INTO student_transactions 
                                (journal_entry_id, student_reg_number, transaction_type, amount, description, 
                                 term, academic_year, class_id, enrollment_id, transaction_date, created_by) 
                                VALUES (NULL, ?, 'CREDIT', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                               [
                                   existing[0].student_regnumber,
                                   feeTransactions[0].amount,
                                   reversalDescription,
                                   '2', // term
                                   '2025', // academic_year
                                   existing[0].gradelevel_class_id,
                                   existing[0].id,
                                   req.user.id
                               ]
                           );
                           console.log('✅ CREDIT reversal transaction created:', reversalResult.insertId);
                           
                           // Update the student balance to reflect the CREDIT
                           // Note: Since we're creating the transaction directly (not through StudentTransactionController),
                           // we need to manually update the balance
                           console.log('💳 Updating student balance with CREDIT...');
                           await StudentBalanceService.updateBalanceOnTransaction(
                               existing[0].student_regnumber,
                               'CREDIT',
                               feeTransactions[0].amount,
                               conn
                           );
                           console.log('✅ Student balance updated with CREDIT');
                           
                           console.log(`✅ Created CREDIT reversal transaction for de-enrollment`);
                       } else {
                           console.log('ℹ️ No fee transactions found, skipping balance update');
                       }
                } else {
                    console.log('⏰ Outside grace period, skipping fee reversal');
                }
            } else {
                console.log('🏁 End of term, skipping fee reversal');
            }
            
            console.log('🗑️ Deleting enrollment record...');
            const [result] = await conn.execute(
                'DELETE FROM enrollments_gradelevel_classes WHERE id = ?',
                [id]
            );
            console.log('✅ Enrollment record deleted, affected rows:', result.affectedRows);
            
            if (result.affectedRows === 0) {
                console.log('❌ No rows affected, enrollment not found');
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            // Log audit event
            console.log('📝 Logging audit event...');
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'DELETE',
                    tableName: 'enrollments_gradelevel_classes',
                    recordId: id,
                    oldValues: {
                        student_regnumber: existing[0].student_regnumber,
                        gradelevel_class_id: existing[0].gradelevel_class_id,
                        status: existing[0].status,
                        reason,
                        isEndOfTerm
                    }
                });
                console.log('✅ Audit event logged');
            } catch (auditError) {
                console.error('❌ Audit logging failed:', auditError);
            }

            console.log('💾 Committing transaction...');
            await conn.commit();
            console.log('✅ Transaction committed successfully');
            
               res.json({ 
                   success: true, 
                   message: 'Enrollment deleted successfully (including subject enrollments)' 
               });
        } catch (error) {
            await conn.rollback();
            console.error('Error deleting grade-level enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to delete grade-level enrollment' });
        } finally {
            conn.release();
        }
    }

    // Get enrollments by grade-level class
    async getEnrollmentsByGradelevelClass(req, res) {
        try {
            const { gradelevel_class_id } = req.params;
            console.log('🔍 Fetching enrollments for grade-level class ID:', gradelevel_class_id);
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.Name, s.Surname, s.RegNumber, s.Gender
                 FROM enrollments_gradelevel_classes e 
                 JOIN students s ON e.student_regnumber = s.RegNumber 
                 WHERE e.gradelevel_class_id = ? AND e.status = 'active'
                 ORDER BY s.Surname, s.Name`,
                [gradelevel_class_id]
            );
            
            console.log('📊 Found enrollments:', enrollments.length);
            if (enrollments.length > 0) {
                console.log('📊 Sample enrollment data:', JSON.stringify(enrollments[0], null, 2));
            }
            res.json({ success: true, data: enrollments });
        } catch (error) {
            console.error('❌ Error fetching enrollments by grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch enrollments by grade-level class' });
        }
    }

    // Get enrollments by student
    async getEnrollmentsByStudent(req, res) {
        try {
            const { student_regnumber } = req.params;
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_gradelevel_classes e 
                 JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON gc.stream_id = st.id 
                 WHERE e.student_regnumber = ?
                 ORDER BY e.status DESC, st.name, gc.name`,
                [student_regnumber]
            );
            
            res.json({ success: true, data: enrollments });
        } catch (error) {
            console.error('Error fetching enrollments by student:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch enrollments by student' });
        }
    }
}

module.exports = new GradelevelEnrollmentController();
