import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';

const EditPaymentModal = ({ payment, currencies, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    amount_paid: '',
    currency_id: '',
    payment_method: '',
    payment_date: '',
    reference_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      console.log('Payment data in edit modal:', payment);
      console.log('Currencies in edit modal:', currencies);
      console.log('Payment currency_id:', payment.currency_id, 'Type:', typeof payment.currency_id);
      setFormData({
        amount_paid: payment.amount_paid || '',
        currency_id: payment.currency_id ? payment.currency_id.toString() : '',
        payment_method: payment.payment_method || '',
        payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : '',
        reference_number: payment.reference_number || '',
        notes: payment.notes || ''
      });
      console.log('Form data set:', {
        amount_paid: payment.amount_paid || '',
        currency_id: payment.currency_id ? payment.currency_id.toString() : '',
        payment_method: payment.payment_method || '',
        payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : '',
        reference_number: payment.reference_number || '',
        notes: payment.notes || ''
      });
    }
  }, [payment, currencies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Error updating payment:', error);
      // Error handling is now done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Info (Read-only) */}
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {payment?.student_name} {payment?.student_surname}
                </div>
                <div className="text-gray-600">{payment?.student_reg_number}</div>
                <div className="text-gray-600">{payment?.hostel_name}</div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_paid}
                onChange={(e) => handleChange('amount_paid', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency_id}
                onChange={(e) => handleChange('currency_id', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select currency</option>
                {currencies && currencies.length > 0 ? (
                  currencies.map((currency) => (
                    <option key={currency.id} value={currency.id.toString()}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">US Dollar ($)</option>
                    <option value="2">Zimbabwe Dollar (ZWL)</option>
                  </>
                )}
              </select>
              {currencies && currencies.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Using default currencies</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleChange('payment_date', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows="3"
                className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 text-xs hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  'Updating...'
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="mr-1" />
                    Update Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentModal;
