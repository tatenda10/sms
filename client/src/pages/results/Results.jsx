import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faPlus, 
  faSearch,
  faSchool,
  faUsers,
  faCalendar,
  faTrophy,
  faMedal,
  faAward,
  faUserGraduate,
  faChartLine,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Results = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClasses, setTotalClasses] = useState(0);
  const [limit] = useState(25);

  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentResultsModal, setShowStudentResultsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  
  // Add Result modal states
  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const [addResultClassId, setAddResultClassId] = useState(null);
  const [addResultClassInfo, setAddResultClassInfo] = useState(null);
  const [addResultLoading, setAddResultLoading] = useState(false);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [addResultStudents, setAddResultStudents] = useState([]);
  const [gradingCriteria, setGradingCriteria] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudentForResult, setSelectedStudentForResult] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [courseworkMark, setCourseworkMark] = useState('');
  const [paperMarks, setPaperMarks] = useState([{ name: 'Paper 1', mark: '' }]);
  const [savingResult, setSavingResult] = useState(false);
  const [resultError, setResultError] = useState('');
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  useEffect(() => {
    fetchClasses();
  }, [currentPage, activeSearchTerm]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode - filter client-side
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const allClasses = response.data.data || [];
        const searchLower = activeSearchTerm.trim().toLowerCase();
        const filtered = allClasses.filter(cls =>
          (cls.name && cls.name.toLowerCase().includes(searchLower)) ||
          (cls.stream_name && cls.stream_name.toLowerCase().includes(searchLower)) ||
          (cls.stream_stage && cls.stream_stage.toLowerCase().includes(searchLower))
        );
        
        setClasses(filtered);
        setTotalPages(1);
        setTotalClasses(filtered.length);
      } else {
        console.log('📄 Fetching all classes');
        // Normal fetch mode - get all classes
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Raw response:', data);
        const allClasses = data.data || [];
        
        // Client-side pagination
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedClasses = allClasses.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allClasses.length / limit);
        
        setClasses(paginatedClasses);
        setTotalPages(totalPages);
        setTotalClasses(allClasses.length);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
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
    console.log('🔍 Starting search with term:', searchTerm);
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  // View modal functions
  const handleViewResults = async (classId) => {
    setShowViewModal(true);
    setViewModalLoading(true);
    setSelectedClass(null);
    setClassStudents([]);

    try {
      // Fetch class info
      const classResponse = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSelectedClass(classResponse.data.data);
      
      // Fetch students in the class
      setStudentsLoading(true);
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
      
      setClassStudents(allStudents);
    } catch (err) {
      console.error('Error fetching class:', err);
      showToast('Failed to load class details', 'error');
      setShowViewModal(false);
    } finally {
      setViewModalLoading(false);
      setStudentsLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedClass(null);
    setClassStudents([]);
    setViewModalLoading(false);
    setStudentsLoading(false);
  };

  const handleViewStudent = async (student) => {
    // Close the class results modal when opening student modal
    setShowViewModal(false);
    setShowStudentResultsModal(true);
    setStudentModalLoading(true);
    setSelectedStudent(student);
    setStudentResults([]);

    try {
      const res = await axios.get(`${BASE_URL}/results/results/student/${student.RegNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { gradelevel_class_id: selectedClass?.id }
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
    setShowStudentResultsModal(false);
    setSelectedStudent(null);
    setStudentResults([]);
    setStudentModalLoading(false);
    
    // Reopen the class results modal if we have a selected class
    if (selectedClass) {
      setShowViewModal(true);
    }
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

  const handleAddResult = async (classId) => {
    setAddResultClassId(classId);
    setAddResultLoading(true);
    setShowAddResultModal(true);
    setResultError('');
    
    try {
      // Fetch class info
      const classRes = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddResultClassInfo(classRes.data.data);
      
      // Fetch subject classes
      const subjectRes = await axios.get(`${BASE_URL}/classes/subject-classes?gradelevel_class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjectClasses(subjectRes.data.data || []);
      
      // Fetch students
      const studentsRes = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddResultStudents(studentsRes.data.data || []);
      
      // Fetch grading criteria
      const gradingRes = await axios.get(`${BASE_URL}/results/grading`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradingCriteria(gradingRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setAddResultLoading(false);
    }
  };

  const handleCloseAddResultModal = () => {
    setShowAddResultModal(false);
    setAddResultClassId(null);
    setAddResultClassInfo(null);
    setAddResultLoading(false);
    setSubjectClasses([]);
    setAddResultStudents([]);
    setGradingCriteria([]);
    setSelectedSubject('');
    setSelectedStudentForResult('');
    setSelectedTerm('');
    setSelectedYear(new Date().getFullYear().toString());
    setCourseworkMark('');
    setPaperMarks([{ name: 'Paper 1', mark: '' }]);
    setSavingResult(false);
    setResultError('');
  };

  const addPaperMark = () => {
    setPaperMarks([...paperMarks, { name: `Paper ${paperMarks.length + 1}`, mark: '' }]);
  };

  const updatePaperMark = (index, field, value) => {
    const updated = [...paperMarks];
    updated[index][field] = value;
    setPaperMarks(updated);
  };

  const removePaperMark = (index) => {
    if (paperMarks.length > 1) {
      setPaperMarks(paperMarks.filter((_, i) => i !== index));
    }
  };

  const calculateTotalMarks = () => {
    const coursework = parseFloat(courseworkMark) || 0;
    const paperTotal = paperMarks.reduce((sum, paper) => sum + (parseFloat(paper.mark) || 0), 0);
    const paperCount = paperMarks.filter(p => p.mark && parseFloat(p.mark) > 0).length;
    const paperAverage = paperCount > 0 ? paperTotal / paperCount : 0;
    return Math.round((coursework + paperAverage) * 100) / 100;
  };

  const calculateGrade = (totalMarks) => {
    const criteria = gradingCriteria.find(c => 
      totalMarks >= c.min_mark && totalMarks <= c.max_mark
    );
    return criteria ? { grade: criteria.grade, points: criteria.points } : { grade: 'N/A', points: 0 };
  };

  const handleSaveResult = async () => {
    if (!selectedSubject || !selectedStudentForResult || !selectedTerm || !selectedYear) {
      setResultError('Please fill in all required fields');
      return;
    }

    setSavingResult(true);
    setResultError('');
    
    try {
      const totalMarks = calculateTotalMarks();
      const gradeInfo = calculateGrade(totalMarks);

      const payload = {
        student_regnumber: selectedStudentForResult,
        subject_class_id: parseInt(selectedSubject),
        term: selectedTerm,
        academic_year: selectedYear,
        coursework_mark: courseworkMark ? parseFloat(courseworkMark) : null,
        paper_marks: paperMarks.map(paper => ({
          paper_name: paper.name,
          mark: paper.mark ? parseFloat(paper.mark) : 0
        })),
        total_marks: totalMarks,
        grade: gradeInfo.grade,
        points: gradeInfo.points
      };

      await axios.post(`${BASE_URL}/results/results`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast('Result saved successfully!', 'success');
      handleCloseAddResultModal();
    } catch (err) {
      console.error('Error saving result:', err);
      setResultError(err.response?.data?.message || 'Failed to save result');
    } finally {
      setSavingResult(false);
    }
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

  // Calculate display ranges for pagination
  const displayStart = classes.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalClasses);
  const hasData = classes.length > 0;

  if (loading && classes.length === 0) {
    return (
      <div className="reports-container" style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading classes...</p>
        </div>
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
          <h2 className="report-title">Results</h2>
          <p className="report-subtitle">View and manage student results by class.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard/results/grading')}
            className="btn-checklist"
            style={{ fontSize: '0.7rem', padding: '6px 12px' }}
          >
            <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
            Grading Criteria
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
                placeholder="Search by class name, stream, or stage..."
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
        {loading && classes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading classes...</p>
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
                <th style={{ padding: '6px 10px' }}>CLASS NAME</th>
                <th style={{ padding: '6px 10px' }}>STAGE</th>
                <th style={{ padding: '6px 10px' }}>STREAM</th>
                <th style={{ padding: '6px 10px' }}>CAPACITY</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls, index) => (
                <tr 
                  key={cls.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faSchool} style={{ color: '#64748b', fontSize: '0.875rem' }} />
                      <div style={{ fontWeight: 500 }}>{cls.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {cls.stream_stage || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {cls.stream_name || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {cls.capacity || 'Unlimited'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewResults(cls.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Results"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleAddResult(cls.id)}
                        style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Add Result"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - classes.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (classes.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
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
          Showing {displayStart} to {displayEnd} of {totalClasses || 0} results.
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

      {/* View Class Results Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '900px', minHeight: viewModalLoading ? '400px' : 'auto', maxHeight: '90vh' }}
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
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading class results...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : selectedClass ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Class Results - {selectedClass.name}
                  </h3>
                  <button className="modal-close-btn" onClick={handleCloseViewModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {studentsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                      <div className="loading-spinner"></div>
                    </div>
                  ) : classStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>No students found in this class</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '6px 10px' }}>POSITION</th>
                            <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                            <th style={{ padding: '6px 10px' }}>REGISTRATION NUMBER</th>
                            <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map((student, index) => {
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
                        </tbody>
                      </table>
                    </div>
                  )}
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

      {/* Student Results Modal */}
      {showStudentResultsModal && selectedStudent && (
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
                            <span style={{ color: 'var(--text-primary)' }}>{selectedClass?.name || 'N/A'}</span>
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

      {/* Add Result Modal */}
      {showAddResultModal && (
        <div className="modal-overlay" onClick={handleCloseAddResultModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '1200px', width: '95%', maxHeight: '90vh' }}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#000000' }}>
                Add Result - {addResultClassInfo?.name || 'Loading...'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseAddResultModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', padding: '20px' }}>
              {addResultLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div>
                  {resultError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {resultError}
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left Column - Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Subject <span className="required">*</span></label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="form-control"
                          required
                        >
                          <option value="">Select Subject</option>
                          {subjectClasses.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Student <span className="required">*</span></label>
                        <select
                          value={selectedStudentForResult}
                          onChange={(e) => setSelectedStudentForResult(e.target.value)}
                          className="form-control"
                          required
                        >
                          <option value="">Select Student</option>
                          {addResultStudents.map((student) => (
                            <option key={student.RegNumber} value={student.RegNumber}>
                              {student.Surname} {student.Name} ({student.RegNumber})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Term <span className="required">*</span></label>
                          <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="form-control"
                            required
                          >
                            <option value="">Select Term</option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Academic Year <span className="required">*</span></label>
                          <input
                            type="text"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Marks Entry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Coursework Mark</label>
                        <input
                          type="number"
                          value={courseworkMark}
                          onChange={(e) => setCourseworkMark(e.target.value)}
                          className="form-control"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0"
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label className="form-label">Paper Marks</label>
                          <button
                            type="button"
                            onClick={addPaperMark}
                            className="modal-btn modal-btn-confirm"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          >
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
                            Add Paper
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {paperMarks.map((paper, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={paper.name}
                                onChange={(e) => updatePaperMark(index, 'name', e.target.value)}
                                className="form-control"
                                style={{ flex: 1 }}
                                placeholder="Paper name"
                              />
                              <input
                                type="number"
                                value={paper.mark}
                                onChange={(e) => updatePaperMark(index, 'mark', e.target.value)}
                                className="form-control"
                                style={{ width: '100px' }}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                              />
                              {paperMarks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePaperMark(index)}
                                  style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Coursework:</span> {courseworkMark || 'N/A'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>Paper Average:</span> {calculateTotalMarks()}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>Grade:</span> {calculateGrade(calculateTotalMarks()).grade}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>Points:</span> {calculateGrade(calculateTotalMarks()).points}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleCloseAddResultModal}>
                Cancel
              </button>
              {!addResultLoading && (
                <button
                  className="modal-btn modal-btn-confirm"
                  onClick={handleSaveResult}
                  disabled={savingResult || !selectedSubject || !selectedStudentForResult || !selectedTerm || !selectedYear}
                >
                  {savingResult ? 'Saving...' : 'Save Result'}
                </button>
              )}
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

export default Results;
