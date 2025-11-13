import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faSearch, faCreditCard, faCalendarAlt, faDollarSign, faReceipt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const TransportPayments = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [payments, setPayments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    route_id: '',
    student_reg_number: '',
    payment_date: '',
    amount: '',
    currency_id: '',
    payment_method: '',
    reference: '',
    notes: ''
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadRoutes();
    loadPayments();
    loadCurrencies();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [pagination.page, searchTerm, statusFilter, dateFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.student-search-container')) {
        setShowStudentResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: authHeaders
      });
      
      const currencyList = response.data.data || [];
      setCurrencies(currencyList);
      
      // Set default currency to base currency
      const baseCurrency = currencyList.find(c => c.base_currency);
      if (baseCurrency && !formData.currency_id) {
        setFormData(prev => ({ ...prev, currency_id: baseCurrency.id }));
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
      setError('Failed to load currencies');
    }
  };

  const searchStudents = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setStudents([]);
      return;
    }

    try {
      // First try exact match by registration number
      try {
        const exactResponse = await axios.get(`${BASE_URL}/students/${searchTerm}`, {
          headers: authHeaders
        });
        
        if (exactResponse.data.success) {
          setStudents([exactResponse.data.data]);
          return;
        }
      } catch (exactErr) {
        // If exact match fails, try general search
      }

      // Fallback to general search
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Error searching students:', err);
      setStudents([]);
    }
  };

  const handleStudentSearch = (e) => {
    const value = e.target.value;
    setStudentSearchTerm(value);
    
    if (value.trim()) {
      searchStudents(value);
      setShowStudentResults(true);
    } else {
      setStudents([]);
      setShowStudentResults(false);
      setSelectedStudent(null);
      setFormData(prev => ({ ...prev, student_reg_number: '' }));
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearchTerm(`${student.Name} ${student.Surname} (${student.RegNumber})`);
    setFormData(prev => ({ ...prev, student_reg_number: student.RegNumber }));
    setShowStudentResults(false);
  };

  const generateReference = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9).toUpperCase();
    const reference = `TRP-${timestamp}-${randomString}`;
    setFormData(prev => ({ ...prev, reference }));
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      
      const response = await axios.get(`${BASE_URL}/transport/payments?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setPayments(response.data.data);
        setPagination(response.data.pagination);
      }
      
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load payments');
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
    const baseCurrency = currencies.find(c => c.base_currency);
    setFormData({
      route_id: '',
      student_reg_number: '',
      payment_date: '',
      amount: '',
      currency_id: baseCurrency?.id || '',
      payment_method: '',
      reference: '',
      notes: ''
    });
    setStudentSearchTerm('');
    setSelectedStudent(null);
    setEditingPayment(null);
  };

  const openModal = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        route_id: payment.route_id || '',
        student_reg_number: payment.student_reg_number || '',
        payment_date: payment.payment_date,
        amount: payment.amount,
        currency_id: payment.currency_id || '',
        payment_method: payment.payment_method,
        reference: payment.reference_number || '',
        notes: payment.notes || ''
      });
      setStudentSearchTerm(payment.student_name || '');
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
      
      if (!formData.route_id || !formData.student_reg_number) {
        setError('Please select both route and student');
        return;
      }
      
      const cleanedData = {
        route_id: parseInt(formData.route_id),
        student_reg_number: formData.student_reg_number,
        payment_date: formData.payment_date,
        amount: parseFloat(formData.amount),
        currency_id: formData.currency_id,
        payment_method: formData.payment_method,
        reference: formData.reference.trim() || null,
        notes: formData.notes.trim() || null
      };
      
      if (editingPayment) {
        // Update existing payment
        await axios.put(`${BASE_URL}/transport/payments/${editingPayment.id}`, cleanedData, {
          headers: authHeaders
        });
        setSuccess('Payment updated successfully');
      } else {
        // Create new payment
        await axios.post(`${BASE_URL}/transport/payments/direct`, cleanedData, {
          headers: authHeaders
        });
        setSuccess('Payment recorded successfully');
      }
      
      closeModal();
      loadPayments();
      
    } catch (err) {
      console.error('Error saving payment:', err);
      setError(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/transport/payments/${paymentId}`, {
        headers: authHeaders
      });
      
      setSuccess('Payment deleted successfully');
      loadPayments();
      
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'cash': faDollarSign,
      'card': faCreditCard,
      'bank_transfer': faReceipt,
      'mobile_money': faCreditCard
    };
    return icons[method] || faCreditCard;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Transport Payments</h1>
        <p className="text-sm text-gray-600">Track and manage transport fee payments</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by student name or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => openModal()}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading payments...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faCreditCard} className="text-4xl text-gray-300 mb-4" />
            <div className="text-gray-500">No payments found</div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200/30 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {payment.student_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {payment.route_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={getPaymentMethodIcon(payment.payment_method)} 
                          className="mr-2 text-gray-400" 
                        />
                        {payment.payment_method?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {payment.reference_number || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(payment)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
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
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
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
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-gray-900 border-gray-900 text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-full max-w-2xl bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editingPayment ? 'Edit Payment' : 'Record Transport Payment'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Route</label>
                  <select
                    name="route_id"
                    value={formData.route_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Route</option>
                    {routes.filter(route => route.is_active).map(route => (
                      <option key={route.id} value={route.id}>
                        {route.route_name} - {route.weekly_fee} {route.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-search-container relative">
                  <label className="block text-xs font-medium text-gray-700">Student Registration Number</label>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={handleStudentSearch}
                    placeholder="Enter student registration number..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                  
                  {/* Student Search Results */}
                  {showStudentResults && students.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.RegNumber}
                          onClick={() => selectStudent(student)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                        >
                          <div className="font-medium">{student.Name} {student.Surname}</div>
                          <div className="text-gray-500">Reg: {student.RegNumber}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Currency</label>
                  <select
                    name="currency_id"
                    value={formData.currency_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Reference</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleInputChange}
                      placeholder="Payment reference (optional)"
                      className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                    <button
                      type="button"
                      onClick={generateReference}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs whitespace-nowrap"
                    >
                      Auto Generate
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional notes (optional)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingPayment ? 'Update Payment' : 'Record Payment')}
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
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 z-50">
          {success}
        </div>
      )}
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default TransportPayments;
