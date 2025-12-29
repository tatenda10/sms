import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEye, 
  faEdit, 
  faTrash,
  faUserGraduate,
  faPhone,
  faMapMarkerAlt,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';


const Students = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(25);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingRegNumber, setGeneratingRegNumber] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    regNumber: '',
    name: '',
    surname: '',
    dateOfBirth: '',
    nationalIDNumber: '',
    address: '',
    gender: '',
    active: 'Yes',
    guardianName: '',
    guardianSurname: '',
    guardianNationalIDNumber: '',
    guardianPhoneNumber: '',
    relationshipToStudent: ''
  });
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });
  
  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    regNumber: '',
    name: '',
    surname: '',
    dateOfBirth: '',
    nationalIDNumber: '',
    address: '',
    gender: '',
    active: 'Yes',
    guardianName: '',
    guardianSurname: '',
    guardianNationalIDNumber: '',
    guardianPhoneNumber: '',
    relationshipToStudent: ''
  });
  const [editFormError, setEditFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, activeSearchTerm, genderFilter, classFilter]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setClasses(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let filteredData = [];
      
      // If class filter is selected, fetch students from that class
      if (classFilter && classFilter !== '') {
        console.log('📚 Fetching students for class:', classFilter);
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classFilter}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        filteredData = response.data.data || [];
        
        // Apply search filter if active
        if (activeSearchTerm && activeSearchTerm.trim() !== '') {
          const searchLower = activeSearchTerm.trim().toLowerCase();
          filteredData = filteredData.filter(student => 
            (student.Name && student.Name.toLowerCase().includes(searchLower)) ||
            (student.Surname && student.Surname.toLowerCase().includes(searchLower)) ||
            (student.RegNumber && student.RegNumber.toLowerCase().includes(searchLower))
          );
        }
        
        // Apply gender filter if selected
        if (genderFilter && genderFilter !== '') {
          filteredData = filteredData.filter(student => student.Gender === genderFilter);
        }
        
        setStudents(filteredData);
        setTotalPages(1);
        setTotalStudents(filteredData.length);
      } else {
      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode - no pagination
        const response = await axios.get(`${BASE_URL}/students/search`, {
          params: { query: activeSearchTerm.trim() },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

          filteredData = response.data.data || [];
          
          // Apply gender filter if selected
          if (genderFilter && genderFilter !== '') {
            filteredData = filteredData.filter(student => student.Gender === genderFilter);
          }
          
          console.log('🔍 Search results:', filteredData);
          setStudents(filteredData);
        setTotalPages(1); // Search results are not paginated
          setTotalStudents(filteredData.length);
      } else {
        console.log('📄 Fetching page:', currentPage);
        // Normal pagination mode
        const response = await axios.get(`${BASE_URL}/students`, {
          params: {
            page: currentPage,
            limit: limit
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

          filteredData = response.data.data || [];
          
          // Apply gender filter if selected
          if (genderFilter && genderFilter !== '') {
            filteredData = filteredData.filter(student => student.Gender === genderFilter);
          }

        const data = response.data;
        console.log('📊 Pagination data:', data.pagination);
        console.log('📊 Raw response:', data);
        const totalPages = data.pagination?.totalPages || 1;
          const totalStudents = genderFilter ? filteredData.length : (data.pagination?.totalStudents || 0);
        console.log('📊 Setting totalPages:', totalPages, 'totalStudents:', totalStudents);
          setStudents(filteredData);
        setTotalPages(totalPages);
        setTotalStudents(totalStudents);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      if (err.response) {
        // Server responded with error status
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Something else happened
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
    // fetchStudents will be called via useEffect
  };

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (e) => {
    const selectedGender = e.target.value;
    setGenderFilter(selectedGender);
    setCurrentPage(1);
    // fetchStudents will be called via useEffect
  };

  const handleClearGenderFilter = () => {
    setGenderFilter('');
    setCurrentPage(1);
  };

  const handleClassFilterChange = (e) => {
    const selectedClass = e.target.value;
    setClassFilter(selectedClass);
    setCurrentPage(1);
    // fetchStudents will be called via useEffect
  };

  const handleClearClassFilter = () => {
    setClassFilter('');
    setCurrentPage(1);
  };

  // Edit modal functions
  const handleEditStudent = async (regNumber) => {
    setShowEditModal(true);
    setEditModalLoading(true);
    setEditFormError(null);
    setEditFormData({
      regNumber: '',
      name: '',
      surname: '',
      dateOfBirth: '',
      nationalIDNumber: '',
      address: '',
      gender: '',
      active: 'Yes',
      guardianName: '',
      guardianSurname: '',
      guardianNationalIDNumber: '',
      guardianPhoneNumber: '',
      relationshipToStudent: ''
    });

    try {
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const studentData = response.data.data;
      const guardian = studentData.guardians?.[0];
      
      setEditFormData({
        regNumber: studentData.RegNumber || '',
        name: studentData.Name || '',
        surname: studentData.Surname || '',
        dateOfBirth: studentData.DateOfBirth ? studentData.DateOfBirth.split('T')[0] : '',
        nationalIDNumber: studentData.NationalIDNumber || '',
        address: studentData.Address || '',
        gender: studentData.Gender || '',
        active: studentData.Active === 'Active' ? 'Yes' : studentData.Active === 'Inactive' ? 'No' : (studentData.Active || 'Yes'),
        guardianName: guardian?.Name || '',
        guardianSurname: guardian?.Surname || '',
        guardianNationalIDNumber: guardian?.NationalIDNumber || '',
        guardianPhoneNumber: guardian?.PhoneNumber || '',
        relationshipToStudent: guardian?.RelationshipToStudent || ''
      });
    } catch (err) {
      console.error('Error fetching student for edit:', err);
      showToast('Failed to load student details for editing', 'error');
      setShowEditModal(false);
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({
      regNumber: '',
      name: '',
      surname: '',
      dateOfBirth: '',
      nationalIDNumber: '',
      address: '',
      gender: '',
      active: 'Yes',
      guardianName: '',
      guardianSurname: '',
      guardianNationalIDNumber: '',
      guardianPhoneNumber: '',
      relationshipToStudent: ''
    });
    setEditFormError(null);
    setIsSaving(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditFormError(null);

    try {
      await axios.put(`${BASE_URL}/students/${editFormData.regNumber}`, editFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchStudents();
      handleCloseEditModal();
      showToast(`Student ${editFormData.name} ${editFormData.surname} has been successfully updated!`, 'success');
    } catch (err) {
      console.error('Error updating student:', err);
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
      editFormData.regNumber &&
      editFormData.name &&
      editFormData.surname &&
      editFormData.dateOfBirth &&
      editFormData.gender &&
      editFormData.guardianName &&
      editFormData.guardianSurname &&
      editFormData.guardianPhoneNumber
    );
  };

  // Delete modal functions
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/students/${studentToDelete.RegNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchStudents();
      handleCloseDeleteModal();
      showToast(`Student ${studentToDelete.Name} ${studentToDelete.Surname} has been successfully deleted!`, 'success');
    } catch (err) {
      console.error('Error deleting student:', err);
      let errorMessage = 'Failed to delete student';
      
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
      regNumber: '',
      name: '',
      surname: '',
      dateOfBirth: '',
      nationalIDNumber: '',
      address: '',
      gender: '',
      active: 'Yes',
      guardianName: '',
      guardianSurname: '',
      guardianNationalIDNumber: '',
      guardianPhoneNumber: '',
      relationshipToStudent: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateRegNumber = () => {
    const digits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    return `R${digits}${letter}`;
  };

  const checkRegNumberExists = async (regNumber) => {
    try {
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.status === 200;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return false;
      }
      throw err;
    }
  };

  const handleGenerateRegNumber = async () => {
    setGeneratingRegNumber(true);
    setFormError(null);
    
    try {
      let regNumber;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        regNumber = generateRegNumber();
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique registration number. Please try again.');
        }
      } while (await checkRegNumberExists(regNumber));
      
      setFormData(prev => ({ ...prev, regNumber }));
    } catch (err) {
      setFormError(`Error generating registration number: ${err.message}`);
    } finally {
      setGeneratingRegNumber(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const response = await axios.post(`${BASE_URL}/students`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh the list
      await fetchStudents();
      handleCloseModal();
      
      // Show success toast
      const studentName = `${formData.name} ${formData.surname}`;
      showToast(`Student ${studentName} has been successfully added!`, 'success');
    } catch (err) {
      console.error('Error adding student:', err);
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

  // Toast functions
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        // Clear message after animation
        setTimeout(() => {
          setToast({ message: null, type: 'success', visible: false });
        }, 300);
      }, duration);
    }
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
    setTimeout(() => {
      setToast({ message: null, type: 'success', visible: false });
    }, 300);
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
      formData.regNumber &&
      formData.name &&
      formData.surname &&
      formData.dateOfBirth &&
      formData.gender &&
      formData.guardianName &&
      formData.guardianSurname &&
      formData.guardianPhoneNumber
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // View modal functions
  const handleViewStudent = async (regNumber) => {
    setShowViewModal(true);
    setViewModalLoading(true);
    setSelectedStudent(null);

    try {
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSelectedStudent(response.data.data);
    } catch (err) {
      console.error('Error fetching student:', err);
      showToast('Failed to load student details', 'error');
      setShowViewModal(false);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedStudent(null);
    setViewModalLoading(false);
  };

  // Calculate display ranges for pagination
  const displayStart = students.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalStudents);
  const hasData = students.length > 0;

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
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
          <h2 className="report-title">Students</h2>
          <p className="report-subtitle">Manage student registrations and information.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Student
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
                placeholder="Search by name, surname, or registration number..."
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
          
          {/* Gender Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Gender:</label>
            <select
              value={genderFilter}
              onChange={handleGenderFilterChange}
              className="filter-input"
              style={{ minWidth: '120px', width: '120px' }}
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {genderFilter && (
          <button
                onClick={handleClearGenderFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear gender filter"
              >
                ×
          </button>
            )}
          </div>
          
          {/* Class Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Class:</label>
            <select
              value={classFilter}
              onChange={handleClassFilterChange}
              className="filter-input"
              style={{ minWidth: '180px', width: '180px' }}
              disabled={loadingClasses}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.stream_name} - {cls.name}
                </option>
              ))}
            </select>
            {classFilter && (
            <button 
                onClick={handleClearClassFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear class filter"
              >
                ×
            </button>
        )}
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
        {loading && students.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading students...
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
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px' }}>NAME</th>
                <th style={{ padding: '6px 10px' }}>SURNAME</th>
                <th style={{ padding: '6px 10px' }}>GENDER</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                  </tr>
                </thead>
            <tbody>
              {students.map((student, index) => (
                <tr 
                  key={student.RegNumber} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                          {student.RegNumber}
                      </td>
                  <td style={{ padding: '4px 10px' }}>
                          {student.Name}
                      </td>
                  <td style={{ padding: '4px 10px' }}>
                          {student.Surname}
                      </td>
                  <td style={{ padding: '4px 10px' }}>
                          {student.Gender || 'N/A'}
                      </td>
                  <td style={{ padding: '4px 10px' }}>
                          {student.Active || 'Unknown'}
                      </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewStudent(student.RegNumber)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student.RegNumber)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                          <button
                        onClick={() => handleDeleteClick(student)}
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
              {Array.from({ length: Math.max(0, 25 - students.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (students.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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
          Showing {displayStart} to {displayEnd} of {totalStudents || 0} results.
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: isLoading ? '400px' : 'auto' }}
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
                  <p>Loading...</p>
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
                  <h3 className="modal-title">Add Student</h3>
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
                    {/* Student Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                        Student Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Registration Number <span className="required">*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              name="regNumber"
                              className="form-control"
                              placeholder="Enter or generate"
                              value={formData.regNumber}
                              onChange={handleInputChange}
                              required
                            />
                  <button
                              type="button"
                              onClick={handleGenerateRegNumber}
                              disabled={generatingRegNumber}
                              className="modal-btn"
                              style={{ 
                                background: '#6b7280', 
                                color: 'white', 
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                fontSize: '0.7rem'
                              }}
                            >
                              {generatingRegNumber ? 'Generating...' : 'Generate'}
                  </button>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            First Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter first name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Surname <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="surname"
                            className="form-control"
                            placeholder="Enter surname"
                            value={formData.surname}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Date of Birth <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            className="form-control"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">National ID Number</label>
                          <input
                            type="text"
                            name="nationalIDNumber"
                            className="form-control"
                            placeholder="Enter national ID"
                            value={formData.nationalIDNumber}
                            onChange={handleInputChange}
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
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Address</label>
                          <input
                            type="text"
                            name="address"
                            className="form-control"
                            placeholder="Enter full address"
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information Section */}
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                        Guardian Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Guardian First Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="guardianName"
                            className="form-control"
                            placeholder="Enter guardian first name"
                            value={formData.guardianName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Guardian Surname <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="guardianSurname"
                            className="form-control"
                            placeholder="Enter guardian surname"
                            value={formData.guardianSurname}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Guardian National ID</label>
                          <input
                            type="text"
                            name="guardianNationalIDNumber"
                            className="form-control"
                            placeholder="Enter guardian national ID"
                            value={formData.guardianNationalIDNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Relationship to Student</label>
                          <input
                            type="text"
                            name="relationshipToStudent"
                            className="form-control"
                            placeholder="e.g., Father, Mother, Uncle"
                            value={formData.relationshipToStudent}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">
                            Guardian Phone Number <span className="required">*</span>
                          </label>
                          <input
                            type="tel"
                            name="guardianPhoneNumber"
                            className="form-control"
                            placeholder="Enter phone number"
                            value={formData.guardianPhoneNumber}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
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
                    {isLoading ? 'Saving...' : 'Save Student'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: viewModalLoading ? '400px' : 'auto' }}
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
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading student details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : selectedStudent ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Student Profile - {selectedStudent.Name} {selectedStudent.Surname}
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
                    {/* Student Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                        Student Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Registration Number
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.RegNumber || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            First Name
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.Name || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Surname
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.Surname || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Date of Birth
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {formatDate(selectedStudent.DateOfBirth) || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            National ID Number
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.NationalIDNumber || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Gender
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.Gender || 'N/A'}
                          </div>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Address
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedStudent.Address || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Status
                          </div>
                          <div style={{ fontSize: '0.85rem', color: selectedStudent.Active === 'Yes' ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                            {selectedStudent.Active || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information Section */}
                    {selectedStudent.guardians && selectedStudent.guardians.length > 0 && (
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                          Guardian Information
                        </h4>
                        
                        {selectedStudent.guardians.map((guardian, index) => (
                          <div key={index} style={{ marginBottom: index < selectedStudent.guardians.length - 1 ? '20px' : '0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  Guardian First Name
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                  {guardian.Name || 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  Guardian Surname
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                  {guardian.Surname || 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  National ID Number
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                  {guardian.NationalIDNumber || 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  Phone Number
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                  {guardian.PhoneNumber || 'N/A'}
                                </div>
                              </div>
                              
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  Relationship to Student
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                  {guardian.RelationshipToStudent || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: editModalLoading ? '400px' : 'auto' }}
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
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading student details...</p>
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
                  <h3 className="modal-title">Edit Student</h3>
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
                  
                  <form onSubmit={handleUpdateStudent} className="modal-form">
                    {/* Student Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                        Student Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Registration Number <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="regNumber"
                            className="form-control"
                            placeholder="Enter registration number"
                            value={editFormData.regNumber}
                            onChange={handleEditInputChange}
                            required
                            readOnly
                            style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            First Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter first name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Surname <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="surname"
                            className="form-control"
                            placeholder="Enter surname"
                            value={editFormData.surname}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Date of Birth <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            className="form-control"
                            value={editFormData.dateOfBirth}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">National ID Number</label>
                          <input
                            type="text"
                            name="nationalIDNumber"
                            className="form-control"
                            placeholder="Enter national ID"
                            value={editFormData.nationalIDNumber}
                            onChange={handleEditInputChange}
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
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Address</label>
                          <input
                            type="text"
                            name="address"
                            className="form-control"
                            placeholder="Enter full address"
                            value={editFormData.address}
                            onChange={handleEditInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information Section */}
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                        Guardian Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Guardian First Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="guardianName"
                            className="form-control"
                            placeholder="Enter guardian first name"
                            value={editFormData.guardianName}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Guardian Surname <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="guardianSurname"
                            className="form-control"
                            placeholder="Enter guardian surname"
                            value={editFormData.guardianSurname}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Guardian National ID</label>
                          <input
                            type="text"
                            name="guardianNationalIDNumber"
                            className="form-control"
                            placeholder="Enter guardian national ID"
                            value={editFormData.guardianNationalIDNumber}
                            onChange={handleEditInputChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Relationship to Student</label>
                          <input
                            type="text"
                            name="relationshipToStudent"
                            className="form-control"
                            placeholder="e.g., Father, Mother, Uncle"
                            value={editFormData.relationshipToStudent}
                            onChange={handleEditInputChange}
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">
                            Guardian Phone Number <span className="required">*</span>
                          </label>
                          <input
                            type="tel"
                            name="guardianPhoneNumber"
                            className="form-control"
                            placeholder="Enter phone number"
                            value={editFormData.guardianPhoneNumber}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleUpdateStudent}
                    disabled={!isEditFormValid() || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Update Student'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
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
                    Are you sure you want to delete this student?
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
                  Student Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Name:</strong> {studentToDelete.Name} {studentToDelete.Surname}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Registration Number:</strong> {studentToDelete.RegNumber}
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
                {isDeleting ? 'Deleting...' : 'Delete Student'}
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

export default Students;
