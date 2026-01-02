import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEye,
  faFileAlt,
  faCalendarAlt,
  faBookOpen,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../contexts/Api';

const TestMarks = () => {
  const { student, token } = useStudentAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Main state
  const [selectedClass, setSelectedClass] = useState('');
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]); // Store all tests for pagination
  const [testMarks, setTestMarks] = useState([]);
  const [subjectClasses, setSubjectClasses] = useState([]);
  
  // Modal states
  const [showViewMarksModal, setShowViewMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    academic_year: new Date().getFullYear().toString(),
    term: '1',
    test_type: ''
  });
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    if (student?.RegNumber) {
      fetchSubjectClasses();
    }
  }, [student?.RegNumber]);

  useEffect(() => {
    if (selectedClass) {
      fetchTests();
    }
  }, [selectedClass, filters]);

  // Pagination logic - slice tests based on current page
  useEffect(() => {
    // Filter tests based on search term
    const filteredTests = allTests.filter(test => {
      const matchesSearch = !searchTerm || 
        test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.test_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    if (filteredTests.length > 0) {
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTests = filteredTests.slice(startIndex, endIndex);
      setTests(paginatedTests);
    } else {
      setTests([]);
    }
  }, [currentPage, allTests, limit, searchTerm]);

  const fetchSubjectClasses = async () => {
    try {
      console.log('📚 Fetching subject classes for student:', student?.RegNumber);
      const response = await fetch(`${BASE_URL}/student-enrollments/subject-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subject classes data:', data);
        setSubjectClasses(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Subject classes response error:', errorText);
        setError('Failed to fetch subject classes');
      }
    } catch (error) {
      console.error('❌ Error fetching subject classes:', error);
      setError('Failed to fetch subject classes');
    }
  };

  const fetchTests = async () => {
    if (!selectedClass) return;

    setIsLoading(true);
    setError('');
    
    try {
      let url = `${BASE_URL}/student-enrollments/subject-classes/${selectedClass}/tests`;
      const params = new URLSearchParams();
      
      if (filters.academic_year) params.append('academic_year', filters.academic_year);
      if (filters.term) params.append('term', filters.term);
      if (filters.test_type) params.append('test_type', filters.test_type);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔍 Fetching tests for class:', selectedClass);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Tests data:', data);
        console.log('📊 Tests count:', data.data?.length || 0);
        setAllTests(data.data || []);
        setCurrentPage(1); // Reset to first page on new fetch
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching tests:', errorData);
        setError(errorData.message || 'Failed to fetch tests');
        setAllTests([]);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to fetch tests');
      setAllTests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestMarks = async (testId) => {
    try {
      const response = await fetch(`${BASE_URL}/student-enrollments/tests/${testId}/marks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Test marks data:', data);
        console.log('📊 Test marks count:', data.data?.marks?.length || 0);
        setTestMarks(data.data?.marks || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching test marks:', errorData);
        setError(errorData.message || 'Failed to fetch test marks');
      }
    } catch (error) {
      console.error('Error fetching test marks:', error);
      setError('Failed to fetch test marks');
    }
  };

  const handleViewMarks = async (test) => {
    setSelectedTest(test);
    setShowViewMarksModal(true);
    await fetchTestMarks(test.id);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter tests based on search term for calculation
  const filteredTests = allTests.filter(test => {
    const matchesSearch = !searchTerm || 
      test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.test_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calculate pagination values
  const totalTests = filteredTests.length;
  const totalPages = Math.ceil(totalTests / limit);
  const displayStart = totalTests > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalTests);

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
          <h2 className="report-title">Test Marks</h2>
          <p className="report-subtitle">View your test scores and performance</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Subject Class Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Subject Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '250px', width: '250px' }}
            >
              <option value="">Select a Subject Class</option>
              {subjectClasses.map(cls => (
                <option key={cls.subject_class_id} value={cls.subject_class_id}>
                  {cls.subject_name} - {cls.gradelevel_class_name || cls.stream_name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          {selectedClass && (
            <>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>Academic Year:</label>
                <select
                  name="academic_year"
                  value={filters.academic_year}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ minWidth: '140px', width: '140px' }}
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              {/* Term Filter */}
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>Term:</label>
                <select
                  name="term"
                  value={filters.term}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ minWidth: '140px', width: '140px' }}
                >
                  <option value="">All Terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>

              {/* Test Type Filter */}
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>Test Type:</label>
                <select
                  name="test_type"
                  value={filters.test_type}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ minWidth: '140px', width: '140px' }}
                >
                  <option value="">All Types</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                  <option value="project">Project</option>
                </select>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="filter-group">
                <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tests..."
                    className="filter-input search-input"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
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
            </>
          )}
        </div>
      </div>

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
        {isLoading && !selectedClass ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading tests...
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
                <th style={{ padding: '6px 10px' }}>TEST DETAILS</th>
                <th style={{ padding: '6px 10px' }}>DATE & YEAR</th>
                <th style={{ padding: '6px 10px' }}>YOUR MARKS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px 10px', textAlign: 'center', color: '#64748b' }}>
                    Loading tests...
                  </td>
                </tr>
              ) : selectedClass && tests.length === 0 && !error ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px 10px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: '2rem', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No Tests Found</div>
                      <div style={{ fontSize: '0.75rem' }}>
                        No tests have been created for this subject class yet.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : selectedClass && tests.length > 0 ? (
                <>
                  {tests.map((test, index) => {
                    const globalIndex = (currentPage - 1) * limit + index;
                    return (
                      <tr 
                        key={test.id} 
                        style={{ 
                          height: '32px', 
                          backgroundColor: globalIndex % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                        }}
                      >
                        <td style={{ padding: '4px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '0.875rem', color: 'var(--sidebar-bg)' }} />
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{test.test_name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  background: test.test_type === 'quiz' ? '#dbeafe' : 
                                            test.test_type === 'assignment' ? '#d1fae5' :
                                            test.test_type === 'test' ? '#fef3c7' :
                                            test.test_type === 'exam' ? '#fee2e2' :
                                            '#e9d5ff',
                                  color: test.test_type === 'quiz' ? '#1e40af' : 
                                        test.test_type === 'assignment' ? '#065f46' :
                                        test.test_type === 'test' ? '#92400e' :
                                        test.test_type === 'exam' ? '#991b1b' :
                                        '#6b21a8'
                                }}>
                                  {test.test_type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          <div style={{ fontSize: '0.75rem' }}>{new Date(test.test_date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{test.academic_year} - Term {test.term}</div>
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          {test.has_marks ? (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{test.marks_obtained} / {test.total_marks}</div>
                              {test.comments && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{test.comments}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not marked yet</span>
                          )}
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          {test.has_marks && (
                            <button
                              onClick={() => handleViewMarks(test)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#2563eb',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.color = '#1d4ed8';
                                e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = '#2563eb';
                                e.target.style.background = 'transparent';
                              }}
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faEye} style={{ fontSize: '0.875rem' }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty placeholder rows to always show 25 rows per page */}
                  {Array.from({ length: Math.max(0, limit - tests.length) }).map((_, index) => {
                    const globalIndex = (currentPage - 1) * limit + tests.length + index;
                    return (
                      <tr 
                        key={`empty-${index}`}
                        style={{ 
                          height: '32px', 
                          backgroundColor: globalIndex % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                        }}
                      >
                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                      </tr>
                    );
                  })}
                </>
              ) : (
                // Display 25 empty rows by default
                Array.from({ length: 25 }).map((_, index) => (
                  <tr 
                    key={`empty-${index}`}
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}></td>
                    <td style={{ padding: '4px 10px' }}></td>
                    <td style={{ padding: '4px 10px' }}></td>
                    <td style={{ padding: '4px 10px' }}></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          {selectedClass && totalTests > 0 ? (
            `Showing ${displayStart} to ${displayEnd} of ${totalTests} results.`
          ) : (
            `Showing 0 to 0 of 0 results.`
          )}
        </div>
        <div className="table-footer-right">
          {selectedClass && totalPages > 1 && (
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
          {selectedClass && totalPages <= 1 && totalTests > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* View Marks Modal */}
      {showViewMarksModal && selectedTest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '56rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Test Details: {selectedTest.test_name}
              </h3>
              <button
                onClick={() => setShowViewMarksModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Test Information */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    TEST TYPE
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedTest.test_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DATE
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{new Date(selectedTest.test_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    ACADEMIC YEAR
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedTest.academic_year} - Term {selectedTest.term}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    TOTAL MARKS
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedTest.total_marks}</div>
                </div>
              </div>
              {selectedTest.description && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DESCRIPTION
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedTest.description}</div>
                </div>
              )}
            </div>

            {/* Your Marks */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Your Performance</h4>
              {selectedTest.has_marks ? (
                <div style={{ padding: '16px', background: '#d1fae5', border: '1px solid #86efac', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#065f46' }}>
                        {selectedTest.marks_obtained} / {selectedTest.total_marks}
                      </div>
                    </div>
                  </div>
                  {selectedTest.comments && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#047857', marginBottom: '4px' }}>Teacher Comments:</div>
                      <div style={{ fontSize: '0.75rem', color: '#065f46' }}>{selectedTest.comments}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Your marks for this test have not been entered yet.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestMarks;
