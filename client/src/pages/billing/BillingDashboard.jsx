import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const BillingDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentsWithPayments, setStudentsWithPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(25);

  // Live search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudentsWithPayments();
  }, [currentPage, activeSearchTerm, genderFilter, classFilter]);

  const fetchStudentsWithPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all students
      const studentsResponse = await axios.get(`${BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          limit: 10000 // Get all to filter
        }
      });

      let allStudents = [];
      if (studentsResponse.data.success) {
        allStudents = studentsResponse.data.data || [];
      }

      // Get unique student registration numbers from fee payments
      const studentsWithPaymentsSet = new Set();

      // Fetch boarding payments to get students who paid
      try {
        const boardingPaymentsResponse = await axios.get(`${BASE_URL}/boarding/payments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: 1,
            limit: 10000
          }
        });

        if (boardingPaymentsResponse.data.success) {
          const boardingPayments = boardingPaymentsResponse.data.data || [];
          boardingPayments.forEach(payment => {
            if (payment.student_reg_number) {
              studentsWithPaymentsSet.add(payment.student_reg_number);
            }
          });
        }
      } catch (err) {
        console.error('Error fetching boarding payments:', err);
      }

      // Filter students to only those who have made payments
      let studentsWithPaymentsList = allStudents.filter(student => 
        studentsWithPaymentsSet.has(student.RegNumber)
      );

      // Apply filters
      let filteredStudents = studentsWithPaymentsList;

      // Apply search filter
      if (activeSearchTerm) {
        const searchLower = activeSearchTerm.toLowerCase();
        filteredStudents = filteredStudents.filter(student => {
          const name = (student.Name || '').toLowerCase();
          const surname = (student.Surname || '').toLowerCase();
          const regNumber = (student.RegNumber || '').toLowerCase();
          return name.includes(searchLower) || surname.includes(searchLower) || regNumber.includes(searchLower);
        });
      }

      // Apply gender filter
      if (genderFilter) {
        filteredStudents = filteredStudents.filter(student => student.Gender === genderFilter);
      }

      // Apply class filter
      if (classFilter) {
        filteredStudents = filteredStudents.filter(student => student.Class === classFilter);
      }

      // Get total count before pagination
      const totalCount = filteredStudents.length;

      // Apply pagination
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

      // Calculate total pages
      const totalPagesCount = Math.ceil(totalCount / limit);

      setStudentsWithPayments(paginatedStudents);
      setTotalPages(totalPagesCount);
      setTotalStudents(totalCount);
    } catch (err) {
      console.error('Error fetching students with payments:', err);
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

  const handleGenderFilterChange = (e) => {
    const selectedGender = e.target.value;
    setGenderFilter(selectedGender);
    setCurrentPage(1);
  };

  const handleClearGenderFilter = () => {
    setGenderFilter('');
    setCurrentPage(1);
  };

  const handleClassFilterChange = (e) => {
    const selectedClass = e.target.value;
    setClassFilter(selectedClass);
    setCurrentPage(1);
  };

  const handleClearClassFilter = () => {
    setClassFilter('');
    setCurrentPage(1);
  };

  // Calculate display ranges for pagination
  const displayStart = studentsWithPayments.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalStudents);
  const hasData = studentsWithPayments.length > 0;

  if (loading && studentsWithPayments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students with payments...</div>
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
          <h2 className="report-title">Billing Dashboard</h2>
          <p className="report-subtitle">View students who have made fee payments.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Classes</option>
              {/* Classes will be populated dynamically if needed */}
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
        {loading && studentsWithPayments.length === 0 ? (
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
                <th style={{ padding: '6px 10px' }}>CLASS</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {studentsWithPayments.map((student, index) => (
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
                    {student.Class || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {student.Active || 'Unknown'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          // Navigate to student financial record or view
                          window.location.href = `/dashboard/students/statement?regNumber=${student.RegNumber}`;
                        }}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Financial Record"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - studentsWithPayments.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (studentsWithPayments.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
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
    </div>
  );
};

export default BillingDashboard;

