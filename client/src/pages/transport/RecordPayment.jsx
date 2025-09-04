import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faMoneyBillWave,
  faCalendarAlt,
  faUser,
  faRoute,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const RecordPayment = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const feeId = searchParams.get('fee_id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    transport_fee_id: feeId || '',
    student_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    payment_method: 'Cash',
    notes: ''
  });
  
  // Fee details for display
  const [feeDetails, setFeeDetails] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (feeId) {
      loadFeeDetails();
    }
    loadCurrencies();
  }, [feeId]);

  const loadFeeDetails = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transport/payments/fees/${feeId}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        const fee = response.data.data;
        setFeeDetails(fee);
        setFormData(prev => ({
          ...prev,
          transport_fee_id: fee.id,
          student_id: fee.student_id,
          amount: fee.amount,
          currency: fee.currency
        }));
      }
    } catch (err) {
      console.error('Error loading fee details:', err);
      setError('Failed to load fee details');
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setCurrencies(response.data.data);
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.transport_fee_id || !formData.student_id || !formData.amount || !formData.payment_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${BASE_URL}/transport/payments/payments`, formData, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/transport');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border border-gray-200 p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 text-lg" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Recorded Successfully!</h3>
          <p className="text-sm text-gray-600 mb-4">
            The transport payment has been recorded and the fee status has been updated.
          </p>
          <div className="bg-green-50 border border-green-200 p-3 rounded">
            <p className="text-xs text-green-800">
              <strong>✓</strong> Payment recorded<br/>
              <strong>✓</strong> Fee status updated<br/>
              <strong>✓</strong> Journal entry created<br/>
              <strong>✓</strong> Receipt generated
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Redirecting to transport dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard/transport')}
            className="text-gray-600 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </button>
          <div>
            <h1 className="text-base font-medium text-gray-900">Record Transport Payment</h1>
            <p className="text-xs text-gray-500 mt-1">Record payment for transport fees</p>
          </div>
        </div>
      </div>

      {/* Fee Details Display */}
      {feeDetails && (
        <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Fee Details</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-blue-700 font-medium">Student:</p>
              <p className="text-blue-900">{feeDetails.student_name} ({feeDetails.student_number})</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Route:</p>
              <p className="text-blue-900">{feeDetails.route_name} ({feeDetails.route_code})</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Fee Period:</p>
              <p className="text-blue-900">{feeDetails.fee_period}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Due Date:</p>
              <p className="text-blue-900">{formatDate(feeDetails.due_date)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-blue-700 font-medium">Amount Due:</p>
              <p className="text-blue-900 text-lg font-semibold">
                {formatCurrency(feeDetails.amount, feeDetails.currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <div className="bg-white border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transport Fee ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Transport Fee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="transport_fee_id"
              value={formData.transport_fee_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter transport fee ID"
              required
            />
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Enter student ID"
              required
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faMoneyBillWave} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="Additional notes about the payment..."
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-sm mt-0.5 mr-2" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Important:</p>
                <ul className="mt-1 space-y-1">
                  <li>• This action will mark the transport fee as paid</li>
                  <li>• A journal entry will be created for accounting</li>
                  <li>• A receipt will be generated automatically</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/transport')}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faSave} className="text-xs" />
              <span>{loading ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700 mt-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default RecordPayment;
