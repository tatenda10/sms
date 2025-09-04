import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faUsers,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faBuilding,
  faUserTie,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const Employees = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filters
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchEmployees();
    fetchDropdownData();
  }, [currentPage, activeSearchTerm, selectedDepartment, selectedJobTitle]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: limit
      };

      if (activeSearchTerm.trim()) {
        params.search = activeSearchTerm.trim();
      }

      if (selectedDepartment) {
        params.department = selectedDepartment;
      }

      if (selectedJobTitle) {
        params.jobTitle = selectedJobTitle;
      }

      const response = await axios.get(`${BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setEmployees(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalRecords(response.data.pagination.totalRecords);
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/configurations/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDepartments(response.data.data.departments || []);
        setJobTitles(response.data.data.jobTitles || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setSelectedDepartment('');
    setSelectedJobTitle('');
    setCurrentPage(1);
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/employees/${selectedEmployee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.error || 'Failed to delete employee');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Employees</h1>
            <p className="mt-1 text-xs text-gray-500">
              Manage employee information and records
            </p>
          </div>
          <Link
            to="/dashboard/employees/add"
            className="bg-gray-700 text-white px-4 py-2 text-xs hover:bg-gray-800 flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center flex-1">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500 flex-1"
            />
            <button
              onClick={handleSearch}
              className="ml-2 bg-gray-700 text-white px-3 py-2 text-xs hover:bg-gray-800"
            >
              <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
            </button>
            {(searchTerm || selectedDepartment || selectedJobTitle) && (
              <button
                onClick={handleClearSearch}
                className="ml-2 text-gray-500 hover:text-gray-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="h-3 w-3 text-gray-400 mr-2" />
            <span className="text-xs text-gray-600">Filters:</span>
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={selectedJobTitle}
            onChange={(e) => {
              setSelectedJobTitle(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="">All Job Titles</option>
            {jobTitles.map((title) => (
              <option key={title.id} value={title.id}>
                {title.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                ID Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Hire Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-xs text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-xs text-gray-500">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">{employee.full_name}</div>
                        <div className="text-gray-500">{employee.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {employee.id_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center text-gray-500">
                      <FontAwesomeIcon icon={faBuilding} className="h-3 w-3 mr-1" />
                      {employee.department_name || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center text-gray-500">
                      <FontAwesomeIcon icon={faUserTie} className="h-3 w-3 mr-1" />
                      {employee.job_title || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div>{employee.email || 'No email'}</div>
                    <div>{employee.phone_number || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {formatDate(employee.hire_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/dashboard/employees/view/${employee.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Employee"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/dashboard/employees/edit/${employee.id}`}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Employee"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Employee"
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
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} employees
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-red-100 mb-4">
                <FontAwesomeIcon icon={faTrash} className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Employee</h3>
              <p className="text-xs text-gray-500 mb-4">
                Are you sure you want to delete "{selectedEmployee.full_name}"? This action will deactivate the employee record.
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

export default Employees;
