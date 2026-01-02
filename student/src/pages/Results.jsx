import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faCalendarAlt,
  faBookOpen,
  faTrophy,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../contexts/Api';

const Results = () => {
  const { student, token } = useStudentAuth();
  const [searchYear, setSearchYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // Store all results for pagination
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balanceStatus, setBalanceStatus] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [classPosition, setClassPosition] = useState(null);
  const [streamPosition, setStreamPosition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    fetchBalanceStatus();
  }, []);

  const fetchBalanceStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/student-results/balance-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching balance status:', error);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchYear || !searchTerm) {
      setError('Please select both academic year and term');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch(
        `${BASE_URL}/student-results/results?academic_year=${searchYear}&term=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.status === 403) {
        if (data.access_denied) {
          setError(data.message);
        } else {
          setError('You cannot view results due to outstanding balance. Please clear your account balance first.');
        }
        setResults([]);
        return;
      }

      if (response.ok) {
        const fetchedResults = data.data.results || [];
        setAllResults(fetchedResults);
        setClassPosition(data.data.class_position || null);
        setStreamPosition(data.data.stream_position || null);
        setError('');
        setCurrentPage(1); // Reset to first page on new search
      } else {
        setError(data.message || 'Failed to fetch results');
        setResults([]);
        setAllResults([]);
        setClassPosition(null);
        setStreamPosition(null);
      }
      } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results');
      setResults([]);
      setAllResults([]);
      setClassPosition(null);
      setStreamPosition(null);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic - slice results based on current page
  useEffect(() => {
    if (allResults.length > 0) {
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      setResults(paginatedResults);
    } else {
      setResults([]);
    }
  }, [currentPage, allResults, limit]);

  // Calculate pagination values
  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / limit);
  const displayStart = totalResults > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalResults);

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
          <h2 className="report-title">Academic Results</h2>
          <p className="report-subtitle">Search and view your published academic results</p>
        </div>
        {balanceStatus && !balanceStatus.can_view_results && (
          <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              background: '#fee2e2',
              borderRadius: '4px',
              border: '1px solid #fcc'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: '0.875rem' }} />
              <div style={{ color: '#dc2626' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>Access Restricted</div>
                <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                  Outstanding Balance: {formatCurrency(balanceStatus.current_balance)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Academic Year Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Academic Year:</label>
            <input
              type="text"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              placeholder="Enter Year (e.g., 2025)"
              className="filter-input"
              style={{ minWidth: '180px', width: '180px' }}
            />
          </div>
          
          {/* Term Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Term:</label>
            <select
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
              style={{ minWidth: '140px', width: '140px' }}
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading || !balanceStatus?.can_view_results}
            className="btn-search"
          >
            <FontAwesomeIcon icon={faSearch} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
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
        {loading && !hasSearched ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading results...
          </div>
        ) : (
          <>
            {hasSearched && results.length > 0 && (
              <div style={{ padding: '20px 30px 0 30px' }}>
                {/* Student Info and Positions */}
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        ACADEMIC YEAR
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {searchYear}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        TERM
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {searchTerm}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        CLASS POSITION
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {classPosition || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        STREAM POSITION
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {streamPosition || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table - Always show headers */}
            <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
              <thead style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                background: 'var(--sidebar-bg)' 
              }}>
                <tr>
                  <th style={{ padding: '6px 10px' }}>SUBJECT</th>
                  <th style={{ padding: '6px 10px' }}>COURSEWORK</th>
                  <th style={{ padding: '6px 10px' }}>PAPER MARKS</th>
                  <th style={{ padding: '6px 10px' }}>GRADE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px 10px', textAlign: 'center', color: '#64748b' }}>
                      Loading results...
                    </td>
                  </tr>
                ) : hasSearched && results.length === 0 && !error ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px 10px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: '2rem', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No Results Found</div>
                        <div style={{ fontSize: '0.75rem' }}>
                          No published results found for {searchYear} - {searchTerm}.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : hasSearched && results.length > 0 ? (
                  <>
                    {results.map((result, index) => {
                      const globalIndex = (currentPage - 1) * limit + index;
                      return (
                        <tr 
                          key={result.id} 
                          style={{ 
                            height: '32px', 
                            backgroundColor: globalIndex % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                          }}
                        >
                          <td style={{ padding: '4px 10px' }}>
                            {result.subject_name}
                          </td>
                          <td style={{ padding: '4px 10px' }}>
                            {result.coursework_mark || 'N/A'}
                          </td>
                          <td style={{ padding: '4px 10px' }}>
                            {result.paper_marks && result.paper_marks.length > 0 ? (
                              <div>
                                {result.paper_marks.map((paper, idx) => (
                                  <div key={idx} style={{ fontSize: '0.75rem' }}>
                                    {paper.paper_name}: {paper.mark}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td style={{ padding: '4px 10px' }}>
                            {result.grade || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty placeholder rows to always show 25 rows per page */}
                    {Array.from({ length: Math.max(0, limit - results.length) }).map((_, index) => {
                      const globalIndex = (currentPage - 1) * limit + results.length + index;
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
          </>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          {hasSearched && totalResults > 0 ? (
            `Showing ${displayStart} to ${displayEnd} of ${totalResults} results.`
          ) : (
            `Showing 0 to 0 of 0 results.`
          )}
        </div>
        <div className="table-footer-right">
          {hasSearched && totalPages > 1 && (
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
          {hasSearched && totalPages <= 1 && totalResults > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
