const { pool } = require('../../config/database');

// Get all inventory items with pagination and search
const getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (ii.name LIKE ? OR ii.reference LIKE ? OR ii.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category) {
      whereClause += ' AND ic.id = ?';
      params.push(category);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Get items with pagination
    const itemsQuery = `
      SELECT 
        ii.*,
        ic.name as category_name,
        ic.icon as category_icon,
        ic.color as category_color
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
      ORDER BY ii.name
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const [items] = await pool.execute(itemsQuery, params);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ii.*,
        ic.name as category_name,
        ic.icon as category_icon,
        ic.color as category_color
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.id = ?
    `;
    
    const [items] = await pool.execute(query, [id]);
    
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error.message
    });
  }
};

// Search items by name or reference
const searchItems = async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    if (!q.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const query = `
      SELECT 
        ii.*,
        ic.name as category_name,
        ic.icon as category_icon,
        ic.color as category_color
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.name LIKE ? OR ii.reference LIKE ?
      ORDER BY ii.name
      LIMIT 20
    `;
    
    const [items] = await pool.execute(query, [`%${q}%`, `%${q}%`]);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search items',
      error: error.message
    });
  }
};

// Create new item
const createItem = async (req, res) => {
  try {
    console.log('📦 Create item request received');
    console.log('📦 Request body:', req.body);
    console.log('📦 Request headers:', req.headers);
    
    const { 
      name, 
      reference, 
      category_id, 
      description, 
      unit_price, 
      current_stock, 
      location, 
      supplier 
    } = req.body;
    
    console.log('📦 Parsed data:', {
      name, reference, category_id, description, unit_price, current_stock, location, supplier
    });
    
    // Validate required fields
    if (!name || !reference || !category_id || !unit_price || current_stock === undefined) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, reference, category, unit price, and current stock are required'
      });
    }
    
    // Check if reference already exists
    console.log('📦 Checking if reference exists:', reference);
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_items WHERE reference = ?',
      [reference]
    );
    
    if (existing.length > 0) {
      console.log('❌ Reference already exists');
      return res.status(400).json({
        success: false,
        message: 'Reference already exists'
      });
    }
    
    // Check if category exists
    console.log('📦 Checking if category exists:', category_id);
    const [category] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE id = ?',
      [category_id]
    );
    
    if (category.length === 0) {
      console.log('❌ Invalid category ID:', category_id);
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Insert new item
    console.log('📦 Inserting new item into database...');
    const insertQuery = `INSERT INTO inventory_items 
       (name, reference, category_id, description, unit_price, current_stock, location, supplier) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertParams = [name, reference, category_id, description || null, unit_price, current_stock, location || null, supplier || null];
    
    console.log('📦 Insert query:', insertQuery);
    console.log('📦 Insert params:', insertParams);
    
    const [result] = await pool.execute(insertQuery, insertParams);
    console.log('✅ Item inserted successfully, ID:', result.insertId);
    
    // Fetch the created item
    const [newItem] = await pool.execute(
      'SELECT * FROM inventory_items WHERE id = ?',
      [result.insertId]
    );
    
    console.log('📦 Created item:', newItem[0]);
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem[0]
    });
  } catch (error) {
    console.error('❌ Error creating item:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message
    });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      reference, 
      category_id, 
      description, 
      unit_price, 
      current_stock, 
      location, 
      supplier 
    } = req.body;
    
    // Validate required fields
    if (!name || !reference || !category_id || !unit_price || current_stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, reference, category, unit price, and current stock are required'
      });
    }
    
    // Check if item exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Check if new reference conflicts with existing items
    const [referenceConflict] = await pool.execute(
      'SELECT id FROM inventory_items WHERE reference = ? AND id != ?',
      [reference, id]
    );
    
    if (referenceConflict.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Reference already exists'
      });
    }
    
    // Check if category exists
    const [category] = await pool.execute(
      'SELECT id FROM inventory_categories WHERE id = ?',
      [category_id]
    );
    
    if (category.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Update item
    await pool.execute(
      `UPDATE inventory_items 
       SET name = ?, reference = ?, category_id = ?, description = ?, 
           unit_price = ?, current_stock = ?, location = ?, supplier = ?
       WHERE id = ?`,
      [name, reference, category_id, description || null, unit_price, current_stock, location || null, supplier || null, id]
    );
    
    // Fetch updated item
    const [updatedItem] = await pool.execute(
      'SELECT * FROM inventory_items WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem[0]
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Check if item has been issued
    const [issues] = await pool.execute(
      'SELECT id FROM uniform_issues WHERE item_id = ?',
      [id]
    );
    
    if (issues.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing issues'
      });
    }
    
    // Delete item
    await pool.execute(
      'DELETE FROM inventory_items WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message
    });
  }
};

// Update stock level
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_stock } = req.body;
    
    if (current_stock === undefined || current_stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid current stock is required'
      });
    }
    
    // Check if item exists
    const [existing] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Update stock
    await pool.execute(
      'UPDATE inventory_items SET current_stock = ? WHERE id = ?',
      [current_stock, id]
    );
    
    res.json({
      success: true,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  searchItems,
  createItem,
  updateItem,
  deleteItem,
  updateStock
};
