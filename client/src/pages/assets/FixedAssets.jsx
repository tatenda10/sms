import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const FixedAssets = () => {
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [assetsRes, typesRes, summaryRes] = await Promise.all([
        axios.get('http://localhost:5000/api/assets', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            asset_type_id: selectedType || undefined,
            status: selectedStatus || undefined
          }
        }),
        axios.get('http://localhost:5000/api/assets/types', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/assets/summary/totals', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAssets(assetsRes.data.data || []);
      setAssetTypes(typesRes.data.data || []);
      setSummary(summaryRes.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Active': 'bg-green-100 text-green-800',
      'Disposed': 'bg-gray-100 text-gray-800',
      'Lost': 'bg-red-100 text-red-800',
      'Damaged': 'bg-orange-100 text-orange-800',
      'Under Repair': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const totalAssets = summary.reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0);
  const totalPaid = summary.reduce((sum, s) => sum + parseFloat(s.total_paid || 0), 0);
  const totalOutstanding = summary.reduce((sum, s) => sum + parseFloat(s.total_outstanding || 0), 0);

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-base font-bold text-gray-900">Fixed Assets</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage school property, vehicles, and equipment</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/assets/configurations"
            className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center gap-1.5 rounded"
          >
            Configurations
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center gap-1.5 rounded"
          >
            <span className="text-sm">+</span>
            Add Asset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Assets Value</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Paid</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Outstanding Balance</p>
          <p className="text-lg font-bold text-orange-600 mt-0.5">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Assets</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{assets.length}</p>
        </div>
      </div>

      {/* Asset Type Summary */}
      <div className="bg-white p-3 border border-gray-200 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Assets by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {summary.map((item, idx) => (
            <div 
              key={idx}
              className="border border-gray-200 p-2 hover:border-gray-400 cursor-pointer transition"
              onClick={() => {
                const type = assetTypes.find(t => t.name === item.asset_type);
                setSelectedType(type ? type.id : '');
              }}
            >
              <p className="text-xs text-gray-600">{item.asset_type}</p>
              <p className="text-sm font-bold text-gray-900">{item.count || 0}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.total_cost)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 border border-gray-200 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asset Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            >
              <option value="">All Types</option>
              {assetTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Disposed">Disposed</option>
              <option value="Lost">Lost</option>
              <option value="Damaged">Damaged</option>
              <option value="Under Repair">Under Repair</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedType('');
                setSelectedStatus('Active');
              }}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 hover:bg-gray-300 text-xs"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="bg-white p-6 border border-gray-200 text-center">
          <p className="text-gray-600 text-xs">Loading assets...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-3 border border-red-200">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white p-6 border border-gray-200 text-center">
          <p className="text-gray-600 text-xs">No assets found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs font-medium text-gray-900">{asset.asset_code}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      <div className="font-medium">{asset.asset_name}</div>
                      {asset.registration_number && (
                        <div className="text-xs text-gray-500">Reg: {asset.registration_number}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.asset_type_name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{formatDate(asset.purchase_date)}</td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-900">{formatCurrency(asset.total_cost)}</td>
                    <td className="px-3 py-2 text-xs text-green-600">{formatCurrency(asset.amount_paid)}</td>
                    <td className="px-3 py-2 text-xs text-orange-600">{formatCurrency(asset.outstanding_balance)}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/dashboard/assets/${asset.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                        </button>
                        {asset.outstanding_balance > 0 && (
                          <button
                            onClick={() => window.location.href = `/dashboard/assets/${asset.id}`}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Asset Modal (placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 max-w-md w-full">
            <h2 className="text-sm font-bold mb-3">Add New Asset</h2>
            <p className="text-xs text-gray-600 mb-3">This will redirect to the Add Asset page...</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  window.location.href = '/dashboard/assets/add';
                }}
                className="flex-1 bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800"
              >
                Continue
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssets;

