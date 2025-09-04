const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class SubjectClassController {
    // Get all subject classes with optional pagination and filtering
    async getAllSubjectClasses(req, res) {
        try {
            let whereClause = '';
            let params = [];
            const { stream_id, subject_id, gradelevel_class_id, search } = req.query;
            if (stream_id) {
                whereClause += 'WHERE sc.stream_id = ? ';
                params.push(stream_id);
            }
            if (subject_id) {
                const subjectWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${subjectWhere}sc.subject_id = ? `;
                params.push(subject_id);
            }
            if (gradelevel_class_id) {
                const gradeWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${gradeWhere}sc.gradelevel_class_id = ? `;
                params.push(gradelevel_class_id);
            }
            if (search) {
                const searchWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${searchWhere}(s.name LIKE ? OR sub.name LIKE ? OR gc.name LIKE ?) `;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            const [classes] = await pool.execute(
                `SELECT sc.*, 
                        s.name as stream_name, s.stage as stream_stage,
                        sub.code as subject_code, sub.name as subject_name, sub.syllabus as subject_syllabus,
                        gc.name as gradelevel_class_name
                 FROM subject_classes sc 
                 JOIN stream s ON sc.stream_id = s.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id 
                 ${whereClause}
                 ORDER BY s.name, sub.name, gc.name`,
                params
            );
            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error fetching subject classes:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject classes' });
        }
    }

    // Get subject class by ID
    async getSubjectClassById(req, res) {
        try {
            const { id } = req.params;
            const [classes] = await pool.execute(
                `SELECT sc.*, 
                        s.name as stream_name, s.stage as stream_stage,
                        sub.code as subject_code, sub.name as subject_name, sub.syllabus as subject_syllabus,
                        gc.name as gradelevel_class_name,
                        e.full_name as teacher_name
                 FROM subject_classes sc 
                 JOIN stream s ON sc.stream_id = s.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id 
                 LEFT JOIN employees e ON sc.employee_number = e.employee_id
                 WHERE sc.id = ?`,
                [id]
            );
            if (classes.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject class not found' });
            }
            res.json({ success: true, data: classes[0] });
        } catch (error) {
            console.error('Error fetching subject class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject class' });
        }
    }

    // Create new subject class
    async createSubjectClass(req, res) {
        try {
            const { subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity } = req.body;
            
            if (!subject_id || !stream_id || !employee_number) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject ID, stream ID, and employee number are required' 
                });
            }
            
            // Check if subject exists
            const [subjects] = await pool.execute(
                'SELECT id FROM subjects WHERE id = ?',
                [subject_id]
            );
            
            if (subjects.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject not found' 
                });
            }
            
            // Check if stream exists
            const [streams] = await pool.execute(
                'SELECT id FROM stream WHERE id = ?',
                [stream_id]
            );
            
            if (streams.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream not found' 
                });
            }
            
            // Check if gradelevel class exists (if provided)
            if (gradelevel_class_id) {
                const [gradelevelClasses] = await pool.execute(
                    'SELECT id FROM gradelevel_classes WHERE id = ? AND stream_id = ?',
                    [gradelevel_class_id, stream_id]
                );
                
                if (gradelevelClasses.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Grade-level class not found or does not belong to the specified stream' 
                    });
                }
            }
            
            // Check if subject class already exists with same combination
            const [existing] = await pool.execute(
                'SELECT id FROM subject_classes WHERE subject_id = ? AND stream_id = ? AND gradelevel_class_id = ? AND employee_number = ?',
                [subject_id, stream_id, gradelevel_class_id || null, employee_number]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject class already exists with this combination' 
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO subject_classes (subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity) VALUES (?, ?, ?, ?, ?, ?)',
                [subject_id, stream_id, gradelevel_class_id || null, employee_number, room_id || null, capacity || null]
            );
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'subject_classes',
                recordId: result.insertId,
                newValues: { subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity }
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Subject class created successfully',
                data: { 
                    id: result.insertId, 
                    subject_id, 
                    stream_id, 
                    gradelevel_class_id, 
                    employee_number, 
                    room_id, 
                    capacity 
                }
            });
        } catch (error) {
            console.error('Error creating subject class:', error);
            res.status(500).json({ success: false, message: 'Failed to create subject class' });
        }
    }

    // Update subject class
    async updateSubjectClass(req, res) {
        try {
            const { id } = req.params;
            const { subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity } = req.body;
            
            if (!subject_id || !stream_id || !employee_number) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject ID, stream ID, and employee number are required' 
                });
            }
            
            // Check if subject class exists
            const [existing] = await pool.execute(
                'SELECT * FROM subject_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject class not found' });
            }
            
            // Check if subject exists
            const [subjects] = await pool.execute(
                'SELECT id FROM subjects WHERE id = ?',
                [subject_id]
            );
            
            if (subjects.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject not found' 
                });
            }
            
            // Check if stream exists
            const [streams] = await pool.execute(
                'SELECT id FROM stream WHERE id = ?',
                [stream_id]
            );
            
            if (streams.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream not found' 
                });
            }
            
            // Check if gradelevel class exists (if provided)
            if (gradelevel_class_id) {
                const [gradelevelClasses] = await pool.execute(
                    'SELECT id FROM gradelevel_classes WHERE id = ? AND stream_id = ?',
                    [gradelevel_class_id, stream_id]
                );
                
                if (gradelevelClasses.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Grade-level class not found or does not belong to the specified stream' 
                    });
                }
            }
            
            // Check if new combination conflicts with other subject classes
            const [combinationConflict] = await pool.execute(
                'SELECT id FROM subject_classes WHERE subject_id = ? AND stream_id = ? AND gradelevel_class_id = ? AND employee_number = ? AND id != ?',
                [subject_id, stream_id, gradelevel_class_id || null, employee_number, id]
            );
            
            if (combinationConflict.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject class already exists with this combination' 
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE subject_classes SET subject_id = ?, stream_id = ?, gradelevel_class_id = ?, employee_number = ?, room_id = ?, capacity = ? WHERE id = ?',
                [subject_id, stream_id, gradelevel_class_id || null, employee_number, room_id || null, capacity || null, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Subject class not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'subject_classes',
                recordId: id,
                newValues: { subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity },
                oldValues: existing[0]
            });
            
            res.json({ 
                success: true, 
                message: 'Subject class updated successfully',
                data: { id, subject_id, stream_id, gradelevel_class_id, employee_number, room_id, capacity }
            });
        } catch (error) {
            console.error('Error updating subject class:', error);
            res.status(500).json({ success: false, message: 'Failed to update subject class' });
        }
    }

    // Delete subject class
    async deleteSubjectClass(req, res) {
        try {
            const { id } = req.params;
            
            // Check if subject class exists
            const [existing] = await pool.execute(
                'SELECT * FROM subject_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject class not found' });
            }
            
            // Check if subject class is referenced by other tables
            const [enrollmentRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM enrollments_subject_classes WHERE subject_class_id = ?',
                [id]
            );
            
            if (enrollmentRefs[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete subject class. It has enrolled students.' 
                });
            }
            
            const [result] = await pool.execute(
                'DELETE FROM subject_classes WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Subject class not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'subject_classes',
                recordId: id,
                oldValues: {
                    subject_id: existing[0].subject_id,
                    stream_id: existing[0].stream_id,
                    gradelevel_class_id: existing[0].gradelevel_class_id,
                    employee_number: existing[0].employee_number
                }
            });
            
            res.json({ 
                success: true, 
                message: 'Subject class deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting subject class:', error);
            res.status(500).json({ success: false, message: 'Failed to delete subject class' });
        }
    }

    // Get subject classes by stream
    async getSubjectClassesByStream(req, res) {
        try {
            const { stream_id } = req.params;
            
            const [classes] = await pool.execute(
                `SELECT sc.*, 
                        sub.code as subject_code, sub.name as subject_name,
                        gc.name as gradelevel_class_name
                 FROM subject_classes sc 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id 
                 WHERE sc.stream_id = ? 
                 ORDER BY sub.name, gc.name`,
                [stream_id]
            );
            
            res.json({ success: true, data: classes });
        } catch (error) {
            console.error('Error fetching subject classes by stream:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject classes by stream' });
        }
    }

    // Get subject classes by grade-level class
    async getSubjectClassesByGradelevelClass(req, res) {
        try {
            const { gradelevel_class_id } = req.params;
            
            const [classes] = await pool.execute(
                `SELECT sc.*, 
                        s.name as stream_name,
                        sub.code as subject_code, sub.name as subject_name
                 FROM subject_classes sc 
                 JOIN stream s ON sc.stream_id = s.id 
                 JOIN subjects sub ON sc.subject_id = sub.id 
                 WHERE sc.gradelevel_class_id = ? 
                 ORDER BY sub.name`,
                [gradelevel_class_id]
            );
            
            res.json({ success: true, data: classes });
        } catch (error) {
            console.error('Error fetching subject classes by grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject classes by grade-level class' });
        }
    }
}

module.exports = new SubjectClassController();
