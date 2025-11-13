const { pool } = require('../../config/database');

class AssetTypesController {
    // Get all asset types
    async getAllAssetTypes(req, res) {
        try {
            const [assetTypes] = await pool.execute(`
                SELECT 
                    ft.*,
                    coa.code as account_code,
                    coa.name as account_name,
                    dep_coa.code as depreciation_account_code,
                    dep_coa.name as depreciation_account_name,
                    exp_coa.code as expense_account_code,
                    exp_coa.name as expense_account_name
                FROM fixed_asset_types ft
                JOIN chart_of_accounts coa ON ft.chart_of_account_id = coa.id
                LEFT JOIN chart_of_accounts dep_coa ON ft.depreciation_account_id = dep_coa.id
                LEFT JOIN chart_of_accounts exp_coa ON ft.expense_account_id = exp_coa.id
                WHERE ft.is_active = 1
                ORDER BY ft.name
            `);
            
            // Get custom fields for each type
            for (let type of assetTypes) {
                const [customFields] = await pool.execute(`
                    SELECT * FROM fixed_asset_custom_fields
                    WHERE asset_type_id = ?
                    ORDER BY display_order
                `, [type.id]);
                
                type.custom_fields = customFields;
            }
            
            res.json({
                success: true,
                data: assetTypes
            });
        } catch (error) {
            console.error('Error fetching asset types:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch asset types',
                details: error.message
            });
        }
    }
    
    // Get single asset type
    async getAssetType(req, res) {
        try {
            const { id } = req.params;
            
            const [[assetType]] = await pool.execute(`
                SELECT 
                    ft.*,
                    coa.code as account_code,
                    coa.name as account_name,
                    dep_coa.code as depreciation_account_code,
                    dep_coa.name as depreciation_account_name,
                    exp_coa.code as expense_account_code,
                    exp_coa.name as expense_account_name
                FROM fixed_asset_types ft
                JOIN chart_of_accounts coa ON ft.chart_of_account_id = coa.id
                LEFT JOIN chart_of_accounts dep_coa ON ft.depreciation_account_id = dep_coa.id
                LEFT JOIN chart_of_accounts exp_coa ON ft.expense_account_id = exp_coa.id
                WHERE ft.id = ?
            `, [id]);
            
            if (!assetType) {
                return res.status(404).json({
                    success: false,
                    error: 'Asset type not found'
                });
            }
            
            // Get custom fields
            const [customFields] = await pool.execute(`
                SELECT * FROM fixed_asset_custom_fields
                WHERE asset_type_id = ?
                ORDER BY display_order
            `, [id]);
            
            assetType.custom_fields = customFields;
            
            res.json({
                success: true,
                data: assetType
            });
        } catch (error) {
            console.error('Error fetching asset type:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch asset type',
                details: error.message
            });
        }
    }
    
    // Create new asset type
    async createAssetType(req, res) {
        const conn = await pool.getConnection();
        
        try {
            await conn.beginTransaction();
            
            const {
                name,
                description,
                chart_of_account_id,
                depreciation_account_id,
                expense_account_id,
                requires_registration,
                requires_serial_number,
                icon,
                custom_fields
            } = req.body;
            
            // Validate
            if (!name || !chart_of_account_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and Chart of Account are required'
                });
            }
            
            // Create asset type
            const [result] = await conn.execute(`
                INSERT INTO fixed_asset_types (
                    name, description, chart_of_account_id, depreciation_account_id,
                    expense_account_id, requires_registration, requires_serial_number,
                    icon, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name,
                description || null,
                chart_of_account_id,
                depreciation_account_id || null,
                expense_account_id || null,
                requires_registration || false,
                requires_serial_number || false,
                icon || 'faBox',
                req.user?.id || 1
            ]);
            
            const assetTypeId = result.insertId;
            
            // Add custom fields if provided
            if (custom_fields && Array.isArray(custom_fields) && custom_fields.length > 0) {
                for (let i = 0; i < custom_fields.length; i++) {
                    const field = custom_fields[i];
                    await conn.execute(`
                        INSERT INTO fixed_asset_custom_fields (
                            asset_type_id, field_name, field_label, field_type,
                            field_options, is_required, display_order
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        assetTypeId,
                        field.field_name,
                        field.field_label,
                        field.field_type || 'text',
                        field.field_options ? JSON.stringify(field.field_options) : null,
                        field.is_required || false,
                        i
                    ]);
                }
            }
            
            await conn.commit();
            
            res.status(201).json({
                success: true,
                message: 'Asset type created successfully',
                data: { id: assetTypeId }
            });
            
        } catch (error) {
            await conn.rollback();
            console.error('Error creating asset type:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create asset type',
                details: error.message
            });
        } finally {
            conn.release();
        }
    }
    
    // Update asset type
    async updateAssetType(req, res) {
        const conn = await pool.getConnection();
        
        try {
            await conn.beginTransaction();
            
            const { id } = req.params;
            const {
                name,
                description,
                chart_of_account_id,
                depreciation_account_id,
                expense_account_id,
                requires_registration,
                requires_serial_number,
                icon,
                custom_fields
            } = req.body;
            
            // Update asset type
            await conn.execute(`
                UPDATE fixed_asset_types
                SET name = ?, description = ?, chart_of_account_id = ?,
                    depreciation_account_id = ?, expense_account_id = ?,
                    requires_registration = ?, requires_serial_number = ?,
                    icon = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                name,
                description,
                chart_of_account_id,
                depreciation_account_id || null,
                expense_account_id || null,
                requires_registration || false,
                requires_serial_number || false,
                icon || 'faBox',
                id
            ]);
            
            // Update custom fields (delete and recreate for simplicity)
            await conn.execute('DELETE FROM fixed_asset_custom_fields WHERE asset_type_id = ?', [id]);
            
            if (custom_fields && Array.isArray(custom_fields) && custom_fields.length > 0) {
                for (let i = 0; i < custom_fields.length; i++) {
                    const field = custom_fields[i];
                    await conn.execute(`
                        INSERT INTO fixed_asset_custom_fields (
                            asset_type_id, field_name, field_label, field_type,
                            field_options, is_required, display_order
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        id,
                        field.field_name,
                        field.field_label,
                        field.field_type || 'text',
                        field.field_options ? JSON.stringify(field.field_options) : null,
                        field.is_required || false,
                        i
                    ]);
                }
            }
            
            await conn.commit();
            
            res.json({
                success: true,
                message: 'Asset type updated successfully'
            });
            
        } catch (error) {
            await conn.rollback();
            console.error('Error updating asset type:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update asset type',
                details: error.message
            });
        } finally {
            conn.release();
        }
    }
    
    // Delete asset type
    async deleteAssetType(req, res) {
        try {
            const { id } = req.params;
            
            // Check if there are assets using this type
            const [[count]] = await pool.execute(
                'SELECT COUNT(*) as count FROM fixed_assets WHERE asset_type_id = ?',
                [id]
            );
            
            if (count.count > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot delete asset type. ${count.count} asset(s) are using this type.`
                });
            }
            
            // Soft delete
            await pool.execute(
                'UPDATE fixed_asset_types SET is_active = 0 WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                message: 'Asset type deleted successfully'
            });
            
        } catch (error) {
            console.error('Error deleting asset type:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete asset type',
                details: error.message
            });
        }
    }
}

module.exports = new AssetTypesController();

