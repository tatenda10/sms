import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUserGraduate,
  faPlus,
  faSave,
  faTimes,
  faExclamationTriangle,
  faCheckCircle,
  faClose,
  faSortAmountDown,
  faSortAmountUp
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const ManualBalanceUpdate = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('lowest');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 25,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    adjustment_type: 'debit',
    amount: '',
    description: 'Opening Balance - Historical Debt',
    reference: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live search effect with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [pagination.currentPage, activeSearchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStudents();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudents = async () => {
    try {
      setTableLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
      });

      let response;
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        // Use search endpoint if there's an active search term
        response = await axios.get(`${BASE_URL}/students/search?query=${activeSearchTerm.trim()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // For search results, client-side pagination
        const searchData = response.data.data || [];
        
        // Filter students with opening balance adjustments
        const studentsWithOpeningBalance = await filterStudentsWithOpeningBalance(searchData);
        console.log('Found students with opening balance:', studentsWithOpeningBalance.length);
        
        const startIndex = (pagination.currentPage - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedStudents = studentsWithOpeningBalance.slice(startIndex, endIndex);
        
        setStudents(paginatedStudents);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(studentsWithOpeningBalance.length / prev.limit) || 1,
          totalStudents: studentsWithOpeningBalance.length,
          hasNextPage: endIndex < studentsWithOpeningBalance.length,
          hasPreviousPage: pagination.currentPage > 1
        }));
      } else {
        // Use all students endpoint for general list
        response = await axios.get(`${BASE_URL}/students?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allStudents = response.data.data || [];
        
        // Filter students with opening balance adjustments
        const studentsWithOpeningBalance = await filterStudentsWithOpeningBalance(allStudents);
        console.log('Found students with opening balance:', studentsWithOpeningBalance.length, 'out of', allStudents.length);
        
        // Client-side pagination for filtered results
        const startIndex = (pagination.currentPage - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedStudents = studentsWithOpeningBalance.slice(startIndex, endIndex);
        
        setStudents(paginatedStudents);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(studentsWithOpeningBalance.length / prev.limit) || 1,
          totalStudents: studentsWithOpeningBalance.length,
          hasNextPage: endIndex < studentsWithOpeningBalance.length,
          hasPreviousPage: pagination.currentPage > 1
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Helper function to filter students with opening balance adjustments
  const filterStudentsWithOpeningBalance = async (studentsList) => {
    if (!studentsList || studentsList.length === 0) return [];

    const batchSize = 5; // Smaller batch size for reliability
    const studentsWithOpeningBalance = [];
    
    for (let i = 0; i < studentsList.length; i += batchSize) {
      const batch = studentsList.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (student) => {
          try {
            // Get student transactions to check for adjustments
            const transactionsResponse = await axios.get(
              `${BASE_URL}/students/financial-records/${student.RegNumber}/transactions`,
              { 
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 200 } // Get more transactions to ensure we catch adjustments
              }
            );
            
            // Handle different response structures
            let transactions = [];
            if (transactionsResponse.data?.data?.transactions) {
              transactions = transactionsResponse.data.data.transactions;
            } else if (transactionsResponse.data?.transactions) {
              transactions = transactionsResponse.data.transactions;
            } else if (Array.isArray(transactionsResponse.data?.data)) {
              transactions = transactionsResponse.data.data;
            } else if (Array.isArray(transactionsResponse.data)) {
              transactions = transactionsResponse.data;
            }
            
            const hasAdjustment = transactions.some(t => {
              if (!t) return false;
              const desc = (t.description || '').toLowerCase();
              const ref = (t.reference || '').toLowerCase();
              const transType = (t.transaction_type || '').toLowerCase();
              
              const isAdjustment = transType === 'adjustment' || 
                     desc.includes('opening balance') ||
                     desc.includes('manual balance') ||
                     desc.includes('historical debt') ||
                     ref.includes('mbu') ||
                     ref.includes('ob-');
              
              if (isAdjustment) {
                console.log(`Found opening balance for ${student.RegNumber}:`, { transType, desc, ref });
              }
              
              return isAdjustment;
            });
            
            return hasAdjustment ? student : null;
          } catch (error) {
            console.warn(`Error checking transactions for student ${student.RegNumber}:`, error.message);
            // Return null if we can't check - this student won't be included
            return null;
          }
        })
      );
      
      // Extract successful results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          studentsWithOpeningBalance.push(result.value);
        }
      });
    }
    
    return studentsWithOpeningBalance;
  };

  const handleOpenModal = async (student = null) => {
    if (student) {
      try {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        // Get current balance
        const balanceResponse = await axios.get(
          `${BASE_URL}/students/${student.RegNumber}/balance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSelectedStudent(student);
        setCurrentBalance(balanceResponse.data.balance || 0);
        setFormData({
          adjustment_type: 'debit',
          amount: '',
          description: 'Opening Balance - Historical Debt',
          reference: ''
        });
        setShowModal(true);
      } catch (error) {
        console.error('Error getting student balance:', error);
        setErrorMessage(error.response?.data?.error || 'Failed to load student balance');
      } finally {
        setLoading(false);
      }
    } else {
      // Open modal without student - user will need to search
      setSelectedStudent(null);
      setCurrentBalance(0);
      setModalSearchTerm('');
      setModalSearchResults([]);
      setFormData({
        adjustment_type: 'debit',
        amount: '',
        description: 'Opening Balance - Historical Debt',
        reference: ''
      });
      setShowModal(true);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  // Expose openModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: () => handleOpenModal(null)
  }));

  const handleModalSearch = async () => {
    if (!modalSearchTerm.trim()) {
      setModalSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${modalSearchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setModalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (modalSearchTerm) {
      const delayDebounceFn = setTimeout(() => {
        handleModalSearch();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setModalSearchResults([]);
    }
  }, [modalSearchTerm]);

  const selectStudentInModal = async (student) => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Get current balance
      const balanceResponse = await axios.get(
        `${BASE_URL}/students/${student.RegNumber}/balance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedStudent(student);
      setCurrentBalance(balanceResponse.data.balance || 0);
      setModalSearchTerm('');
      setModalSearchResults([]);
    } catch (error) {
      console.error('Error getting student balance:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to load student balance');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setCurrentBalance(0);
    setModalSearchTerm('');
    setModalSearchResults([]);
    setFormData({
      adjustment_type: 'debit',
      amount: '',
      description: 'Opening Balance - Historical Debt',
      reference: ''
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({
      ...prev,
      reference: `MBU-${timestamp}-${random}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Please enter a description for this adjustment');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const adjustmentData = {
        student_id: selectedStudent.RegNumber,
        adjustment_type: formData.adjustment_type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference || `MBU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      await axios.post(`${BASE_URL}/students/manual-balance-adjustment`, adjustmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Opening balance recorded successfully! This historical debt has been added to the student account.');

      // Refresh student balance
      const balanceResponse = await axios.get(
        `${BASE_URL}/students/${selectedStudent.RegNumber}/balance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentBalance(balanceResponse.data.balance || 0);

      // Reset form
      setFormData({
        adjustment_type: 'debit',
        amount: '',
        description: 'Opening Balance - Historical Debt',
        reference: ''
      });

      // Refresh students list
      setTimeout(() => {
        fetchStudents();
      }, 500);

    } catch (error) {
      console.error('Error updating balance:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to update student balance');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'lowest' ? 'highest' : 'lowest');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const displayStart = students.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.currentPage * pagination.limit, pagination.totalStudents);

  if (loading && students.length === 0) {
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
          <h2 className="report-title">Student Opening Balance</h2>
          <p className="report-subtitle">Record historical student debts from before system implementation.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleOpenModal(null)}
            className="btn-checklist"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Record Opening Balance
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0, borderTop: 'none' }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <div className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or reg number..."
                className="filter-input search-input"
                style={{ width: '300px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
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
          </div>

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
        {tableLoading && students.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading students...
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
                <th style={{ padding: '6px 10px' }}>STUDENT</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>CURRENT BALANCE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.RegNumber || student.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    {student.Name} {student.Surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {student.RegNumber}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700 }}>
                    N/A
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <button
                      onClick={() => handleOpenModal(student)}
                      style={{
                        color: '#2563eb',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Update Opening Balance"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Update Balance
                    </button>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, pagination.limit - students.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (students.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
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

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.totalStudents || 0} results.
        </div>
        <div className="table-footer-right">
          {pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Update Opening Balance Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Update Opening Balance</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                {/* Success/Error Messages */}
                {successMessage && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#065f46' }}>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {successMessage}
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Student Search */}
                <div className="form-group">
                  <label className="form-label">
                    Search Student <span className="required">*</span>
                  </label>
                  <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      placeholder="Search by name or registration number..."
                      className="filter-input search-input"
                    />
                  </div>
                  {modalSearchResults.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'white'
                    }}>
                      {modalSearchResults.map((student) => (
                        <div
                          key={student.RegNumber || student.id}
                          onClick={() => selectStudentInModal(student)}
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
                            Reg: {student.RegNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#065f46' }}>
                            {selectedStudent.Name} {selectedStudent.Surname}
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#047857' }}>
                            Reg: {selectedStudent.RegNumber} | Current Balance: {formatCurrency(currentBalance)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(null);
                            setCurrentBalance(0);
                            setModalSearchTerm('');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#047857',
                            padding: '4px'
                          }}
                          title="Change student"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Balance Type <span className="required">*</span>
                  </label>
                  <select
                    name="adjustment_type"
                    value={formData.adjustment_type}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="debit">Student Owes Money (Debit - Most Common)</option>
                    <option value="credit">Student Has Credit (Rare)</option>
                  </select>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    💡 In most cases, use "Student Owes Money" for historical unpaid fees
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Amount <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="e.g., Opening Balance - Unpaid fees from 2023 Term 1"
                    className="form-control"
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📝 Describe what this historical debt is for (year, term, reason)
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if left empty"
                      className="form-control"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={generateReference}
                      className="modal-btn"
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        padding: '6px 12px',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !selectedStudent}
                    className="modal-btn modal-btn-confirm"
                  >
                    {isProcessing ? 'Processing...' : 'Record Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ManualBalanceUpdate;
