import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faBuilding,
  faUsers,
  faSearch,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const DepartmentManagement = () => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchDepartments();
  }, [currentPage, searchTerm]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: limit
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get(`${BASE_URL}/configurations/departments`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setDepartments(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalRecords(response.data.pagination.totalRecords);
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDepartments();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleCreateDepartment = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', isActive: true });
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const handleEditDepartment = (department) => {
    setModalMode('edit');
    setFormData({
      name: department.name,
      description: department.description || '',
      isActive: department.is_active
    });
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleDeleteDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const url = modalMode === 'create' 
        ? `${BASE_URL}/configurations/departments`
        : `${BASE_URL}/configurations/departments/${selectedDepartment.id}`;

      const method = modalMode === 'create' ? 'post' : 'put';

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowModal(false);
        fetchDepartments();
        setFormData({ name: '', description: '', isActive: true });
      }
    } catch (err) {
      console.error('Error saving department:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save department');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/configurations/departments/${selectedDepartment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.error || 'Failed to delete department');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
            <button
              onClick={handleSearch}
              className="ml-2 bg-gray-700 text-white px-3 py-2 text-xs hover:bg-gray-800"
            >
              <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
            </button>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="ml-2 text-gray-500 hover:text-gray-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleCreateDepartment}
          className="bg-gray-700 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
          Add Department
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-white border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Employees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-xs text-gray-500">
                  Loading departments...
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-xs text-gray-500">
                  No departments found
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">{department.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div className="max-w-xs truncate">
                      {department.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center text-gray-500">
                      <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-1" />
                      {department.employee_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold ${
                      department.is_active 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {department.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Department"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Department"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} departments
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-xs border ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 text-xs border ${
                  currentPage === index + 1
                    ? 'border-gray-700 bg-gray-700 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-xs border ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalMode === 'create' ? 'Add New Department' : 'Edit Department'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter department description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-xs text-gray-600">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gray-700 text-white text-xs hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-red-100 mb-4">
                <FontAwesomeIcon icon={faTrash} className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Department</h3>
              <p className="text-xs text-gray-500 mb-4">
                Are you sure you want to delete "{selectedDepartment.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-xs hover:bg-red-700 disabled:bg-red-400"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
