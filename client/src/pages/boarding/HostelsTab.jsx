import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch, faBuilding } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const HostelsTab = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHostels, setTotalHostels] = useState(0);
  const [limit] = useState(25);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    gender: 'Male'
  });
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });
  
  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    description: '',
    location: '',
    gender: 'Male'
  });
  const [editFormError, setEditFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    fetchHostels();
  }, [currentPage, activeSearchTerm]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode - filter client-side
        const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
          params: {
            search: activeSearchTerm.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const allHostels = response.data.data || [];
        const searchLower = activeSearchTerm.trim().toLowerCase();
        const filtered = allHostels.filter(hostel =>
          (hostel.name && hostel.name.toLowerCase().includes(searchLower)) ||
          (hostel.location && hostel.location.toLowerCase().includes(searchLower)) ||
          (hostel.description && hostel.description.toLowerCase().includes(searchLower))
        );
        
        setHostels(filtered);
        setTotalPages(1);
        setTotalHostels(filtered.length);
      } else {
        console.log('📄 Fetching all hostels');
        // Normal fetch mode - get all hostels
        const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Raw response:', data);
        const allHostels = data.data || [];
        
        // Client-side pagination
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedHostels = allHostels.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allHostels.length / limit);
        
        setHostels(paginatedHostels);
        setTotalPages(totalPages);
        setTotalHostels(allHostels.length);
      }
    } catch (err) {
      console.error('Error fetching hostels:', err);
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
    console.log('🔍 Starting search with term:', searchTerm);
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
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
    setFormData({
      name: '',
      description: '',
      location: '',
      gender: 'Male'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const response = await axios.post(`${BASE_URL}/boarding/hostels`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await fetchHostels();
        handleCloseModal();
        
        const hostelName = formData.name;
        showToast(`Hostel ${hostelName} has been successfully added!`, 'success');
      } else {
        setFormError(response.data.message || 'Failed to create hostel');
      }
    } catch (err) {
      console.error('Error creating hostel:', err);
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // View modal functions
  const handleViewHostel = async (hostelId) => {
    setShowViewModal(true);
    setViewModalLoading(true);
    setSelectedHostel(null);

    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${hostelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSelectedHostel(response.data.data);
    } catch (err) {
      console.error('Error fetching hostel:', err);
      showToast('Failed to load hostel details', 'error');
      setShowViewModal(false);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedHostel(null);
    setViewModalLoading(false);
  };

  // Edit modal functions
  const handleEditHostel = async (hostelId) => {
    setShowEditModal(true);
    setEditModalLoading(true);
    setEditFormError(null);
    setEditFormData({
      id: '',
      name: '',
      description: '',
      location: '',
      gender: 'Male'
    });

    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${hostelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const hostelData = response.data.data;
      
      setEditFormData({
        id: hostelData.id || '',
        name: hostelData.name || '',
        description: hostelData.description || '',
        location: hostelData.location || '',
        gender: hostelData.gender || 'Male'
      });
    } catch (err) {
      console.error('Error fetching hostel for edit:', err);
      showToast('Failed to load hostel details for editing', 'error');
      setShowEditModal(false);
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({
      id: '',
      name: '',
      description: '',
      location: '',
      gender: 'Male'
    });
    setEditFormError(null);
    setIsSaving(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateHostel = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditFormError(null);

    try {
      await axios.put(`${BASE_URL}/boarding/hostels/${editFormData.id}`, editFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchHostels();
      handleCloseEditModal();
      showToast(`Hostel ${editFormData.name} has been successfully updated!`, 'success');
    } catch (err) {
      console.error('Error updating hostel:', err);
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setEditFormError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const isEditFormValid = () => {
    return (
      editFormData.name &&
      editFormData.location &&
      editFormData.gender
    );
  };

  // Delete modal functions
  const handleDeleteClick = (hostel) => {
    setHostelToDelete(hostel);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setHostelToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!hostelToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/boarding/hostels/${hostelToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchHostels();
      handleCloseDeleteModal();
      showToast(`Hostel ${hostelToDelete.name} has been successfully deleted!`, 'success');
    } catch (err) {
      console.error('Error deleting hostel:', err);
      let errorMessage = 'Failed to delete hostel';
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server Error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      showToast(errorMessage, 'error');
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

  const isFormValid = () => {
    return (
      formData.name &&
      formData.location &&
      formData.gender
    );
  };

  // Calculate display ranges for pagination
  const displayStart = hostels.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalHostels);
  const hasData = hostels.length > 0;

  if (loading && hostels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading hostels...</div>
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
          <h2 className="report-title">Hostels</h2>
          <p className="report-subtitle">Manage boarding hostels and their details.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Hostel
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
                placeholder="Search by name, location, or description..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setCurrentPage(1);
                  }}
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
        {loading && hostels.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading hostels...
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
                <th style={{ padding: '6px 10px' }}>NAME</th>
                <th style={{ padding: '6px 10px' }}>LOCATION</th>
                <th style={{ padding: '6px 10px' }}>GENDER</th>
                <th style={{ padding: '6px 10px' }}>TOTAL ROOMS</th>
                <th style={{ padding: '6px 10px' }}>TOTAL CAPACITY</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {hostels.map((hostel, index) => (
                <tr 
                  key={hostel.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {hostel.name}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {hostel.location || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {hostel.gender || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {hostel.total_rooms || 0}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {hostel.total_capacity || 0}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewHostel(hostel.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditHostel(hostel.id)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(hostel)}
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
              {Array.from({ length: Math.max(0, 25 - hostels.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (hostels.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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
          Showing {displayStart} to {displayEnd} of {totalHostels || 0} results.
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

      {/* Add Hostel Modal */}
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
                  <h3 className="modal-title">Add Hostel</h3>
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
                        Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter hostel name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        placeholder="Enter hostel description (optional)"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Location <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        className="form-control"
                        placeholder="Enter hostel location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Gender <span className="required">*</span>
                      </label>
                      <select
                        name="gender"
                        className="form-control"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
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
                    disabled={!isFormValid() || isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Hostel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Hostel Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', minHeight: viewModalLoading ? '400px' : 'auto' }}
          >
            {viewModalLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading hostel details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : selectedHostel ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Hostel Details - {selectedHostel.name}
                  </h3>
                  <button className="modal-close-btn" onClick={handleCloseViewModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faBuilding} style={{ color: '#2563eb' }} />
                        Hostel Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Name
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedHostel.name || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Location
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedHostel.location || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Gender
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedHostel.gender || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Total Rooms
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedHostel.total_rooms || 0}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Total Capacity
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedHostel.total_capacity || 0}
                          </div>
                        </div>
                        
                        {selectedHostel.description && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Description
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedHostel.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseViewModal}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Hostel Modal */}
      {showEditModal && (
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
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading hostel details...</p>
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
                  <h3 className="modal-title">Edit Hostel</h3>
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
                  
                  <form onSubmit={handleUpdateHostel} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter hostel name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        placeholder="Enter hostel description (optional)"
                        rows="3"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Location <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        className="form-control"
                        placeholder="Enter hostel location"
                        value={editFormData.location}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Gender <span className="required">*</span>
                      </label>
                      <select
                        name="gender"
                        className="form-control"
                        value={editFormData.gender}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleUpdateHostel}
                    disabled={!isEditFormValid() || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Update Hostel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && hostelToDelete && (
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
                    Are you sure you want to delete this hostel?
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
                  Hostel Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Name:</strong> {hostelToDelete.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Location:</strong> {hostelToDelete.location || 'N/A'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Gender:</strong> {hostelToDelete.gender || 'N/A'}
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
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Hostel'}
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

export default HostelsTab;
