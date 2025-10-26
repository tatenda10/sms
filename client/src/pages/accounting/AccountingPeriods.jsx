import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faPlus,
  faEdit,
  faTrash,
  faLock,
  faUnlock,
  faExclamationTriangle,
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const AccountingPeriods = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    period_name: '',
    period_type: 'monthly',
    start_date: '',
    end_date: ''
  });
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [deletingPeriod, setDeletingPeriod] = useState(null);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/periods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPeriods(response.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
      setError('Failed to fetch periods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriod = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/accounting/periods`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Period created successfully');
      setShowAddModal(false);
      setFormData({ period_name: '', period_type: 'monthly', start_date: '', end_date: '' });
      fetchPeriods();
    } catch (error) {
      console.error('Error creating period:', error);
      setError(error.response?.data?.error || 'Failed to create period');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPeriod = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/accounting/periods/${editingPeriod.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Period updated successfully');
      setShowEditModal(false);
      setEditingPeriod(null);
      fetchPeriods();
    } catch (error) {
      console.error('Error updating period:', error);
      setError(error.response?.data?.error || 'Failed to update period');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async () => {
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/accounting/periods/${deletingPeriod.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Period deleted successfully');
      setShowDeleteModal(false);
      setDeletingPeriod(null);
      fetchPeriods();
    } catch (error) {
      console.error('Error deleting period:', error);
      setError(error.response?.data?.error || 'Failed to delete period');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateYearlyPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/accounting/periods/generate-yearly`, 
        { year: generateYear },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess(response.data.message);
      setShowGenerateModal(false);
      fetchPeriods();
    } catch (error) {
      console.error('Error generating periods:', error);
      setError(error.response?.data?.error || 'Failed to generate periods');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (period) => {
    setEditingPeriod(period);
    setFormData({
      period_name: period.period_name,
      period_type: period.period_type,
      start_date: period.start_date.split('T')[0],
      end_date: period.end_date.split('T')[0]
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (period) => {
    setDeletingPeriod(period);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'closed') {
      return (
        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 border border-red-200">
          <FontAwesomeIcon icon={faLock} className="mr-1" />
          Closed
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 border border-green-200">
        <FontAwesomeIcon icon={faUnlock} className="mr-1" />
        Open
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Accounting Periods</h1>
            <p className="text-xs text-gray-600 mt-1">Manage accounting periods for financial reporting</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Generate Year</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Period</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheck} className="mr-2 text-xs" />
            <span className="text-xs">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-xs" />
            <span className="text-xs">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>
      )}

      {/* Periods Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && periods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-gray-500">
                    Loading periods...
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-gray-500">
                    No accounting periods found. Click "Generate Year" to create periods for a year.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-900">{period.period_name}</td>
                    <td className="px-4 py-2 text-xs text-gray-900 capitalize">{period.period_type}</td>
                    <td className="px-4 py-2 text-xs text-gray-900">{formatDate(period.start_date)}</td>
                    <td className="px-4 py-2 text-xs text-gray-900">{formatDate(period.end_date)}</td>
                    <td className="px-4 py-2 text-xs">{getStatusBadge(period.status)}</td>
                    <td className="px-4 py-2 text-xs">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(period)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Period"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(period)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Period"
                          disabled={period.status === 'closed'}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Add Accounting Period</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <form onSubmit={handleAddPeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period Name</label>
                <input
                  type="text"
                  value={formData.period_name}
                  onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., January 2025"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period Type</label>
                <select
                  value={formData.period_type}
                  onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Period Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Edit Accounting Period</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <form onSubmit={handleEditPeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period Name</label>
                <input
                  type="text"
                  value={formData.period_name}
                  onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period Type</label>
                <select
                  value={formData.period_type}
                  onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Delete Period</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to delete the period <strong>{deletingPeriod?.period_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePeriod}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Year Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Generate Yearly Periods</h2>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              This will create 12 monthly periods for the selected year. Existing periods will not be duplicated.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={generateYear}
                onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                min="2020"
                max="2050"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateYearlyPeriods}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Periods'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingPeriods;

