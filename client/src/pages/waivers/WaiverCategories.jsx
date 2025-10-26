import React, { useState, useEffect } from 'react';
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
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const WaiverCategories = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      setErrorMessage('Category name is required');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        await axios.put(`${BASE_URL}/waivers/categories/${editingCategory.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Waiver category updated successfully');
      } else {
        // Create new category
        await axios.post(`${BASE_URL}/waivers/categories`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Waiver category created successfully');
      }
      
      setShowSuccessModal(true);
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ category_name: '', description: '', is_active: true });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to save waiver category');
      }
      setShowErrorModal(true);
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
    setShowModal(true);
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
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorMessage('Failed to delete waiver category');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ category_name: '', description: '', is_active: true });
  };

  return (
    <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white border border-gray-200 p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading categories...</div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faTag} className="text-4xl text-gray-300 mb-4" />
              <div className="text-gray-500">No waiver categories found</div>
              <div className="text-xs text-gray-400 mt-2">Click "Add Category" to create your first category</div>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 p-3 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{category.category_name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-600">{category.description}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {new Date(category.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Edit category"
                      >
                        <FontAwesomeIcon icon={faEdit} className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete category"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm md:text-base font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                    placeholder="e.g., Staff Child, Scholarship"
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this waiver category..."
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    rows="3"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-xs text-gray-700">
                    Active (can be used for new waivers)
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm md:text-base font-bold text-gray-900">Confirm Delete</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">
                  Are you sure you want to delete this waiver category?
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm text-gray-900">{categoryToDelete?.category_name}</div>
                  {categoryToDelete?.description && (
                    <div className="text-xs text-gray-600 mt-1">{categoryToDelete.description}</div>
                  )}
                </div>
                <p className="text-xs text-red-600 mt-2">
                  This action cannot be undone. Existing waivers using this category will not be affected.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={errorMessage}
        />
    </div>
  );
};

export default WaiverCategories;
