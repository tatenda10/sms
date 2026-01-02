import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faDollarSign,
  faUserGraduate,
  faExclamationTriangle,
  faEye,
  faFileAlt,
  faDownload,
  faPrint,
  faRefresh,
  faClose
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const StudentBalances = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 25,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    fetchStudentBalances();
    fetchSummary();
  }, [pagination.currentPage, activeSearchTerm]);

  const fetchStudentBalances = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(activeSearchTerm && { search: activeSearchTerm.trim() })
      });

      const response = await axios.get(`${BASE_URL}/students/balances/outstanding?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStudents(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching student balances:', error);
      setError('Failed to fetch student balances');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/students/balances/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleRefresh = () => {
    fetchStudentBalances();
    fetchSummary();
  };

  const handleExport = () => {
    const csvContent = [
      ['Registration Number', 'Name', 'Surname', 'Outstanding Balance', 'Last Transaction Date'],
      ...students.map(student => [
        student.RegNumber,
        student.Name,
        student.Surname,
        Math.abs(student.current_balance).toFixed(2),
        student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding-balances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Outstanding Student Balances</title>
          <style>
            body { font-family: 'Nunito', sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; text-transform: uppercase; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OUTSTANDING STUDENT BALANCES</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Students with Debt:</strong> ${summary?.total_students_with_debt || 0}</p>
            <p><strong>Total Outstanding:</strong> ${formatCurrency(summary?.total_outstanding_debt || 0)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Name</th>
                <th>Surname</th>
                <th class="amount">Outstanding Balance</th>
                <th>Last Transaction</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td>${student.RegNumber}</td>
                  <td>${student.Name}</td>
                  <td>${student.Surname}</td>
                  <td class="amount">${formatCurrency(student.current_balance)}</td>
                  <td>${student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Calculate display ranges for pagination
  const displayStart = students.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.currentPage * pagination.limit, pagination.totalStudents);

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
          <h2 className="report-title">Outstanding Student Balances</h2>
          <p className="report-subtitle">Students with outstanding debts and payment obligations.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            className="btn-checklist"
            style={{ backgroundColor: '#475569' }}
          >
            <FontAwesomeIcon icon={faRefresh} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn-checklist"
            style={{ backgroundColor: '#059669' }}
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPrint} />
            Print
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="report-filters" style={{ flexShrink: 0, padding: '10px 30px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', gap: '24px' }}>
        {summary && (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: '0.85rem' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Students with Debt</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{summary.total_students_with_debt}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faDollarSign} style={{ color: '#dc2626', fontSize: '0.85rem' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Outstanding</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(summary.total_outstanding_debt)}</p>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0, borderTop: 'none' }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or reg number..."
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
                    color: 'var(--text-secondary)'
                  }}
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
            Loading outstanding balances...
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
                <th style={{ padding: '6px 10px' }}>STUDENT</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>OUTSTANDING BALANCE</th>
                <th style={{ padding: '6px 10px' }}>LAST TRANSACTION</th>
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
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    {student.Name} {student.Surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {student.RegNumber}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                    {formatCurrency(student.current_balance)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.totalStudents || 0} results.
        </div>
        <div className="table-footer-right">
          {pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentBalances;
