const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class StreamController {
    // Get all streams with optional pagination
    async getAllStreams(req, res) {
        try {
            const [streams] = await pool.execute(
                'SELECT * FROM stream ORDER BY name'
            );
            res.json({
                success: true,
                data: streams
            });
        } catch (error) {
            console.error('Error fetching streams:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch streams' });
        }
    }

    // Get stream by ID
    async getStreamById(req, res) {
        try {
            const { id } = req.params;
            
            const [streams] = await pool.execute(
                'SELECT * FROM stream WHERE id = ?',
                [id]
            );
            
            if (streams.length === 0) {
                return res.status(404).json({ success: false, message: 'Stream not found' });
            }
            
            res.json({ success: true, data: streams[0] });
        } catch (error) {
            console.error('Error fetching stream:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch stream' });
        }
    }

    // Create new stream
    async createStream(req, res) {
        try {
            const { name, stage } = req.body;
            
            if (!name || !stage) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Name and stage are required' 
                });
            }
            
            // Check if stream name already exists
            const [existing] = await pool.execute(
                'SELECT id FROM stream WHERE name = ?',
                [name]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream name already exists' 
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO stream (name, stage) VALUES (?, ?)',
                [name, stage]
            );
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'CREATE',
                tableName: 'stream',
                recordId: result.insertId,
                newValues: { name, stage }
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Stream created successfully',
                data: { id: result.insertId, name, stage }
            });
        } catch (error) {
            console.error('Error creating stream:', error);
            res.status(500).json({ success: false, message: 'Failed to create stream' });
        }
    }

    // Update stream
    async updateStream(req, res) {
        try {
            const { id } = req.params;
            const { name, stage } = req.body;
            
            if (!name || !stage) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Name and stage are required' 
                });
            }
            
            // Check if stream exists
            const [existing] = await pool.execute(
                'SELECT * FROM stream WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Stream not found' });
            }
            
            // Check if new name conflicts with other streams
            const [nameConflict] = await pool.execute(
                'SELECT id FROM stream WHERE name = ? AND id != ?',
                [name, id]
            );
            
            if (nameConflict.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Stream name already exists' 
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE stream SET name = ?, stage = ? WHERE id = ?',
                [name, stage, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Stream not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'UPDATE',
                tableName: 'stream',
                recordId: id,
                oldValues: { name: existing[0].name, stage: existing[0].stage },
                newValues: { name, stage }
            });
            
            res.json({ 
                success: true, 
                message: 'Stream updated successfully',
                data: { id, name, stage }
            });
        } catch (error) {
            console.error('Error updating stream:', error);
            res.status(500).json({ success: false, message: 'Failed to update stream' });
        }
    }

    // Delete stream
    async deleteStream(req, res) {
        try {
            const { id } = req.params;
            
            // Check if stream exists
            const [existing] = await pool.execute(
                'SELECT * FROM stream WHERE id = ?',
                [id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Stream not found' });
            }
            
            // Check if stream is referenced by other tables
            const [gradelevelRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM gradelevel_classes WHERE stream_id = ?',
                [id]
            );
            
            const [subjectClassRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM subject_classes WHERE stream_id = ?',
                [id]
            );
            
            const [studentRefs] = await pool.execute(
                'SELECT COUNT(*) as count FROM students WHERE stream_id = ?',
                [id]
            );
            
            if (gradelevelRefs[0].count > 0 || subjectClassRefs[0].count > 0 || studentRefs[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete stream. It is referenced by other records.' 
                });
            }
            
            const [result] = await pool.execute(
                'DELETE FROM stream WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Stream not found' });
            }
            
            // Log audit event
            await AuditLogger.log({
                userId: req.user.id,
                action: 'DELETE',
                tableName: 'stream',
                recordId: id,
                oldValues: { name: existing[0].name, stage: existing[0].stage }
            });
            
            res.json({ 
                success: true, 
                message: 'Stream deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting stream:', error);
            res.status(500).json({ success: false, message: 'Failed to delete stream' });
        }
    }

    // Get streams by stage
    async getStreamsByStage(req, res) {
        try {
            const { stage } = req.params;
            
            const [streams] = await pool.execute(
                'SELECT * FROM stream WHERE stage = ? ORDER BY name',
                [stage]
            );
            
            res.json({ success: true, data: streams });
        } catch (error) {
            console.error('Error fetching streams by stage:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch streams by stage' });
        }
    }
}

module.exports = new StreamController();
