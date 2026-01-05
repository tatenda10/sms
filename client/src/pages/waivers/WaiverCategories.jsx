import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faCheck, 
  faTimes,
  faTag,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const WaiverCategories = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    is_active: true
  });

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setShowModal(true);
      fetchCategories();
      setEditingCategory(null);
      setFormData({ category_name: '', description: '', is_active: true });
      setSuccessMessage('');
      setErrorMessage('');
    }
  }));

  useEffect(() => {
    if (showModal) {
      fetchCategories();
    }
  }, [showModal]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/waivers/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrorMessage('Failed to fetch waiver categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ category_name: '', description: '', is_active: true });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      setErrorMessage('Category name is required');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      if (editingCategory) {
        await axios.put(`${BASE_URL}/waivers/categories/${editingCategory.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Waiver category updated successfully');
      } else {
        await axios.post(`${BASE_URL}/waivers/categories`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Waiver category created successfully');
      }
      
      setEditingCategory(null);
      setFormData({ category_name: '', description: '', is_active: true });
      fetchCategories();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to save waiver category');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || '',
      is_active: category.is_active
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/waivers/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Waiver category deleted successfully');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorMessage('Failed to delete waiver category');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({ category_name: '', description: '', is_active: true });
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!showModal) return null;

  return (
    <>
      {/* Categories Modal */}
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header">
            <h3 className="modal-title">Waiver Categories</h3>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body">
            {/* Success/Error Messages */}
            {successMessage && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#065f46' }}>
                  <FontAwesomeIcon icon={faCheck} />
                  {successMessage}
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                  <FontAwesomeIcon icon={faTimes} />
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Add Category Button */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({ category_name: '', description: '', is_active: true });
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="btn-checklist"
                style={{ backgroundColor: '#2563eb' }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Category
              </button>
            </div>

            {/* Categories List */}
            {loading && categories.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <FontAwesomeIcon icon={faTag} style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }} />
                <div>No waiver categories found</div>
                <div style={{ fontSize: '0.7rem', marginTop: '8px' }}>Click "Add Category" to create your first category</div>
              </div>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      background: editingCategory?.id === category.id ? '#f0f9ff' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            {category.category_name}
                          </h4>
                          <span style={{
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            borderRadius: '12px',
                            background: category.is_active ? '#d1fae5' : '#fee2e2',
                            color: category.is_active ? '#065f46' : '#991b1b'
                          }}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {category.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                            {category.description}
                          </p>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                          Created: {new Date(category.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(category)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                          title="Edit category"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                          title="Delete category"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Form */}
            {(editingCategory || (!editingCategory && formData.category_name)) && (
              <div style={{
                border: '1px solid var(--border-color)',
                padding: '16px',
                borderRadius: '4px',
                background: '#f9fafb',
                marginTop: '24px'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h4>
                <form onSubmit={handleSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">
                      Category Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.category_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                      placeholder="e.g., Staff Child, Scholarship"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this waiver category..."
                      className="form-control"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span className="form-label" style={{ margin: 0 }}>Active (can be used for new waivers)</span>
                    </label>
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="modal-btn modal-btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="modal-btn modal-btn-confirm"
                    >
                      {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete this waiver category?
                </p>
                <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {categoryToDelete?.category_name}
                  </div>
                  {categoryToDelete?.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {categoryToDelete.description}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                  This action cannot be undone. Existing waivers using this category will not be affected.
                </p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="modal-btn modal-btn-delete"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

WaiverCategories.displayName = 'WaiverCategories';

export default WaiverCategories;
