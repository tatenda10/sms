import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faSearch, 
  faCreditCard, 
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faEye,
  faFileAlt,
  faBook,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const StudentFeePayments = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    receipt_number: '',
    notes: ''
  });
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  // Load initial data
  useEffect(() => {
    loadStudents();
  }, []);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        setTimeout(() => {
          setToast({ message: null, type: 'success', visible: false });
        }, 300);
      }, duration);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await axios.get(`${BASE_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setStudents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadStudentAssignments = async (studentRegNumber) => {
    try {
      setLoadingAssignments(true);
      const response = await axios.get(`${BASE_URL}/additional-fees/assignments/student/${studentRegNumber}/year/${new Date().getFullYear()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setStudentAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
      showToast('Failed to load fee assignments', 'error');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleStudentSearch = (e) => {
    e.preventDefault();
    if (activeSearchTerm.trim()) {
      const student = students.find(s => 
        s.RegNumber.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
        (s.Name && s.Name.toLowerCase().includes(activeSearchTerm.toLowerCase())) ||
        (s.Surname && s.Surname.toLowerCase().includes(activeSearchTerm.toLowerCase()))
      );
      if (student) {
        setSelectedStudent(student);
        loadStudentAssignments(student.RegNumber);
      } else {
        showToast('Student not found', 'error');
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setSelectedStudent(null);
    setStudentAssignments([]);
  };

  const handlePayment = (assignment) => {
    setSelectedAssignment(assignment);
    setPaymentData({
      payment_amount: assignment.balance.toString(),
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      receipt_number: '',
      notes: ''
    });
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      const response = await axios.post(`${BASE_URL}/additional-fees/payments`, {
        student_reg_number: selectedStudent.RegNumber,
        fee_assignment_id: selectedAssignment.id,
        payment_amount: parseFloat(paymentData.payment_amount),
        currency_id: 1, // Assuming USD
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        reference_number: paymentData.reference_number,
        receipt_number: paymentData.receipt_number,
        notes: paymentData.notes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        showToast('Payment processed successfully!', 'success');
        setShowPaymentModal(false);
        loadStudentAssignments(selectedStudent.RegNumber);
      } else {
        setPaymentError(response.data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      let errorMessage = 'Error processing payment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981' }} />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} style={{ color: '#f59e0b' }} />;
      case 'overdue':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444' }} />;
      default:
        return <FontAwesomeIcon icon={faClock} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: { background: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
      pending: { background: '#fef3c7', color: '#92400e', border: '#fcd34d' },
      partial: { background: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
      overdue: { background: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
      waived: { background: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    };
    return badges[status] || { background: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  };

  const getFeeIcon = (feeType) => {
    switch (feeType) {
      case 'annual':
        return <FontAwesomeIcon icon={faBook} style={{ marginRight: '4px' }} />;
      case 'one_time':
        return <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '4px' }} />;
      default:
        return <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: '4px' }} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getToastIcon = (type) => {
    const iconProps = {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    if (type === 'success') {
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    }
    if (type === 'error') {
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    if (type === 'info') {
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      );
    }
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#2563eb';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  // Ensure 25 rows are always displayed
  const displayRows = [];
  const actualRows = studentAssignments.length;
  const emptyRows = Math.max(0, 25 - actualRows);

  for (let i = 0; i < actualRows; i++) {
    displayRows.push(studentAssignments[i]);
  }
  for (let i = 0; i < emptyRows; i++) {
    displayRows.push(null);
  }

  if (loadingStudents && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Student Fee Payments</h2>
          <p className="report-subtitle">Search for students and process fee payments.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={(e) => {
            e.preventDefault();
            setActiveSearchTerm(searchTerm);
            handleStudentSearch(e);
          }} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or registration number..."
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

      {/* Selected Student Info */}
      {selectedStudent && (
        <div style={{
          padding: '10px 30px',
          background: '#eff6ff',
          borderLeft: '4px solid #2563eb',
          flexShrink: 0,
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faEye} style={{ color: '#2563eb' }} />
            <strong style={{ color: '#1e40af' }}>
              {selectedStudent.Name} {selectedStudent.Surname} ({selectedStudent.RegNumber})
            </strong>
          </div>
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
        {loadingAssignments ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading fee assignments...
          </div>
        ) : selectedStudent ? (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 10, 
              background: 'var(--sidebar-bg)' 
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>FEE NAME</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>PAID</th>
                <th style={{ padding: '6px 10px' }}>BALANCE</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>DUE DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((assignment, index) => {
                if (!assignment) {
                  return (
                    <tr 
                      key={`empty-${index}`}
                      style={{ 
                        height: '32px', 
                        backgroundColor: (studentAssignments.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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
                  );
                }

                const statusColors = getStatusBadge(assignment.status);
                return (
                  <tr 
                    key={assignment.id}
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {getFeeIcon(assignment.fee_type)}
                      {assignment.fee_name}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: assignment.fee_type === 'annual' ? '#dbeafe' : '#e0f2fe',
                        color: assignment.fee_type === 'annual' ? '#1e40af' : '#0369a1',
                        border: `1px solid ${assignment.fee_type === 'annual' ? '#93c5fd' : '#7dd3fc'}`
                      }}>
                        {assignment.fee_type}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px' }}>{formatCurrency(assignment.amount)}</td>
                    <td style={{ padding: '4px 10px' }}>{formatCurrency(assignment.paid_amount)}</td>
                    <td style={{ padding: '4px 10px' }}>
                      <strong style={{
                        color: assignment.balance > 0 ? '#ef4444' : '#10b981'
                      }}>
                        {formatCurrency(assignment.balance)}
                      </strong>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: statusColors.background,
                        color: statusColors.color,
                        border: `1px solid ${statusColors.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getStatusIcon(assignment.status)}
                        {assignment.status}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px' }}>{assignment.due_date || 'N/A'}</td>
                    <td style={{ padding: '4px 10px' }}>
                      {assignment.balance > 0 ? (
                        <button 
                          onClick={() => handlePayment(assignment)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FontAwesomeIcon icon={faCreditCard} />
                          Pay
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '200px', 
            color: '#64748b' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <FontAwesomeIcon icon={faSearch} style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.75rem' }}>Search for a student to view their fee assignments</div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          {selectedStudent 
            ? `Showing ${studentAssignments.length} fee assignment${studentAssignments.length !== 1 ? 's' : ''}.`
            : 'No student selected.'
          }
        </div>
        <div className="table-footer-right">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {selectedStudent ? 'All data displayed' : ''}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Process Payment</h3>
              <button className="modal-close-btn" onClick={() => setShowPaymentModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body">
                {paymentError && (
                  <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                    {paymentError}
                  </div>
                )}

                <div style={{
                  padding: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Student:</strong> {selectedStudent?.Name} {selectedStudent?.Surname} ({selectedStudent?.RegNumber})
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Fee:</strong> {selectedAssignment.fee_name}
                  </div>
                  <div>
                    <strong>Amount Due:</strong> {formatCurrency(selectedAssignment.balance)}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Payment Amount <span className="required">*</span>
                    </label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={paymentData.payment_amount}
                      onChange={(e) => setPaymentData(prev => ({...prev, payment_amount: e.target.value}))}
                      step="0.01"
                      max={selectedAssignment.balance}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Payment Method <span className="required">*</span>
                    </label>
                    <select 
                      className="form-control"
                      value={paymentData.payment_method}
                      onChange={(e) => setPaymentData(prev => ({...prev, payment_method: e.target.value}))}
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Payment Date <span className="required">*</span>
                    </label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData(prev => ({...prev, payment_date: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference Number</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={paymentData.reference_number}
                      onChange={(e) => setPaymentData(prev => ({...prev, reference_number: e.target.value}))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Receipt Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={paymentData.receipt_number}
                    onChange={(e) => setPaymentData(prev => ({...prev, receipt_number: e.target.value}))}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-control"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({...prev, notes: e.target.value}))}
                    rows="3"
                    placeholder="Optional payment notes..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-confirm"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast.visible && toast.message && (
        <div className="success-toast">
          <div 
            className="success-toast-content" 
            style={{ background: getToastBackgroundColor(toast.type) }}
          >
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeePayments;
