import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faPlus, 
  faArrowLeft, 
  faTrophy, 
  faMedal, 
  faAward,
  faSearch,
  faUserGraduate,
  faSchool
} from '@fortawesome/free-solid-svg-icons';

const ViewResults = () => {
  const { token } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(25);
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  useEffect(() => {
    if (classId) {
      fetchClassInfo();
      fetchStudents();
    }
  }, [classId, currentPage, activeSearchTerm]);

  const fetchClassInfo = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassInfo(res.data.data);
    } catch (err) {
      console.error('Error fetching class info:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch students in the class
      const studentsRes = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let allStudents = studentsRes.data.data || [];
      
      // Try to get positions for current term/year
      const currentYear = new Date().getFullYear();
      const currentTerm = '1';
      
      try {
        const positionsRes = await axios.get(`${BASE_URL}/results/results/class-positions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            gradelevel_class_id: classId,
            term: currentTerm,
            academic_year: currentYear
          }
        });
        
        const positions = positionsRes.data.data || [];
        
        // Merge student data with position data
        allStudents = allStudents.map(student => {
          const positionData = positions.find(p => p.RegNumber === student.RegNumber);
          return {
            ...student,
            position: positionData?.position || null,
            total_marks: positionData?.total_mark || null,
            average: positionData?.average || null,
            grade: positionData?.grade || null
          };
        });
      } catch (positionErr) {
        console.log('No position data available');
      }
      
      // Apply search filter
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        const searchLower = activeSearchTerm.trim().toLowerCase();
        allStudents = allStudents.filter(student =>
          (student.Name && student.Name.toLowerCase().includes(searchLower)) ||
          (student.Surname && student.Surname.toLowerCase().includes(searchLower)) ||
          (student.RegNumber && student.RegNumber.toLowerCase().includes(searchLower))
        );
      }
      
      // Client-side pagination
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStudents = allStudents.slice(startIndex, endIndex);
      const totalPages = Math.ceil(allStudents.length / limit);
      
      setStudents(paginatedStudents);
      setTotalPages(totalPages);
      setTotalStudents(allStudents.length);
    } catch (err) {
      console.error('Error fetching students:', err);
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

  const handleViewStudent = async (student) => {
    setShowStudentModal(true);
    setStudentModalLoading(true);
    setSelectedStudent(student);
    setStudentResults([]);

    try {
      const res = await axios.get(`${BASE_URL}/results/results/student/${student.RegNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { gradelevel_class_id: classId }
      });
      setStudentResults(res.data.data || []);
    } catch (err) {
      console.error('Error fetching student results:', err);
      showToast('Failed to fetch student results', 'error');
    } finally {
      setStudentModalLoading(false);
    }
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentResults([]);
    setStudentModalLoading(false);
  };

  const handleAddResult = () => {
    navigate(`/dashboard/results/entry/${classId}`);
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <FontAwesomeIcon icon={faTrophy} style={{ color: '#f59e0b', fontSize: '0.875rem' }} />;
    if (position === 2) return <FontAwesomeIcon icon={faMedal} style={{ color: '#6b7280', fontSize: '0.875rem' }} />;
    if (position === 3) return <FontAwesomeIcon icon={faAward} style={{ color: '#f97316', fontSize: '0.875rem' }} />;
    return null;
  };

  const getPositionBadgeStyle = (position) => {
    if (position === 1) return { background: '#fef3c7', color: '#92400e' };
    if (position === 2) return { background: '#f3f4f6', color: '#374151' };
    if (position === 3) return { background: '#fed7aa', color: '#9a3412' };
    return { background: '#dbeafe', color: '#1e40af' };
  };

  // Toast functions
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        setTimeout(() => {
          setToast({ message: null, type: 'success', visible: false });
        }, 300);
      }, duration);
    }
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
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#10b981';
    }
  };

  // Calculate display ranges for pagination
  const displayStart = students.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalStudents);

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
          <h2 className="report-title">Class Results</h2>
          <p className="report-subtitle">
            {classInfo ? `${classInfo.name} - ${classInfo.stream_name || 'N/A'}` : 'View and manage student results'}
          </p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard/results')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.7rem' }} />
            Back
          </button>
          <button
            onClick={handleAddResult}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Result
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
                 <th style={{ padding: '6px 10px' }}>POSITION</th>
                 <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                 <th style={{ padding: '6px 10px' }}>REGISTRATION NUMBER</th>
                 <th style={{ padding: '6px 10px' }}>ACTIONS</th>
               </tr>
            </thead>
            <tbody>
               {students.map((student, index) => {
                 const position = student.position;
                 const badgeStyle = position ? getPositionBadgeStyle(position) : { background: '#f3f4f6', color: '#6b7280' };
                 
                 return (
                   <tr 
                     key={student.RegNumber} 
                     style={{ 
                       height: '32px', 
                       backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                     }}
                   >
                     <td style={{ padding: '4px 10px' }}>
                       {position ? (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           {getPositionIcon(position)}
                           <span style={{
                             padding: '2px 8px',
                             borderRadius: '12px',
                             fontSize: '0.7rem',
                             fontWeight: 500,
                             ...badgeStyle
                           }}>
                             {position}
                           </span>
                         </div>
                       ) : (
                         <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>N/A</span>
                       )}
                     </td>
                     <td style={{ padding: '4px 10px' }}>
                       {student.Surname} {student.Name}
                     </td>
                     <td style={{ padding: '4px 10px' }}>
                       {student.RegNumber}
                     </td>
                     <td style={{ padding: '4px 10px' }}>
                       <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <button
                           onClick={() => handleViewStudent(student)}
                           style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                           title="View Results"
                         >
                           <FontAwesomeIcon icon={faEye} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 );
               })}
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

      {/* Student Results Modal */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={handleCloseStudentModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: studentModalLoading ? '400px' : 'auto', maxHeight: '90vh' }}
          >
            {studentModalLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading student results...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    {selectedStudent.Surname} {selectedStudent.Name} - Results
                  </h3>
                  <button className="modal-close-btn" onClick={handleCloseStudentModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                        Student Information
                      </h4>
                      
                      <div style={{ 
                        padding: '12px', 
                        background: '#f9fafb', 
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Registration Number:</span>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>{selectedStudent.RegNumber}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Class:</span>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>{classInfo?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {studentResults.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>No results found for this student</p>
                      </div>
                    ) : (
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faSchool} style={{ color: '#2563eb' }} />
                          Subject Results
                        </h4>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '6px 10px' }}>SUBJECT</th>
                                <th style={{ padding: '6px 10px' }}>COURSEWORK</th>
                                <th style={{ padding: '6px 10px' }}>PAPER MARKS</th>
                                <th style={{ padding: '6px 10px' }}>TOTAL</th>
                                <th style={{ padding: '6px 10px' }}>GRADE</th>
                                <th style={{ padding: '6px 10px' }}>POINTS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentResults.map((result, index) => (
                                <tr 
                                  key={result.id}
                                  style={{ 
                                    height: '32px', 
                                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                                  }}
                                >
                                  <td style={{ padding: '4px 10px', fontWeight: 500 }}>
                                    {result.subject_name || 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {result.coursework_mark || 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {result.total_paper_marks || 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 10px', fontWeight: 500 }}>
                                    {result.total_marks || 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 10px', fontWeight: 500 }}>
                                    {result.grade || 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {result.points || 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseStudentModal}>
                    Close
                  </button>
                </div>
              </>
            )}
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

export default ViewResults;
