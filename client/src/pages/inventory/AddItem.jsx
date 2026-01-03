import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, faBoxes, faTshirt, faBook, faFlask, faFutbol,
  faPalette, faBroom, faLaptop, faUtensils
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const AddItem = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    reference: '',
    description: '',
    unitPrice: '',
    currentStock: '',
    location: '',
    supplier: ''
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      if (!token) return;

      try {
        setLoadingCategories(true);
        const response = await axios.get(`${BASE_URL}/inventory/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('❌ Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReference = () => {
    const category = formData.category || 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newReference = `${category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;

    setFormData(prev => ({
      ...prev,
      reference: newReference
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 Form submitted');
    console.log('🚀 Token:', token);
    console.log('🚀 BASE_URL:', BASE_URL);
    console.log('🚀 Form data:', formData);

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.category || !formData.reference) {
        setError('Please fill in all required fields');
        return;
      }

      if (parseFloat(formData.unitPrice) < 0) {
        setError('Unit price cannot be negative');
        return;
      }

      if (parseInt(formData.currentStock) < 0) {
        setError('Current stock cannot be negative');
        return;
      }

      // Prepare data for API
      const itemData = {
        name: formData.name.trim(),
        category_id: parseInt(formData.category),
        reference: formData.reference.trim(),
        description: formData.description.trim() || null,
        unit_price: parseFloat(formData.unitPrice),
        current_stock: parseInt(formData.currentStock),
        location: formData.location.trim() || null,
        supplier: formData.supplier.trim() || null
      };

      console.log('📦 Submitting item data:', itemData);

      // Call the API to create the item
      const response = await axios.post(`${BASE_URL}/inventory/items`, itemData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Item created successfully:', response.data);
      setSuccess('Item added successfully!');

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          category: '',
          reference: '',
          description: '',
          unitPrice: '',
          currentStock: '',
          location: '',
          supplier: ''
        });
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('❌ Error adding item:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to add items.');
      } else {
        setError('Failed to add item. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotalValue = () => {
    const stock = parseFloat(formData.currentStock) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    return stock * price;
  };

  const getStockStatus = () => {
    const current = parseInt(formData.currentStock) || 0;

    if (current === 0) return 'Out of Stock';
    if (current <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-green-600';
      case 'Low Stock': return 'text-yellow-600';
      case 'Out of Stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Item Details</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="e.g., Primary School Uniform - Boys"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                disabled={loadingCategories}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select Category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="e.g., UNI-PRI-B-001"
                />
                <button
                  type="button"
                  onClick={generateReference}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 border border-gray-300"
                >
                  Auto
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Brief description of the item..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Unit Price (USD) *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Stock Information */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Stock *
              </label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="e.g., Storage Room A"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="e.g., Uniforms Plus Ltd"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h4 className="text-xs font-medium text-gray-900 mb-3">Item Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Total Value:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatCurrency(calculateTotalValue())}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Stock Status:</span>
              <span className={`ml-2 font-medium ${getStatusColor(getStockStatus())}`}>
                {getStockStatus()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium text-gray-900">
                {categories.find(cat => cat.id === parseInt(formData.category))?.name || 'Not selected'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Reference:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formData.reference || 'Not generated'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 flex items-center rounded"
          >
            {loading ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Add Item
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-96 shadow-lg bg-white rounded-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Success!</h3>
              <p className="text-xs text-gray-600 mb-4">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 shadow-lg z-50 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddItem;
