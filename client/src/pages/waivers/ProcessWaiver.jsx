import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faDollarSign,
  faCalendarAlt,
  faCheck,
  faTimes,
  faTag,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const ProcessWaiver = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    student_reg_number: '',
    waiver_amount: '',
    currency_id: '',
    category_id: '',
    reason: '',
    notes: '',
    term: '',
    academic_year: ''
  });

  useEffect(() => {
    if (showModal) {
      fetchCategories();
      fetchCurrencies();
    }
  }, [showModal]);

  // Auto-search students while typing
  useEffect(() => {
    if (searchTerm.trim() && showModal) {
      const delayDebounceFn = setTimeout(() => {
        searchStudents();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setStudents([]);
    }
  }, [searchTerm, showModal]);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setShowModal(true);
      setSearchTerm('');
      setSelectedStudent(null);
      setStudents([]);
      setSuccessMessage('');
      setErrorMessage('');
      setFormData({
        student_reg_number: '',
        waiver_amount: '',
        currency_id: '',
        category_id: '',
        reason: '',
        notes: '',
        term: '',
        academic_year: ''
      });
    }
  }));

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/waivers/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currencyList = response.data.data || [];
      setCurrencies(currencyList);
      const baseCurrency = currencyList.find(c => c.base_currency);
      if (baseCurrency) {
        setFormData(prev => ({ ...prev, currency_id: baseCurrency.id }));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
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
    setFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setSearchTerm('');
    setStudents([]);
    setShowConfirmation(false);
    setSuccessMessage('');
    setErrorMessage('');
    setFormData({
      student_reg_number: '',
      waiver_amount: '',
      currency_id: '',
      category_id: '',
      reason: '',
      notes: '',
      term: '',
      academic_year: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      return;
    }

    if (!formData.waiver_amount || !formData.currency_id || !formData.category_id || !formData.reason || !formData.term || !formData.academic_year) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.waiver_amount) <= 0) {
      setErrorMessage('Waiver amount must be greater than 0');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmWaiver = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const waiverPayload = {
        student_reg_number: selectedStudent.RegNumber,
        waiver_amount: parseFloat(formData.waiver_amount),
        currency_id: formData.currency_id,
        category_id: formData.category_id,
        reason: formData.reason,
        notes: formData.notes,
        term: formData.term,
        academic_year: formData.academic_year
      };

      const response = await axios.post(`${BASE_URL}/waivers/process`, waiverPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(`Waiver of ${formData.waiver_amount} processed successfully for ${selectedStudent.Name} ${selectedStudent.Surname}`);
        setShowConfirmation(false);
        
        // Reset form
        const baseCurrency = currencies.find(c => c.base_currency);
        setFormData({
          student_reg_number: '',
          waiver_amount: '',
          currency_id: baseCurrency?.id || '',
          category_id: '',
          reason: '',
          notes: '',
          term: '',
          academic_year: ''
        });
        setSelectedStudent(null);
        setSearchTerm('');

        // Close modal after 2 seconds
        setTimeout(() => {
          handleCloseModal();
          // Refresh parent component if callback provided
          if (props.onWaiverProcessed) {
            props.onWaiverProcessed();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing waiver:', error);
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to process waiver');
      }
      setShowConfirmation(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setErrorMessage('');
  };

  if (!showModal) return null;

  return (
    <>
      {/* Process Waiver Modal */}
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header">
            <h3 className="modal-title">Process Waiver</h3>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body">
            {/* Success/Error Messages */}
            {successMessage && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#065f46' }}>
                  <FontAwesomeIcon icon={faCheck} />
                  {successMessage}
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                  <FontAwesomeIcon icon={faTimes} />
                  {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Student Selection */}
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or registration number..."
                      className="filter-input search-input"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
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
                      <div style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
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

              {/* Waiver Details */}
              <div className="form-group">
                <label className="form-label">
                  Waiver Amount <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon icon={faDollarSign} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem' }} />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.waiver_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, waiver_amount: e.target.value }))}
                    placeholder="0.00"
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
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
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Waiver Category <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon icon={faTag} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem', zIndex: 1 }} />
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Reason <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon icon={faFileAlt} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }} />
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why this waiver is being granted..."
                    className="form-control"
                    style={{ paddingLeft: '32px', paddingTop: '8px' }}
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Term <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem', zIndex: 1 }} />
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    required
                  >
                    <option value="">Select Term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Academic Year <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem', zIndex: 1 }} />
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="e.g., 2025"
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes or comments..."
                  className="form-control"
                  rows="2"
                />
              </div>

              {/* Form Actions */}
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="modal-btn modal-btn-confirm"
                >
                  {isProcessing ? 'Processing...' : 'Process Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={handleCancelConfirmation}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Waiver</h3>
              <button className="modal-close-btn" onClick={handleCancelConfirmation}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Student:</strong> {selectedStudent?.Name} {selectedStudent?.Surname}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Registration:</strong> {selectedStudent?.RegNumber}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Waiver Amount:</strong> {formData.waiver_amount} {currencies.find(c => c.id == formData.currency_id)?.code}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Category:</strong> {categories.find(c => c.id == formData.category_id)?.category_name}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Reason:</strong> {formData.reason}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Term:</strong> {formData.term}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Academic Year:</strong> {formData.academic_year}</p>
              </div>
              <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  <strong>Note:</strong> This waiver will credit the student's account and reduce their outstanding balance.
                </p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={handleCancelConfirmation} className="modal-btn modal-btn-cancel">Cancel</button>
                <button onClick={confirmWaiver} disabled={isProcessing} className="modal-btn modal-btn-confirm">
                  {isProcessing ? 'Processing...' : 'Confirm Waiver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ProcessWaiver.displayName = 'ProcessWaiver';

export default ProcessWaiver;
