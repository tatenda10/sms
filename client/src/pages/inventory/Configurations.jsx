import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faTimes,
  faBoxes, faTshirt, faBook, faFlask, faFutbol, faPalette,
  faBroom, faLaptop, faUtensils, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const Configurations = ({ onClose }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // State for categories
  const [categories, setCategories] = useState([]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'faBoxes',
    color: 'blue',
    description: ''
  });

  const getIconComponent = (iconName) => {
    const iconMap = { faBoxes, faTshirt, faBook, faFlask, faFutbol, faPalette, faBroom, faLaptop, faUtensils, faBuilding };
    return iconMap[iconName] || faBoxes;
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      pink: 'bg-pink-100 text-pink-800',
      gray: 'bg-gray-100 text-gray-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      red: 'bg-red-100 text-red-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      const result = await createCategoryAPI(newCategory);

      setCategories(prev => [...prev, result.data]);
      setNewCategory({ name: '', icon: 'faBoxes', color: 'blue', description: '' });
      setShowAddModal(false);
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ ...category });
    setShowAddModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      await updateCategoryAPI(editingCategory.id, newCategory);

      setCategories(prev => prev.map(cat =>
        cat.id === editingCategory.id ? { ...cat, ...newCategory } : cat
      ));

      setEditingCategory(null);
      setNewCategory({ name: '', icon: 'faBoxes', color: 'blue', description: '' });
      setShowAddModal(false);
      setSuccess('Category updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLoading(true);
        await deleteCategoryAPI(id);

        setCategories(prev => prev.filter(cat => cat.id !== id));
        setSuccess('Category deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setNewCategory({ name: '', icon: 'faBoxes', color: 'blue', description: '' });
    setEditingCategory(null);
    setShowAddModal(false);
    setError(null);
  };

  // API functions
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/inventory/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategoryAPI = async (categoryData) => {
    try {
      const response = await axios.post(`${BASE_URL}/inventory/categories`, categoryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateCategoryAPI = async (id, categoryData) => {
    try {
      const response = await axios.put(`${BASE_URL}/inventory/categories/${id}`, categoryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteCategoryAPI = async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/inventory/categories/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Load categories on component mount
  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const iconOptions = [
    { value: 'faBoxes', label: 'Boxes', icon: faBoxes },
    { value: 'faTshirt', label: 'T-Shirt', icon: faTshirt },
    { value: 'faBook', label: 'Book', icon: faBook },
    { value: 'faFlask', label: 'Flask', icon: faFlask },
    { value: 'faFutbol', label: 'Sports', icon: faFutbol },
    { value: 'faPalette', label: 'Art', icon: faPalette },
    { value: 'faBroom', label: 'Cleaning', icon: faBroom },
    { value: 'faLaptop', label: 'IT', icon: faLaptop },
    { value: 'faUtensils', label: 'Kitchen', icon: faUtensils },
    { value: 'faBuilding', label: 'Building', icon: faBuilding }
  ];

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-800' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-800' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-800' },
    { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Inventory Categories
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manage item categories and organization</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-checklist"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {/* Categories Display */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px' }}>
        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No categories found. Create your first category to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {categories.map((category) => (
                <div key={category.id} style={{ background: '#f9fafb', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className={`p-2 rounded ${getColorClass(category.color)}`} style={{ borderRadius: '4px' }}>
                      <FontAwesomeIcon icon={getIconComponent(category.icon)} style={{ fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditCategory(category)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{category.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{category.description}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{category.item_count || 0} items</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm} style={{ zIndex: 10000 }}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', width: '90%' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button className="modal-close-btn" onClick={resetForm}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">

              <form className="modal-form">
                {/* Category Name */}
                <div className="form-group">
                  <label className="form-label">
                    Category Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., Uniforms"
                  />
                </div>

                {/* Icon Selection */}
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {iconOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewCategory(prev => ({ ...prev, icon: option.value }))}
                        style={{
                          padding: '8px',
                          border: `1px solid ${newCategory.icon === option.value ? '#2563eb' : 'var(--border-color)'}`,
                          borderRadius: '4px',
                          background: newCategory.icon === option.value ? '#eff6ff' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        <FontAwesomeIcon icon={option.icon} style={{ fontSize: '0.875rem' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewCategory(prev => ({ ...prev, color: option.value }))}
                        className={`${option.class}`}
                        style={{
                          padding: '8px',
                          border: `1px solid var(--border-color)`,
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          outline: newCategory.color === option.value ? '2px solid #2563eb' : 'none',
                          outlineOffset: '2px'
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                    className="form-control"
                    placeholder="Brief description of the category..."
                  />
                </div>

                {/* Form Actions */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                    className="modal-btn modal-btn-primary"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                        {editingCategory ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={editingCategory ? faEdit : faPlus} style={{ fontSize: '0.7rem' }} />
                        {editingCategory ? 'Update' : 'Add'} Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configurations;
