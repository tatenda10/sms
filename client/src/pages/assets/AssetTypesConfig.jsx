import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faBox, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const AssetTypesConfig = () => {
  const [assetTypes, setAssetTypes] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_of_account_id: '',
    depreciation_account_id: '',
    expense_account_id: '',
    requires_registration: false,
    requires_serial_number: false,
    icon: 'faBox'
  });

  useEffect(() => {
    fetchData();
    fetchChartOfAccounts();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/assets/types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssetTypes(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching asset types:', err);
      setError('Failed to fetch asset types');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/accounting/chart-of-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartOfAccounts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching chart of accounts:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      chart_of_account_id: '',
      depreciation_account_id: '',
      expense_account_id: '',
      requires_registration: false,
      requires_serial_number: false,
      icon: 'faBox'
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      description: type.description || '',
      chart_of_account_id: type.chart_of_account_id || '',
      depreciation_account_id: type.depreciation_account_id || '',
      expense_account_id: type.expense_account_id || '',
      requires_registration: type.requires_registration || false,
      requires_serial_number: type.requires_serial_number || false,
      icon: type.icon || 'faBox'
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingType
        ? `http://localhost:5000/api/assets/types/${editingType.id}`
        : 'http://localhost:5000/api/assets/types';
      
      const method = editingType ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingType ? 'Asset type updated successfully' : 'Asset type created successfully');
      setShowAddModal(false);
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving asset type:', err);
      setError(err.response?.data?.error || 'Failed to save asset type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset type? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/assets/types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Asset type deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting asset type:', err);
      setError(err.response?.data?.error || 'Failed to delete asset type');
    } finally {
      setLoading(false);
    }
  };

  const getAssetAccounts = () => {
    return chartOfAccounts.filter(acc => 
      acc.type === 'Asset' && acc.is_active
    );
  };

  const getExpenseAccounts = () => {
    return chartOfAccounts.filter(acc => 
      acc.type === 'Expense' && acc.is_active
    );
  };

  if (loading && assetTypes.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">Loading asset types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard/assets"
              className="text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Fixed Assets Configuration</h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">Manage asset types and their settings</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Asset Type
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-xs rounded">
          {success}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Chart of Account</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Requires Registration</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Requires Serial #</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assetTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No asset types found. Click "Add Asset Type" to create one.
                </td>
              </tr>
            ) : (
              assetTypes.map((type) => (
                <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBox} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{type.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {type.description || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {type.account_code} - {type.account_name}
                  </td>
                  <td className="px-4 py-2">
                    {type.requires_registration ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Yes</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {type.requires_serial_number ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Yes</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingType ? 'Edit Asset Type' : 'Add New Asset Type'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                    placeholder="e.g., Vehicles, Equipment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                    placeholder="faBox"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                    placeholder="Brief description of this asset type"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Chart of Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="chart_of_account_id"
                    value={formData.chart_of_account_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                  >
                    <option value="">Select Account</option>
                    {getAssetAccounts().map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Depreciation Account
                  </label>
                  <select
                    name="depreciation_account_id"
                    value={formData.depreciation_account_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                  >
                    <option value="">Select Account (Optional)</option>
                    {getExpenseAccounts().map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Expense Account
                  </label>
                  <select
                    name="expense_account_id"
                    value={formData.expense_account_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 text-xs rounded"
                  >
                    <option value="">Select Account (Optional)</option>
                    {getExpenseAccounts().map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="requires_registration"
                      checked={formData.requires_registration}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Requires Registration Number</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="requires_serial_number"
                      checked={formData.requires_serial_number}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span className="text-xs font-medium text-gray-700">Requires Serial Number</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTypesConfig;

