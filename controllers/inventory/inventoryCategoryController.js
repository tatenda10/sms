const { pool } = require('../../config/database');

// Get all categories with item counts
const getAllCategories = async (req, res) => {
  try {
    const query = `
      SELECT 
        ic.*,
        COUNT(ii.id) as item_count
      FROM inventory_categories ic
      LEFT JOIN inventory_items ii ON ic.id = ii.category_id
      GROUP BY ic.id
      ORDER BY ic.name
    `;
    
    const [categories] = await pool.execute(query);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ic.*,
        COUNT(ii.id) as item_count
      FROM inventory_categories ic
      LEFT JOIN inventory_items ii ON ic.id = ii.category_id
      WHERE ic.id = ?
      GROUP BY ic.id
    `;
    
    const [categories] = await pool.execute(query, [id]);
    
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, icon, color, description } = req.body;
    
    // Validate required fields
    if (!name || !icon || !color) {
      return res.status(400).json({
        success: false,
        message: 'Name, icon, and color are required'
      });
    }
    
    // Check if category name already exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE name = ?',
      [name]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    // Insert new category
    const [result] = await pool.execute(
      'INSERT INTO inventory_categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
      [name, icon, color, description || null]
    );
    
    // Fetch the created category
    const [newCategory] = await pool.execute(
      'SELECT * FROM inventory_categories WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, description } = req.body;
    
    // Validate required fields
    if (!name || !icon || !color) {
      return res.status(400).json({
        success: false,
        message: 'Name, icon, and color are required'
      });
    }
    
    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if new name conflicts with existing categories
    const [nameConflict] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE name = ? AND id != ?',
      [name, id]
    );
    
    if (nameConflict.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    // Update category
    await pool.execute(
      'UPDATE inventory_categories SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?',
      [name, icon, color, description || null, id]
    );
    
    // Fetch updated category
    const [updatedCategory] = await pool.execute(
      'SELECT * FROM inventory_categories WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has items
    const [items] = await pool.execute(
      'SELECT id FROM inventory_items WHERE category_id = ?',
      [id]
    );
    
    if (items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing items'
      });
    }
    
    // Delete category
    await pool.execute(
      'DELETE FROM inventory_categories WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
