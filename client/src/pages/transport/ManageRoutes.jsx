import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faSearch, faRoute, faMapMarkerAlt, faDollarSign, faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const ManageRoutes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [routes, setRoutes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    route_name: '',
    route_code: '',
    pickup_point: '',
    dropoff_point: '',
    weekly_fee: '',
    currency: 'USD'
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [pagination.page, searchTerm, statusFilter]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== '') params.append('is_active', statusFilter === 'active');
      
      const response = await axios.get(`${BASE_URL}/transport/routes?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setRoutes(response.data.data);
        setPagination(response.data.pagination);
      }
      
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      route_name: '',
      route_code: '',
      pickup_point: '',
      dropoff_point: '',
      weekly_fee: '',
      currency: 'USD'
    });
    setEditingRoute(null);
  };

  const openModal = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        route_name: route.route_name,
        route_code: route.route_code,
        pickup_point: route.pickup_point,
        dropoff_point: route.dropoff_point,
        weekly_fee: route.weekly_fee,
        currency: route.currency
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingRoute) {
        // Update existing route
        await axios.put(`${BASE_URL}/transport/routes/${editingRoute.id}`, formData, {
          headers: authHeaders
        });
        setSuccess('Route updated successfully');
      } else {
        // Create new route
        await axios.post(`${BASE_URL}/transport/routes`, formData, {
          headers: authHeaders
        });
        setSuccess('Route created successfully');
      }
      
      closeModal();
      loadRoutes();
      
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err.response?.data?.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${BASE_URL}/transport/routes/${routeId}`, {
        headers: authHeaders
      });
      
      setSuccess('Route deleted successfully');
      loadRoutes();
      
    } catch (err) {
      console.error('Error deleting route:', err);
      setError(err.response?.data?.message || 'Failed to delete route');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (routeId, currentStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`${BASE_URL}/transport/routes/${routeId}`, {
        is_active: !currentStatus
      }, {
        headers: authHeaders
      });
      
      setSuccess(`Route ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadRoutes();
      
    } catch (err) {
      console.error('Error toggling route status:', err);
      setError(err.response?.data?.message || 'Failed to toggle route status');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (isActive) => {
    return (
      <span style={{
        padding: '2px 8px',
        fontSize: '0.7rem',
        fontWeight: 500,
        borderRadius: '4px',
        backgroundColor: isActive ? '#d1fae5' : '#fee2e2',
        color: isActive ? '#065f46' : '#991b1b'
      }}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading && routes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading routes...</div>
      </div>
    );
  }

  // Calculate display ranges for pagination
  const displayStart = routes.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Transport Routes</h2>
          <p className="report-subtitle">Manage transport routes for student pickup and dropoff.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => openModal()}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Route
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={(e) => { e.preventDefault(); loadRoutes(); }} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search routes..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>
          
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="filter-input"
              style={{ minWidth: '120px', width: '120px' }}
            >
              <option value="">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear status filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="report-content-container ecl-table-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading && routes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading routes...
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 10, 
              background: 'var(--sidebar-bg)' 
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>ROUTE NAME</th>
                <th style={{ padding: '6px 10px' }}>ROUTE CODE</th>
                <th style={{ padding: '6px 10px' }}>PICKUP POINT</th>
                <th style={{ padding: '6px 10px' }}>DROPOFF POINT</th>
                <th style={{ padding: '6px 10px' }}>WEEKLY FEE</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route, index) => (
                <tr 
                  key={route.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {route.route_name}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {route.route_code}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {route.pickup_point}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {route.dropoff_point}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatCurrency(route.weekly_fee, route.currency)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {getStatusBadge(route.is_active)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => openModal(route)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(route.id, route.is_active)}
                        style={{ 
                          color: route.is_active ? '#f59e0b' : '#10b981', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: 0,
                          fontSize: '0.7rem'
                        }}
                        title={route.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {route.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - routes.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (routes.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.total || 0} results.
        </div>
        <div className="table-footer-right">
          {pagination.pages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
          {pagination.pages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Route Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Route Name</label>
                  <input
                    type="text"
                    name="route_name"
                    value={formData.route_name}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Route Code</label>
                  <input
                    type="text"
                    name="route_code"
                    value={formData.route_code}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Pickup Point</label>
                  <input
                    type="text"
                    name="pickup_point"
                    value={formData.pickup_point}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Dropoff Point</label>
                  <input
                    type="text"
                    name="dropoff_point"
                    value={formData.dropoff_point}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Weekly Fee</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      name="weekly_fee"
                      value={formData.weekly_fee}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="form-control"
                      style={{ paddingRight: '50px' }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem'
                    }}>
                      {formData.currency}
                    </span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="modal-btn modal-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="modal-btn modal-btn-primary"
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Saving...' : (editingRoute ? 'Update Route' : 'Create Route')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {success}
        </div>
      )}
    </div>
  );
};

export default ManageRoutes;
