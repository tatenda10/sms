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

const AddItem = ({ onClose }) => {
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

      // Reset form and close modal after 2 seconds
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
        if (onClose) {
          onClose();
        }
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
    <div>

      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Item Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="e.g., Primary School Uniform - Boys"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                disabled={loadingCategories}
                className="form-control"
                style={loadingCategories ? { background: '#f3f4f6' } : {}}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select Category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Reference <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  style={{ flex: 1 }}
                  placeholder="e.g., UNI-PRI-B-001"
                />
                <button
                  type="button"
                  onClick={generateReference}
                  className="btn-checklist"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                className="form-control"
                placeholder="Brief description of the item..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Unit Price (USD) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Current Stock <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleInputChange}
                required
                min="0"
                className="form-control"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-control"
                placeholder="e.g., Storage Room A"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="form-control"
                placeholder="e.g., Uniforms Plus Ltd"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Item Preview</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Total Value:</span>
              <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {formatCurrency(calculateTotalValue())}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Stock Status:</span>
              <span style={{ marginLeft: '8px', fontWeight: 500 }} className={getStatusColor(getStockStatus())}>
                {getStockStatus()}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
              <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {categories.find(cat => cat.id === parseInt(formData.category))?.name || 'Not selected'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Reference:</span>
              <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {formData.reference || 'Not generated'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="modal-btn modal-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                Adding...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} style={{ fontSize: '0.7rem' }} />
                Add Item
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {success && (
        <div style={{ 
          padding: '10px', 
          background: '#d1fae5', 
          color: '#065f46', 
          fontSize: '0.75rem', 
          marginTop: '16px',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}
    </div>
  );
};

export default AddItem;
