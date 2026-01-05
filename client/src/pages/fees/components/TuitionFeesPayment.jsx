import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faGraduationCap,
  faDollarSign,
  faCalendarAlt,
  faList,
  faCheck,
  faTimes,
  faPlus,
  faEye,
  faBed,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../../components/SuccessModal';
import ErrorModal from '../../../components/ErrorModal';
import { jsPDF } from 'jspdf';

const TuitionFeesPayment = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [limit] = useState(25);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('tuition'); // 'tuition', 'boarding', 'additional'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [hostels, setHostels] = useState([]);
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states - Tuition
  const [tuitionFormData, setTuitionFormData] = useState({
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

  // Form states - Boarding
  const [boardingFormData, setBoardingFormData] = useState({
    student_reg_number: '',
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

  // Form states - Additional Fees
  const [additionalFormData, setAdditionalFormData] = useState({
    student_reg_number: '',
    fee_assignment_id: '',
    payment_amount: '',
    currency_id: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, activeSearchTerm]);

  useEffect(() => {
    if (showPaymentModal) {
      fetchClasses();
      fetchCurrencies();
      if (paymentType === 'boarding') {
        fetchHostels();
      }
    }
  }, [showPaymentModal, paymentType]);

  useEffect(() => {
    if (tuitionFormData.gradelevel_class_id && tuitionFormData.term && tuitionFormData.academic_year) {
      fetchInvoiceStructures();
    }
  }, [tuitionFormData.gradelevel_class_id, tuitionFormData.term, tuitionFormData.academic_year]);

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentType('tuition');
    setTuitionFormData({
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
    setBoardingFormData({
      student_reg_number: '',
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
    setAdditionalFormData({
      student_reg_number: '',
      fee_assignment_id: '',
      payment_amount: '',
      currency_id: '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setSelectedStudent(null);
    setSelectedStructure(null);
    setStudents([]);
    setSearchTerm('');
  };

  // Expose openModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: handleOpenPaymentModal
  }));

  const fetchPayments = async () => {
    try {
      setTableLoading(true);
      setError(null);

      // Fetch boarding payments (as they have student info)
      const params = {
        page: currentPage,
        limit: limit
      };

      if (activeSearchTerm) {
        params.search = activeSearchTerm.trim();
      }

      const response = await axios.get(`${BASE_URL}/boarding/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        const paymentData = response.data.data || [];
        // Transform to include student name and format
        const formattedPayments = paymentData.map(payment => ({
          ...payment,
          student_name: payment.student_name || 'N/A',
          student_surname: payment.student_surname || 'N/A',
          student_reg_number: payment.student_reg_number || 'N/A',
          amount: payment.amount_paid || payment.base_currency_amount || 0,
          currency: payment.base_currency_symbol || payment.currency_symbol || '',
          payment_date: payment.payment_date || payment.created_at,
          payment_method: payment.payment_method || 'N/A',
          receipt_number: payment.receipt_number || 'N/A',
          reference_number: payment.reference_number || 'N/A'
        }));

        setPayments(formattedPayments);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalPayments(response.data.pagination?.total_items || 0);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
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

  const fetchHostels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHostels(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hostels:', error);
    }
  };

  const fetchInvoiceStructures = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fees/invoice-structures/class/${tuitionFormData.gradelevel_class_id}?term=${tuitionFormData.term}&academic_year=${tuitionFormData.academic_year}`,
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
    if (!searchTerm.trim()) {
      setStudents([]);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setTuitionFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setBoardingFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setAdditionalFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const selectInvoiceStructure = (structure) => {
    setSelectedStructure(structure);
    setTuitionFormData(prev => ({
      ...prev,
      invoice_structure_id: structure.id,
      currency_id: structure.currency_id
    }));
  };

  const generateReferenceNumber = () => {
    return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentType('tuition');
    setSelectedStudent(null);
    setSelectedStructure(null);
    setTuitionFormData({
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
    setBoardingFormData({
      student_reg_number: '',
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
    setAdditionalFormData({
      student_reg_number: '',
      fee_assignment_id: '',
      payment_amount: '',
      currency_id: '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      setShowErrorModal(true);
      return;
    }

    // Validate based on payment type
    if (paymentType === 'tuition') {
      if (!tuitionFormData.amount || parseFloat(tuitionFormData.amount) <= 0) {
        setErrorMessage('Please enter a valid payment amount');
        setShowErrorModal(true);
        return;
      }
      if (!tuitionFormData.currency_id) {
        setErrorMessage('Please select a currency');
        setShowErrorModal(true);
        return;
      }
      if (!tuitionFormData.payment_method_id) {
        setErrorMessage('Please select a payment method');
        setShowErrorModal(true);
        return;
      }
      if (!tuitionFormData.reference_number) {
        setErrorMessage('Please enter a reference number');
        setShowErrorModal(true);
        return;
      }
    } else if (paymentType === 'boarding') {
      if (!boardingFormData.amount_paid || parseFloat(boardingFormData.amount_paid) <= 0) {
        setErrorMessage('Please enter a valid payment amount');
        setShowErrorModal(true);
        return;
      }
      if (!boardingFormData.currency_id) {
        setErrorMessage('Please select a currency');
        setShowErrorModal(true);
        return;
      }
      if (!boardingFormData.hostel_id) {
        setErrorMessage('Please select a hostel');
        setShowErrorModal(true);
        return;
      }
      if (!boardingFormData.reference_number) {
        setErrorMessage('Please enter a reference number');
        setShowErrorModal(true);
        return;
      }
    } else if (paymentType === 'additional') {
      if (!additionalFormData.payment_amount || parseFloat(additionalFormData.payment_amount) <= 0) {
        setErrorMessage('Please enter a valid payment amount');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.currency_id) {
        setErrorMessage('Please select a currency');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.fee_assignment_id) {
        setErrorMessage('Please select a fee assignment');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.reference_number) {
        setErrorMessage('Please enter a reference number');
        setShowErrorModal(true);
        return;
      }
    }

    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    try {
      let response;
      let receiptData;

      if (paymentType === 'tuition') {
        const paymentPayload = {
          student_reg_number: tuitionFormData.student_reg_number,
          amount: parseFloat(tuitionFormData.amount),
          payment_currency: tuitionFormData.currency_id,
          payment_method: paymentMethods.find(m => m.id === tuitionFormData.payment_method_id)?.name || 'Cash',
          payment_date: tuitionFormData.payment_date,
          reference_number: tuitionFormData.reference_number,
          notes: tuitionFormData.notes || ''
        };
        
        if (tuitionFormData.invoice_structure_id) {
          paymentPayload.invoice_structure_id = tuitionFormData.invoice_structure_id;
        }

        response = await axios.post(`${BASE_URL}/fees/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          receiptData = {
            receipt_number: response.data.data.receipt_number,
            student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
            student_reg: selectedStudent.RegNumber,
            amount: tuitionFormData.amount,
            currency: currencies.find(c => c.id === tuitionFormData.currency_id)?.symbol || '',
            payment_date: tuitionFormData.payment_date,
            payment_method: paymentMethods.find(m => m.id === tuitionFormData.payment_method_id)?.name || 'Cash',
            fee_type: 'tuition',
            reference_number: tuitionFormData.reference_number,
            class_name: selectedStructure?.class_name || 'N/A',
            term: selectedStructure?.term || 'N/A',
            academic_year: selectedStructure?.academic_year || 'N/A',
            notes: tuitionFormData.notes || ''
          };
        }
      } else if (paymentType === 'boarding') {
        const paymentPayload = {
          student_reg_number: boardingFormData.student_reg_number,
          academic_year: boardingFormData.academic_year,
          term: boardingFormData.term,
          hostel_id: boardingFormData.hostel_id,
          amount_paid: parseFloat(boardingFormData.amount_paid),
          currency_id: boardingFormData.currency_id,
          payment_method: boardingFormData.payment_method,
          payment_date: boardingFormData.payment_date,
          reference_number: boardingFormData.reference_number,
          notes: boardingFormData.notes || ''
        };

        response = await axios.post(`${BASE_URL}/boarding/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          receiptData = {
            receipt_number: response.data.data.receipt_number,
            student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
            student_reg: selectedStudent.RegNumber,
            amount: boardingFormData.amount_paid,
            currency: currencies.find(c => c.id === boardingFormData.currency_id)?.symbol || '',
            payment_date: boardingFormData.payment_date,
            payment_method: boardingFormData.payment_method,
            fee_type: 'boarding',
            reference_number: boardingFormData.reference_number,
            hostel_name: hostels.find(h => h.id === boardingFormData.hostel_id)?.name || 'N/A',
            notes: boardingFormData.notes || ''
          };
        }
      } else if (paymentType === 'additional') {
        const paymentPayload = {
          student_reg_number: additionalFormData.student_reg_number,
          fee_assignment_id: additionalFormData.fee_assignment_id,
          payment_amount: parseFloat(additionalFormData.payment_amount),
          currency_id: additionalFormData.currency_id,
          payment_method: additionalFormData.payment_method,
          payment_date: additionalFormData.payment_date,
          reference_number: additionalFormData.reference_number,
          notes: additionalFormData.notes || ''
        };

        response = await axios.post(`${BASE_URL}/fees/additional/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          receiptData = {
            receipt_number: response.data.data.receipt_number,
            student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
            student_reg: selectedStudent.RegNumber,
            amount: additionalFormData.payment_amount,
            currency: currencies.find(c => c.id === additionalFormData.currency_id)?.symbol || '',
            payment_date: additionalFormData.payment_date,
            payment_method: additionalFormData.payment_method,
            fee_type: 'additional',
            reference_number: additionalFormData.reference_number,
            notes: additionalFormData.notes || ''
          };
        }
      }

      if (response && response.data.success) {
        setReceipt(receiptData);
        setShowConfirmation(false);
        setShowReceipt(true);
        setSuccessMessage('Payment processed successfully');
        setShowSuccessModal(true);
        
        // Reset form
        handleClosePaymentModal();
        
        // Refresh payments table
        fetchPayments();
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
      setIsProcessing(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setErrorMessage('');
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    doc.setFontSize(10);
    doc.text('Receipt Number:', 20, 40);
    doc.text(receipt.receipt_number, 60, 40);
    doc.text('Date:', 20, 50);
    doc.text(receipt.payment_date, 60, 50);
    
    doc.setFontSize(12);
    doc.text('Student Information:', 20, 70);
    doc.setFontSize(10);
    doc.text('Name:', 20, 80);
    doc.text(receipt.student_name, 60, 80);
    doc.text('Registration:', 20, 90);
    doc.text(receipt.student_reg, 60, 90);
    
    doc.setFontSize(12);
    doc.text('Payment Details:', 20, 110);
    doc.setFontSize(10);
    doc.text('Amount:', 20, 120);
    doc.text(`${receipt.amount} ${receipt.currency}`, 60, 120);
    doc.text('Payment Method:', 20, 130);
    doc.text(receipt.payment_method, 60, 130);
    doc.text('Reference:', 20, 140);
    doc.text(receipt.reference_number, 60, 140);
    
    doc.save(`receipt-${receipt.receipt_number}.pdf`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  // Calculate display ranges for pagination
  const displayStart = payments.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalPayments);

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payment history...</div>
      </div>
    );
  }

  return (
    <>
      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, registration number, or receipt number..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {tableLoading && payments.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading payments...
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'var(--sidebar-bg)'
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>RECEIPT NUMBER</th>
                <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>PAYMENT DATE</th>
                <th style={{ padding: '6px 10px' }}>PAYMENT METHOD</th>
                <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr
                  key={payment.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {payment.receipt_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.student_name} {payment.student_surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.student_reg_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.amount} {payment.currency}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.payment_method}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.reference_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          // View payment details
                          console.log('View payment:', payment);
                        }}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - payments.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (payments.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalPayments || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={handleClosePaymentModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close-btn" onClick={handleClosePaymentModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                {/* Payment Type Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faList} style={{ color: '#10b981' }} />
                    Payment Type <span className="required">*</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentType('tuition')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'tuition' ? '#2563eb' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        background: paymentType === 'tuition' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: paymentType === 'tuition' ? 600 : 400,
                        color: paymentType === 'tuition' ? '#2563eb' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '6px' }} />
                      Tuition Fees
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('boarding')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'boarding' ? '#2563eb' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        background: paymentType === 'boarding' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: paymentType === 'boarding' ? 600 : 400,
                        color: paymentType === 'boarding' ? '#2563eb' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FontAwesomeIcon icon={faBed} style={{ marginRight: '6px' }} />
                      Boarding Fees
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('additional')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'additional' ? '#2563eb' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        background: paymentType === 'additional' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: paymentType === 'additional' ? 600 : 400,
                        color: paymentType === 'additional' ? '#2563eb' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ marginRight: '6px' }} />
                      Additional Fees
                    </button>
                  </div>
                </div>

                {/* Student Search */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                    Student Selection <span className="required">*</span>
                  </h4>
                  <div style={{ position: 'relative' }}>
                    <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          searchStudents();
                        }}
                        placeholder="Search by name or registration number..."
                        className="filter-input search-input"
                      />
                    </div>
                    {students.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}>
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
                  </div>

                  {selectedStudent && (
                    <div style={{ 
                      marginTop: '12px',
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

                {/* Tuition Form - Invoice Structure Selection (Optional) */}
                {paymentType === 'tuition' && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faList} style={{ color: '#10b981' }} />
                      Invoice Structure <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Class</label>
                        <select
                          value={tuitionFormData.gradelevel_class_id}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, gradelevel_class_id: e.target.value, term: '', academic_year: '', invoice_structure_id: '' }))}
                          className="form-control"
                        >
                          <option value="">Select Class (Optional)</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Term</label>
                        <select
                          value={tuitionFormData.term}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, term: e.target.value, academic_year: '', invoice_structure_id: '' }))}
                          className="form-control"
                          disabled={!tuitionFormData.gradelevel_class_id}
                        >
                          <option value="">Select Term (Optional)</option>
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Academic Year</label>
                        <input
                          type="text"
                          value={tuitionFormData.academic_year}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, academic_year: e.target.value, invoice_structure_id: '' }))}
                          placeholder="e.g., 2025 (Optional)"
                          className="form-control"
                          disabled={!tuitionFormData.gradelevel_class_id || !tuitionFormData.term}
                        />
                      </div>
                    </div>

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
                            setTuitionFormData(prev => ({ ...prev, invoice_structure_id: '' }));
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
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {/* Boarding Form - Hostel and Term Selection */}
                {paymentType === 'boarding' && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faBed} style={{ color: '#10b981' }} />
                      Boarding Details
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          Hostel <span className="required">*</span>
                        </label>
                        <select
                          value={boardingFormData.hostel_id}
                          onChange={(e) => setBoardingFormData(prev => ({ ...prev, hostel_id: e.target.value }))}
                          className="form-control"
                          required
                        >
                          <option value="">Select Hostel</option>
                          {hostels.map((hostel) => (
                            <option key={hostel.id} value={hostel.id}>
                              {hostel.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Academic Year <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          value={boardingFormData.academic_year}
                          onChange={(e) => setBoardingFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Term <span className="required">*</span>
                        </label>
                        <select
                          value={boardingFormData.term}
                          onChange={(e) => setBoardingFormData(prev => ({ ...prev, term: e.target.value }))}
                          className="form-control"
                          required
                        >
                          <option value="1">Term 1</option>
                          <option value="2">Term 2</option>
                          <option value="3">Term 3</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details - Conditional based on payment type */}
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
                        value={paymentType === 'tuition' ? tuitionFormData.amount : paymentType === 'boarding' ? boardingFormData.amount_paid : additionalFormData.payment_amount}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, amount: e.target.value }));
                          } else if (paymentType === 'boarding') {
                            setBoardingFormData(prev => ({ ...prev, amount_paid: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, payment_amount: e.target.value }));
                          }
                        }}
                        className="form-control"
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Currency <span className="required">*</span>
                      </label>
                      <select
                        value={paymentType === 'tuition' ? tuitionFormData.currency_id : paymentType === 'boarding' ? boardingFormData.currency_id : additionalFormData.currency_id}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, currency_id: e.target.value }));
                          } else if (paymentType === 'boarding') {
                            setBoardingFormData(prev => ({ ...prev, currency_id: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, currency_id: e.target.value }));
                          }
                        }}
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
                      {paymentType === 'tuition' ? (
                        <select
                          value={tuitionFormData.payment_method_id}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, payment_method_id: e.target.value }))}
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
                      ) : (
                        <select
                          value={paymentType === 'boarding' ? boardingFormData.payment_method : additionalFormData.payment_method}
                          onChange={(e) => {
                            if (paymentType === 'boarding') {
                              setBoardingFormData(prev => ({ ...prev, payment_method: e.target.value }));
                            } else {
                              setAdditionalFormData(prev => ({ ...prev, payment_method: e.target.value }));
                            }
                          }}
                          className="form-control"
                          required
                        >
                          <option value="">Select Payment Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Mobile Money">Mobile Money</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Payment Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        value={paymentType === 'tuition' ? tuitionFormData.payment_date : paymentType === 'boarding' ? boardingFormData.payment_date : additionalFormData.payment_date}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, payment_date: e.target.value }));
                          } else if (paymentType === 'boarding') {
                            setBoardingFormData(prev => ({ ...prev, payment_date: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, payment_date: e.target.value }));
                          }
                        }}
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
                          value={paymentType === 'tuition' ? tuitionFormData.reference_number : paymentType === 'boarding' ? boardingFormData.reference_number : additionalFormData.reference_number}
                          onChange={(e) => {
                            if (paymentType === 'tuition') {
                              setTuitionFormData(prev => ({ ...prev, reference_number: e.target.value }));
                            } else if (paymentType === 'boarding') {
                              setBoardingFormData(prev => ({ ...prev, reference_number: e.target.value }));
                            } else {
                              setAdditionalFormData(prev => ({ ...prev, reference_number: e.target.value }));
                            }
                          }}
                          placeholder="Enter reference number"
                          className="form-control"
                          style={{ flex: 1 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const refNum = generateReferenceNumber();
                            if (paymentType === 'tuition') {
                              setTuitionFormData(prev => ({ ...prev, reference_number: refNum }));
                            } else if (paymentType === 'boarding') {
                              setBoardingFormData(prev => ({ ...prev, reference_number: refNum }));
                            } else {
                              setAdditionalFormData(prev => ({ ...prev, reference_number: refNum }));
                            }
                          }}
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
                      <label className="form-label">Notes</label>
                      <textarea
                        value={paymentType === 'tuition' ? tuitionFormData.notes : paymentType === 'boarding' ? boardingFormData.notes : additionalFormData.notes}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, notes: e.target.value }));
                          } else if (paymentType === 'boarding') {
                            setBoardingFormData(prev => ({ ...prev, notes: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, notes: e.target.value }));
                          }
                        }}
                        placeholder="Additional notes..."
                        className="form-control"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="modal-btn modal-btn-confirm"
                  >
                    {isProcessing ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={handleCancelConfirmation}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Payment</h3>
              <button className="modal-close-btn" onClick={handleCancelConfirmation}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Student:</strong> {selectedStudent?.Name} {selectedStudent?.Surname}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Amount:</strong> {formData.amount} {currencies.find(c => c.id == formData.currency_id)?.symbol}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Reference:</strong> {formData.reference_number}</p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={handleCancelConfirmation} className="modal-btn modal-btn-cancel">Cancel</button>
                <button onClick={confirmPayment} disabled={isProcessing} className="modal-btn modal-btn-confirm">
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Payment Receipt</h3>
              <button className="modal-close-btn" onClick={() => setShowReceipt(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Receipt Number:</strong> {receipt.receipt_number}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Date:</strong> {receipt.payment_date}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Student:</strong> {receipt.student_name}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Amount:</strong> {receipt.amount} {receipt.currency}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Reference:</strong> {receipt.reference_number}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Payment Method:</strong> {receipt.payment_method}</p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={downloadReceipt} className="modal-btn modal-btn-confirm">Download PDF</button>
                <button onClick={() => setShowReceipt(false)} className="modal-btn modal-btn-cancel">Close</button>
              </div>
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
    </>
  );
});

export default TuitionFeesPayment;
