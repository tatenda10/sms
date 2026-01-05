import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const WaiverManagement = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [waivers, setWaivers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalWaivers: 0,
    limit: 25,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Live search effect with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchWaivers();
  }, [pagination.currentPage, activeSearchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWaivers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchWaivers();
    }
  }));

  const fetchWaivers = async () => {
    try {
      setTableLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit
      });

      if (activeSearchTerm) {
        params.append('search', activeSearchTerm.trim());
      }

      const response = await axios.get(`${BASE_URL}/waivers/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setWaivers(response.data.data.waivers || []);
        const paginationData = response.data.data.pagination || {};
        setPagination(prev => ({
          ...prev,
          totalPages: paginationData.totalPages || 1,
          totalWaivers: paginationData.total || 0,
          hasNextPage: paginationData.page < paginationData.totalPages,
          hasPreviousPage: paginationData.page > 1
        }));
      }
    } catch (error) {
      console.error('Error fetching waivers:', error);
      setError('Failed to fetch waivers');
      setWaivers([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount || 0));
  };

  const getCategoryName = (description) => {
    const match = description?.match(/Fee Waiver - ([^:]+):/);
    return match ? match[1] : 'Unknown';
  };

  const displayStart = waivers.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.currentPage * pagination.limit, pagination.totalWaivers);

  if (loading && waivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading waivers...</div>
      </div>
    );
  }

  return (
    <>
      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <div className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or registration number..."
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
        {tableLoading && waivers.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading waivers...
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
                <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>WAIVER AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>CATEGORY</th>
                <th style={{ padding: '6px 10px' }}>TERM</th>
                <th style={{ padding: '6px 10px' }}>ACADEMIC YEAR</th>
                <th style={{ padding: '6px 10px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {waivers.map((waiver, index) => (
                <tr
                  key={waiver.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    {waiver.Name} {waiver.Surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.student_reg_number}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(waiver.waiver_amount)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {getCategoryName(waiver.description)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.term || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.academic_year || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatDate(waiver.transaction_date)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => console.log('View waiver:', waiver.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, pagination.limit - waivers.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (waivers.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
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

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.totalWaivers || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && pagination.totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>
    </>
  );
});

WaiverManagement.displayName = 'WaiverManagement';

export default WaiverManagement;
