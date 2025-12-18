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
      <div className="modal-overlay" onClick={handleNewPayment}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h3 className="modal-title">Payment Successful!</h3>
            <button className="modal-close-btn" onClick={handleNewPayment}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="modal-body">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '3rem', color: '#10b981', marginBottom: '12px' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Your boarding fees payment has been processed successfully.</p>
            </div>

            <div style={{
              padding: '12px',
              background: '#f9fafb',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'center' }}>Payment Receipt</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Receipt No
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {receiptData.receipt_number}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Reference No
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {receiptData.reference_number}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Student Name
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {receiptData.student_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Registration No
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {receiptData.student_reg}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hostel
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {receiptData.hostel_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Payment Date
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {receiptData.payment_date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Payment Method
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {receiptData.payment_method}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Amount Paid
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    {receiptData.currency}{receiptData.amount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={handleNewPayment}
            >
              New Payment
            </button>
            <button
              className="modal-btn"
              onClick={handlePrintReceipt}
              style={{ background: '#6b7280', color: 'white' }}
            >
              <FontAwesomeIcon icon={faPrint} style={{ marginRight: '4px' }} />
              Print
            </button>
            <button
              className="modal-btn modal-btn-confirm"
              onClick={handleDownloadPDF}
            >
              <FontAwesomeIcon icon={faDownload} style={{ marginRight: '4px' }} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="modal-overlay" onClick={handleCancelConfirmation}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h3 className="modal-title">Confirm Payment</h3>
            <button className="modal-close-btn" onClick={handleCancelConfirmation}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="modal-body">
            <div style={{
              padding: '12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '0.75rem'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Student:</strong> {foundStudent?.Name} {foundStudent?.Surname} ({foundStudent?.RegNumber})
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Hostel:</strong> {getSelectedHostelName()}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Academic Year:</strong> {paymentData.academic_year} | <strong>Term:</strong> Term {paymentData.term}
              </div>
              <div>
                <strong>Amount:</strong> {getSelectedCurrencySymbol()}{paymentData.amount_paid}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', fontSize: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Payment Method
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {paymentData.payment_method}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Payment Date
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {paymentData.payment_date}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Reference Number
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {paymentData.reference_number}
                </div>
              </div>
              {paymentData.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Notes
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {paymentData.notes}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ 
                padding: '10px', 
                background: '#fee2e2', 
                color: '#dc2626', 
                fontSize: '0.75rem', 
                marginTop: '16px', 
                borderRadius: '4px' 
              }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={handleCancelConfirmation}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-confirm"
              onClick={handleConfirmPayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handlePaymentSubmit} className="modal-form">
        {/* Student Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ color: '#2563eb' }} />
            Student Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Student Registration Number <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={studentRegNumber}
                  onChange={(e) => setStudentRegNumber(e.target.value)}
                  placeholder="Enter student registration number"
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleStudentSearch}
                  disabled={loading}
                  className="modal-btn"
                  style={{ 
                    background: '#6b7280', 
                    color: 'white', 
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  {loading ? 'Searching...' : (
                    <>
                      <FontAwesomeIcon icon={faSearch} style={{ marginRight: '4px' }} />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Student Info */}
          {foundStudent && (
            <div style={{ 
              background: '#d1fae5', 
              border: '1px solid #6ee7b7', 
              padding: '12px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', marginRight: '8px', fontSize: '0.75rem' }} />
                <span style={{ fontWeight: 500, color: '#065f46' }}>Student Found Successfully</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                  <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{foundStudent.Name} {foundStudent.Surname}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Registration No:</span>
                  <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{foundStudent.RegNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{ 
            padding: '10px', 
            background: '#fee2e2', 
            color: '#dc2626', 
            fontSize: '0.75rem', 
            marginBottom: '16px', 
            borderRadius: '4px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '10px', 
            background: '#d1fae5', 
            color: '#065f46', 
            fontSize: '0.75rem', 
            marginBottom: '16px', 
            borderRadius: '4px',
            border: '1px solid #6ee7b7'
          }}>
            {success}
          </div>
        )}

        {/* Payment Details */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faCreditCard} style={{ color: '#10b981' }} />
            Payment Details
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Academic Year <span className="required">*</span>
              </label>
              <input
                type="text"
                value={paymentData.academic_year}
                onChange={(e) => setPaymentData({ ...paymentData, academic_year: e.target.value })}
                placeholder="e.g., 2025"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Term <span className="required">*</span>
              </label>
              <select
                value={paymentData.term}
                onChange={(e) => setPaymentData({ ...paymentData, term: e.target.value })}
                className="form-control"
              >
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Hostel <span className="required">*</span>
              </label>
              <select
                value={paymentData.hostel_id}
                onChange={(e) => setPaymentData({ ...paymentData, hostel_id: e.target.value })}
                className="form-control"
              >
                <option value="">Select a hostel</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentData.amount_paid}
                onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                placeholder="0.00"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Currency <span className="required">*</span>
              </label>
              <select
                value={paymentData.currency_id}
                onChange={(e) => setPaymentData({ ...paymentData, currency_id: e.target.value })}
                className="form-control"
              >
                <option value="">Select currency</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Method <span className="required">*</span>
              </label>
              <select
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                className="form-control"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Reference Number <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  placeholder="Enter reference number or auto-generate"
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateReference}
                  className="modal-btn"
                  style={{ 
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                  title="Auto-generate reference number"
                >
                  <FontAwesomeIcon icon={faSync} style={{ marginRight: '4px' }} />
                  Auto
                </button>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Notes (Optional)
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows="2"
                placeholder="Additional notes about this payment"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="submit"
            disabled={loading || !foundStudent}
            className="modal-btn modal-btn-confirm"
            style={{ 
              minWidth: '120px'
            }}
          >
            {loading ? 'Processing...' : (
              <>
                <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '4px' }} />
                Process Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardingFeesPayment;
