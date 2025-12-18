import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faPlus, faSearch, faDollarSign, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

const Expenses = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  // Pagination, search, filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();
  
  // Add Expense Form State
  const [addForm, setAddForm] = useState({ 
    supplier_id: '', 
    amount: '', 
    currency_id: '', 
    expense_date: new Date().toISOString().split('T')[0], 
    description: '', 
    payment_method: 'Cash', 
    payment_status: 'full', 
    expense_account_id: '',
    amount_paid: '',
    reference_number: ''
  });
  const [addFormError, setAddFormError] = useState('');
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      params.push(`page=${page}`);
      params.push(`pageSize=${pageSize}`);
      if (activeSearchTerm) params.push(`search=${encodeURIComponent(activeSearchTerm)}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const res = await axios.get(`${BASE_URL}/expenses/expenses${query}`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [page, activeSearchTerm, startDate, endDate]);

  useEffect(() => {
    if (showAddModal) {
      fetchOptions();
    }
  }, [showAddModal]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [suppliersRes, currenciesRes, accountsRes] = await Promise.all([
        axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/accounting/currencies`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/accounting/chart-of-accounts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSuppliers(suppliersRes.data.data || []);
      setCurrencies(currenciesRes.data.data || []);
      const accounts = accountsRes.data.data || [];
      setExpenseAccounts(accounts.filter(acc => acc.type === 'Expense'));
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(search);
    setPage(1);
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EXP-${timestamp}-${random}`;
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate amount paid for partial payments
    if (name === 'amount' && addForm.payment_status === 'partial') {
      const totalAmount = parseFloat(value) || 0;
      const amountPaid = parseFloat(addForm.amount_paid) || 0;
      if (amountPaid > totalAmount) {
        setAddForm(prev => ({ ...prev, amount_paid: value }));
      }
    }
  };

  const handleOpenAddModal = () => {
    setAddForm({
      supplier_id: '', 
      amount: '', 
      currency_id: '', 
      expense_date: new Date().toISOString().split('T')[0], 
      description: '', 
      payment_method: 'Cash', 
      payment_status: 'full', 
      expense_account_id: '',
      amount_paid: '',
      reference_number: ''
    });
    setAddFormError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddFormError('');
    setAddForm({
      supplier_id: '', 
      amount: '', 
      currency_id: '', 
      expense_date: new Date().toISOString().split('T')[0], 
      description: '', 
      payment_method: 'Cash', 
      payment_status: 'full', 
      expense_account_id: '',
      amount_paid: '',
      reference_number: ''
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddFormLoading(true);
    setAddFormError('');
    
    try {
      if (!addForm.amount || !addForm.currency_id || !addForm.expense_date || !addForm.payment_method || !addForm.payment_status || !addForm.expense_account_id) {
        setAddFormError('Please fill all required fields.');
        setAddFormLoading(false);
        return;
      }

      if (!addForm.reference_number) {
        setAddFormError('Please add a reference number.');
        setAddFormLoading(false);
        return;
      }

      // Validate partial payment
      if (addForm.payment_status === 'partial') {
        if (!addForm.amount_paid || parseFloat(addForm.amount_paid) <= 0) {
          setAddFormError('Please enter the amount paid for partial payment.');
          setAddFormLoading(false);
          return;
        }
        if (parseFloat(addForm.amount_paid) >= parseFloat(addForm.amount)) {
          setAddFormError('Amount paid must be less than total amount for partial payment.');
          setAddFormLoading(false);
          return;
        }
      }

      await axios.post(`${BASE_URL}/expenses/expenses`, {
        ...addForm,
        supplier_id: addForm.supplier_id || null,
        amount: parseFloat(addForm.amount),
        amount_paid: addForm.payment_status === 'partial' ? parseFloat(addForm.amount_paid) : null,
        expense_account_id: addForm.expense_account_id,
        reference_number: addForm.reference_number
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      handleCloseAddModal();
      fetchExpenses();
    } catch (err) {
      setAddFormError(err.response?.data?.message || 'Failed to save expense.');
    } finally {
      setAddFormLoading(false);
    }
  };

  const remainingAmount = addForm.amount && addForm.amount_paid ? 
    (parseFloat(addForm.amount) - parseFloat(addForm.amount_paid)).toFixed(2) : '';

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeleteLoadingId(id);
    try {
      await axios.delete(`${BASE_URL}/expenses/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleView = async (id) => {
    setShowViewModal(true);
    setViewLoading(true);
    setViewExpense(null);
    try {
      const res = await axios.get(`${BASE_URL}/expenses/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setViewExpense(res.data.data);
    } catch {
      setViewExpense(null);
    } finally {
      setViewLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const displayStart = expenses.length > 0 ? (page - 1) * pageSize + 1 : 0;
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
          <h2 className="report-title">Expenses</h2>
          <p className="report-subtitle">Manage and track expense records.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenAddModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Expense
          </button>
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
                placeholder="Search by description, supplier..."
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

      {/* Accounting Ledger Container */}
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
            Loading expenses...
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
                <th style={{ padding: '6px 10px', width: '100px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', width: '120px' }}>DEBIT</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', width: '120px' }}>CREDIT</th>
                <th style={{ padding: '6px 10px', width: '100px' }}>REFERENCE</th>
                <th style={{ padding: '6px 10px', width: '100px' }}>ACTIONS</th>
                </tr>
              </thead>
            <tbody>
              {expenses.map((e, index) => (
                <tr
                  key={e.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{e.expense_date}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontWeight: 500 }}>{e.description}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {e.supplier_name ? `Supplier: ${e.supplier_name}` : ''}
                        {e.supplier_name && e.payment_method ? ' • ' : ''}
                        {e.payment_method ? `${e.payment_method}` : ''}
                        {e.payment_status ? ` (${e.payment_status})` : ''}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                    {parseFloat(e.amount || 0).toFixed(2)} {e.currency_code || ''}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', color: '#059669' }}>
                    -
                  </td>
                  <td style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {e.journal_description || '-'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleView(e.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/expenses/expenses/edit/${e.id}`)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deleteLoadingId === e.id}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: deleteLoadingId === e.id ? 0.5 : 1 }}
                        title="Delete"
                      >
                        {deleteLoadingId === e.id ? '...' : <FontAwesomeIcon icon={faTrash} />}
                      </button>
                    </div>
                    </td>
                  </tr>
                ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - expenses.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (expenses.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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
      {/* View Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', minHeight: viewLoading ? '400px' : 'auto' }}
          >
            {viewLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading expense details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : viewExpense ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Expense Details</h3>
                  <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Date
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.expense_date || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Supplier
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.supplier_name || '-'}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Description
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.description || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Amount
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {parseFloat(viewExpense.amount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Currency
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.currency_code || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Payment Method
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.payment_method || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Payment Status
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.payment_status || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Journal
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.journal_description || '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Recorded At
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {viewExpense.created_at || 'N/A'}
                      </div>
                    </div>
                </div>
                </div>
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setShowViewModal(false)}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="modal-body">
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '4px' }}>
                  Failed to load expense details.
                </div>
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setShowViewModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: loadingOptions ? '400px' : 'auto' }}
          >
            {loadingOptions ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading...</p>
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
                  <h3 className="modal-title">Add Expense</h3>
                  <button className="modal-close-btn" onClick={handleCloseAddModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  {addFormError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {addFormError}
                    </div>
                  )}
                  <form onSubmit={handleAddSubmit} className="modal-form">
                    {/* Expense Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#2563eb' }} />
                        Expense Information
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Expense Date <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            name="expense_date"
                            className="form-control"
                            value={addForm.expense_date}
                            onChange={handleAddFormChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Supplier</label>
                          <select
                            name="supplier_id"
                            className="form-control"
                            value={addForm.supplier_id}
                            onChange={handleAddFormChange}
                          >
                            <option value="">-- None --</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Total Amount <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            name="amount"
                            className="form-control"
                            placeholder="Enter amount"
                            value={addForm.amount}
                            onChange={handleAddFormChange}
                            required
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Currency <span className="required">*</span>
                          </label>
                          <select
                            name="currency_id"
                            className="form-control"
                            value={addForm.currency_id}
                            onChange={handleAddFormChange}
                            required
                          >
                            <option value="">-- Select --</option>
                            {currencies.map((c) => (
                              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Expense Account <span className="required">*</span>
                          </label>
                          <select
                            name="expense_account_id"
                            className="form-control"
                            value={addForm.expense_account_id}
                            onChange={handleAddFormChange}
                            required
                          >
                            <option value="">-- Select --</option>
                            {expenseAccounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Reference Number <span className="required">*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              name="reference_number"
                              className="form-control"
                              placeholder="Enter or generate"
                              value={addForm.reference_number}
                              onChange={handleAddFormChange}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setAddForm(prev => ({...prev, reference_number: generateReferenceNumber()}))}
                              className="modal-btn"
                              style={{
                                background: '#6b7280',
                                color: 'white',
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                fontSize: '0.7rem'
                              }}
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Description</label>
                          <input
                            type="text"
                            name="description"
                            className="form-control"
                            placeholder="Enter expense description"
                            value={addForm.description}
                            onChange={handleAddFormChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Information Section */}
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                        Payment Information
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Payment Method <span className="required">*</span>
                          </label>
                          <select
                            name="payment_method"
                            className="form-control"
                            value={addForm.payment_method}
                            onChange={handleAddFormChange}
                            required
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Payment Status <span className="required">*</span>
                          </label>
                          <select
                            name="payment_status"
                            className="form-control"
                            value={addForm.payment_status}
                            onChange={handleAddFormChange}
                            required
                          >
                            <option value="full">Full Payment</option>
                            <option value="partial">Partial Payment</option>
                            <option value="debt">Credit/Debt</option>
                          </select>
                        </div>
                        {addForm.payment_status === 'partial' && (
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">
                              Amount Paid <span className="required">*</span>
                            </label>
                            <input
                              type="number"
                              name="amount_paid"
                              className="form-control"
                              placeholder="Enter amount paid"
                              value={addForm.amount_paid}
                              onChange={handleAddFormChange}
                              required={addForm.payment_status === 'partial'}
                              step="0.01"
                              min="0"
                            />
                            {remainingAmount && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Remaining: {remainingAmount}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseAddModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm"
                    onClick={handleAddSubmit}
                    disabled={addFormLoading}
                  >
                    {addFormLoading ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
