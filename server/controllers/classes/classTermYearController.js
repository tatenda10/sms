const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class ClassTermYearController {
    // Get all class term year records
    async getAllClassTermYears(req, res) {
        try {
            console.log('Fetching class term years...');
            const { term, academic_year, gradelevel_class_id } = req.query;
            let whereClause = '';
            let params = [];

            if (term) {
                whereClause += whereClause ? ' AND ' : 'WHERE ';
                whereClause += 'cty.term = ?';
                params.push(term);
            }
            if (academic_year) {
                whereClause += whereClause ? ' AND ' : 'WHERE ';
                whereClause += 'cty.academic_year = ?';
                params.push(academic_year);
            }
            if (gradelevel_class_id) {
                whereClause += whereClause ? ' AND ' : 'WHERE ';
                whereClause += 'cty.gradelevel_class_id = ?';
                params.push(gradelevel_class_id);
            }

            console.log('SQL Query:', `SELECT cty.*, gc.name as class_name, s.name as stream_name FROM class_term_year cty LEFT JOIN gradelevel_classes gc ON cty.gradelevel_class_id = gc.id LEFT JOIN stream s ON gc.stream_id = s.id ${whereClause} ORDER BY cty.academic_year DESC, cty.term, s.name, gc.name`);
            console.log('Parameters:', params);

            const [records] = await pool.execute(
                `SELECT cty.*, 
                        gc.name as class_name,
                        s.name as stream_name
                 FROM class_term_year cty
                 LEFT JOIN gradelevel_classes gc ON cty.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 ${whereClause}
                 ORDER BY cty.academic_year DESC, cty.term, s.name, gc.name`,
                params
            );

            console.log('Records found:', records.length);

            res.json({
                success: true,
                data: records
            });
        } catch (error) {
            console.error('Error fetching class term years:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch class term years',
                error: error.message 
            });
        }
    }

    // Get class term year by ID
    async getClassTermYearById(req, res) {
        try {
            const { id } = req.params;

            const [records] = await pool.execute(
                `SELECT cty.*, 
                        gc.name as class_name,
                        s.name as stream_name
                 FROM class_term_year cty
                 LEFT JOIN gradelevel_classes gc ON cty.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 WHERE cty.id = ?`,
                [id]
            );

            if (records.length === 0) {
                return res.status(404).json({ success: false, message: 'Class term year not found' });
            }

            res.json({
                success: true,
                data: records[0]
            });
        } catch (error) {
            console.error('Error fetching class term year:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch class term year' });
        }
    }

    // Create new class term year record
    async createClassTermYear(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { 
                gradelevel_class_id, 
                term, 
                academic_year, 
                start_date, 
                end_date 
            } = req.body;

            // Validation
            if (!gradelevel_class_id || !term || !academic_year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade level class, term, and academic year are required' 
                });
            }

            // Check if class exists
            const [classes] = await conn.execute(
                'SELECT id FROM gradelevel_classes WHERE id = ?',
                [gradelevel_class_id]
            );

            if (classes.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade level class not found' 
                });
            }

            // Check for duplicate
            const [existing] = await conn.execute(
                'SELECT id FROM class_term_year WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ?',
                [gradelevel_class_id, term, academic_year]
            );

            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Class term year record already exists for this class, term, and academic year' 
                });
            }

            // Create class term year record
            const [result] = await conn.execute(
                `INSERT INTO class_term_year 
                 (gradelevel_class_id, term, academic_year, start_date, end_date, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [gradelevel_class_id, term, academic_year, start_date || null, end_date || null, req.user.id]
            );

            const recordId = result.insertId;

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'CREATE',
                    tableName: 'class_term_year',
                    recordId: recordId,
                    newValues: { gradelevel_class_id, term, academic_year, start_date, end_date }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
                // Don't fail the main operation if audit fails
            }

            await conn.commit();

            res.status(201).json({
                success: true,
                message: 'Class term year record created successfully',
                data: { id: recordId }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error creating class term year:', error);
            res.status(500).json({ success: false, message: 'Failed to create class term year record' });
        } finally {
            conn.release();
        }
    }

    // Update class term year record
    async updateClassTermYear(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;
            const { 
                gradelevel_class_id, 
                term, 
                academic_year, 
                start_date, 
                end_date,
                is_active 
            } = req.body;

            // Check if record exists
            const [existing] = await conn.execute(
                'SELECT * FROM class_term_year WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Class term year record not found' });
            }

            // Validation
            if (!gradelevel_class_id || !term || !academic_year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade level class, term, and academic year are required' 
                });
            }

            // Check for duplicate (excluding current record)
            const [duplicate] = await conn.execute(
                'SELECT id FROM class_term_year WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ? AND id != ?',
                [gradelevel_class_id, term, academic_year, id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Class term year record already exists for this class, term, and academic year' 
                });
            }

            // Update record
            await conn.execute(
                `UPDATE class_term_year 
                 SET gradelevel_class_id = ?, term = ?, academic_year = ?, 
                     start_date = ?, end_date = ?, is_active = ?, updated_by = ?
                 WHERE id = ?`,
                [gradelevel_class_id, term, academic_year, start_date || null, end_date || null, is_active, req.user.id, id]
            );

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'UPDATE',
                    tableName: 'class_term_year',
                    recordId: id,
                    oldValues: existing[0],
                    newValues: { gradelevel_class_id, term, academic_year, start_date, end_date, is_active }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
                // Don't fail the main operation if audit fails
            }

            await conn.commit();

            res.json({
                success: true,
                message: 'Class term year record updated successfully'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error updating class term year:', error);
            res.status(500).json({ success: false, message: 'Failed to update class term year record' });
        } finally {
            conn.release();
        }
    }

    // Delete class term year record
    async deleteClassTermYear(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;

            // Check if record exists
            const [existing] = await conn.execute(
                'SELECT * FROM class_term_year WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Class term year record not found' });
            }

            // Check if there are any invoice structures using this record
            const [invoiceStructures] = await conn.execute(
                'SELECT COUNT(*) as count FROM invoice_structures WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ?',
                [existing[0].gradelevel_class_id, existing[0].term, existing[0].academic_year]
            );

            if (invoiceStructures[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete class term year record that has associated invoice structures' 
                });
            }

            // Delete record
            await conn.execute(
                'DELETE FROM class_term_year WHERE id = ?',
                [id]
            );

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'DELETE',
                    tableName: 'class_term_year',
                    recordId: id,
                    oldValues: existing[0]
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
                // Don't fail the main operation if audit fails
            }

            await conn.commit();

            res.json({
                success: true,
                message: 'Class term year record deleted successfully'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error deleting class term year:', error);
            res.status(500).json({ success: false, message: 'Failed to delete class term year record' });
        } finally {
            conn.release();
        }
    }

    // Bulk populate class term year records for all classes
    async bulkPopulateClassTermYears(req, res) {
        const conn = await pool.getConnection();
        try {
            console.log('Starting bulk populate...');
            await conn.beginTransaction();

            const { term, academic_year, start_date, end_date } = req.body;
            console.log('Bulk populate data:', { term, academic_year, start_date, end_date });

            // Validation
            if (!term || !academic_year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Term and academic year are required' 
                });
            }

            // Get all classes
            const [classes] = await conn.execute(
                'SELECT id FROM gradelevel_classes'
            );

            console.log('Found classes:', classes.length);

            if (classes.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No active classes found' 
                });
            }

            let createdCount = 0;
            let skippedCount = 0;

            // Create or update class term year records for each class
            for (const cls of classes) {
                // Check if class already has a term/year record (any term/year)
                const [existing] = await conn.execute(
                    'SELECT id FROM class_term_year WHERE gradelevel_class_id = ?',
                    [cls.id]
                );

                if (existing.length > 0) {
                    // UPDATE existing record to new term/year
                    await conn.execute(
                        `UPDATE class_term_year 
                         SET term = ?, academic_year = ?, start_date = ?, end_date = ?, 
                             is_active = TRUE, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE gradelevel_class_id = ?`,
                        [term, academic_year, start_date || null, end_date || null, req.user.id, cls.id]
                    );
                    createdCount++; // Count as updated
                } else {
                    // CREATE new record
                    await conn.execute(
                        `INSERT INTO class_term_year 
                         (gradelevel_class_id, term, academic_year, start_date, end_date, created_by) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [cls.id, term, academic_year, start_date || null, end_date || null, req.user.id]
                    );
                    createdCount++;
                }
            }

            // Log audit event
            try {
                await AuditLogger.log({
                    userId: req.user.id,
                    action: 'BULK_CREATE',
                    tableName: 'class_term_year',
                    recordId: null,
                    newValues: { 
                        term, 
                        academic_year, 
                        start_date, 
                        end_date, 
                        created_count: createdCount,
                        skipped_count: skippedCount
                    }
                });
            } catch (auditError) {
                console.error('Audit logging failed:', auditError);
                // Don't fail the main operation if audit fails
            }

            await conn.commit();

            console.log('Bulk populate completed:', { createdCount, skippedCount });

            res.json({
                success: true,
                message: `Bulk population completed. Updated/Created: ${createdCount}, Total Classes: ${classes.length}`,
                data: {
                    updated_count: createdCount,
                    total_classes: classes.length
                }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error bulk populating class term years:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            res.status(500).json({ 
                success: false, 
                message: 'Failed to bulk populate class term years',
                error: error.message 
            });
        } finally {
            conn.release();
        }
    }

    // Get classes that don't have term/year records
    async getClassesWithoutTermYear(req, res) {
        try {
            const { term, academic_year } = req.query;

            if (!term || !academic_year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Term and academic year are required' 
                });
            }

            const [classes] = await pool.execute(
                `SELECT gc.id, gc.name, s.name as stream_name
                 FROM gradelevel_classes gc
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 WHERE gc.id NOT IN (
                     SELECT gradelevel_class_id 
                     FROM class_term_year 
                     WHERE term = ? AND academic_year = ?
                 )
                 ORDER BY s.name, gc.name`,
                [term, academic_year]
            );

            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error fetching classes without term year:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch classes without term year' });
        }
    }
}

module.exports = new ClassTermYearController();
