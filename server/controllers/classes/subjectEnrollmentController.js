const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class SubjectEnrollmentController {
    // Get all subject class enrollments with optional pagination and filtering
    async getAllSubjectEnrollments(req, res) {
        try {
            // Remove pagination
            const { subject_class_id, student_regnumber, status, search } = req.query;
            let whereClause = '';
            let params = [];
            if (subject_class_id) {
                whereClause += 'WHERE e.subject_class_id = ? ';
                params.push(subject_class_id);
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
            if (search) {
                const searchWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${searchWhere}(s.Name LIKE ? OR s.Surname LIKE ? OR s.RegNumber LIKE ? OR sub.name LIKE ? OR gc.name LIKE ?) `;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.Name, s.Surname, s.RegNumber,
                        sub.code as subject_code, sub.name as subject_name,
                        sc.employee_number as teacher_employee_number,
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_subject_classes e 
                 JOIN students s ON e.student_regnumber = s.RegNumber 
                 JOIN subject_classes sc ON e.subject_class_id = sc.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON sc.stream_id = st.id 
                 ${whereClause}
                 ORDER BY st.name, sub.name, gc.name, s.Surname, s.Name`
                , params
            );
            res.json({
                success: true,
                data: enrollments
            });
        } catch (error) {
            console.error('Error fetching subject enrollments:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject enrollments' });
        }
    }

    // Get enrollment by ID
    async getSubjectEnrollmentById(req, res) {
        try {
            const { id } = req.params;
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.first_name, s.last_name, s.regnumber,
                        sub.code as subject_code, sub.name as subject_name,
                        sc.employee_number as teacher_employee_number,
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_subject_classes e 
                 JOIN students s ON e.student_regnumber = s.regnumber 
                 JOIN subject_classes sc ON e.subject_class_id = sc.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON sc.stream_id = st.id 
                 WHERE e.id = ?`,
                [id]
            );
            
            if (enrollments.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            res.json({ success: true, data: enrollments[0] });
        } catch (error) {
            console.error('Error fetching subject enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject enrollment' });
        }
    }

    // Create new subject class enrollment
    async createSubjectEnrollment(req, res) {
        try {
            const { student_regnumber, subject_class_id, gradelevel_class_id, status = 'active' } = req.body;
            
            if (!student_regnumber || !subject_class_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student registration number and subject class ID are required' 
                });
            }
            
            // Check if student exists
            const [students] = await pool.execute(
                'SELECT * FROM students WHERE regnumber = ?',
                [student_regnumber]
            );
            
            if (students.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student not found' 
                });
            }
            
            // Check if subject class exists
            const [subjectClasses] = await pool.execute(
                'SELECT * FROM subject_classes WHERE id = ?',
                [subject_class_id]
            );
            
            if (subjectClasses.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject class not found' 
                });
            }
            
            const subjectClass = subjectClasses[0];
            
            // Check if student is already enrolled in this subject class
            const [existing] = await pool.execute(
                'SELECT id FROM enrollments_subject_classes WHERE student_regnumber = ? AND subject_class_id = ?',
                [student_regnumber, subject_class_id]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student is already enrolled in this subject class' 
                });
            }
            
            // Validate enrollment based on subject class type
            if (subjectClass.gradelevel_class_id) {
                // Homeroom-tied class: student must be in that specific homeroom
                if (!gradelevel_class_id || gradelevel_class_id !== subjectClass.gradelevel_class_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Student must be enrolled in the specific homeroom for this subject class' 
                    });
                }
                
                // Check if student is enrolled in the required homeroom
                const [homeroomEnrollment] = await pool.execute(
                    'SELECT id FROM enrollments_gradelevel_classes WHERE student_regnumber = ? AND gradelevel_class_id = ? AND status = "active"',
                    [student_regnumber, subjectClass.gradelevel_class_id]
                );
                
                if (homeroomEnrollment.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Student must be enrolled in the required homeroom for this subject class' 
                    });
                }
            } else {
                // Combined class: student must be in any homeroom within the same stream
                if (gradelevel_class_id) {
                    // Check if the specified homeroom is in the same stream
                    const [homeroomStream] = await pool.execute(
                        'SELECT stream_id FROM gradelevel_classes WHERE id = ?',
                        [gradelevel_class_id]
                    );
                    
                    if (homeroomStream.length === 0 || homeroomStream[0].stream_id !== subjectClass.stream_id) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Specified homeroom must be in the same stream as the subject class' 
                        });
                    }
                    
                    // Check if student is enrolled in the specified homeroom
                    const [homeroomEnrollment] = await pool.execute(
                        'SELECT id FROM enrollments_gradelevel_classes WHERE student_regnumber = ? AND gradelevel_class_id = ? AND status = "active"',
                        [student_regnumber, gradelevel_class_id]
                    );
                    
                    if (homeroomEnrollment.length === 0) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Student must be enrolled in the specified homeroom' 
                        });
                    }
                } else {
                    // Auto-determine homeroom from student's current enrollment
                    const [studentHomeroom] = await pool.execute(
                        'SELECT gradelevel_class_id FROM students WHERE regnumber = ?',
                        [student_regnumber]
                    );
                    
                    if (!studentHomeroom[0].gradelevel_class_id) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Student must be enrolled in a homeroom to join this subject class' 
                        });
                    }
                    
                    // Check if the homeroom is in the same stream
                    const [homeroomStream] = await pool.execute(
                        'SELECT stream_id FROM gradelevel_classes WHERE id = ?',
                        [studentHomeroom[0].gradelevel_class_id]
                    );
                    
                    if (homeroomStream[0].stream_id !== subjectClass.stream_id) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Student must be in a homeroom within the same stream as the subject class' 
                        });
                    }
                    
                    gradelevel_class_id = studentHomeroom[0].gradelevel_class_id;
                }
            }
            
            // Check class capacity if specified
            if (subjectClass.capacity) {
                const [enrolledCount] = await pool.execute(
                    'SELECT COUNT(*) as count FROM enrollments_subject_classes WHERE subject_class_id = ? AND status = "active"',
                    [subject_class_id]
                );
                
                if (enrolledCount[0].count >= subjectClass.capacity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Subject class is at full capacity' 
                    });
                }
            }
            
            const [result] = await pool.execute(
                'INSERT INTO enrollments_subject_classes (student_regnumber, subject_class_id, gradelevel_class_id, status) VALUES (?, ?, ?, ?)',
                [student_regnumber, subject_class_id, gradelevel_class_id, status]
            );
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'enrollments_subject_classes',
                recordId: result.insertId,
                newValues: {
                    student_regnumber,
                    subject_class_id,
                    gradelevel_class_id,
                    status
                }
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Subject enrollment created successfully',
                data: { 
                    id: result.insertId, 
                    student_regnumber, 
                    subject_class_id, 
                    gradelevel_class_id, 
                    status 
                }
            });
        } catch (error) {
            console.error('Error creating subject enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to create subject enrollment' });
        }
    }

    // Update subject class enrollment
    async updateSubjectEnrollment(req, res) {
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
                'SELECT * FROM enrollments_subject_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            const [result] = await pool.execute(
                'UPDATE enrollments_subject_classes SET status = ? WHERE id = ?',
                [status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'enrollments_subject_classes',
                recordId: id,
                newValues: { status },
                oldValues: { status: existing[0].status }
            });
            
            res.json({ 
                success: true, 
                message: 'Subject enrollment updated successfully',
                data: { id, status }
            });
        } catch (error) {
            console.error('Error updating subject enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to update subject enrollment' });
        }
    }

    // Delete subject class enrollment
    async deleteSubjectEnrollment(req, res) {
        try {
            const { id } = req.params;
            
            // Check if enrollment exists
            const [existing] = await pool.execute(
                'SELECT * FROM enrollments_subject_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            const [result] = await pool.execute(
                'DELETE FROM enrollments_subject_classes WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Enrollment not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'enrollments_subject_classes',
                recordId: id,
                oldValues: {
                    student_regnumber: existing[0].student_regnumber,
                    subject_class_id: existing[0].subject_class_id,
                    gradelevel_class_id: existing[0].gradelevel_class_id,
                    status: existing[0].status
                }
            });
            
            res.json({ 
                success: true, 
                message: 'Subject enrollment deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting subject enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to delete subject enrollment' });
        }
    }

    // Get enrollments by subject class
    async getEnrollmentsBySubjectClass(req, res) {
        try {
            const { subject_class_id } = req.params;
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        s.Name, s.Surname, s.RegNumber,
                        gc.name as gradelevel_class_name
                 FROM enrollments_subject_classes e 
                 JOIN students s ON e.student_regnumber = s.RegNumber 
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 WHERE e.subject_class_id = ? AND e.status = 'active'
                 ORDER BY s.Surname, s.Name`,
                [subject_class_id]
            );
            
            res.json({ success: true, data: enrollments });
        } catch (error) {
            console.error('Error fetching enrollments by subject class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch enrollments by subject class' });
        }
    }

    // Get enrollments by student
    async getEnrollmentsByStudent(req, res) {
        try {
            const { student_regnumber } = req.params;
            
            const [enrollments] = await pool.execute(
                `SELECT e.*, 
                        sub.code as subject_code, sub.name as subject_name,
                        sc.employee_number as teacher_employee_number,
                        gc.name as gradelevel_class_name,
                        st.name as stream_name, st.stage as stream_stage
                 FROM enrollments_subject_classes e 
                 JOIN subject_classes sc ON e.subject_class_id = sc.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON e.gradelevel_class_id = gc.id 
                 JOIN stream st ON sc.stream_id = st.id 
                 WHERE e.student_regnumber = ?
                 ORDER BY e.status DESC, st.name, sub.name`,
                [student_regnumber]
            );
            
            res.json({ success: true, data: enrollments });
        } catch (error) {
            console.error('Error fetching enrollments by student:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch enrollments by student' });
        }
    }

    // Bulk enroll students in a subject class
    async bulkEnrollStudents(req, res) {
        try {
            const { subject_class_id, student_regnumbers } = req.body;
            
            if (!subject_class_id || !student_regnumbers || !Array.isArray(student_regnumbers)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject class ID and array of student registration numbers are required' 
                });
            }
            
            // Check if subject class exists
            const [subjectClasses] = await pool.execute(
                'SELECT * FROM subject_classes WHERE id = ?',
                [subject_class_id]
            );
            
            if (subjectClasses.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject class not found' 
                });
            }
            
            const subjectClass = subjectClasses[0];
            const results = [];
            const errors = [];
            
            for (const regnumber of student_regnumbers) {
                try {
                    // Check if student exists
                    const [students] = await pool.execute(
                        'SELECT * FROM students WHERE regnumber = ?',
                        [regnumber]
                    );
                    
                    if (students.length === 0) {
                        errors.push(`Student ${regnumber} not found`);
                        continue;
                    }
                    
                    // Check if already enrolled
                    const [existing] = await pool.execute(
                        'SELECT id FROM enrollments_subject_classes WHERE student_regnumber = ? AND subject_class_id = ?',
                        [regnumber, subject_class_id]
                    );
                    
                    if (existing.length > 0) {
                        errors.push(`Student ${regnumber} already enrolled`);
                        continue;
                    }
                    
                    // Validate enrollment (similar logic as createSubjectEnrollment)
                    let gradelevel_class_id = null;
                    
                    if (subjectClass.gradelevel_class_id) {
                        // Homeroom-tied class
                        const [homeroomEnrollment] = await pool.execute(
                            'SELECT id FROM enrollments_gradelevel_classes WHERE student_regnumber = ? AND gradelevel_class_id = ? AND status = "active"',
                            [regnumber, subjectClass.gradelevel_class_id]
                        );
                        
                        if (homeroomEnrollment.length === 0) {
                            errors.push(`Student ${regnumber} not in required homeroom`);
                            continue;
                        }
                        
                        gradelevel_class_id = subjectClass.gradelevel_class_id;
                    } else {
                        // Combined class - get student's current homeroom
                        const [studentHomeroom] = await pool.execute(
                            'SELECT gradelevel_class_id FROM students WHERE regnumber = ?',
                            [regnumber]
                        );
                        
                        if (!studentHomeroom[0].gradelevel_class_id) {
                            errors.push(`Student ${regnumber} not enrolled in any homeroom`);
                            continue;
                        }
                        
                        // Check if homeroom is in same stream
                        const [homeroomStream] = await pool.execute(
                            'SELECT stream_id FROM gradelevel_classes WHERE id = ?',
                            [studentHomeroom[0].gradelevel_class_id]
                        );
                        
                        if (homeroomStream[0].stream_id !== subjectClass.stream_id) {
                            errors.push(`Student ${regnumber} homeroom not in same stream`);
                            continue;
                        }
                        
                        gradelevel_class_id = studentHomeroom[0].gradelevel_class_id;
                    }
                    
                    // Check capacity
                    if (subjectClass.capacity) {
                        const [enrolledCount] = await pool.execute(
                            'SELECT COUNT(*) as count FROM enrollments_subject_classes WHERE subject_class_id = ? AND status = "active"',
                            [subject_class_id]
                        );
                        
                        if (enrolledCount[0].count >= subjectClass.capacity) {
                            errors.push(`Subject class at full capacity`);
                            break;
                        }
                    }
                    
                    // Create enrollment
                    const [result] = await pool.execute(
                        'INSERT INTO enrollments_subject_classes (student_regnumber, subject_class_id, gradelevel_class_id, status) VALUES (?, ?, ?, "active")',
                        [regnumber, subject_class_id, gradelevel_class_id]
                    );
                    
                    results.push({ regnumber, id: result.insertId });
                    
                } catch (error) {
                    errors.push(`Error enrolling student ${regnumber}: ${error.message}`);
                }
            }
            
            // Log audit event (bulk)
            if (results.length > 0) {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'BULK_CREATE',
                    tableName: 'enrollments_subject_classes',
                    newValues: {
                        subject_class_id,
                        enrolled_count: results.length,
                        student_regnumbers: results.map(r => r.regnumber)
                    }
                });
            }
            
            res.json({ 
                success: true, 
                message: `Bulk enrollment completed. ${results.length} students enrolled, ${errors.length} errors.`,
                data: { 
                    successful: results,
                    errors: errors
                }
            });
        } catch (error) {
            console.error('Error in bulk enrollment:', error);
            res.status(500).json({ success: false, message: 'Failed to perform bulk enrollment' });
        }
    }
}

module.exports = new SubjectEnrollmentController();
