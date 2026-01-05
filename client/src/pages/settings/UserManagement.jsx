import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash,
  faEye,
  faSearch,
  faUser,
  faEnvelope,
  faCalendarAlt,
  faCheckCircle,
  faTimesCircle,
  faUserShield,
  faBan
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewRolesModal, setShowViewRolesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/management/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('👥 Users data:', response.data);
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewRoles = (user) => {
    setSelectedUser(user);
    setShowViewRolesModal(true);
  };

  const handleDeactivateUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    const action = user.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await axios.patch(`${BASE_URL}/management/users/${userId}/toggle-status`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Update local state
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, is_active: !u.is_active }
            : u
        ));
      } catch (err) {
        console.error('Error toggling user status:', err);
        setError('Failed to update user status');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${BASE_URL}/management/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Update local state
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to delete user');
        }
      }
    }
  };

  // Helper function to check if user is system admin
  const isSysAdmin = (user) => {
    return user.username === 'sysadmin';
  };

  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(25);

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

  useEffect(() => {
    fetchUsers();
  }, [currentPage, activeSearchTerm]);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
        user.roles.some(role => role.toLowerCase().includes(activeSearchTerm.toLowerCase()))
      );
      setTotalUsers(filtered.length);
      setTotalPages(Math.ceil(filtered.length / limit));
    }
  }, [users, activeSearchTerm, limit]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(activeSearchTerm.toLowerCase()))
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * limit, currentPage * limit);

  const displayStart = paginatedUsers.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalUsers);
  const hasData = paginatedUsers.length > 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Loading users...</div>
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
          <h2 className="report-title">User Management</h2>
          <p className="report-subtitle">Manage system users, roles, and permissions.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleAddUser}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add User
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0, borderTop: 'none' }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or role..."
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
        {loading && users.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading users...
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
                <th style={{ padding: '6px 10px' }}>USERNAME</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>LAST LOGIN</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faUser} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                      {user.username}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon 
                        icon={user.is_active ? faCheckCircle : faTimesCircle} 
                        style={{ 
                          fontSize: '0.7rem',
                          color: user.is_active ? '#10b981' : '#ef4444'
                        }} 
                      />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewRoles(user)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Roles"
                      >
                        <FontAwesomeIcon icon={faUserShield} />
                      </button>
                      
                      {isSysAdmin(user) ? (
                        <button
                          disabled
                          style={{ color: '#d1d5db', background: 'none', border: 'none', cursor: 'not-allowed', padding: 0 }}
                          title="System admin cannot be edited"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit User"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}

                      {isSysAdmin(user) ? (
                        <button
                          disabled
                          style={{ color: '#d1d5db', background: 'none', border: 'none', cursor: 'not-allowed', padding: 0 }}
                          title="System admin cannot be deactivated"
                        >
                          <FontAwesomeIcon icon={faBan} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          style={{ color: user.is_active ? '#f59e0b' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title={user.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          <FontAwesomeIcon icon={user.is_active ? faBan : faCheckCircle} />
                        </button>
                      )}

                      {isSysAdmin(user) ? (
                        <button
                          disabled
                          style={{ color: '#d1d5db', background: 'none', border: 'none', cursor: 'not-allowed', padding: 0 }}
                          title="System admin cannot be deleted"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, limit - paginatedUsers.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (paginatedUsers.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalUsers || 0} results.
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

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          user={null}
          onSave={async (userData) => {
            try {
              const response = await axios.post(`${BASE_URL}/management/users`, userData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('✅ User created:', response.data);
              // Refresh users list
              fetchUsers();
              setShowAddModal(false);
            } catch (err) {
              console.error('Error creating user:', err);
              // Handle error in the modal component
              throw err;
            }
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={selectedUser}
          onSave={async (userData) => {
            try {
              const response = await axios.put(`${BASE_URL}/management/users/${selectedUser.id}`, userData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('✅ User updated:', response.data);
              // Refresh users list
              fetchUsers();
              setShowEditModal(false);
            } catch (err) {
              console.error('Error updating user:', err);
              // Handle error in the modal component
              throw err;
            }
          }}
        />
      )}

      {/* View Roles Modal */}
      {showViewRolesModal && selectedUser && (
        <ViewRolesModal
          isOpen={showViewRolesModal}
          onClose={() => setShowViewRolesModal(false)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    roles: [],
    isActive: true
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/management/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setAvailableRoles(response.data.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        roles: user.roleIds || [],
        isActive: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setFormData({
        username: '',
        password: '',
        roles: [],
        isActive: true
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleChange = (roleId) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Error saving user:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save user');
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
          <h3 className="modal-title">{user ? 'Edit User' : 'Add New User'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Error Display */}
          {error && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="modal-form">
            {/* Username */}
            <div className="form-group">
              <label className="form-label">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                className="form-control"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                Password {!user && <span className="required">*</span>}
                {user && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> (Leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                required={!user}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>

            {/* Roles */}
            <div className="form-group">
              <label className="form-label">
                Roles <span className="required">*</span>
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px',
                background: '#f9fafb',
                marginTop: '8px'
              }}>
                {availableRoles.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.75rem' 
                  }}>
                    No roles available
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '8px'
                  }}>
                    {availableRoles.map((role) => (
                      <label
                        key={role.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          userSelect: 'none',
                          backgroundColor: formData.roles.includes(role.id) ? '#eff6ff' : 'transparent',
                          border: formData.roles.includes(role.id) ? '1px solid #bfdbfe' : '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!formData.roles.includes(role.id)) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!formData.roles.includes(role.id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role.id)}
                          onChange={() => handleRoleChange(role.id)}
                          style={{
                            cursor: 'pointer',
                            width: '16px',
                            height: '16px',
                            accentColor: '#2563eb',
                            margin: 0,
                            flexShrink: 0
                          }}
                        />
                        <span style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          fontWeight: formData.roles.includes(role.id) ? 500 : 400
                        }}>
                          {role.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">User Status</label>
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
                    {formData.isActive ? 'Active User' : 'Inactive User'}
                  </span>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px'
                  }}>
                    {formData.isActive 
                      ? 'User can log in and access the system' 
                      : 'User account is disabled'}
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
            {loading ? 'Saving...' : `${user ? 'Update' : 'Create'} User`}
          </button>
        </div>
      </div>
    </div>
  );
};

// View Roles Modal Component
const ViewRolesModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">User Roles - {user.username}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* User Information Section */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#2563eb' }} />
                User Information
              </h4>
              <div style={{ background: '#f9fafb', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Username:</span>
                    <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{user.username}</div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: user.is_active ? '#10b981' : '#ef4444' }}>
                      <FontAwesomeIcon 
                        icon={user.is_active ? faCheckCircle : faTimesCircle} 
                        style={{ fontSize: '0.7rem' }} 
                      />
                      <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Last Login:</span>
                    <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Section */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faUserShield} style={{ color: '#8b5cf6' }} />
                Assigned Roles ({user.roles.length})
              </h4>
              {user.roles && user.roles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {user.roles.map((role, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
                      <FontAwesomeIcon icon={faUserShield} style={{ fontSize: '0.7rem', color: '#2563eb' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1e40af' }}>{role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  No roles assigned to this user
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
