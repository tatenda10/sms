import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

const AccountsPayable = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency_id: '',
    payment_date: '',
    payment_method: 'cash',
    description: ''
  });
  const [currencies, setCurrencies] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayableForView, setSelectedPayableForView] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // Opening Balance states
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    supplier_id: '',
    amount: '',
    description: '',
    reference_number: '',
    due_date: '',
    opening_balance_date: '',
    currency_id: 1
  });
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accounting/currencies`, { headers: { Authorization: `Bearer ${token}` } });
      setCurrencies(res.data.data || []);
    } catch {}
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data.data || []);
    } catch {}
  };

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable?${params}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPayables(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Failed to load accounts payable');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable/summary`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSummary(res.data.data || {});
    } catch {}
  };

  const fetchTransactions = async (payableId) => {
    try {
      setTransactionsLoading(true);
      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable/${payableId}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchSuppliers();
    fetchPayables();
    fetchSummary();
  }, [page, pageSize, search, statusFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleMakePayment = (payable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      amount: payable.outstanding_balance,
      currency_id: payable.currency_id,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      description: `Payment for ${payable.expense_description}`
    });
    setError(''); // Clear any previous errors
    setShowPaymentModal(true);
  };

  const handleViewTransactions = async (payable) => {
    setSelectedPayableForView(payable);
    setShowViewModal(true);
    await fetchTransactions(payable.id);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setError(''); // Clear previous errors
    try {
      await axios.post(`${BASE_URL}/expenses/accounts-payable/${selectedPayable.id}/pay`, {
        amount: parseFloat(paymentForm.amount),
        currency_id: selectedPayable.currency_id,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        description: paymentForm.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only close modal on success
      setShowPaymentModal(false);
      setError('');
      fetchPayables();
      fetchSummary();
    } catch (err) {
      console.error('Payment error:', err);
      // Keep modal open and show error
      setError(err.response?.data?.message || err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    setOpeningBalanceLoading(true);
    try {
      await axios.post(`${BASE_URL}/expenses/accounts-payable/opening-balance`, {
        supplier_id: openingBalanceForm.supplier_id || null,
        amount: parseFloat(openingBalanceForm.amount),
        description: openingBalanceForm.description,
        reference_number: openingBalanceForm.reference_number,
        due_date: openingBalanceForm.due_date || null,
        opening_balance_date: openingBalanceForm.opening_balance_date,
        currency_id: openingBalanceForm.currency_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowOpeningBalanceModal(false);
      setOpeningBalanceForm({
        supplier_id: '',
        amount: '',
        description: '',
        reference_number: '',
        due_date: '',
        opening_balance_date: '',
        currency_id: 1
      });
      fetchPayables();
      fetchSummary();
      alert('Opening balance created successfully!');
    } catch (err) {
      console.error('Opening balance error:', err);
      setError('Failed to create opening balance: ' + (err.response?.data?.message || err.message));
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'outstanding': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount, currencyCode) => {
    return `${currencyCode} ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="p-2">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 mb-2">Accounts Payable</h1>
          <p className="text-sm text-gray-600">
            Manage outstanding payments and track transaction history
          </p>
        </div>
        <button
          onClick={() => setShowOpeningBalanceModal(true)}
          className="bg-blue-600 text-white px-4 py-2 text-xs hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>+ Add Opening Balance</span>
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs text-gray-600">Total Payables</div>
          <div className="text-lg font-semibold">{summary.total_payables || 0}</div>
        </div>
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs text-gray-600">Total Outstanding</div>
          <div className="text-lg font-semibold text-red-600">
            {summary.total_outstanding ? formatCurrency(summary.total_outstanding, 'USD') : 'USD 0.00'}
          </div>
        </div>
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs text-gray-600">Outstanding</div>
          <div className="text-lg font-semibold text-red-600">{summary.outstanding_count || 0}</div>
        </div>
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs text-gray-600">Overdue</div>
          <div className="text-lg font-semibold text-red-800">{summary.overdue_count || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by supplier, description..."
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="outstanding">Outstanding</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Payable To</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Original Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Paid Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Outstanding</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Due Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-4 text-center text-xs text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : payables.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-4 text-center text-xs text-gray-500">
                        No accounts payable found
                      </td>
                    </tr>
                  ) : (
                    payables.map((payable) => (
                      <tr key={payable.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {payable.payable_to || 'Non-Supplier'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {payable.expense_description}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {formatCurrency(payable.original_amount, payable.currency_code)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {formatCurrency(payable.paid_amount, payable.currency_code)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium">
                            {formatCurrency(payable.outstanding_balance, payable.currency_code)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(payable.status)}`}>
                            {payable.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {payable.due_date || 'Not set'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewTransactions(payable)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Transactions"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                            </button>
                            {payable.status !== 'paid' && (
                              <button
                                onClick={() => handleMakePayment(payable)}
                                className="text-green-600 hover:text-green-900"
                                title="Make Payment"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-gray-600">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= total}
              className="px-3 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md">
            {/* Error Message Above Modal */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            <h2 className="text-base font-semibold mb-4">Make Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                  step="0.01"
                  max={selectedPayable.outstanding_balance}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setError(''); // Clear error when closing
                  }}
                  className="px-4 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="px-4 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800"
                >
                  {paymentLoading ? 'Processing...' : 'Make Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Transactions Modal */}
      {showViewModal && selectedPayableForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold">Transaction History</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Payable Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Payable To:</span>
                  <div className="font-medium">{selectedPayableForView.payable_to || 'Non-Supplier'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <div className="font-medium">{selectedPayableForView.expense_description}</div>
                </div>
                <div>
                  <span className="text-gray-600">Outstanding:</span>
                  <div className="font-medium text-red-600">
                    {formatCurrency(selectedPayableForView.outstanding_balance, selectedPayableForView.currency_code)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedPayableForView.status)}`}>
                      {selectedPayableForView.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {transactionsLoading ? (
              <div className="text-center py-4">
                <div className="text-xs text-gray-500">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-xs text-gray-500">No transactions found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Payment Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Amount Paid</th>
                      <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Payment Method</th>
                      <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {new Date(transaction.payment_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium">
                            {formatCurrency(transaction.amount_paid, selectedPayableForView.currency_code)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 capitalize">
                            {transaction.payment_method}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {transaction.description || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opening Balance Modal */}
      {showOpeningBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-semibold">Add Opening Balance</h2>
                <p className="text-xs text-gray-600 mt-1">Record historical debt or payable</p>
              </div>
              <button
                onClick={() => setShowOpeningBalanceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleOpeningBalanceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Supplier <span className="text-gray-400">(Optional)</span>
                  </label>
                  <select
                    value={openingBalanceForm.supplier_id}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Supplier (Optional)</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalanceForm.amount}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="e.g., 50000.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={openingBalanceForm.description}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    required
                    placeholder="e.g., City Council - Historical Debt from 2020"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Reference Number
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={openingBalanceForm.reference_number}
                      onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, reference_number: e.target.value }))}
                      className="flex-1 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., CC-2020-DEBT"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const timestamp = Date.now();
                        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                        const refNumber = `OB-${new Date().getFullYear()}-${randomNum}-${timestamp.toString().slice(-4)}`;
                        setOpeningBalanceForm(prev => ({ ...prev, reference_number: refNumber }));
                      }}
                      className="px-3 py-1 text-xs bg-gray-600 text-white hover:bg-gray-700 whitespace-nowrap"
                    >
                      Auto Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave blank or click Auto Generate</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Opening Balance Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={openingBalanceForm.opening_balance_date}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, opening_balance_date: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={openingBalanceForm.due_date}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This will create a journal entry debiting Retained Earnings (3998) 
                  and crediting Accounts Payable (2000). This ensures historical debts don't inflate current 
                  period expenses. The payable will appear in the list above and can be paid off like any other payable.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOpeningBalanceModal(false)}
                  className="px-4 py-2 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={openingBalanceLoading}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {openingBalanceLoading ? 'Creating...' : 'Create Opening Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
