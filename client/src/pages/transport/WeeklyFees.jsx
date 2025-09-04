import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faSearch, faCalendarAlt, faDollarSign, faCheckCircle, 
  faExclamationTriangle, faTimesCircle, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const WeeklyFees = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [fees, setFees] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [generateForm, setGenerateForm] = useState({
    week_start_date: '',
    week_end_date: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_date: '',
    amount: '',
    payment_method: 'Cash',
    notes: ''
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadRoutes();
    loadFees();
  }, []);

  useEffect(() => {
    loadFees();
  }, [pagination.page, searchTerm, statusFilter, routeFilter, weekFilter]);

  const loadRoutes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transport/routes?limit=100`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  const loadFees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (routeFilter) params.append('route_id', routeFilter);
      if (weekFilter) params.append('week_start', weekFilter);
      
      const response = await axios.get(`${BASE_URL}/transport/fees?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        console.log('🔍 Fees received from API:', response.data.data);
        if (response.data.data.length > 0) {
          console.log('🔍 First fee structure:', response.data.data[0]);
          console.log('🔍 student_reg_number field:', response.data.data[0].student_reg_number);
        }
        setFees(response.data.data);
        setPagination(response.data.pagination);
      }
      
    } catch (err) {
      console.error('Error loading fees:', err);
      setError('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFees = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${BASE_URL}/transport/fees/generate`, generateForm, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setSuccess(`Weekly fees generated successfully! ${response.data.data.fees_created} fees created, ${response.data.data.fees_skipped} skipped.`);
        setShowGenerateModal(false);
        setGenerateForm({ week_start_date: '', week_end_date: '' });
        loadFees();
      }
      
    } catch (err) {
      console.error('Error generating fees:', err);
      setError(err.response?.data?.message || 'Failed to generate weekly fees');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const paymentData = {
        ...paymentForm,
        transport_fee_id: selectedFee.id,
        student_reg_number: selectedFee.student_reg_number || selectedFee.student_number,
        currency: selectedFee.currency
      };
      
      console.log('🔍 Payment data being sent:', paymentData);
      console.log('🔍 Selected fee:', selectedFee);
      console.log('🔍 Selected fee keys:', Object.keys(selectedFee));
      console.log('🔍 student_reg_number value:', selectedFee.student_reg_number);
      console.log('🔍 student_number value:', selectedFee.student_number);
      console.log('🔍 Final student_reg_number:', selectedFee.student_reg_number || selectedFee.student_number);
      
      const response = await axios.post(`${BASE_URL}/transport/payments`, paymentData, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setSuccess(`Payment recorded successfully! Reference: ${response.data.data.reference_number}`);
        setShowPaymentModal(false);
        setSelectedFee(null);
        setPaymentForm({ payment_date: '', amount: '', payment_method: 'Cash', notes: '' });
        loadFees();
      }
      
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (fee) => {
    console.log('🔍 Fee data for payment:', fee);
    setSelectedFee(fee);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: fee.amount.toString(),
      payment_method: 'Cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
            Pending
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  if (loading && fees.length === 0) {
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
              <h1 className="text-xl font-bold text-gray-900">Weekly Transport Fees</h1>
              <p className="text-xs text-gray-600">Manage weekly transport fees and payments</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Generate Weekly Fees
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
                  placeholder="Search students or routes..."
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
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">All Routes</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.route_name}</option>
              ))}
            </select>
            
            <input
              type="date"
              placeholder="Week starting..."
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{fee.student_name}</div>
                        <div className="text-sm text-gray-500">ID: {fee.student_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{fee.route_name}</div>
                        <div className="text-sm text-gray-500">{fee.route_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 text-xs" />
                          <span>{formatDate(fee.week_start_date)} - {formatDate(fee.week_end_date)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatCurrency(fee.amount, fee.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(fee.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {fee.status !== 'Paid' && (
                        <button
                          onClick={() => openPaymentModal(fee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                          Record Payment
                        </button>
                      )}
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

        {/* Generate Weekly Fees Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Weekly Fees</h3>
                
                <form onSubmit={handleGenerateFees} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Week Start Date (Monday)</label>
                    <input
                      type="date"
                      name="week_start_date"
                      value={generateForm.week_start_date}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, week_start_date: e.target.value }))}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Week End Date (Sunday)</label>
                    <input
                      type="date"
                      name="week_end_date"
                      value={generateForm.week_end_date}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, week_end_date: e.target.value }))}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Fees'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
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

        {/* Record Payment Modal */}
        {showPaymentModal && selectedFee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
                
                <div className="mb-4 p-3 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    <div><strong>Student:</strong> {selectedFee.student_name}</div>
                    <div><strong>Route:</strong> {selectedFee.route_name}</div>
                    <div><strong>Week:</strong> {formatDate(selectedFee.week_start_date)} - {formatDate(selectedFee.week_end_date)}</div>
                    <div><strong>Amount Due:</strong> {formatCurrency(selectedFee.amount, selectedFee.currency)}</div>
                  </div>
                </div>
                
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      step="0.01"
                      min="0"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      name="payment_method"
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows="3"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
                    >
                      {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
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

export default WeeklyFees;
