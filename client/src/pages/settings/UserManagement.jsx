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

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to check if user is system admin
  const isSysAdmin = (user) => {
    return user.username === 'sysadmin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add User Button */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-sm font-semibold text-gray-900">System Users</h2>
          <p className="mt-1 text-xs text-gray-700">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAddUser}
            className="inline-flex items-center justify-center border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or role..."
                className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Users Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-gray-400 mr-2" />
                          <div className="text-xs text-gray-900 font-medium">
                            {user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 flex items-center">
                          <FontAwesomeIcon 
                            icon={user.is_active ? faCheckCircle : faTimesCircle} 
                            className={`h-3 w-3 mr-1 ${user.is_active ? 'text-green-500' : 'text-red-500'}`} 
                          />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewRoles(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Roles"
                          >
                            <FontAwesomeIcon icon={faUserShield} className="h-4 w-4" />
                          </button>
                          
                          {/* Edit Button - Disabled for sysadmin */}
                          {isSysAdmin(user) ? (
                            <button
                              disabled
                              className="text-gray-300 cursor-not-allowed"
                              title="System admin cannot be edited"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit User"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                            </button>
                          )}

                          {/* Deactivate/Activate Button - Disabled for sysadmin */}
                          {isSysAdmin(user) ? (
                            <button
                              disabled
                              className="text-gray-300 cursor-not-allowed"
                              title="System admin cannot be deactivated"
                            >
                              <FontAwesomeIcon icon={faBan} className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className={`${user.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                              title={user.is_active ? 'Deactivate User' : 'Activate User'}
                            >
                              <FontAwesomeIcon icon={user.is_active ? faBan : faCheckCircle} className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button - Disabled for sysadmin */}
                          {isSysAdmin(user) ? (
                            <button
                              disabled
                              className="text-gray-300 cursor-not-allowed"
                              title="System admin cannot be deleted"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[500px] bg-white">
        <div className="mt-3">
          <h3 className="text-sm leading-6 font-medium text-gray-900 mb-4">
            {user ? 'Edit User' : 'Add New User'}
          </h3>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-600">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                placeholder="Enter username"
              />
            </div>



            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-600">
                Password {!user && <span className="text-red-500">*</span>}
                {user && <span className="text-gray-400">(Leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required={!user}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                placeholder="Enter password"
              />
            </div>

            {/* Roles */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 p-2">
                {availableRoles.map((role) => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.id)}
                      onChange={() => handleRoleChange(role.id)}
                      className="h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <span className="ml-2 text-xs text-gray-700">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300"
                />
                <span className="ml-2 text-xs text-gray-700">Active User</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : `${user ? 'Update' : 'Create'} User`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Roles Modal Component
const ViewRolesModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
        <div className="mt-3">
          <h3 className="text-sm leading-6 font-medium text-gray-900 mb-4">
            User Roles - {user.username}
          </h3>
          
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-600">User Information</span>
            </div>
            <div className="bg-gray-50 p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Username:</span>
                  <div className="text-gray-900">{user.username}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <div className={`flex items-center ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    <FontAwesomeIcon 
                      icon={user.is_active ? faCheckCircle : faTimesCircle} 
                      className="h-3 w-3 mr-1" 
                    />
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Last Login:</span>
                  <div className="text-gray-900">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faUserShield} className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-600">Assigned Roles ({user.roles.length})</span>
            </div>
            {user.roles && user.roles.length > 0 ? (
              <div className="space-y-2">
                {user.roles.map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUserShield} className="h-3 w-3 text-blue-600 mr-2" />
                      <span className="text-xs font-medium text-blue-800">{role}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                No roles assigned to this user
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
