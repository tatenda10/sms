import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign,
  faReceipt,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../contexts/Api';

const Financial = () => {
  const { student, token } = useStudentAuth();
  const [financialData, setFinancialData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]); // Store all payments for pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Pagination logic - slice payments based on current page
  useEffect(() => {
    if (allPayments.length > 0) {
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPayments = allPayments.slice(startIndex, endIndex);
      setPayments(paginatedPayments);
    } else {
      setPayments([]);
    }
  }, [currentPage, allPayments, limit]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch financial summary
      const summaryResponse = await fetch(`${BASE_URL}/student-financial/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch financial summary');
      }

      const summaryData = await summaryResponse.json();
      setFinancialData(summaryData.data);

      // Fetch transaction history
      const transactionsResponse = await fetch(`${BASE_URL}/student-financial/payments?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setAllPayments(transactionsData.data.transactions || []);
        setCurrentPage(1); // Reset to first page on new fetch
      }

    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Failed to load financial data');
      setAllPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate pagination values
  const totalPayments = allPayments.length;
  const totalPages = Math.ceil(totalPayments / limit);
  const displayStart = totalPayments > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalPayments);

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
          <h2 className="report-title">Financial Information</h2>
          <p className="report-subtitle">View your account balance and payment history</p>
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
        {/* Balance Display */}
        {financialData && !error && (
          <div style={{ padding: '20px 30px 0 30px', flexShrink: 0 }}>
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '0px', 
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    CURRENT BALANCE
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    color: (financialData.current_balance || 0) >= 0 ? '#065f46' : '#dc2626', 
                    fontWeight: '700' 
                  }}>
                    {formatCurrency(financialData.current_balance || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    STATUS
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                    {(financialData.current_balance || 0) >= 0 ? 'CR - Credit Balance' : 'DR - Debit Balance'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading transactions...
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
                <th style={{ padding: '6px 10px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>DR</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>CR</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                <>
                  {payments.map((transaction, index) => {
                    const globalIndex = (currentPage - 1) * limit + index;
                    return (
                      <tr 
                        key={transaction.id || index} 
                        style={{ 
                          height: '32px', 
                          backgroundColor: globalIndex % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                        }}
                      >
                        <td style={{ padding: '4px 10px' }}>
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            color: transaction.transaction_type === 'CREDIT' ? '#065f46' : '#dc2626'
                          }}>
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          {transaction.description || `${transaction.transaction_type} transaction`}
                        </td>
                        <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                          {transaction.transaction_type === 'DEBIT' ? (
                            <span style={{ color: '#dc2626', fontWeight: '500', fontSize: '0.75rem' }}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                          {transaction.transaction_type === 'CREDIT' ? (
                            <span style={{ color: '#065f46', fontWeight: '500', fontSize: '0.75rem' }}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                          <span style={{ 
                            color: (transaction.running_balance || 0) >= 0 ? '#065f46' : '#dc2626',
                            fontSize: '0.75rem'
                          }}>
                            {formatCurrency(transaction.running_balance || 0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty placeholder rows to always show 25 rows per page */}
                  {Array.from({ length: Math.max(0, limit - payments.length) }).map((_, index) => {
                    const globalIndex = (currentPage - 1) * limit + payments.length + index;
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
                        <td style={{ padding: '4px 10px', textAlign: 'right' }}>&nbsp;</td>
                        <td style={{ padding: '4px 10px', textAlign: 'right' }}>&nbsp;</td>
                        <td style={{ padding: '4px 10px', textAlign: 'right' }}>&nbsp;</td>
                      </tr>
                    );
                  })}
                </>
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px 10px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FontAwesomeIcon icon={faReceipt} style={{ fontSize: '2rem', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No Transactions Found</div>
                      <div style={{ fontSize: '0.75rem' }}>
                        No financial transactions found in your account.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          {totalPayments > 0 ? (
            `Showing ${displayStart} to ${displayEnd} of ${totalPayments} results.`
          ) : (
            `Showing 0 to 0 of 0 results.`
          )}
        </div>
        <div className="table-footer-right">
          {totalPages > 1 && (
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
          {totalPages <= 1 && totalPayments > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financial;
