const { pool } = require('../../config/database');

class CloseToTermController {
    // Close to term - de-enroll all students (no balance changes)
    async closeToTerm(req, res) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            console.log(`🔄 Starting Close to Term process - removing all enrollments`);
            
            // Get all active gradelevel enrollments
            const [gradelevelEnrollments] = await connection.execute(`
                SELECT 
                    e.id as enrollment_id,
                    e.student_regnumber,
                    e.gradelevel_class_id,
                    gc.name as class_name,
                    s.name as stream_name
                FROM enrollments_gradelevel_classes e
                LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                LEFT JOIN stream s ON gc.stream_id = s.id
                WHERE e.status = 'active'
            `);
            
            // Get all active subject enrollments
            const [subjectEnrollments] = await connection.execute(`
                SELECT 
                    e.id as enrollment_id,
                    e.student_regnumber,
                    e.subject_class_id
                FROM enrollments_subject_classes e
                WHERE e.status = 'active'
            `);
            
            const totalEnrollments = gradelevelEnrollments.length + subjectEnrollments.length;
            console.log(`👥 Found ${gradelevelEnrollments.length} gradelevel enrollments and ${subjectEnrollments.length} subject enrollments`);
            
            if (totalEnrollments === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No active enrollments found'
                });
            }
            
            let closedCount = 0;
            let alreadyClosedCount = 0;
            const errors = [];
            
            // Process gradelevel enrollments
            for (const enrollment of gradelevelEnrollments) {
                try {
                    // Check if enrollment is already closed
                    const [existingStatus] = await connection.execute(`
                        SELECT status FROM enrollments_gradelevel_classes 
                        WHERE id = ?
                    `, [enrollment.enrollment_id]);
                    
                    if (existingStatus.length > 0 && existingStatus[0].status === 'closed') {
                        console.log(`⏭️  Skipping gradelevel ${enrollment.student_regnumber} - already closed`);
                        alreadyClosedCount++;
                        continue;
                    }
                    
                    // Update enrollment status to 'closed'
                    await connection.execute(`
                        UPDATE enrollments_gradelevel_classes 
                        SET status = 'closed', updated_at = NOW()
                        WHERE id = ?
                    `, [enrollment.enrollment_id]);
                    
                    console.log(`✅ Closed gradelevel enrollment for ${enrollment.student_regnumber} in ${enrollment.class_name} (${enrollment.stream_name})`);
                    closedCount++;
                    
                } catch (error) {
                    console.error(`❌ Error closing gradelevel enrollment for ${enrollment.student_regnumber}:`, error.message);
                    errors.push({
                        student: enrollment.student_regnumber,
                        class: `${enrollment.class_name} (${enrollment.stream_name})`,
                        type: 'gradelevel',
                        error: error.message
                    });
                }
            }
            
            // Process subject enrollments
            for (const enrollment of subjectEnrollments) {
                try {
                    // Check if enrollment is already closed
                    const [existingStatus] = await connection.execute(`
                        SELECT status FROM enrollments_subject_classes 
                        WHERE id = ?
                    `, [enrollment.enrollment_id]);
                    
                    if (existingStatus.length > 0 && existingStatus[0].status === 'closed') {
                        console.log(`⏭️  Skipping subject ${enrollment.student_regnumber} - already closed`);
                        alreadyClosedCount++;
                        continue;
                    }
                    
                    // Update enrollment status to 'closed'
                    await connection.execute(`
                        UPDATE enrollments_subject_classes 
                        SET status = 'closed', updated_at = NOW()
                        WHERE id = ?
                    `, [enrollment.enrollment_id]);
                    
                    console.log(`✅ Closed subject enrollment for ${enrollment.student_regnumber}`);
                    closedCount++;
                    
                } catch (error) {
                    console.error(`❌ Error closing subject enrollment for ${enrollment.student_regnumber}:`, error.message);
                    errors.push({
                        student: enrollment.student_regnumber,
                        class: 'Subject Class',
                        type: 'subject',
                        error: error.message
                    });
                }
            }
            
            await connection.commit();
            
            console.log(`🎉 Close to Term completed:`);
            console.log(`✅ Successfully closed: ${closedCount} enrollments`);
            console.log(`⏭️  Already closed: ${alreadyClosedCount} enrollments`);
            console.log(`❌ Errors: ${errors.length} enrollments`);
            
            res.json({
                success: true,
                message: 'Close to Term process completed successfully',
                data: {
                    total_processed: totalEnrollments,
                    gradelevel_closed: gradelevelEnrollments.length,
                    subject_closed: subjectEnrollments.length,
                    closed_count: closedCount,
                    already_closed_count: alreadyClosedCount,
                    error_count: errors.length,
                    errors: errors
                }
            });
            
        } catch (error) {
            await connection.rollback();
            console.error('Error in Close to Term process:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete Close to Term process',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }
    
    // Open to term - update all class_term_year to new term
    async openToTerm(req, res) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const { new_term, new_academic_year } = req.body;
            
            // Validate required fields
            if (!new_term || !new_academic_year) {
                return res.status(400).json({
                    success: false,
                    message: 'New term and new academic year are required'
                });
            }
            
            console.log(`🔄 Starting Open to Term process:`);
            console.log(`📅 Setting all classes to: ${new_term} ${new_academic_year}`);
            
            // Get all class_term_year records
            const [allClasses] = await connection.execute(`
                SELECT 
                    cty.id,
                    cty.gradelevel_class_id,
                    gc.name as class_name,
                    s.name as stream_name
                FROM class_term_year cty
                LEFT JOIN gradelevel_classes gc ON cty.gradelevel_class_id = gc.id
                LEFT JOIN stream s ON gc.stream_id = s.id
            `);
            
            console.log(`👥 Found ${allClasses.length} classes to update to new term`);
            
            if (allClasses.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No classes found in class_term_year table'
                });
            }
            
            let updatedCount = 0;
            const errors = [];
            
            // Update each class to new term
            for (const classItem of allClasses) {
                try {
                    // Update the class to new term
                    await connection.execute(`
                        UPDATE class_term_year 
                        SET term = ?, academic_year = ?, updated_at = NOW()
                        WHERE id = ?
                    `, [new_term, new_academic_year, classItem.id]);
                    
                    console.log(`✅ Updated ${classItem.class_name} (${classItem.stream_name}) to ${new_term} ${new_academic_year}`);
                    updatedCount++;
                    
                } catch (error) {
                    console.error(`❌ Error updating class ${classItem.class_name}:`, error.message);
                    errors.push({
                        class: `${classItem.class_name} (${classItem.stream_name})`,
                        error: error.message
                    });
                }
            }
            
            await connection.commit();
            
            console.log(`🎉 Open to Term completed:`);
            console.log(`✅ Successfully updated: ${updatedCount} classes`);
            console.log(`❌ Errors: ${errors.length} classes`);
            
            res.json({
                success: true,
                message: 'Open to Term process completed successfully',
                data: {
                    new_term: `${new_term} ${new_academic_year}`,
                    classes_updated: updatedCount,
                    error_count: errors.length,
                    errors: errors
                }
            });
            
        } catch (error) {
            await connection.rollback();
            console.error('Error in Open to Term process:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete Open to Term process',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }
    
    // Get available terms and academic years for Close to Term
    async getAvailableTerms(req, res) {
        try {
            // Since enrollments_gradelevel_classes doesn't have term/academic_year columns,
            // we'll get them from class_term_year table instead
            const [terms] = await pool.execute(`
                SELECT DISTINCT cty.term, cty.academic_year,
                       COUNT(e.id) as total_enrollments,
                       SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_enrollments,
                       SUM(CASE WHEN e.status = 'closed' THEN 1 ELSE 0 END) as closed_enrollments
                FROM class_term_year cty
                LEFT JOIN enrollments_gradelevel_classes e ON cty.gradelevel_class_id = e.gradelevel_class_id
                GROUP BY cty.term, cty.academic_year
                ORDER BY cty.academic_year DESC, cty.term DESC
            `);
            
            res.json({
                success: true,
                data: terms
            });
            
        } catch (error) {
            console.error('Error getting available terms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get available terms',
                error: error.message
            });
        }
    }
    
    // Get preview of enrollments to be closed
    async getCloseToTermPreview(req, res) {
        try {
            const { current_term, current_academic_year } = req.query;
            
            if (!current_term || !current_academic_year) {
                return res.status(400).json({
                    success: false,
                    message: 'Current term and current academic year are required'
                });
            }
            
            // Get students who would be affected by joining with class_term_year
            const [enrollments] = await pool.execute(`
                SELECT 
                    e.id as enrollment_id,
                    e.student_regnumber,
                    s.Name as student_name,
                    s.Surname as student_surname,
                    gc.name as class_name,
                    st.name as stream_name,
                    e.created_at as enrollment_date,
                    e.status,
                    CASE 
                        WHEN e.status = 'active' THEN 'Will be Closed'
                        WHEN e.status = 'closed' THEN 'Already Closed'
                        ELSE 'Other Status'
                    END as action_status
                FROM enrollments_gradelevel_classes e
                LEFT JOIN students s ON e.student_regnumber = s.RegNumber
                LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id
                LEFT JOIN stream st ON gc.stream_id = st.id
                LEFT JOIN class_term_year cty ON gc.id = cty.gradelevel_class_id
                WHERE cty.term = ?
                AND cty.academic_year = ?
                ORDER BY gc.name, s.Name, s.Surname
            `, [current_term, current_academic_year]);
            
            const summary = {
                total_enrollments: enrollments.length,
                will_be_closed: enrollments.filter(e => e.action_status === 'Will be Closed').length,
                already_closed: enrollments.filter(e => e.action_status === 'Already Closed').length,
                other_status: enrollments.filter(e => e.action_status === 'Other Status').length
            };
            
            res.json({
                success: true,
                data: {
                    enrollments,
                    summary,
                    term: `${current_term} ${current_academic_year}`
                }
            });
            
        } catch (error) {
            console.error('Error getting Close to Term preview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get Close to Term preview',
                error: error.message
            });
        }
    }
}

module.exports = new CloseToTermController();
