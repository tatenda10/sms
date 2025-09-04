import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faEye, faEdit, faTrash, faDownload, faPrint } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import EditPaymentModal from './components/EditPaymentModal';
import SuccessModal from './components/SuccessModal';
import ErrorModal from './components/ErrorModal';

const AllPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    academic_year: '',
    term: '',
    hostel_id: ''
  });
  const [hostels, setHostels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchHostels();
    fetchCurrencies();
    fetchPayments();
  }, [pagination.current_page, filters]);

  const fetchHostels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data.data)) {
        setHostels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Currencies response:', response.data);
      if (response.data && Array.isArray(response.data.data)) {
        setCurrencies(response.data.data);
        console.log('Currencies set:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // If currencies fail to load, try to set some default currencies
      setCurrencies([
        { id: 1, name: 'US Dollar', symbol: '$' },
        { id: 2, name: 'Zimbabwe Dollar', symbol: 'ZWL' }
      ]);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filters
      });

      console.log('Frontend params being sent:', {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        filters: filters,
        fullParams: params.toString()
      });

      const response = await axios.get(`${BASE_URL}/boarding/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPayments(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      academic_year: '',
      term: '',
      hostel_id: ''
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount, currencySymbol) => {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
  };

  const getStudentName = (payment) => {
    return `${payment.student_name || ''} ${payment.student_surname || ''}`.trim() || 'N/A';
  };

  const handleViewPayment = async (payment) => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/payments/${payment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedPayment(response.data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setErrorMessage('Failed to fetch payment details');
      setShowErrorModal(true);
    }
  };

  const handleEditPayment = async (payment) => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/payments/${payment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('Payment details for edit:', response.data.data);
        console.log('Available currencies:', currencies);
        setSelectedPayment(response.data.data);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setErrorMessage('Failed to fetch payment details');
      setShowErrorModal(true);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm('Are you sure you want to delete this payment? This will also delete all related accounting entries.')) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/boarding/payments/${payment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Payment and related accounting entries deleted successfully!');
        setShowSuccessModal(true);
        // Refresh the list
        fetchPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete payment';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      const receiptData = {
        receipt_number: payment.receipt_number,
        reference_number: payment.reference_number,
        payment_date: payment.payment_date,
        student_name: getStudentName(payment),
        student_reg: payment.student_reg_number,
        hostel_name: payment.hostel_name,
        payment_method: payment.payment_method,
        amount: payment.amount_paid,
        currency: payment.currency_symbol
      };

      // For now, create a text file download
      const receiptContent = `
SCHOOL MANAGEMENT SYSTEM
BOARDING FEES PAYMENT RECEIPT

Receipt No: ${receiptData.receipt_number}
Reference No: ${receiptData.reference_number}
Date: ${receiptData.payment_date}
Student: ${receiptData.student_name}
Registration No: ${receiptData.student_reg}
Hostel: ${receiptData.hostel_name}
Payment Method: ${receiptData.payment_method}
Amount Paid: ${receiptData.currency}${receiptData.amount}

Thank you for your payment!
      `;
      
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.receipt_number}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setErrorMessage('Failed to download receipt');
      setShowErrorModal(true);
    }
  };

  const handleUpdatePayment = async (updatedData) => {
    try {
      const response = await axios.put(`${BASE_URL}/boarding/payments/${selectedPayment.id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Payment and related accounting entries updated successfully!');
        setShowSuccessModal(true);
        setShowEditModal(false);
        setSelectedPayment(null);
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update payment';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const handlePrintReceipt = (payment) => {
    const receiptData = {
      receipt_number: payment.receipt_number,
      reference_number: payment.reference_number,
      payment_date: payment.payment_date,
      student_name: getStudentName(payment),
      student_reg: payment.student_reg_number,
      hostel_name: payment.hostel_name,
      payment_method: payment.payment_method,
      amount: payment.amount_paid,
      currency: payment.currency_symbol
    };

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Boarding Fees Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { border: 2px solid #000; padding: 20px; max-width: 400px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>SCHOOL MANAGEMENT SYSTEM</h2>
              <h3>BOARDING FEES PAYMENT RECEIPT</h3>
            </div>
            <div class="row">
              <span>Receipt No:</span>
              <span>${receiptData.receipt_number}</span>
            </div>
            <div class="row">
              <span>Reference No:</span>
              <span>${receiptData.reference_number}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${receiptData.payment_date}</span>
            </div>
            <div class="row">
              <span>Student:</span>
              <span>${receiptData.student_name}</span>
            </div>
            <div class="row">
              <span>Reg No:</span>
              <span>${receiptData.student_reg}</span>
            </div>
            <div class="row">
              <span>Hostel:</span>
              <span>${receiptData.hostel_name}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${receiptData.payment_method}</span>
            </div>
            <div class="total">
              <div class="row">
                <span>Amount Paid:</span>
                <span>${receiptData.currency}${receiptData.amount}</span>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p>Thank you for your payment!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">All Boarding Fees Payments</h1>
            <p className="text-xs text-gray-600">View and manage all boarding fees payments</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by student name or registration number..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-1" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2025"
                    value={filters.academic_year}
                    onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Term
                  </label>
                  <select
                    value={filters.term}
                    onChange={(e) => handleFilterChange('term', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">All Terms</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hostel
                  </label>
                  <select
                    value={filters.hostel_id}
                    onChange={(e) => handleFilterChange('hostel_id', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">All Hostels</option>
                    {hostels.map((hostel) => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-200 text-gray-700 px-4 py-1.5 text-xs hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600">No payments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt No
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hostel
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div>
                            <div className="font-medium text-gray-900">
                              {getStudentName(payment)}
                            </div>
                            <div className="text-gray-500">
                              {payment.student_reg_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {payment.receipt_number}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {payment.hostel_name || 'N/A'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {payment.academic_year}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          Term {payment.term}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {formatCurrency(payment.amount_paid, payment.currency_symbol)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {payment.payment_method}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewPayment(payment)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button
                              onClick={() => handlePrintReceipt(payment)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Print Receipt"
                            >
                              <FontAwesomeIcon icon={faPrint} />
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(payment)}
                              className="text-green-600 hover:text-green-900"
                              title="Download Receipt"
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </button>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit Payment"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Payment"
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
              {pagination.total_pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={!pagination.has_prev}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={!pagination.has_next}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {((pagination.current_page - 1) * pagination.items_per_page) + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.total_items}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={!pagination.has_prev}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-3 py-2 border text-xs font-medium ${
                                  pageNum === pagination.current_page
                                    ? 'z-10 bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={!pagination.has_next}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
                 </div>
       </div>

       {/* View Payment Modal */}
       {showViewModal && selectedPayment && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Receipt No:</span>
                   <span>{selectedPayment.receipt_number}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Reference No:</span>
                   <span>{selectedPayment.reference_number}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Student:</span>
                   <span>{getStudentName(selectedPayment)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Registration No:</span>
                   <span>{selectedPayment.student_reg_number}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Hostel:</span>
                   <span>{selectedPayment.hostel_name || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Academic Year:</span>
                   <span>{selectedPayment.academic_year}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Term:</span>
                   <span>Term {selectedPayment.term}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Amount:</span>
                   <span>{formatCurrency(selectedPayment.amount_paid, selectedPayment.currency_symbol)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Payment Method:</span>
                   <span>{selectedPayment.payment_method}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-gray-600">Payment Date:</span>
                   <span>{formatDate(selectedPayment.payment_date)}</span>
                 </div>
                 {selectedPayment.notes && (
                   <div className="flex justify-between">
                     <span className="font-medium text-gray-600">Notes:</span>
                     <span>{selectedPayment.notes}</span>
                   </div>
                 )}
               </div>
               <div className="flex justify-end mt-6">
                 <button
                   onClick={() => {
                     setShowViewModal(false);
                     setSelectedPayment(null);
                   }}
                   className="bg-gray-500 text-white px-4 py-2 text-xs hover:bg-gray-600"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

               {/* Edit Payment Modal */}
        {showEditModal && selectedPayment && (
          <EditPaymentModal
            payment={selectedPayment}
            currencies={currencies}
            onUpdate={handleUpdatePayment}
            onClose={() => {
              setShowEditModal(false);
              setSelectedPayment(null);
            }}
          />
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessMessage('');
          }}
        />

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          message={errorMessage}
          onClose={() => {
            setShowErrorModal(false);
            setErrorMessage('');
          }}
        />
      </div>
    );
  };

export default AllPayments;
