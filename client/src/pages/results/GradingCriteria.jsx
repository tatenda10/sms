import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch, faChartLine, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const GradingCriteria = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCriteria, setTotalCriteria] = useState(0);
  const [limit] = useState(25);
  const [isNavigating, setIsNavigating] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState({
    grade: '',
    min_mark: '',
    max_mark: '',
    points: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [editForm, setEditForm] = useState({
    grade: '',
    min_mark: '',
    max_mark: '',
    points: '',
    description: ''
  });
  const [editFormError, setEditFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [criterionToDelete, setCriterionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  useEffect(() => {
    fetchCriteria();
  }, [currentPage, activeSearchTerm]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/results/grading`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let allCriteria = response.data.data || [];
      
      // Apply search filter
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        const searchLower = activeSearchTerm.trim().toLowerCase();
        allCriteria = allCriteria.filter(criterion =>
          criterion.grade.toLowerCase().includes(searchLower) ||
          (criterion.description && criterion.description.toLowerCase().includes(searchLower))
        );
      }

      // Client-side pagination
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCriteria = allCriteria.slice(startIndex, endIndex);
      const totalPages = Math.ceil(allCriteria.length / limit);
      
      setCriteria(paginatedCriteria);
      setTotalPages(totalPages);
      setTotalCriteria(allCriteria.length);
    } catch (err) {
      console.error('Error fetching grading criteria:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
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

  // Modal functions
  const handleOpenModal = () => {
    setShowAddModal(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsLoading(false);
    setFormError(null);
    setForm({
      grade: '',
      min_mark: '',
      max_mark: '',
      points: '',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        min_mark: parseInt(form.min_mark),
        max_mark: parseInt(form.max_mark),
        points: parseInt(form.points)
      };
      
      await axios.post(`${BASE_URL}/results/grading`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      showToast('Grading criterion added successfully!', 'success');
      handleCloseModal();
      fetchCriteria();
    } catch (err) {
      console.error('Error adding grading criterion:', err);
      if (err.response) {
        setFormError(err.response.data?.message || 'Failed to add grading criterion');
      } else {
        setFormError('Failed to add grading criterion. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (criterion) => {
    setSelectedCriterion(criterion);
    setEditModalLoading(true);
    setShowEditModal(true);
    setEditForm({
      grade: criterion.grade,
      min_mark: criterion.min_mark.toString(),
      max_mark: criterion.max_mark.toString(),
      points: criterion.points.toString(),
      description: criterion.description || ''
    });
    setTimeout(() => {
      setEditModalLoading(false);
    }, 300);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditModalLoading(false);
    setSelectedCriterion(null);
    setEditFormError(null);
    setEditForm({
      grade: '',
      min_mark: '',
      max_mark: '',
      points: '',
      description: ''
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditFormError(null);
    setIsSaving(true);

    try {
      const payload = {
        ...editForm,
        min_mark: parseInt(editForm.min_mark),
        max_mark: parseInt(editForm.max_mark),
        points: parseInt(editForm.points)
      };
      
      await axios.put(`${BASE_URL}/results/grading/${selectedCriterion.id}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      showToast('Grading criterion updated successfully!', 'success');
      handleCloseEditModal();
      fetchCriteria();
    } catch (err) {
      console.error('Error updating grading criterion:', err);
      if (err.response) {
        setEditFormError(err.response.data?.message || 'Failed to update grading criterion');
      } else {
        setEditFormError('Failed to update grading criterion. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (criterion) => {
    setCriterionToDelete(criterion);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCriterionToDelete(null);
    setIsDeleting(false);
  };

  const handleDelete = async () => {
    if (!criterionToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/results/grading/${criterionToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Grade "${criterionToDelete.grade}" deleted successfully!`, 'success');
      handleCloseDeleteModal();
      fetchCriteria();
    } catch (err) {
      console.error('Error deleting grading criterion:', err);
      showToast('Failed to delete grading criterion', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toast functions
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

  // Calculate display ranges for pagination
  const displayStart = criteria.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalCriteria);
  const hasData = criteria.length > 0;

  if (loading && criteria.length === 0) {
    return (
      <div className="reports-container" style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading grading criteria...</p>
        </div>
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
      {/* Full Page Loading Overlay */}
      {isNavigating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: '16px'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      )}
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Grading Criteria</h2>
          <p className="report-subtitle">Manage grade ranges and points for automatic grade calculation.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => {
                navigate('/dashboard/results');
              }, 300);
            }}
            disabled={isNavigating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: isNavigating ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              height: '32px',
              fontFamily: 'Nunito, sans-serif',
              opacity: isNavigating ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.7rem' }} />
            Back
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Grade
          </button>
        </div>
      </div>

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
                placeholder="Search by grade or description..."
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
        {loading && criteria.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading grading criteria...</p>
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
                <th style={{ padding: '6px 10px' }}>GRADE</th>
                <th style={{ padding: '6px 10px' }}>MARK RANGE</th>
                <th style={{ padding: '6px 10px' }}>POINTS</th>
                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion, index) => (
                <tr 
                  key={criterion.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 500 }}>
                    {criterion.grade}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {criterion.min_mark} - {criterion.max_mark}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {criterion.points}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {criterion.description || 'No description'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      background: criterion.is_active ? '#d1fae5' : '#fee2e2',
                      color: criterion.is_active ? '#065f46' : '#991b1b'
                    }}>
                      {criterion.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleEditClick(criterion)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(criterion)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - criteria.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (criteria.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
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
          Showing {displayStart} to {displayEnd} of {totalCriteria || 0} results.
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

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', minHeight: isLoading ? '400px' : 'auto' }}
          >
            {isLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Add Grade</h3>
                  <button className="modal-close-btn" onClick={handleCloseModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body">
                  {formError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSave} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Grade <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="grade"
                        className="form-control"
                        placeholder="e.g., A, B, C, D, E, F"
                        value={form.grade}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          Min Mark <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          name="min_mark"
                          className="form-control"
                          placeholder="0"
                          value={form.min_mark}
                          onChange={handleInputChange}
                          required
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Max Mark <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          name="max_mark"
                          className="form-control"
                          placeholder="100"
                          value={form.max_mark}
                          onChange={handleInputChange}
                          required
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Points <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        name="points"
                        className="form-control"
                        placeholder="e.g., 12 for A, 10 for B"
                        value={form.points}
                        onChange={handleInputChange}
                        required
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="2"
                        placeholder="Optional description (e.g., Excellent, Good, Pass)"
                        value={form.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleSave}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Grade'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditModal && selectedCriterion && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', minHeight: editModalLoading ? '400px' : 'auto' }}
          >
            {editModalLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Edit Grade</h3>
                  <button className="modal-close-btn" onClick={handleCloseEditModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body">
                  {editFormError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {editFormError}
                    </div>
                  )}

                  <form onSubmit={handleUpdate} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Grade <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="grade"
                        className="form-control"
                        value={editForm.grade}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          Min Mark <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          name="min_mark"
                          className="form-control"
                          value={editForm.min_mark}
                          onChange={handleEditInputChange}
                          required
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Max Mark <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          name="max_mark"
                          className="form-control"
                          value={editForm.max_mark}
                          onChange={handleEditInputChange}
                          required
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Points <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        name="points"
                        className="form-control"
                        value={editForm.points}
                        onChange={handleEditInputChange}
                        required
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="2"
                        value={editForm.description}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Updating...' : 'Update Grade'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && criterionToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close-btn" onClick={handleCloseDeleteModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: '#fee2e2', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Are you sure you want to delete this grade?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Grade Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Grade:</strong> {criterionToDelete.grade}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Mark Range:</strong> {criterionToDelete.min_mark} - {criterionToDelete.max_mark}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Points:</strong> {criterionToDelete.points}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-delete" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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

export default GradingCriteria;
