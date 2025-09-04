const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class GradelevelClassController {
        // Get all grade-level classes with optional filtering
    async getAllGradelevelClasses(req, res) {
        try {
            let whereClause = '';
            let params = [];
            
            if (req.query.stream_id && req.query.stream_id !== 'null' && req.query.stream_id !== 'undefined') {
                whereClause += 'WHERE gc.stream_id = ? ';
                params.push(parseInt(req.query.stream_id));
            }
            
            // Build the SQL query dynamically
            let sqlQuery = `SELECT gc.*, s.name as stream_name, s.stage as stream_stage, e.full_name as teacher_name 
                           FROM gradelevel_classes gc 
                           JOIN stream s ON gc.stream_id = s.id
                           LEFT JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id`;
            
            if (whereClause) {
                sqlQuery += ` ${whereClause}`;
            }
            
            // Always add a space before ORDER BY to ensure proper SQL formatting
            sqlQuery += ` ORDER BY s.name, gc.name`;
            
            const [classes] = await pool.execute(sqlQuery, params);
            
            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error fetching grade-level classes:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch grade-level classes' });
        }
    }

    // Search grade-level classes
    async searchGradelevelClasses(req, res) {
        try {
            if (!req.query.search || req.query.search.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Search term is required' 
                });
            }
            
            let whereClause = 'WHERE (gc.name LIKE ? OR s.name LIKE ?)';
            let params = [`%${req.query.search.trim()}%`, `%${req.query.search.trim()}%`];
            
            if (req.query.stream_id && req.query.stream_id !== 'null' && req.query.stream_id !== 'undefined') {
                whereClause += ' AND gc.stream_id = ?';
                params.push(parseInt(req.query.stream_id));
            }
            
            // Build the SQL query dynamically
            let sqlQuery = `SELECT gc.*, s.name as stream_name, s.stage as stream_stage, e.full_name as teacher_name 
                           FROM gradelevel_classes gc 
                           JOIN stream s ON gc.stream_id = s.id 
                           LEFT JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id
                           ${whereClause}`;
            
            sqlQuery += ` ORDER BY s.name, gc.name`;
            
            const [classes] = await pool.execute(sqlQuery, params);
            
            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error searching grade-level classes:', error);
            res.status(500).json({ success: false, message: 'Failed to search grade-level classes' });
        }
    }

    // Get grade-level class by ID
    async getGradelevelClassById(req, res) {
        try {
            const { id } = req.params;
            
            const [classes] = await pool.execute(
                `SELECT gc.*, s.name as stream_name, s.stage as stream_stage, e.full_name as teacher_name 
                 FROM gradelevel_classes gc 
                 JOIN stream s ON gc.stream_id = s.id 
                 LEFT JOIN employees e ON gc.homeroom_teacher_employee_number = e.employee_id 
                 WHERE gc.id = ?`,
                [id]
            );
            
            if (classes.length === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
            }
            
            res.json({ success: true, data: classes[0] });
        } catch (error) {
            console.error('Error fetching grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch grade-level class' });
        }
    }

    // Create new grade-level class
    async createGradelevelClass(req, res) {
        try {
            const { stream_id, name, homeroom_teacher_employee_number, capacity } = req.body;
            
            if (!stream_id || !name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream ID and name are required' 
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
            
            // Check if class name already exists in this stream
            const [existing] = await pool.execute(
                'SELECT id FROM gradelevel_classes WHERE stream_id = ? AND name = ?',
                [stream_id, name]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Class name already exists in this stream' 
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO gradelevel_classes (stream_id, name, homeroom_teacher_employee_number, capacity) VALUES (?, ?, ?, ?)',
                [stream_id, name, homeroom_teacher_employee_number || null, capacity || null]
            );
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'gradelevel_classes',
                recordId: result.insertId,
                newValues: { stream_id, name, homeroom_teacher_employee_number, capacity }
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Grade-level class created successfully',
                data: { 
                    id: result.insertId, 
                    stream_id, 
                    name, 
                    homeroom_teacher_employee_number, 
                    capacity 
                }
            });
        } catch (error) {
            console.error('Error creating grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to create grade-level class' });
        }
    }

    // Update grade-level class
    async updateGradelevelClass(req, res) {
        try {
            const { id } = req.params;
            const { stream_id, name, homeroom_teacher_employee_number, capacity } = req.body;
            
            if (!stream_id || !name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream ID and name are required' 
                });
            }
            
            // Check if class exists
            const [existing] = await pool.execute(
                'SELECT * FROM gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
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
            
            // Check if new name conflicts with other classes in the same stream
            const [nameConflict] = await pool.execute(
                'SELECT id FROM gradelevel_classes WHERE stream_id = ? AND name = ? AND id != ?',
                [stream_id, name, id]
            );
            
            if (nameConflict.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Class name already exists in this stream' 
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE gradelevel_classes SET stream_id = ?, name = ?, homeroom_teacher_employee_number = ?, capacity = ? WHERE id = ?',
                [stream_id, name, homeroom_teacher_employee_number || null, capacity || null, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'gradelevel_classes',
                recordId: id,
                oldValues: {
                    stream_id: existing[0].stream_id,
                    name: existing[0].name,
                    homeroom_teacher_employee_number: existing[0].homeroom_teacher_employee_number,
                    capacity: existing[0].capacity
                },
                newValues: { stream_id, name, homeroom_teacher_employee_number, capacity }
            });
            
            res.json({ 
                success: true, 
                message: 'Grade-level class updated successfully',
                data: { id, stream_id, name, homeroom_teacher_employee_number, capacity }
            });
        } catch (error) {
            console.error('Error updating grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to update grade-level class' });
        }
    }

    // Delete grade-level class
    async deleteGradelevelClass(req, res) {
        try {
            const { id } = req.params;
            
            // Check if class exists
            const [existing] = await pool.execute(
                'SELECT * FROM gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
            }
            
            // Check if class is referenced by other tables
            const [subjectClassRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM subject_classes WHERE gradelevel_class_id = ?',
                [id]
            );
            
            const [studentRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM students WHERE gradelevel_class_id = ?',
                [id]
            );
            
            const [enrollmentRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM enrollments_gradelevel_classes WHERE gradelevel_class_id = ?',
                [id]
            );
            
            if (subjectClassRefs[0].count > 0 || studentRefs[0].count > 0 || enrollmentRefs[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete grade-level class. It is referenced by other records.' 
                });
            }
            
            const [result] = await pool.execute(
                'DELETE FROM gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'gradelevel_classes',
                recordId: id,
                oldValues: {
                    stream_id: existing[0].stream_id,
                    name: existing[0].name,
                    homeroom_teacher_employee_number: existing[0].homeroom_teacher_employee_number,
                    capacity: existing[0].capacity
                }
            });
            
            res.json({ 
                success: true, 
                message: 'Grade-level class deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting grade-level class:', error);
            res.status(500).json({ success: false, message: 'Failed to delete grade-level class' });
        }
    }

    // Get classes by stream
    async getClassesByStream(req, res) {
        try {
            const { stream_id } = req.params;
            
            const [classes] = await pool.execute(
                'SELECT * FROM gradelevel_classes WHERE stream_id = ? ORDER BY name',
                [stream_id]
            );
            
            res.json({ success: true, data: classes });
        } catch (error) {
            console.error('Error fetching classes by stream:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch classes by stream' });
        }
    }

    // Get students by class
    async getStudentsByClass(req, res) {
        try {
            const { id } = req.params;
            
            // Check if class exists
            const [existing] = await pool.execute(
                'SELECT * FROM gradelevel_classes WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Grade-level class not found' });
            }
            
            // Get students enrolled in this class through the enrollment table
            const [students] = await pool.execute(
                `SELECT s.RegNumber, s.Name, s.Surname, s.Gender, s.DateOfBirth, s.CreatedAt as AdmissionDate
                 FROM students s
                 JOIN enrollments_gradelevel_classes e ON s.RegNumber = e.student_regnumber
                 WHERE e.gradelevel_class_id = ? AND e.status = 'active'
                 ORDER BY s.Surname, s.Name`,
                [id]
            );
            
            res.json({ success: true, data: students });
        } catch (error) {
            console.error('Error fetching students by class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch students by class' });
        }
    }
}

module.exports = new GradelevelClassController();
