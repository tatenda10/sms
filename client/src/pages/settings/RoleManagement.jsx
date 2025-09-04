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
  faTimesCircle
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

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

  useEffect(() => {
    fetchRoles();
  }, []);

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
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add Role Button */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-sm font-semibold text-gray-900">System Roles</h2>
          <p className="mt-1 text-xs text-gray-700">
            Manage user roles
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAddRole}
            className="inline-flex items-center justify-center border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Role
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
                placeholder="Search by role name or description..."
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

      {/* Roles Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Role Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Description
                    </th>

                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Users
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUserShield} className="h-3 w-3 text-gray-400 mr-2" />
                          <div className="text-xs text-gray-900 font-medium">
                            {role.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">
                          {role.description}
                        </div>
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-900">
                          <FontAwesomeIcon icon={faUsers} className="h-3 w-3 text-gray-400 mr-1" />
                          {role.userCount}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 flex items-center">
                          <FontAwesomeIcon 
                            icon={role.isActive ? faCheckCircle : faTimesCircle} 
                            className={`h-3 w-3 mr-1 ${role.isActive ? 'text-green-500' : 'text-red-500'}`} 
                          />
                          {role.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                          </button>
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
      {console.log('🗑️ Modal render check:', { showDeleteModal, selectedRole: selectedRole?.name })}
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
  }, [role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[500px] bg-white">
        <div className="mt-3">
          <h3 className="text-sm leading-6 font-medium text-gray-900 mb-4">
            {role ? 'Edit Role' : 'Add New Role'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-600">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                placeholder="Enter role name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-medium text-gray-600">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                placeholder="Enter role description"
              />
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
                <span className="ml-2 text-xs text-gray-700">Active Role</span>
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
                className="px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {role ? 'Update' : 'Create'} Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, role, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  console.log('🗑️ Delete modal rendering for role:', role?.name);

  // Check if role has users assigned
  const hasUsers = role.userCount > 0;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={handleOverlayClick}
    >
      <div className="relative top-20 mx-auto p-5 border w-[400px] bg-white shadow-lg">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <FontAwesomeIcon 
                icon={faTrash} 
                className="h-6 w-6 text-red-600" 
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm leading-6 font-medium text-gray-900">
                Delete Role
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            {hasUsers ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Cannot delete this role because it is currently assigned to users.
                </p>
                <div className="bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">
                      <strong>{role.name}</strong> is assigned to <strong>{role.userCount}</strong> user{role.userCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Please reassign or remove this role from all users before deleting it.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to delete this role? This action cannot be undone.
                </p>
                <div className="bg-gray-50 border border-gray-200 p-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-gray-600">{role.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {hasUsers ? 'Close' : 'Cancel'}
            </button>
            {!hasUsers && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`px-3 py-1.5 border border-transparent text-xs font-medium text-white ${
                  loading
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete Role'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
