const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class InvoiceStructureController {
    // Get all invoice structures with optional filtering
    async getAllInvoiceStructures(req, res) {
        try {
            const { gradelevel_class_id, term, academic_year } = req.query;
            let whereClause = '';
            let params = [];

            if (gradelevel_class_id) {
                whereClause += 'WHERE inv.gradelevel_class_id = ? ';
                params.push(gradelevel_class_id);
            }
            if (term) {
                const termWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${termWhere}inv.term = ? `;
                params.push(term);
            }
            if (academic_year) {
                const yearWhere = whereClause ? 'AND ' : 'WHERE ';
                whereClause += `${yearWhere}inv.academic_year = ? `;
                params.push(academic_year);
            }

            const [structures] = await pool.execute(
                `SELECT inv.*, 
                        gc.name as class_name,
                        s.name as stream_name,
                        c.name as currency_name, c.symbol as currency_symbol
                 FROM invoice_structures inv
                 LEFT JOIN gradelevel_classes gc ON inv.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 LEFT JOIN currencies c ON inv.currency_id = c.id
                 ${whereClause}
                 ORDER BY inv.academic_year DESC, inv.term, s.name, gc.name`,
                params
            );

            // Get invoice items for each structure
            for (let structure of structures) {
                const [items] = await pool.execute(
                    'SELECT * FROM invoice_items WHERE invoice_structure_id = ? AND is_active = TRUE ORDER BY item_name',
                    [structure.id]
                );
                structure.invoice_items = items;
            }

            res.json({
                success: true,
                data: structures
            });
        } catch (error) {
            console.error('Error fetching invoice structures:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch invoice structures' });
        }
    }

    // Get invoice structure by ID
    async getInvoiceStructureById(req, res) {
        try {
            const { id } = req.params;

            const [structures] = await pool.execute(
                `SELECT inv.*, 
                        gc.name as class_name,
                        s.name as stream_name,
                        c.name as currency_name, c.symbol as currency_symbol
                 FROM invoice_structures inv
                 LEFT JOIN gradelevel_classes gc ON inv.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 LEFT JOIN currencies c ON inv.currency_id = c.id
                 WHERE inv.id = ?`,
                [id]
            );

            if (structures.length === 0) {
                return res.status(404).json({ success: false, message: 'Invoice structure not found' });
            }

            // Get invoice items for this structure
            const [items] = await pool.execute(
                'SELECT * FROM invoice_items WHERE invoice_structure_id = ? AND is_active = TRUE ORDER BY item_name',
                [id]
            );
            structures[0].invoice_items = items;

            res.json({
                success: true,
                data: structures[0]
            });
        } catch (error) {
            console.error('Error fetching invoice structure:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch invoice structure' });
        }
    }

    // Create new invoice structure
    async createInvoiceStructure(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { 
                gradelevel_class_id, 
                term, 
                academic_year, 
                total_amount, 
                currency_id, 
                invoice_items 
            } = req.body;

            // Validation
            if (!gradelevel_class_id || !term || !academic_year || !total_amount || !currency_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade level class, term, academic year, total amount, and currency are required' 
                });
            }

            // Check if currency exists
            const [currencies] = await conn.execute(
                'SELECT id FROM currencies WHERE id = ?',
                [currency_id]
            );

            if (currencies.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Currency not found' 
                });
            }

            // Check for duplicate invoice structure
            const [existing] = await conn.execute(
                'SELECT id FROM invoice_structures WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ?',
                [gradelevel_class_id, term, academic_year]
            );

            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invoice structure already exists for this class, term, and academic year' 
                });
            }

            // Create invoice structure
            const [result] = await conn.execute(
                `INSERT INTO invoice_structures 
                 (gradelevel_class_id, term, academic_year, total_amount, currency_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [gradelevel_class_id, term, academic_year, total_amount, currency_id, req.user.id]
            );

            const invoiceStructureId = result.insertId;

            // Create invoice items if provided
            if (invoice_items && Array.isArray(invoice_items) && invoice_items.length > 0) {
                for (const item of invoice_items) {
                    if (item.item_name && item.amount) {
                        await conn.execute(
                            `INSERT INTO invoice_items 
                             (invoice_structure_id, item_name, amount, description, created_by) 
                             VALUES (?, ?, ?, ?, ?)`,
                            [invoiceStructureId, item.item_name, item.amount, item.description || null, req.user.id]
                        );
                    }
                }
            }

            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'invoice_structures',
                recordId: invoiceStructureId,
                newValues: { gradelevel_class_id, term, academic_year, total_amount, currency_id, invoice_items }
            });

            await conn.commit();

            res.status(201).json({
                success: true,
                message: 'Invoice structure created successfully',
                data: { id: invoiceStructureId }
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error creating invoice structure:', error);
            res.status(500).json({ success: false, message: 'Failed to create invoice structure' });
        } finally {
            conn.release();
        }
    }

    // Update invoice structure
    async updateInvoiceStructure(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;
            const { 
                gradelevel_class_id, 
                term, 
                academic_year, 
                total_amount, 
                currency_id, 
                is_active,
                invoice_items 
            } = req.body;

            // Check if invoice structure exists
            const [existing] = await conn.execute(
                'SELECT * FROM invoice_structures WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Invoice structure not found' });
            }

            // Validation
            if (!gradelevel_class_id || !term || !academic_year || !total_amount || !currency_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Grade level class, term, academic year, total amount, and currency are required' 
                });
            }

            // Check for duplicate (excluding current record)
            const [duplicate] = await conn.execute(
                'SELECT id FROM invoice_structures WHERE gradelevel_class_id = ? AND term = ? AND academic_year = ? AND id != ?',
                [gradelevel_class_id, term, academic_year, id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invoice structure already exists for this class, term, and academic year' 
                });
            }

            // Update invoice structure
            await conn.execute(
                `UPDATE invoice_structures 
                 SET gradelevel_class_id = ?, term = ?, academic_year = ?, 
                     total_amount = ?, currency_id = ?, 
                     is_active = ?, updated_by = ?
                 WHERE id = ?`,
                [gradelevel_class_id, term, academic_year, total_amount, currency_id, is_active, req.user.id, id]
            );

            // Update invoice items if provided
            if (invoice_items && Array.isArray(invoice_items)) {
                // Deactivate all existing items
                await conn.execute(
                    'UPDATE invoice_items SET is_active = FALSE WHERE invoice_structure_id = ?',
                    [id]
                );

                // Create new items
                for (const item of invoice_items) {
                    if (item.item_name && item.amount) {
                        await conn.execute(
                            `INSERT INTO invoice_items 
                             (invoice_structure_id, item_name, amount, description, created_by) 
                             VALUES (?, ?, ?, ?, ?)`,
                            [id, item.item_name, item.amount, item.description || null, req.user.id]
                        );
                    }
                }
            }

            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'invoice_structures',
                recordId: id,
                oldValues: existing[0],
                newValues: { gradelevel_class_id, term, academic_year, total_amount, currency_id, is_active, invoice_items }
            });

            await conn.commit();

            res.json({
                success: true,
                message: 'Invoice structure updated successfully'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error updating invoice structure:', error);
            res.status(500).json({ success: false, message: 'Failed to update invoice structure' });
        } finally {
            conn.release();
        }
    }

    // Delete invoice structure
    async deleteInvoiceStructure(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { id } = req.params;

            // Check if invoice structure exists
            const [existing] = await conn.execute(
                'SELECT * FROM invoice_structures WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Invoice structure not found' });
            }

            // Check if there are any payments using this structure
            const [payments] = await conn.execute(
                'SELECT COUNT(*) as count FROM boarding_fees_payments WHERE invoice_structure_id = ?',
                [id]
            );

            if (payments[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete invoice structure that has associated payments' 
                });
            }

            // Delete invoice items first
            await conn.execute(
                'DELETE FROM invoice_items WHERE invoice_structure_id = ?',
                [id]
            );

            // Delete invoice structure
            await conn.execute(
                'DELETE FROM invoice_structures WHERE id = ?',
                [id]
            );

            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'invoice_structures',
                recordId: id,
                oldValues: existing[0]
            });

            await conn.commit();

            res.json({
                success: true,
                message: 'Invoice structure deleted successfully'
            });
        } catch (error) {
            await conn.rollback();
            console.error('Error deleting invoice structure:', error);
            res.status(500).json({ success: false, message: 'Failed to delete invoice structure' });
        } finally {
            conn.release();
        }
    }

    // Get invoice structures by class
    async getInvoiceStructuresByClass(req, res) {
        try {
            const { gradelevel_class_id } = req.params;
            const { term, academic_year } = req.query;

            let whereClause = 'WHERE inv.gradelevel_class_id = ?';
            let params = [gradelevel_class_id];

            if (term) {
                whereClause += ' AND inv.term = ?';
                params.push(term);
            }
            if (academic_year) {
                whereClause += ' AND inv.academic_year = ?';
                params.push(academic_year);
            }

            const [structures] = await pool.execute(
                `SELECT inv.*, 
                        gc.name as class_name,
                        s.name as stream_name,
                        c.name as currency_name, c.symbol as currency_symbol
                 FROM invoice_structures inv
                 LEFT JOIN gradelevel_classes gc ON inv.gradelevel_class_id = gc.id
                 LEFT JOIN stream s ON gc.stream_id = s.id
                 LEFT JOIN currencies c ON inv.currency_id = c.id
                 ${whereClause}
                 ORDER BY inv.academic_year DESC, inv.term`,
                params
            );

            // Get invoice items for each structure
            for (let structure of structures) {
                const [items] = await pool.execute(
                    'SELECT * FROM invoice_items WHERE invoice_structure_id = ? AND is_active = TRUE ORDER BY item_name',
                    [structure.id]
                );
                structure.invoice_items = items;
            }

            res.json({
                success: true,
                data: structures
            });
        } catch (error) {
            console.error('Error fetching invoice structures by class:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch invoice structures' });
        }
    }

    // Get invoice items by structure ID
    async getInvoiceItemsByStructure(req, res) {
        try {
            const { invoice_structure_id } = req.params;

            const [items] = await pool.execute(
                'SELECT * FROM invoice_items WHERE invoice_structure_id = ? AND is_active = TRUE ORDER BY item_name',
                [invoice_structure_id]
            );

            res.json({
                success: true,
                data: items
            });
        } catch (error) {
            console.error('Error fetching invoice items:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch invoice items' });
        }
    }
}

module.exports = new InvoiceStructureController();
