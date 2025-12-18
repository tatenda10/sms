import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const Procurement = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);


  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);


  // Fetch purchase requests
  const fetchPurchaseRequests = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        page: page,
        limit: pageSize
      };
      if (activeSearchTerm) params.search = activeSearchTerm;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${BASE_URL}/procurement/purchase-requests`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different response structures
      if (response.data.success !== false) {
        // If response has success field and it's true, or no success field
        const data = response.data.data || response.data;
        const totalCount = response.data.total || response.data.pagination?.total || (Array.isArray(data) ? data.length : 0);
        const requests = Array.isArray(data) ? data : (data?.requests || data?.purchase_requests || []);
        
        setPurchaseRequests(requests);
        setTotal(totalCount);
      } else {
        setError(response.data.message || 'Failed to fetch purchase requests');
        setPurchaseRequests([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = 'Failed to fetch purchase requests';
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Error setting up request
        errorMessage = error.message || 'Failed to fetch purchase requests';
      }
      
      setError(errorMessage);
      setPurchaseRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeSearchTerm, statusFilter, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(search);
    setPage(1);
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this purchase request?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/procurement/purchase-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Purchase request deleted successfully');
      setShowSuccessModal(true);
      fetchPurchaseRequests(); // Refresh data
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      setError(error.response?.data?.message || 'Failed to delete purchase request');
      setShowErrorModal(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'approved':
        return faCheckCircle;
      case 'delivered':
        return faTruck;
      case 'rejected':
        return faExclamationTriangle;
      default:
        return faExclamationTriangle;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(total / pageSize);
  const displayStart = purchaseRequests.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const displayEnd = Math.min(page * pageSize, total);

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
          <h2 className="report-title">Purchase Requests</h2>
          <p className="report-subtitle">Manage and track purchase requests.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/dashboard/procurement/purchase-requests/new"
            className="btn-checklist"
            style={{ textDecoration: 'none' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Purchase Request
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, requester, department..."
                className="filter-input search-input"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setActiveSearchTerm('');
                    setPage(1);
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
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
            </select>
            {statusFilter && (
              <button
                onClick={() => { setPage(1); setStatusFilter(''); }}
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
                title="Clear status filter"
              >
                ×
              </button>
            )}
          </div>
          {/* Start Date Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            />
            {startDate && (
              <button
                onClick={() => { setPage(1); setStartDate(''); }}
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
                title="Clear start date"
              >
                ×
              </button>
            )}
          </div>
          {/* End Date Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            />
            {endDate && (
              <button
                onClick={() => { setPage(1); setEndDate(''); }}
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
                title="Clear end date"
              >
                ×
              </button>
            )}
          </div>
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
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading purchase requests...
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#dc2626', fontSize: '0.75rem' }}>
            {error}
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
                <th style={{ padding: '6px 10px' }}>REQUEST</th>
                <th style={{ padding: '6px 10px' }}>REQUESTER</th>
                <th style={{ padding: '6px 10px' }}>DEPARTMENT</th>
                <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRequests.map((request, index) => (
                <tr
                  key={request.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ fontWeight: 500 }}>{request.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>#{request.id}</div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>{request.requester || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{request.department || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{formatCurrency(request.amount || 0)}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      borderRadius: '4px',
                      ...(request.status === 'pending' ? { color: '#d97706', background: '#fef3c7' } :
                          request.status === 'approved' ? { color: '#2563eb', background: '#dbeafe' } :
                          request.status === 'delivered' ? { color: '#059669', background: '#d1fae5' } :
                          request.status === 'rejected' ? { color: '#dc2626', background: '#fee2e2' } :
                          { color: '#6b7280', background: '#f3f4f6' })
                    }}>
                      <FontAwesomeIcon icon={getStatusIcon(request.status)} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
                      {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : '-'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>{formatDate(request.created_at)}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Link
                        to={`/dashboard/procurement/purchase-requests/${request.id}`}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none' }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link
                        to={`/dashboard/procurement/purchase-requests/${request.id}/edit`}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none' }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
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
              {Array.from({ length: Math.max(0, 25 - purchaseRequests.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (purchaseRequests.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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
          Showing {displayStart} to {displayEnd} of {total || 0} results.
        </div>
        <div className="table-footer-right">
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={success}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={error}
      />
    </div>
  );
};

export default Procurement;
