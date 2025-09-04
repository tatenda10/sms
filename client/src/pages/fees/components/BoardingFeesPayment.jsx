import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCreditCard, faSync, faCheckCircle, faTimes, faDownload, faPrint } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';

const BoardingFeesPayment = ({ onPaymentSuccess }) => {
  const [studentRegNumber, setStudentRegNumber] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [showValidation, setShowValidation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    fee_type: 'boarding',
    academic_year: new Date().getFullYear().toString(),
    term: '1',
    hostel_id: '',
    amount_paid: '',
    currency_id: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchCurrencies();
    fetchHostels();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data.data)) {
        setCurrencies(response.data.data);
        // Set default currency (first one or USD)
        const defaultCurrency = response.data.data.find(c => c.is_base_currency) || response.data.data[0];
        if (defaultCurrency) {
          setPaymentData(prev => ({ ...prev, currency_id: defaultCurrency.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

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

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${timestamp}-${randomNum}`;
  };

  const handleAutoGenerateReference = () => {
    setPaymentData(prev => ({ ...prev, reference_number: generateReferenceNumber() }));
  };

  const handleStudentSearch = async () => {
    if (!studentRegNumber.trim()) {
      setError('Please enter a student registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const studentResponse = await axios.get(`${BASE_URL}/students/search?query=${studentRegNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (studentResponse.data && studentResponse.data.data && studentResponse.data.data.length > 0) {
        const student = studentResponse.data.data[0];
        setFoundStudent(student);
        setSuccess('Student found successfully!');
      } else {
        setError('Student not found with this registration number');
        setFoundStudent(null);
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      setError('Failed to search for student');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    setShowValidation(true);

    if (!foundStudent) {
      setError('Please search for a student first');
      return;
    }

    if (!paymentData.amount_paid || !paymentData.currency_id || !paymentData.academic_year || !paymentData.term) {
      setError('Please fill in all required fields');
      return;
    }

    if (!paymentData.hostel_id) {
      setError('Please select a hostel for boarding fees');
      return;
    }

    if (!paymentData.reference_number.trim()) {
      setError('Please enter a reference number');
      return;
    }

    // Show confirmation instead of processing immediately
    setShowConfirmation(true);
    setError('');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const paymentPayload = {
        student_reg_number: foundStudent.RegNumber,
        academic_year: paymentData.academic_year,
        term: paymentData.term,
        hostel_id: paymentData.hostel_id,
        amount_paid: parseFloat(paymentData.amount_paid),
        currency_id: paymentData.currency_id,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        fee_type: paymentData.fee_type
      };

      const response = await axios.post(`${BASE_URL}/boarding/payments`, paymentPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const receiptData = {
          receipt_number: response.data.data.receipt_number,
          student_name: `${foundStudent.Name} ${foundStudent.Surname}`,
          student_reg: foundStudent.RegNumber,
          amount: paymentData.amount_paid,
          currency: currencies.find(c => c.id === paymentData.currency_id)?.symbol || '',
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          fee_type: paymentData.fee_type,
          reference_number: paymentData.reference_number,
          hostel_name: hostels.find(h => h.id === paymentData.hostel_id)?.name || ''
        };
        
        setReceiptData(receiptData);
        setShowConfirmation(false);
        setShowReceipt(true);
        onPaymentSuccess(receiptData);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to process payment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setError('');
  };

  const handleNewPayment = () => {
    setStudentRegNumber('');
    setFoundStudent(null);
    setShowValidation(false);
    setShowConfirmation(false);
    setShowReceipt(false);
    setReceiptData(null);
    setPaymentData({
      fee_type: 'boarding',
      academic_year: new Date().getFullYear().toString(),
      term: '1',
      hostel_id: '',
      amount_paid: '',
      currency_id: paymentData.currency_id || '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setError('');
    setSuccess('');
  };

  const handlePrintReceipt = () => {
    if (!receiptData) return;
    
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

  const handleDownloadPDF = async () => {
    if (!receiptData) return;
    
    try {
      // Create PDF content
      const pdfContent = {
        receipt_number: receiptData.receipt_number,
        reference_number: receiptData.reference_number,
        payment_date: receiptData.payment_date,
        student_name: receiptData.student_name,
        student_reg: receiptData.student_reg,
        hostel_name: receiptData.hostel_name,
        payment_method: receiptData.payment_method,
        amount: receiptData.amount,
        currency: receiptData.currency
      };

      // Send to backend to generate PDF
      const response = await axios.post(`${BASE_URL}/boarding/payments/download-receipt`, pdfContent, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptData.receipt_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to text download if PDF generation fails
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
    }
  };

  const isFieldRequired = (fieldName) => {
    const requiredFields = ['amount_paid', 'currency_id', 'academic_year', 'term', 'reference_number', 'hostel_id'];
    return requiredFields.includes(fieldName);
  };

  const isFieldValid = (fieldName) => {
    if (!showValidation) return true;
    
    const value = paymentData[fieldName];
    if (isFieldRequired(fieldName)) {
      return value && value.toString().trim() !== '';
    }
    return true;
  };

  const getSelectedHostelName = () => {
    const hostel = hostels.find(h => h.id === paymentData.hostel_id);
    return hostel ? hostel.name : '';
  };

  const getSelectedCurrencySymbol = () => {
    const currency = currencies.find(c => c.id === paymentData.currency_id);
    return currency ? currency.symbol : '';
  };

  // Show receipt only after successful payment
  if (showReceipt && receiptData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center mb-6">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="text-sm text-gray-600">Your boarding fees payment has been processed successfully.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Payment Receipt</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Receipt No:</span>
              <span className="font-bold">{receiptData.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Reference No:</span>
              <span className="font-bold">{receiptData.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Student Name:</span>
              <span className="font-bold">{receiptData.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Registration No:</span>
              <span className="font-bold">{receiptData.student_reg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Hostel:</span>
              <span className="font-bold">{receiptData.hostel_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Payment Date:</span>
              <span className="font-bold">{receiptData.payment_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Payment Method:</span>
              <span className="font-bold">{receiptData.payment_method}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-bold text-lg">Amount Paid:</span>
              <span className="text-gray-900 font-bold text-lg">
                {receiptData.currency}{receiptData.amount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePrintReceipt}
            className="flex-1 bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faPrint} className="mr-2" />
            Print Receipt
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Download PDF
          </button>
          <button
            onClick={handleNewPayment}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 text-sm hover:bg-gray-300 flex items-center justify-center"
          >
            New Payment
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-base font-medium text-gray-900 mb-4">Confirm Payment</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Student Name:</span>
              <span className="font-medium">{foundStudent?.Name} {foundStudent?.Surname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration No:</span>
              <span className="font-medium">{foundStudent?.RegNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee Type:</span>
              <span className="font-medium">Boarding Fees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hostel:</span>
              <span className="font-medium">{getSelectedHostelName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Academic Year:</span>
              <span className="font-medium">{paymentData.academic_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Term:</span>
              <span className="font-medium">Term {paymentData.term}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{paymentData.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-medium">{paymentData.payment_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference Number:</span>
              <span className="font-medium">{paymentData.reference_number}</span>
            </div>
            {paymentData.notes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Notes:</span>
                <span className="font-medium">{paymentData.notes}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Amount to Pay:</span>
              <span className="text-gray-900 font-bold text-sm">
                {getSelectedCurrencySymbol()}{paymentData.amount_paid}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Processing...' : (
              <>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                Confirm Payment
              </>
            )}
          </button>
          <button
            onClick={handleCancelConfirmation}
            disabled={loading}
            className="flex-1 bg-gray-500 text-white px-4 py-2 text-xs hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-base font-medium text-gray-900 mb-4">Boarding Fee Payments</h2>
      
      {/* Student Search */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Student Registration Number <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={studentRegNumber}
            onChange={(e) => setStudentRegNumber(e.target.value)}
            placeholder="Enter student registration number"
            className={`flex-1 border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
              showValidation && !studentRegNumber.trim() ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            onClick={handleStudentSearch}
            disabled={loading}
            className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Searching...' : (
              <>
                <FontAwesomeIcon icon={faSearch} className="mr-1" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Student Info */}
      {foundStudent && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <h3 className="text-xs font-medium text-gray-900 mb-1">Student Information</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-1 font-medium">{foundStudent.Name} {foundStudent.Surname}</span>
            </div>
            <div>
              <span className="text-gray-600">Registration No:</span>
              <span className="ml-1 font-medium">{foundStudent.RegNumber}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
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

      {/* Payment Form */}
      <form onSubmit={handlePaymentSubmit} className="space-y-3">
        {/* Academic Year and Term */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentData.academic_year}
              onChange={(e) => setPaymentData({ ...paymentData, academic_year: e.target.value })}
              placeholder="e.g., 2025"
              className={`w-full border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                !isFieldValid('academic_year') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentData.term}
              onChange={(e) => setPaymentData({ ...paymentData, term: e.target.value })}
              className={`w-full border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                !isFieldValid('term') ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>
        </div>

        {/* Hostel Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Hostel <span className="text-red-500">*</span>
          </label>
          <select
            value={paymentData.hostel_id}
            onChange={(e) => setPaymentData({ ...paymentData, hostel_id: e.target.value })}
            className={`w-full border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
              !isFieldValid('hostel_id') ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a hostel</option>
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={paymentData.amount_paid}
              onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
              placeholder="0.00"
              className={`w-full border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                !isFieldValid('amount_paid') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentData.currency_id}
              onChange={(e) => setPaymentData({ ...paymentData, currency_id: e.target.value })}
              className={`w-full border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                !isFieldValid('currency_id') ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select currency</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Method and Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reference Number <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={paymentData.reference_number}
              onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
              placeholder="Enter reference number or auto-generate"
              className={`flex-1 border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                !isFieldValid('reference_number') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={handleAutoGenerateReference}
              className="bg-blue-600 text-white px-2 py-1.5 text-xs hover:bg-blue-700"
              title="Auto-generate reference number"
            >
              <FontAwesomeIcon icon={faSync} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            rows="2"
            placeholder="Additional notes about this payment"
            className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !foundStudent}
          className="w-full bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (
            <>
              <FontAwesomeIcon icon={faCreditCard} className="mr-1" />
              Process Payment
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BoardingFeesPayment;
