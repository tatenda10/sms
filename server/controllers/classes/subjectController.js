const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class SubjectController {
    // Get all subjects with optional pagination and filtering
    async getAllSubjects(req, res) {
        try {
            let whereClause = '';
            let params = [];
            const { syllabus, search } = req.query;
            if (syllabus) {
                whereClause += 'WHERE syllabus = ? ';
                params.push(syllabus);
            }
            if (search) {
                const searchWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${searchWhere}(code LIKE ? OR name LIKE ?) `;
                params.push(`%${search}%`, `%${search}%`);
            }
            const [subjects] = await pool.execute(
                `SELECT * FROM subjects 
                 ${whereClause}
                 ORDER BY name`,
                params
            );
            res.json({
                success: true,
                data: subjects
            });
        } catch (error) {
            console.error('Error fetching subjects:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
        }
    }

    // Get subject by ID
    async getSubjectById(req, res) {
        try {
            const { id } = req.params;
            
            const [subjects] = await pool.execute(
                'SELECT * FROM subjects WHERE id = ?',
                [id]
            );
            
            if (subjects.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }
            
            res.json({ success: true, data: subjects[0] });
        } catch (error) {
            console.error('Error fetching subject:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subject' });
        }
    }

    // Create new subject
    async createSubject(req, res) {
        try {
            const { code, name, syllabus } = req.body;
            
            if (!code || !name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Code and name are required' 
                });
            }
            
            // Check if subject code already exists
            const [existingCode] = await pool.execute(
                'SELECT id FROM subjects WHERE code = ?',
                [code]
            );
            
            if (existingCode.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject code already exists' 
                });
            }
            
            // Check if subject name already exists
            const [existingName] = await pool.execute(
                'SELECT id FROM subjects WHERE name = ?',
                [name]
            );
            
            if (existingName.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject name already exists' 
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO subjects (code, name, syllabus) VALUES (?, ?, ?)',
                [code, name, syllabus || null]
            );
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'subjects',
                recordId: result.insertId,
                newValues: { code, name, syllabus }
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Subject created successfully',
                data: { 
                    id: result.insertId, 
                    code, 
                    name, 
                    syllabus 
                }
            });
        } catch (error) {
            console.error('Error creating subject:', error);
            res.status(500).json({ success: false, message: 'Failed to create subject' });
        }
    }

    // Update subject
    async updateSubject(req, res) {
        try {
            const { id } = req.params;
            const { code, name, syllabus } = req.body;
            
            if (!code || !name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Code and name are required' 
                });
            }
            
            // Check if subject exists
            const [existing] = await pool.execute(
                'SELECT * FROM subjects WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }
            
            // Check if new code conflicts with other subjects
            const [codeConflict] = await pool.execute(
                'SELECT id FROM subjects WHERE code = ? AND id != ?',
                [code, id]
            );
            
            if (codeConflict.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject code already exists' 
                });
            }
            
            // Check if new name conflicts with other subjects
            const [nameConflict] = await pool.execute(
                'SELECT id FROM subjects WHERE name = ? AND id != ?',
                [name, id]
            );
            
            if (nameConflict.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject name already exists' 
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE subjects SET code = ?, name = ?, syllabus = ? WHERE id = ?',
                [code, name, syllabus || null, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'subjects',
                recordId: id,
                newValues: { code, name, syllabus },
                oldValues: existing[0]
            });
            
            res.json({ 
                success: true, 
                message: 'Subject updated successfully',
                data: { id, code, name, syllabus }
            });
        } catch (error) {
            console.error('Error updating subject:', error);
            res.status(500).json({ success: false, message: 'Failed to update subject' });
        }
    }

    // Delete subject
    async deleteSubject(req, res) {
        try {
            const { id } = req.params;
            
            // Check if subject exists
            const [existing] = await pool.execute(
                'SELECT * FROM subjects WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }
            
            // Check if subject is referenced by other tables
            const [subjectClassRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM subject_classes WHERE subject_id = ?',
                [id]
            );
            
            if (subjectClassRefs[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete subject. It is referenced by subject classes.' 
                });
            }
            
            const [result] = await pool.execute(
                'DELETE FROM subjects WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'subjects',
                recordId: id,
                oldValues: {
                    code: existing[0].code,
                    name: existing[0].name,
                    syllabus: existing[0].syllabus
                }
            });
            
            res.json({ 
                success: true, 
                message: 'Subject deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting subject:', error);
            res.status(500).json({ success: false, message: 'Failed to delete subject' });
        }
    }

    // Get subjects by syllabus
    async getSubjectsBySyllabus(req, res) {
        try {
            const { syllabus } = req.params;
            
            const [subjects] = await pool.execute(
                'SELECT * FROM subjects WHERE syllabus = ? ORDER BY name',
                [syllabus]
            );
            
            res.json({ success: true, data: subjects });
        } catch (error) {
            console.error('Error fetching subjects by syllabus:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subjects by syllabus' });
        }
    }

    // Search subjects
    async searchSubjects(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Search query is required' 
                });
            }
            
            const [subjects] = await pool.execute(
                'SELECT * FROM subjects WHERE code LIKE ? OR name LIKE ? ORDER BY name LIMIT 20',
                [`%${q}%`, `%${q}%`]
            );
            
            res.json({ success: true, data: subjects });
        } catch (error) {
            console.error('Error searching subjects:', error);
            res.status(500).json({ success: false, message: 'Failed to search subjects' });
        }
    }
}

module.exports = new SubjectController();
