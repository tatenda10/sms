import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faGraduationCap,
  faDollarSign,
  faCalendarAlt,
  faList,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../../components/SuccessModal';
import ErrorModal from '../../../components/ErrorModal';
import { jsPDF } from 'jspdf';

const TuitionFeesPayment = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods] = useState([
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'other', name: 'Other' }
  ]);
  const [invoiceStructures, setInvoiceStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    student_reg_number: '',
    gradelevel_class_id: '',
    term: '',
    academic_year: '',
    invoice_structure_id: '',
    amount: '',
    currency_id: '',
    payment_method_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.gradelevel_class_id && formData.term && formData.academic_year) {
      fetchInvoiceStructures();
    }
  }, [formData.gradelevel_class_id, formData.term, formData.academic_year]);

  const fetchClasses = async () => {
    try {
      console.log('🔍 Fetching classes from:', `${BASE_URL}/classes/gradelevel-classes`);
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📊 Classes response:', response.data);
      setClasses(response.data.data || []);
      console.log('📋 Classes set:', response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrencies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };



  const fetchInvoiceStructures = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fees/invoice-structures/class/${formData.gradelevel_class_id}?term=${formData.term}&academic_year=${formData.academic_year}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInvoiceStructures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoice structures:', error);
      setInvoiceStructures([]);
    }
  };

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const selectInvoiceStructure = (structure) => {
    setSelectedStructure(structure);
    setFormData(prev => ({
      ...prev,
      invoice_structure_id: structure.id,
      currency_id: structure.currency_id
      // Removed auto-population of amount
    }));
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      setShowErrorModal(true);
      return;
    }

    if (!formData.amount || !formData.currency_id || !formData.payment_method_id) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    if (!formData.reference_number.trim()) {
      setErrorMessage('Please enter a reference number');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const paymentPayload = {
        student_reg_number: selectedStudent.RegNumber,
        payment_amount: parseFloat(formData.amount),
        payment_currency: formData.currency_id,
        payment_method: paymentMethods.find(m => m.id === formData.payment_method_id)?.name || 'Cash',
        payment_date: formData.payment_date,
        reference_number: formData.reference_number,
        notes: (formData.notes && formData.notes.trim()) || (formData.invoice_structure_id ? null : 'Payment for outstanding debt (no invoice)'),
        fee_type: 'tuition'
      };
      
      // Only include invoice_structure_id if one was selected
      if (formData.invoice_structure_id) {
        paymentPayload.invoice_structure_id = formData.invoice_structure_id;
      }

      const response = await axios.post(`${BASE_URL}/fees/payments`, paymentPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const receiptData = {
          receipt_number: response.data.data.receipt_number,
          student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
          student_reg: selectedStudent.RegNumber,
          amount: formData.amount,
          currency: currencies.find(c => c.id === formData.currency_id)?.symbol || '',
          payment_date: formData.payment_date,
          payment_method: paymentMethods.find(m => m.id === formData.payment_method_id)?.name || 'Cash',
          fee_type: 'tuition',
          reference_number: formData.reference_number,
          class_name: selectedStructure?.class_name || 'N/A',
          term: selectedStructure?.term || 'N/A',
          academic_year: selectedStructure?.academic_year || 'N/A',
          notes: formData.notes || ''
        };
        
        setReceipt(receiptData);
        setShowConfirmation(false);
        setShowReceipt(true);
        setSuccessMessage('Payment processed successfully');
        setShowSuccessModal(true);
        
        // Reset form
        setFormData({
          student_reg_number: '',
          gradelevel_class_id: '',
          term: '',
          academic_year: '',
          invoice_structure_id: '',
          amount: '',
          currency_id: '',
          payment_method_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: ''
        });
        setSelectedStudent(null);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to process payment');
      }
      setShowErrorModal(true);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setErrorMessage('');
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    
    // Create PDF content using jsPDF
    const doc = new jsPDF();
    
    // Set font and styling
    doc.setFont('helvetica');
    doc.setFontSize(16);
    
    // Header
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Receipt details
    doc.setFontSize(10);
    doc.text('Receipt Number:', 20, 40);
    doc.text(receipt.receipt_number, 60, 40);
    
    doc.text('Date:', 20, 50);
    doc.text(receipt.payment_date, 60, 50);
    
    // Student Information
    doc.setFontSize(12);
    doc.text('Student Information:', 20, 70);
    doc.setFontSize(10);
    doc.text('Name:', 20, 80);
    doc.text(receipt.student_name, 60, 80);
    doc.text('Registration:', 20, 90);
    doc.text(receipt.student_reg, 60, 90);
    
    // Payment Details
    doc.setFontSize(12);
    doc.text('Payment Details:', 20, 110);
    doc.setFontSize(10);
    doc.text('Amount:', 20, 120);
    doc.text(`${receipt.amount} ${receipt.currency}`, 60, 120);
    doc.text('Payment Method:', 20, 130);
    doc.text(receipt.payment_method, 60, 130);
    doc.text('Reference Number:', 20, 140);
    doc.text(receipt.reference_number, 60, 140);
    
    // Fee Information
    doc.text('Fee Type:', 20, 150);
    doc.text(receipt.fee_type, 60, 150);
    if (receipt.class_name !== 'N/A') {
      doc.text('Class:', 20, 160);
      doc.text(receipt.class_name, 60, 160);
      doc.text('Term:', 20, 170);
      doc.text(`${receipt.term} ${receipt.academic_year}`, 60, 170);
    } else {
      doc.text('Payment Type:', 20, 160);
      doc.text('General Payment (No Invoice)', 60, 160);
    }
    if (receipt.notes) {
      doc.text('Notes:', 20, 180);
      doc.text(receipt.notes.substring(0, 50), 60, 180); // Truncate if too long
    }
    
    // Footer
    doc.setLineWidth(0.5);
    doc.line(20, 190, 190, 190);
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 200, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 210, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${receipt.receipt_number}.pdf`);
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} className="modal-form">
        {/* Student Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
            Student Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Search Student <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter student name or registration number..."
                    className="form-control"
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={searchStudents}
                  className="modal-btn"
                  style={{ 
                    background: '#6b7280', 
                    color: 'white', 
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

            {students.length > 0 && (
              <div style={{ 
                border: '1px solid var(--border-color)', 
                maxHeight: '120px', 
                overflowY: 'auto',
                marginBottom: '16px',
                borderRadius: '4px'
              }}>
                 <div style={{ 
                   background: '#eff6ff', 
                   padding: '8px 12px', 
                   borderBottom: '1px solid var(--border-color)',
                   fontSize: '0.7rem',
                   color: '#1e40af',
                   fontWeight: 500
                 }}>
                   <p>Click on a student below to select:</p>
                 </div>
                {students.map((student) => (
                  <div
                    key={student.RegNumber}
                    onClick={() => selectStudent(student)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.75rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {student.Name} {student.Surname}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Reg: {student.RegNumber} | Class: {student.Class || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && (
               <div style={{ 
                 background: '#d1fae5', 
                 border: '1px solid #6ee7b7', 
                 padding: '12px',
                 borderRadius: '4px',
                 fontSize: '0.75rem'
               }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                   <FontAwesomeIcon icon={faCheck} style={{ color: '#059669', marginRight: '8px', fontSize: '0.75rem' }} />
                   <span style={{ fontWeight: 500, color: '#065f46' }}>Student Selected Successfully</span>
                 </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                    <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStudent.Name} {selectedStudent.Surname}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Registration No:</span>
                    <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStudent.RegNumber}</span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Invoice Structure Selection (Optional) */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faList} style={{ color: '#10b981' }} />
            Invoice Structure <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
          </h4>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            💡 You can skip this section to record payments for outstanding debts without a specific invoice
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Class ({classes.length} loaded)
              </label>
              <select
                value={formData.gradelevel_class_id}
                onChange={(e) => setFormData(prev => ({ ...prev, gradelevel_class_id: e.target.value, term: '', academic_year: '', invoice_structure_id: '' }))}
                className="form-control"
              >
                <option value="">Select Class (Optional)</option>
                {classes.map((cls) => {
                  console.log('🔍 Class item:', cls);
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.stream_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Term
              </label>
              <select
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value, academic_year: '', invoice_structure_id: '' }))}
                className="form-control"
                disabled={!formData.gradelevel_class_id}
              >
                <option value="">Select Term (Optional)</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value, invoice_structure_id: '' }))}
                placeholder="e.g., 2025 (Optional)"
                className="form-control"
                disabled={!formData.gradelevel_class_id || !formData.term}
              />
            </div>
          </div>

          {/* Invoice Structures List */}
          {invoiceStructures.length > 0 && (
            <div style={{ marginTop: '16px' }}>
               <div style={{ 
                 background: '#eff6ff', 
                 padding: '8px 12px', 
                 border: '1px solid var(--border-color)', 
                 marginBottom: '8px',
                 borderRadius: '4px',
                 fontSize: '0.7rem',
                 color: '#1e40af',
                 fontWeight: 500
               }}>
                 <p>Click on an invoice structure below to select (optional):</p>
               </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {invoiceStructures.map((structure) => (
                  <div
                    key={structure.id}
                    onClick={() => selectInvoiceStructure(structure)}
                    style={{
                      padding: '12px',
                      border: `1px solid ${selectedStructure?.id === structure.id ? '#6b7280' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedStructure?.id === structure.id ? '#f9fafb' : 'transparent',
                      fontSize: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStructure?.id !== structure.id) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStructure?.id !== structure.id) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {structure.class_name} - {structure.term} {structure.academic_year}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {structure.invoice_items?.length || 0} items
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {structure.total_amount} {structure.currency_symbol}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {structure.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedStructure && (
             <div style={{ 
               marginTop: '16px',
               background: '#d1fae5', 
               border: '1px solid #6ee7b7', 
               padding: '12px',
               borderRadius: '4px',
               fontSize: '0.75rem'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                   <FontAwesomeIcon icon={faCheck} style={{ color: '#059669', marginRight: '8px', fontSize: '0.75rem' }} />
                   <span style={{ fontWeight: 500, color: '#065f46' }}>Invoice Structure Selected</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => {
                     setSelectedStructure(null);
                     setFormData(prev => ({ ...prev, invoice_structure_id: '' }));
                   }}
                   style={{
                     fontSize: '0.7rem',
                     color: 'var(--text-secondary)',
                     background: 'transparent',
                     border: 'none',
                     cursor: 'pointer',
                     padding: '4px 8px'
                   }}
                 >
                   Clear
                 </button>
               </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Selected:</span>
                  <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStructure.class_name} - {selectedStructure.term} {selectedStructure.academic_year}</span>
                </div>
                <div>
                   <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                  <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStructure.total_amount} {selectedStructure.currency_symbol}</span>
                </div>
                 <div style={{ gridColumn: '1 / -1' }}>
                   <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Note: Please enter the payment amount manually below</span>
                </div>
              </div>
            </div>
          )}
          
          {formData.gradelevel_class_id && formData.term && formData.academic_year && invoiceStructures.length === 0 && (
            <div style={{ 
              marginTop: '16px',
              background: '#fef3c7', 
              border: '1px solid #fcd34d', 
              padding: '12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#92400e'
            }}>
              <p>
                ℹ️ No invoice structures found for this class/term/year. You can still proceed with the payment without selecting an invoice.
              </p>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
            Payment Details
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Currency <span className="required">*</span>
              </label>
              <select
                value={formData.currency_id}
                onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                className="form-control"
                required
              >
                <option value="">Select Currency</option>
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
                value={formData.payment_method_id}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method_id: e.target.value }))}
                className="form-control"
                required
              >
                <option value="">Select Payment Method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="form-control"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Reference Number <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Enter reference number"
                  className="form-control"
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reference_number: generateReferenceNumber() }))}
                  className="modal-btn"
                  style={{ 
                    background: '#6b7280', 
                    color: 'white', 
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="form-control"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="submit"
            disabled={loading}
            className="modal-btn modal-btn-confirm"
            style={{ 
              minWidth: '120px'
            }}
          >
            {loading ? 'Processing...' : 'Process Payment'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-bold text-gray-900">Confirm Payment</h2>
              <button
                onClick={handleCancelConfirmation}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium text-gray-900">{selectedStudent?.Name} {selectedStudent?.Surname}</span>
              </div>
              {selectedStructure && (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium text-gray-900">{selectedStructure?.class_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium text-gray-900">{selectedStructure?.term} {selectedStructure?.academic_year}</span>
                  </div>
                </>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">{formData.amount} {currencies.find(c => c.id == formData.currency_id)?.symbol}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-gray-900">{formData.reference_number}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
               <button
                 onClick={handleCancelConfirmation}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
               >
                 Cancel
               </button>
              <button
                onClick={confirmPayment}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Payment Receipt</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Number</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.receipt_number}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.payment_date}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.student_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.amount} {receipt.currency}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.reference_number}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.payment_method}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={downloadReceipt}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800"
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default TuitionFeesPayment;
