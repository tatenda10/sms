import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash,
  faSearch,
  faUserShield,
  faUsers,
  faCheckCircle,
  faTimesCircle,
  faTimes,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const RoleManagement = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [limit] = useState(25);

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/management/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🎭 Roles data:', response.data);
      setRoles(response.data.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.error || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Live search effect with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchRoles();
  }, [currentPage, activeSearchTerm]);

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowAddModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDeleteRole = (role) => {
    console.log('🗑️ Delete button clicked for role:', role?.name);
    setSelectedRole(role);
    setShowDeleteModal(true);
    console.log('🗑️ Modal state set to true');
  };

  const confirmDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await axios.delete(`${BASE_URL}/management/roles/${selectedRole.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setRoles(roles.filter(role => role.id !== selectedRole.id));
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (err) {
      console.error('Error deleting role:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to delete role');
      }
      setShowDeleteModal(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(activeSearchTerm.toLowerCase()))
  );

  const paginatedRoles = filteredRoles.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    if (roles.length > 0) {
      setTotalRoles(filteredRoles.length);
      setTotalPages(Math.ceil(filteredRoles.length / limit));
    }
  }, [roles, activeSearchTerm, limit, filteredRoles.length]);

  const displayStart = paginatedRoles.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalRoles);

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && roles.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Loading roles...</div>
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
          <h2 className="report-title">Role Management</h2>
          <p className="report-subtitle">Manage system roles and permissions.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleAddRole}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Role
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
                placeholder="Search by role name or description..."
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
                    color: 'var(--text-secondary)'
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
        {loading && roles.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading roles...
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
                <th style={{ padding: '6px 10px' }}>ROLE NAME</th>
                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px' }}>USERS</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRoles.map((role, index) => (
                <tr
                  key={role.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faUserShield} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                      {role.name}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {role.description || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                      {role.userCount || 0}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon
                        icon={role.isActive ? faCheckCircle : faTimesCircle}
                        style={{
                          fontSize: '0.7rem',
                          color: role.isActive ? '#10b981' : '#ef4444'
                        }}
                      />
                      {role.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleEditRole(role)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit Role"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete Role"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, limit - paginatedRoles.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (paginatedRoles.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
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

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalRoles || 0} results.
        </div>
        <div className="table-footer-right">
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <RoleModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          role={null}

          onSave={async (roleData) => {
            try {
              const response = await axios.post(`${BASE_URL}/management/roles`, roleData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('✅ Role created:', response.data);
              // Refresh roles list
              fetchRoles();
              setShowAddModal(false);
            } catch (err) {
              console.error('Error creating role:', err);
              // Handle error in the modal component
              throw err;
            }
          }}
        />
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <RoleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          role={selectedRole}

          onSave={async (roleData) => {
            try {
              const response = await axios.put(`${BASE_URL}/management/roles/${selectedRole.id}`, roleData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('✅ Role updated:', response.data);
              // Refresh roles list
              fetchRoles();
              setShowEditModal(false);
            } catch (err) {
              console.error('Error updating role:', err);
              // Handle error in the modal component
              throw err;
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            console.log('🗑️ Closing delete modal');
            setShowDeleteModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          onConfirm={confirmDeleteRole}
        />
      )}
    </div>
  );
};

// Role Modal Component
const RoleModal = ({ isOpen, onClose, role, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        isActive: role.isActive !== undefined ? role.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true
      });
    }
    setError(null);
  }, [role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Error saving role:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save role');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">{role ? 'Edit Role' : 'Add New Role'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body">
          {/* Error Display */}
          {error && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Role Name */}
            <div className="form-group">
              <label className="form-label">
                Role Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter role name"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                className="form-control"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter role description"
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Role Status</label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: formData.isActive ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${formData.isActive ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = formData.isActive ? '#86efac' : '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = formData.isActive ? '#bbf7d0' : '#fecaca';
              }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  style={{
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    accentColor: formData.isActive ? '#10b981' : '#ef4444',
                    margin: 0,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}>
                    {formData.isActive ? 'Active Role' : 'Inactive Role'}
                  </span>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px'
                  }}>
                    {formData.isActive 
                      ? 'Role is active and can be assigned to users' 
                      : 'Role is disabled and cannot be assigned'}
                  </div>
                </div>
              </label>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-confirm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : (role ? 'Update' : 'Create') + ' Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, role, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during deletion:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to delete role');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Check if role has users assigned
  const hasUsers = role.userCount > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Delete Role</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body">
          {/* Error Display */}
          {error && (
            <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {error}
              </div>
            </div>
          )}

          {hasUsers ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <strong>Cannot delete this role</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '8px' }}>
                  This role is currently assigned to users.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#991b1b' }}>
                  <FontAwesomeIcon icon={faUsers} />
                  <span>
                    <strong>{role.name}</strong> is assigned to <strong>{role.userCount}</strong> user{role.userCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Please reassign or remove this role from all users before deleting it.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Are you sure you want to delete this role? This action cannot be undone.
              </p>
              <div style={{ padding: '12px', background: '#f9fafb', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{role.name}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{role.description || 'No description'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
          >
            {hasUsers ? 'Close' : 'Cancel'}
          </button>
          {!hasUsers && (
            <button
              type="button"
              className="modal-btn modal-btn-delete"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Role'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
