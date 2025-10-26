const { pool } = require('../../config/database');

class SportsCategoriesController {
  // Get all sports categories
  static async getAllCategories(req, res) {
    try {
      const { active_only = 'true' } = req.query;
      
      let whereClause = '';
      let queryParams = [];
      
      if (active_only === 'true') {
        whereClause = 'WHERE is_active = ?';
        queryParams.push(true);
      }
      
      const query = `
        SELECT 
          id,
          name,
          description,
          icon,
          is_active,
          created_at,
          updated_at
        FROM sports_categories
        ${whereClause}
        ORDER BY name ASC
      `;
      
      const [categories] = await pool.execute(query, queryParams);
      
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Error fetching sports categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports categories'
      });
    }
  }

  // Get category by ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          id,
          name,
          description,
          icon,
          is_active,
          created_at,
          updated_at
        FROM sports_categories
        WHERE id = ?
      `;
      
      const [categories] = await pool.execute(query, [id]);
      
      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports category not found'
        });
      }
      
      res.json({
        success: true,
        data: categories[0]
      });
    } catch (error) {
      console.error('Error fetching sports category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sports category'
      });
    }
  }

  // Create new sports category
  static async createCategory(req, res) {
    try {
      const { name, description, icon = 'fa-futbol' } = req.body;
      
      // Check if category already exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_categories WHERE name = ?',
        [name]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Sports category with this name already exists'
        });
      }
      
      const query = `
        INSERT INTO sports_categories (name, description, icon, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      
      const [result] = await pool.execute(query, [name, description, icon]);
      
      res.status(201).json({
        success: true,
        message: 'Sports category created successfully',
        data: {
          id: result.insertId,
          name,
          description,
          icon
        }
      });
    } catch (error) {
      console.error('Error creating sports category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sports category'
      });
    }
  }

  // Update sports category
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, icon, is_active } = req.body;
      
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_categories WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports category not found'
        });
      }
      
      // Check if new name conflicts with existing category
      if (name) {
        const [conflict] = await pool.execute(
          'SELECT id FROM sports_categories WHERE name = ? AND id != ?',
          [name, id]
        );
        
        if (conflict.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Sports category with this name already exists'
          });
        }
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(icon);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `
        UPDATE sports_categories 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await pool.execute(query, updateValues);
      
      res.json({
        success: true,
        message: 'Sports category updated successfully'
      });
    } catch (error) {
      console.error('Error updating sports category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports category'
      });
    }
  }

  // Delete sports category (soft delete)
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      // Check if category exists
      const [existing] = await pool.execute(
        'SELECT id FROM sports_categories WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sports category not found'
        });
      }
      
      // Check if category has associated teams
      const [teams] = await pool.execute(
        'SELECT COUNT(*) as count FROM sports_teams WHERE sport_category_id = ?',
        [id]
      );
      
      if (teams[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with associated teams. Please remove teams first.'
        });
      }
      
      // Soft delete by setting is_active to false
      await pool.execute(
        'UPDATE sports_categories SET is_active = false, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Sports category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sports category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete sports category'
      });
    }
  }
}

module.exports = SportsCategoriesController;
