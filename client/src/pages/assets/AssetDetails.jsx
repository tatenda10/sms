import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Bank Transfer',
    payment_account_code: '1000',
    reference_number: '',
    description: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Custom details modal state
  const [showCustomDetailsModal, setShowCustomDetailsModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    asset_name: '',
    description: '',
    location: '',
    registration_number: '',
    serial_number: '',
    supplier_name: ''
  });

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const assetData = response.data.data;
      setAsset(assetData);
      // Populate form for editing
      setAssetForm({
        asset_name: assetData.asset_name || '',
        description: assetData.description || '',
        location: assetData.location || '',
        registration_number: assetData.registration_number || '',
        serial_number: assetData.serial_number || '',
        supplier_name: assetData.supplier_name || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setPaymentLoading(true);
      setError(''); // Clear any previous errors
      await axios.post(
        `${BASE_URL}/assets/${id}/payments`,
        paymentForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setShowPaymentModal(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'Bank Transfer',
        payment_account_code: '1000',
        reference_number: '',
        description: ''
      });
      
      fetchAssetDetails();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to process payment';
      setError(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAssetUpdate = async (e) => {
    e.preventDefault();
    try {
      setEditingAsset(true);
      await axios.put(
        `${BASE_URL}/assets/${id}`,
        assetForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setShowCustomDetailsModal(false);
      fetchAssetDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setEditingAsset(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800',
      'Disposed': 'bg-red-100 text-red-800',
      'Lost': 'bg-red-100 text-red-800',
      'Damaged': 'bg-orange-100 text-orange-800',
      'Under Repair': 'bg-yellow-100 text-yellow-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-2">
        <div className="bg-white p-6 border border-gray-200 text-center">
          <p className="text-xs text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="bg-red-50 p-3 border border-red-200">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900">{asset.asset_name}</h1>
            <span className={`px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(asset.status)}`}>
              {asset.status}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {asset.asset_type_name} • {asset.asset_code}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomDetailsModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700"
          >
            Edit Details
          </button>
          {asset.outstanding_balance > 0 && (
            <button
              onClick={() => {
                setError('');
                setShowPaymentModal(true);
              }}
              className="bg-green-600 text-white px-3 py-1.5 text-xs hover:bg-green-700"
            >
              Make Payment
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard/assets')}
            className="bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300"
          >
            Back to Assets
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Total Cost</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(asset.total_cost)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Amount Paid</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">{formatCurrency(asset.amount_paid)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Outstanding Balance</p>
          <p className="text-lg font-bold text-orange-600 mt-0.5">{formatCurrency(asset.outstanding_balance)}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Payment Progress</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {((asset.amount_paid / asset.total_cost) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === 'details'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Asset Details
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === 'financial'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Financial Information
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === 'payments'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Payment History
        </button>
        <button
          onClick={() => setActiveTab('depreciation')}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === 'depreciation'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Depreciation
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="bg-white border border-gray-200 p-4">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Asset Code</label>
              <p className="text-xs font-medium text-gray-900">{asset.asset_code}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Asset Type</label>
              <p className="text-xs font-medium text-gray-900">{asset.asset_type_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Asset Name</label>
              <p className="text-xs font-medium text-gray-900">{asset.asset_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Purchase Date</label>
              <p className="text-xs font-medium text-gray-900">{formatDate(asset.purchase_date)}</p>
            </div>
            {asset.registration_number && (
              <div>
                <label className="text-xs text-gray-500">Registration Number</label>
                <p className="text-xs font-medium text-gray-900">{asset.registration_number}</p>
              </div>
            )}
            {asset.serial_number && (
              <div>
                <label className="text-xs text-gray-500">Serial Number</label>
                <p className="text-xs font-medium text-gray-900">{asset.serial_number}</p>
              </div>
            )}
            {asset.location && (
              <div>
                <label className="text-xs text-gray-500">Location</label>
                <p className="text-xs font-medium text-gray-900">{asset.location}</p>
              </div>
            )}
            {asset.supplier_name && (
              <div>
                <label className="text-xs text-gray-500">Supplier</label>
                <p className="text-xs font-medium text-gray-900">{asset.supplier_name}</p>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p className="text-xs font-medium text-gray-900">{asset.status}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Condition</label>
              <p className="text-xs font-medium text-gray-900">{asset.condition || 'N/A'}</p>
            </div>
          </div>
          {asset.description && (
            <div className="mt-4">
              <label className="text-xs text-gray-500">Description</label>
              <p className="text-xs text-gray-900 mt-1">{asset.description}</p>
            </div>
          )}

          {/* Custom Fields */}
          {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h2 className="text-xs font-semibold text-gray-900 mb-3">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(asset.custom_fields).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</label>
                    <p className="text-xs font-medium text-gray-900">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="bg-white border border-gray-200 p-4">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Total Cost</label>
              <p className="text-xs font-medium text-gray-900">{formatCurrency(asset.total_cost)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Currency</label>
              <p className="text-xs font-medium text-gray-900">{asset.currency_code || 'USD'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount Paid</label>
              <p className="text-xs font-medium text-green-600">{formatCurrency(asset.amount_paid)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Outstanding Balance</label>
              <p className="text-xs font-medium text-orange-600">{formatCurrency(asset.outstanding_balance)}</p>
            </div>
            {asset.is_opening_balance && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Opening Balance Entry</label>
                  <p className="text-xs font-medium text-blue-600">Yes</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Opening Balance Date</label>
                  <p className="text-xs font-medium text-gray-900">{formatDate(asset.opening_balance_date)}</p>
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-gray-500">COA Account</label>
              <p className="text-xs font-medium text-gray-900">
                {asset.coa_account_code} - {asset.coa_account_name}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Journal Entry ID</label>
              <p className="text-xs font-medium text-gray-900">{asset.journal_entry_id || 'N/A'}</p>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-xs text-gray-500 mb-2 block">Payment Progress</label>
            <div className="w-full bg-gray-200 h-6 relative">
              <div
                className="bg-green-600 h-6 transition-all duration-300"
                style={{ width: `${(asset.amount_paid / asset.total_cost) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                {((asset.amount_paid / asset.total_cost) * 100).toFixed(1)}% Paid
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white border border-gray-200 p-4">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Payment History</h2>
          {asset.payments && asset.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {asset.payments.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-900">{formatDate(payment.payment_date)}</td>
                      <td className="px-3 py-2 text-xs font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{payment.payment_method}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{payment.reference_number}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{payment.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">No payments recorded yet</p>
          )}
        </div>
      )}

      {activeTab === 'depreciation' && (
        <div className="bg-white border border-gray-200 p-4">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Depreciation Information</h2>
          {asset.depreciation_method ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Depreciation Method</label>
                <p className="text-xs font-medium text-gray-900">{asset.depreciation_method}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Useful Life</label>
                <p className="text-xs font-medium text-gray-900">{asset.useful_life_years} years</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Salvage Value</label>
                <p className="text-xs font-medium text-gray-900">{formatCurrency(asset.salvage_value)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Depreciable Amount</label>
                <p className="text-xs font-medium text-gray-900">
                  {formatCurrency(asset.total_cost - (asset.salvage_value || 0))}
                </p>
              </div>
              {asset.depreciation_method === 'Straight Line' && (
                <div>
                  <label className="text-xs text-gray-500">Annual Depreciation</label>
                  <p className="text-xs font-medium text-gray-900">
                    {formatCurrency((asset.total_cost - (asset.salvage_value || 0)) / asset.useful_life_years)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Depreciation tracking is not enabled for this asset</p>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-xs max-w-md w-full z-50">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-700 hover:text-red-900 font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          <div className="bg-white p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold mb-3">Make Payment</h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  max={asset.outstanding_balance}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding: {formatCurrency(asset.outstanding_balance)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment From <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.payment_account_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const method = code === '1000' ? 'Cash' : 'Bank Transfer';
                    setPaymentForm({ 
                      ...paymentForm, 
                      payment_account_code: code,
                      payment_method: method
                    });
                  }}
                  required
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                >
                  <option value="1000">Cash</option>
                  <option value="1010">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    className="flex-1 border border-gray-300 px-2 py-1.5 text-xs"
                    placeholder="Optional"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ref = `PAY-${asset.asset_code}-${Date.now()}`;
                      setPaymentForm({ ...paymentForm, reference_number: ref });
                    }}
                    className="bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300 whitespace-nowrap"
                  >
                    Auto Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  rows="2"
                  placeholder="Payment notes..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing...' : 'Submit Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Details Modal */}
      {showCustomDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold mb-3">Edit Asset Details</h2>
            <form onSubmit={handleAssetUpdate} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Asset Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assetForm.asset_name}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    placeholder="Where is this asset located?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={assetForm.registration_number}
                    onChange={(e) => setAssetForm({ ...assetForm, registration_number: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    placeholder="e.g., ABC-1234"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={assetForm.serial_number}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    placeholder="e.g., SN123456789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={assetForm.supplier_name}
                    onChange={(e) => setAssetForm({ ...assetForm, supplier_name: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    placeholder="Name of supplier/vendor"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={assetForm.description}
                    onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    rows="3"
                    placeholder="Additional details about the asset..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editingAsset}
                  className="flex-1 bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  {editingAsset ? 'Updating...' : 'Update Asset'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomDetailsModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetails;

