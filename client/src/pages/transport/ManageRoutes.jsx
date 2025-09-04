import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faSearch, faRoute, faMapMarkerAlt, faDollarSign
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
    limit: 10,
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
      <span className={`px-2 py-1 text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading && routes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Transport Routes</h1>
              <p className="text-xs text-gray-600">Create and manage transport routes for student pickup and dropoff</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Route
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Routes Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup/Dropoff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{route.route_name}</div>
                        <div className="text-sm text-gray-500">Code: {route.route_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500 text-xs" />
                          <span>{route.pickup_point}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500 text-xs" />
                          <span>{route.dropoff_point}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatCurrency(route.weekly_fee, route.currency)}
                      </div>
                      <div className="text-xs text-gray-500">per week</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(route.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(route)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(route.id, route.is_active)}
                          className={`${route.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {route.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-gray-50 border-gray-500 text-gray-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Route Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingRoute ? 'Edit Route' : 'Add New Route'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Name</label>
                    <input
                      type="text"
                      name="route_name"
                      value={formData.route_name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Code</label>
                    <input
                      type="text"
                      name="route_code"
                      value={formData.route_code}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup Point</label>
                    <input
                      type="text"
                      name="pickup_point"
                      value={formData.pickup_point}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dropoff Point</label>
                    <input
                      type="text"
                      name="dropoff_point"
                      value={formData.dropoff_point}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weekly Fee</label>
                    <div className="mt-1 relative shadow-sm">
                      <input
                        type="number"
                        name="weekly_fee"
                        value={formData.weekly_fee}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                        className="block w-full pr-12 px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{formData.currency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingRoute ? 'Update Route' : 'Create Route')}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 shadow-lg z-50">
            {success}
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 shadow-lg z-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRoutes;
