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

const Configurations = () => {
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
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory Categories</h1>
              <p className="text-xs text-gray-600">Manage item categories and organization</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Categories Display */}
        <div className="bg-white border border-gray-200">
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No categories found. Create your first category to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="bg-gray-50 border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 ${getColorClass(category.color)}`}>
                        <FontAwesomeIcon icon={getIconComponent(category.icon)} className="text-sm" />
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{category.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{category.description}</p>
                    <span className="text-xs text-gray-500">{category.item_count || 0} items</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <form className="space-y-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g., Uniforms"
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {iconOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, icon: option.value }))}
                          className={`p-2 border text-xs ${
                            newCategory.icon === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <FontAwesomeIcon icon={option.icon} className="text-sm" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, color: option.value }))}
                          className={`p-2 border text-xs ${option.class} ${
                            newCategory.color === option.value
                              ? 'ring-2 ring-blue-500'
                              : 'hover:opacity-80'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Brief description of the category..."
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-red-600 text-xs">{error}</div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                      className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800"
                    >
                      {editingCategory ? 'Update' : 'Add'} Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 shadow-lg z-50 text-sm">
            {success}
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 shadow-lg z-50 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Configurations;
