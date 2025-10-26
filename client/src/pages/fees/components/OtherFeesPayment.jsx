import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faDollarSign, 
  faFileAlt, 
  faBook, 
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';

const OtherFeesPayment = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableFees, setAvailableFees] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedFees, setSelectedFees] = useState([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    currency_id: '',
    reference_number: '',
    notes: ''
  });

  // Generate auto reference number
  const generateReferenceNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `AF${dateStr}${timeStr}`;
  };

  useEffect(() => {
    loadAvailableFees();
    loadCurrencies();
  }, []);

  const loadAvailableFees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/additional-fees/structures`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableFees(data.data);
      }
    } catch (error) {
      console.error('Error loading available fees:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${BASE_URL}/accounting/currencies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/students/search?query=${encodeURIComponent(searchTerm)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedFees([]);
    setFormData({
      amount: '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      currency_id: '',
      reference_number: '',
      notes: ''
    });
  };

  const handleFeeToggle = (fee) => {
    setSelectedFees(prev => {
      const isSelected = prev.find(f => f.id === fee.id);
      if (isSelected) {
        return prev.filter(f => f.id !== fee.id);
      } else {
        return [...prev, fee];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to pay for');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    if (!formData.currency_id) {
      alert('Please select a currency');
      return;
    }
    if (!formData.reference_number.trim()) {
      alert('Please enter a reference number');
      return;
    }
    setShowConfirmation(true);
  };

  const processPayment = async () => {
    if (!selectedStudent || selectedFees.length === 0) return;

    try {
      setLoading(true);
      
      // Use the reference number from form (it's required now)
      const referenceNumber = formData.reference_number;
      
      // Calculate amount per fee
      const amountPerFee = parseFloat(formData.amount) / selectedFees.length;
      
      // Process payment for each selected fee directly
      let allPaymentsSuccessful = true;
      const errors = [];

      for (const fee of selectedFees) {
        console.log('🔄 Processing payment for fee:', fee);
        
        // Process payment directly without creating assignments
        console.log('💳 Processing payment for fee:', fee.id, 'student:', selectedStudent.RegNumber);
        console.log('🔍 Payment method being sent:', formData.payment_method, 'Type:', typeof formData.payment_method);
        const paymentResponse = await fetch(`${BASE_URL}/additional-fees/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fee_structure_id: fee.id,
            student_reg_number: selectedStudent.RegNumber,
            amount: amountPerFee,
            payment_method: formData.payment_method,
            currency_id: formData.currency_id,
            exchange_rate: 1,
            receipt_number: formData.reference_number,
            reference_number: formData.reference_number,
            academic_year: new Date().getFullYear().toString()
          })
        });

        if (!paymentResponse.ok) {
          console.error(`❌ Failed to process payment for fee ${fee.id}`, paymentResponse.status);
          const errorData = await paymentResponse.json();
          console.error('❌ Payment error:', errorData);
          allPaymentsSuccessful = false;
          errors.push(`Fee ${fee.fee_name}: ${errorData.message || 'Payment failed'}`);
        } else {
          const paymentData = await paymentResponse.json();
          console.log('✅ Payment response:', paymentData);
        }
      }

      // Check if all payments were successful
      if (!allPaymentsSuccessful) {
        alert(`Payment failed for some fees:\n${errors.join('\n')}`);
        return; // Don't close the modal or reset form
      }

      // All payments successful
      setShowSuccessModal(true);
      setShowConfirmation(false);
      setSelectedFees([]);
      setSelectedStudent(null);
      setFormData({
        amount: '',
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        currency_id: '',
        reference_number: '',
        notes: ''
      });
      setSearchTerm('');
      setStudents([]);
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const getFeeIcon = (feeType) => {
    return feeType === 'annual' ? faBook : faFileAlt;
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-base font-medium text-gray-900 mb-4">Additional Fees Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Student Selection */}
        <div>
          <h3 className="text-xs font-medium text-gray-900 mb-1">Student Information</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search Student <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter student name or registration number..."
                    className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchStudents}
                  className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800"
                >
                  Search
                </button>
              </div>
            </div>

            {students.length > 0 && (
              <div className="border border-gray-200 max-h-32 overflow-y-auto">
                <div className="bg-blue-50 p-2 border-b border-gray-200">
                  <p className="text-xs text-blue-700 font-medium">Click on a student below to select:</p>
                </div>
                {students.map((student) => (
                  <div
                    key={student.RegNumber}
                    onClick={() => selectStudent(student)}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 text-xs">
                      {student.Name || student.FirstName} {student.Surname || student.LastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Reg: {student.RegNumber} | Class: {student.Class || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs mr-2" />
                  <span className="text-xs font-medium text-green-800">Student Selected Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-1 font-medium">{selectedStudent.Name || selectedStudent.FirstName} {selectedStudent.Surname || selectedStudent.LastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Registration No:</span>
                    <span className="ml-1 font-medium">{selectedStudent.RegNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fee Selection */}
        {selectedStudent && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Select Fees to Pay For</h3>
            
            <div className="border border-gray-200 max-h-40 overflow-y-auto">
              <div className="bg-blue-50 p-2 border-b border-gray-200">
                <p className="text-xs text-blue-700 font-medium">Click on fees below to select:</p>
              </div>
              {availableFees.map((fee) => {
                const isSelected = selectedFees.find(f => f.id === fee.id);
                return (
                  <div
                    key={fee.id}
                    onClick={() => handleFeeToggle(fee)}
                    className={`p-2 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon 
                          icon={getFeeIcon(fee.fee_type)} 
                          className="text-gray-400 text-xs" 
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-xs">
                            {fee.fee_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {fee.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            Type: {fee.fee_type} | Amount: ${(parseFloat(fee.amount) || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 text-xs">
                          ${(parseFloat(fee.amount) || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fee.fee_type}
                        </div>
                        {isSelected && (
                          <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedFees.length > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 p-3">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs mr-2" />
                  <span className="text-xs font-medium text-green-800">Fees Selected Successfully</span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">{selectedFees.length}</span> fee(s) selected
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Details */}
        {selectedStudent && selectedFees.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Payment Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.symbol} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference Number <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Enter reference number..."
                    className="flex-1 border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, reference_number: generateReferenceNumber() }))}
                    className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    title="Generate reference number"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedStudent && selectedFees.length > 0 && (
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setSelectedFees([]);
                setFormData({
                  amount: '',
                  payment_method: 'Cash',
                  payment_date: new Date().toISOString().split('T')[0],
                  currency_id: '',
                  reference_number: '',
                  notes: ''
                });
                setSearchTerm('');
                setStudents([]);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.amount || parseFloat(formData.amount) <= 0 || !formData.currency_id || !formData.reference_number.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
            >
              Process Payment
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 max-w-md w-full mx-4">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900">Confirm Payment</h3>
              <button
                onClick={handleCancelConfirmation}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-900">
                  Student: {selectedStudent?.Name || selectedStudent?.FirstName} {selectedStudent?.Surname || selectedStudent?.LastName}
                </p>
                <p className="text-xs text-gray-500">Amount: {currencies.find(c => c.id === formData.currency_id)?.symbol || '$'}{(parseFloat(formData.amount) || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Method: {formData.payment_method}</p>
                <p className="text-xs text-gray-500">Currency: {currencies.find(c => c.id === formData.currency_id)?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">Reference: {formData.reference_number}</p>
                <p className="text-xs text-gray-500">Selected Fees: {selectedFees.length}</p>
              </div>

              <div className="text-xs text-gray-600">
                <p>This will:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Create fee assignments for the selected fees</li>
                  <li>Split the payment amount equally among selected fees</li>
                  <li>Update student balance and create transaction records</li>
                </ul>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={handleCancelConfirmation}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
      </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-sm text-gray-500 mb-6">
                All payments have been processed successfully. The student's balance has been updated and transactions have been recorded.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherFeesPayment;