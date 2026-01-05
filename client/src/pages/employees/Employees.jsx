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
  faFilter,
  faTimes,
  faEnvelope,
  faPhone,
  faIdCard,
  faCalendarAlt,
  faUniversity,
  faCreditCard,
  faDollarSign,
  faStar,
  faCheck,
  faExclamationTriangle,
  faMapMarkerAlt
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
  const [toast, setToast] = useState({ visible: false, message: null, type: 'success' });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form data for Add/Edit
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeId: '',
    fullName: '',
    idNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    gender: '',
    departmentId: '',
    jobTitleId: '',
    hireDate: '',
    generateEmployeeId: true
  });

  const [bankAccounts, setBankAccounts] = useState([
    { bankName: '', accountNumber: '', currency: '', isPrimary: true }
  ]);

  // Filters
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 25; // Adjusted to match Students limit

  useEffect(() => {
    fetchEmployees();
    fetchDropdownData();
  }, [currentPage, activeSearchTerm, selectedDepartment, selectedJobTitle, selectedGender]);

  // Live search effect similar to Students.jsx
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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

      if (selectedGender) {
        params.gender = selectedGender;
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
      showToast('Employee deleted successfully');
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

  // Modal handlers
  const handleOpenAddModal = () => {
    setEmployeeFormData({
      employeeId: '',
      fullName: '',
      idNumber: '',
      address: '',
      email: '',
      phoneNumber: '',
      gender: '',
      departmentId: '',
      jobTitleId: '',
      hireDate: '',
      generateEmployeeId: true
    });
    setBankAccounts([{ bankName: '', accountNumber: '', currency: '', isPrimary: true }]);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleViewEmployee = async (employeeId) => {
    try {
      setModalLoading(true);
      setShowViewModal(true);
      const response = await axios.get(`${BASE_URL}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSelectedEmployee(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setFormError('Failed to load employee details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditEmployee = async (employeeId) => {
    try {
      setModalLoading(true);
      setShowEditModal(true);
      setFormError(null);

      const response = await axios.get(`${BASE_URL}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const emp = response.data.data;
        setEmployeeFormData({
          id: emp.id,
          employeeId: emp.employee_id || '',
          fullName: emp.full_name || '',
          idNumber: emp.id_number || '',
          address: emp.address || '',
          email: emp.email || '',
          phoneNumber: emp.phone_number || '',
          gender: emp.gender || '',
          departmentId: emp.department_id || '',
          jobTitleId: emp.job_title_id || '',
          hireDate: emp.hire_date ? emp.hire_date.split('T')[0] : '',
          generateEmployeeId: false
        });

        if (emp.bankAccounts && emp.bankAccounts.length > 0) {
          setBankAccounts(emp.bankAccounts.map(acc => ({
            id: acc.id,
            bankName: acc.bank_name || '',
            accountNumber: acc.account_number || '',
            currency: acc.currency || '',
            isPrimary: acc.is_primary || false
          })));
        } else {
          setBankAccounts([{ bankName: '', accountNumber: '', currency: '', isPrimary: true }]);
        }
      }
    } catch (err) {
      console.error('Error fetching employee for edit:', err);
      setFormError('Failed to load employee data');
    } finally {
      setModalLoading(false);
    }
  };

  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBankAccountChange = (index, field, value) => {
    setBankAccounts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'isPrimary' && value) {
        updated.forEach((acc, i) => { i !== index && (acc.isPrimary = false); });
      }
      return updated;
    });
  };

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { bankName: '', accountNumber: '', currency: '', isPrimary: false }]);
  };

  const removeBankAccount = (index) => {
    if (bankAccounts.length > 1) {
      setBankAccounts(prev => {
        const updated = prev.filter((_, i) => i !== index);
        if (prev[index].isPrimary && updated.length > 0) updated[0].isPrimary = true;
        return updated;
      });
    }
  };

  const handleSaveEmployee = async (e) => {
    if (e) e.preventDefault();
    try {
      setModalLoading(true);
      setFormError(null);

      const payload = {
        ...employeeFormData,
        bankAccounts: bankAccounts.filter(acc => acc.bankName.trim() && acc.accountNumber.trim())
      };

      const url = showEditModal ? `${BASE_URL}/employees/${employeeFormData.id}` : `${BASE_URL}/employees`;
      const method = showEditModal ? 'put' : 'post';

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        showToast(showEditModal ? 'Employee updated successfully' : 'Employee added successfully');
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error saving employee:', err);
      setFormError(err.response?.data?.error || 'Failed to save employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedEmployee(null);
    setFormError(null);
  };

  // Toast functions
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        setTimeout(() => { setToast({ message: null, type: 'success', visible: false }); }, 300);
      }, duration);
    }
  };

  const getToastIcon = (type) => {
    const iconProps = { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
    if (type === 'success') return (<svg {...iconProps}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
    if (type === 'error') return (<svg {...iconProps}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>);
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#10b981';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const displayStart = employees.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalRecords);

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
          <h2 className="report-title">Employees</h2>
          <p className="report-subtitle">Manage employee information and records.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenAddModal}
            className="btn-checklist"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Employee
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
                placeholder="Search by name, ID or department..."
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

          {/* Department Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Dept:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Title Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Title:</label>
            <select
              value={selectedJobTitle}
              onChange={(e) => {
                setSelectedJobTitle(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Job Titles</option>
              {jobTitles.map((title) => (
                <option key={title.id} value={title.id}>
                  {title.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Gender:</label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '100px' }}
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
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
        {loading && employees.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading employees...
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
                <th style={{ padding: '6px 10px' }}>EMPLOYEE ID</th>
                <th style={{ padding: '6px 10px' }}>FULL NAME</th>
                <th style={{ padding: '6px 10px' }}>DEPARTMENT</th>
                <th style={{ padding: '6px 10px' }}>JOB TITLE</th>
                <th style={{ padding: '6px 10px' }}>GENDER</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr
                  key={employee.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {employee.employee_id}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {employee.full_name}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faBuilding} className="h-3 w-3 mr-1 text-gray-400" />
                      {employee.department_name || 'Not assigned'}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUserTie} className="h-3 w-3 mr-1 text-gray-400" />
                      {employee.job_title || 'Not assigned'}
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {employee.gender || 'Not specified'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewEmployee(employee.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditEmployee(employee.id)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to match Students.jsx (limit 25) */}
              {Array.from({ length: Math.max(0, limit - employees.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (employees.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalRecords || 0} results.
        </div>
        <div className="table-footer-right">
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          {totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: modalLoading ? '400px' : 'auto' }}
          >
            {modalLoading && !employeeFormData.fullName ? (
              <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '300px' }}>
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3 className="modal-title">{showEditModal ? 'Edit Employee' : 'Add Employee'}</h3>
                  <button className="modal-close-btn" onClick={handleCloseModals}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {formError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSaveEmployee} className="modal-form">
                    {/* Employee Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserTie} style={{ color: '#2563eb' }} />
                        Employee Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Employee ID</label>
                          <input
                            type="text"
                            name="employeeId"
                            className="form-control"
                            placeholder={employeeFormData.generateEmployeeId ? "Will be auto-generated" : "Enter employee ID"}
                            value={employeeFormData.employeeId}
                            onChange={handleFormInputChange}
                            readOnly={employeeFormData.generateEmployeeId}
                            style={{ background: employeeFormData.generateEmployeeId ? '#f3f4f6' : 'white' }}
                          />
                          {!showEditModal && (
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: employeeFormData.generateEmployeeId ? '#eff6ff' : '#f9fafb',
                              border: `1px solid ${employeeFormData.generateEmployeeId ? '#bfdbfe' : '#e5e7eb'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              marginTop: '8px'
                            }}
                            onMouseEnter={(e) => {
                              if (!employeeFormData.generateEmployeeId) {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!employeeFormData.generateEmployeeId) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }
                            }}
                            >
                              <input
                                type="checkbox"
                                id="generateEmployeeId"
                                name="generateEmployeeId"
                                checked={employeeFormData.generateEmployeeId}
                                onChange={handleFormInputChange}
                                style={{
                                  cursor: 'pointer',
                                  width: '16px',
                                  height: '16px',
                                  accentColor: '#2563eb',
                                  margin: 0,
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--text-primary)',
                                  fontWeight: employeeFormData.generateEmployeeId ? 500 : 400
                                }}>
                                  Auto-generate Employee ID
                                </span>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '2px'
                                }}>
                                  {employeeFormData.generateEmployeeId 
                                    ? 'Employee ID will be automatically generated (V + 4 numbers + letter)' 
                                    : 'Manually enter employee ID'}
                                </div>
                              </div>
                            </label>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Full Name <span className="required">*</span></label>
                          <input
                            type="text"
                            name="fullName"
                            className="form-control"
                            placeholder="Enter full name"
                            value={employeeFormData.fullName}
                            onChange={handleFormInputChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">ID Number <span className="required">*</span></label>
                          <input
                            type="text"
                            name="idNumber"
                            className="form-control"
                            placeholder="Enter ID number"
                            value={employeeFormData.idNumber}
                            onChange={handleFormInputChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select
                            name="gender"
                            className="form-control"
                            value={employeeFormData.gender}
                            onChange={handleFormInputChange}
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter email address"
                            value={employeeFormData.email}
                            onChange={handleFormInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            className="form-control"
                            placeholder="Enter phone number"
                            value={employeeFormData.phoneNumber}
                            onChange={handleFormInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Department</label>
                          <select
                            name="departmentId"
                            className="form-control"
                            value={employeeFormData.departmentId}
                            onChange={handleFormInputChange}
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Job Title</label>
                          <select
                            name="jobTitleId"
                            className="form-control"
                            value={employeeFormData.jobTitleId}
                            onChange={handleFormInputChange}
                          >
                            <option value="">Select Job Title</option>
                            {jobTitles.map(title => (
                              <option key={title.id} value={title.id}>{title.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Hire Date</label>
                          <input
                            type="date"
                            name="hireDate"
                            className="form-control"
                            value={employeeFormData.hireDate}
                            onChange={handleFormInputChange}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Address</label>
                          <textarea
                            name="address"
                            className="form-control"
                            placeholder="Enter full address"
                            value={employeeFormData.address || ''}
                            onChange={handleFormInputChange}
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banking Information Section */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faUniversity} style={{ color: '#10b981' }} />
                          Banking Information
                        </h4>
                        <button
                          type="button"
                          onClick={addBankAccount}
                          className="modal-btn"
                          style={{ background: '#6b7280', color: 'white', fontSize: '0.65rem', padding: '4px 8px' }}
                        >
                          <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                          Add Account
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {bankAccounts.map((account, index) => (
                          <div key={index} style={{ padding: '16px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Account {index + 1}</span>
                                {account.isPrimary && (
                                  <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>Primary</span>
                                )}
                              </div>
                              {bankAccounts.length > 1 && (
                                <button type="button" onClick={() => removeBankAccount(index)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">Bank Name</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={account.bankName}
                                  onChange={(e) => handleBankAccountChange(index, 'bankName', e.target.value)}
                                  placeholder="Bank name"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Account No.</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={account.accountNumber}
                                  onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)}
                                  placeholder="Account number"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Currency</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={account.currency}
                                  onChange={(e) => handleBankAccountChange(index, 'currency', e.target.value)}
                                  placeholder="e.g. USD"
                                />
                              </div>
                            </div>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: account.isPrimary ? '#f0fdf4' : '#f9fafb',
                              border: `1px solid ${account.isPrimary ? '#bbf7d0' : '#e5e7eb'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              marginTop: '8px'
                            }}
                            onMouseEnter={(e) => {
                              if (!account.isPrimary) {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!account.isPrimary) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }
                            }}
                            >
                              <input
                                type="checkbox"
                                id={`primary_${index}`}
                                checked={account.isPrimary}
                                onChange={(e) => handleBankAccountChange(index, 'isPrimary', e.target.checked)}
                                style={{
                                  cursor: 'pointer',
                                  width: '16px',
                                  height: '16px',
                                  accentColor: account.isPrimary ? '#10b981' : '#6b7280',
                                  margin: 0,
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--text-primary)',
                                  fontWeight: account.isPrimary ? 500 : 400
                                }}>
                                  {account.isPrimary ? 'Primary Account' : 'Set as Primary Account'}
                                </span>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '2px'
                                }}>
                                  {account.isPrimary 
                                    ? 'This is the primary account for payments' 
                                    : 'Mark this account as the primary payment account'}
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseModals}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm"
                    onClick={handleSaveEmployee}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Saving...' : showEditModal ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: modalLoading ? '400px' : 'auto' }}
          >
            {modalLoading ? (
              <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '300px' }}>
                <div className="loading-spinner"></div>
                <p>Loading employee details...</p>
              </div>
            ) : selectedEmployee ? (
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Employee Profile - {selectedEmployee.full_name}</h3>
                  <button className="modal-close-btn" onClick={handleCloseModals}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Employee Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserTie} style={{ color: '#2563eb' }} />
                        Employee Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Employee ID</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.employee_id}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.full_name}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>ID Number</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.id_number}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Gender</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.gender || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.email || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone Number</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.phone_number || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Department</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.department_name || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Job Title</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.job_title || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Hire Date</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatDate(selectedEmployee.hire_date)}</div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Address</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedEmployee.address || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUniversity} style={{ color: '#10b981' }} />
                        Banking Information
                      </h4>

                      {selectedEmployee.bankAccounts && selectedEmployee.bankAccounts.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                          {selectedEmployee.bankAccounts.map((account, index) => (
                            <div key={index} style={{ padding: '16px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Bank Name</div>
                                  <div style={{ fontSize: '0.8rem' }}>{account.bank_name}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Account Number</div>
                                  <div style={{ fontSize: '0.8rem' }}>{account.account_number}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280' }}>Currency</div>
                                  <div style={{ fontSize: '0.8rem' }}>
                                    {account.currency}
                                    {account.is_primary && (
                                      <span style={{ marginLeft: '8px', fontSize: '0.6rem', padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>Primary</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>No banking information available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseModals}>
                    Close
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm"
                    onClick={() => {
                      handleCloseModals();
                      handleEditEmployee(selectedEmployee.id);
                    }}
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Employee</h3>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body text-center" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: '3rem', color: '#ef4444' }} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Are you sure you want to delete <strong>{selectedEmployee.full_name}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                This action will deactivate the employee record.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-btn modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="modal-btn modal-btn-confirm"
                style={{ background: '#ef4444' }}
              >
                {loading ? 'Deleting...' : 'Delete'}
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

export default Employees;
