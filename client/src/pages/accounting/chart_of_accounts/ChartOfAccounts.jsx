import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faDollarSign,
  faEye
} from '@fortawesome/free-solid-svg-icons';

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
const TYPE_PREFIX = {
  Asset: '1',
  Liability: '2',
  Equity: '3',
  Revenue: '4',
  Expense: '5',
};

const ChartOfAccounts = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [viewAccount, setViewAccount] = useState(null);
  const [viewParent, setViewParent] = useState(null);
  const [viewBalances, setViewBalances] = useState([]);
  const [viewLedgerEntries, setViewLedgerEntries] = useState([]);
  const [viewLedgerLoading, setViewLedgerLoading] = useState(false);
  const [viewLedgerPagination, setViewLedgerPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 25
  });
  const [viewLedgerFilters, setViewLedgerFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [addForm, setAddForm] = useState({
    code: '',
    name: '',
    type: '',
    parent_id: '',
    is_active: true
  });
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    account_id: '',
    amount: '',
    balance_type: 'debit',
    description: '',
    reference: '',
    opening_balance_date: new Date().toISOString().split('T')[0],
    currency_id: 1
  });
  const [addLoading, setAddLoading] = useState(false);
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [openingBalanceError, setOpeningBalanceError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAccounts();
    loadCurrencies();
    // eslint-disable-next-line
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const currencyList = response.data.data || [];
        setCurrencies(currencyList);
        // Set default currency (base currency or first one)
        const baseCurrency = currencyList.find(c => c.base_currency) || currencyList[0];
        if (baseCurrency) {
          setOpeningBalanceForm(prev => ({ ...prev, currency_id: baseCurrency.id }));
        }
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
    }
  };

  // Auto-generate code when type changes
  useEffect(() => {
    if (!addForm.type) {
      setAddForm((prev) => ({ ...prev, code: '' }));
      return;
    }
    const prefix = TYPE_PREFIX[addForm.type];
    // Find highest code for this type
    const codes = accounts
      .filter((acc) => acc.type === addForm.type && acc.code && acc.code.startsWith(prefix))
      .map((acc) => parseInt(acc.code, 10))
      .filter((num) => !isNaN(num));
    let nextCode;
    if (codes.length === 0) {
      nextCode = prefix + '000';
    } else {
      nextCode = (Math.max(...codes) + 1).toString();
    }
    setAddForm((prev) => ({ ...prev, code: nextCode }));
    // eslint-disable-next-line
  }, [addForm.type, accounts]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAccounts(response.data.data || []);
      } else {
        setError('Failed to load accounts.');
      }
    } catch (err) {
      setError('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const payload = {
        ...addForm,
        parent_id: addForm.parent_id || null,
        is_active: !!addForm.is_active
      };
      const response = await axios.post(
        `${BASE_URL}/accounting/chart-of-accounts`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setShowAddModal(false);
        setAddForm({ code: '', name: '', type: '', parent_id: '', is_active: true });
        fetchAccounts();
      } else {
        setAddError(response.data.message || 'Failed to add account.');
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add account.');
    } finally {
      setAddLoading(false);
    }
  };

  const openOpeningBalanceModal = (account) => {
    setSelectedAccount(account);
    // Set default balance type based on account type
    const defaultBalanceType = (account.type === 'Asset' || account.type === 'Expense') ? 'debit' : 'credit';
    setOpeningBalanceForm({
      account_id: account.id,
      amount: '',
      balance_type: defaultBalanceType,
      description: `Opening Balance - ${account.name} (${account.code})`,
      reference: `OB-${account.code}-${Date.now()}`,
      opening_balance_date: new Date().toISOString().split('T')[0],
      currency_id: currencies.find(c => c.base_currency)?.id || currencies[0]?.id || 1
    });
    setOpeningBalanceError('');
    setSuccess('');
    setShowOpeningBalanceModal(true);
  };

  const handleOpeningBalanceChange = (e) => {
    const { name, value } = e.target;
    setOpeningBalanceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    setOpeningBalanceLoading(true);
    setOpeningBalanceError('');
    setSuccess('');
    
    try {
      const payload = {
        ...openingBalanceForm,
        amount: parseFloat(openingBalanceForm.amount)
      };

      const response = await axios.post(
        `${BASE_URL}/accounting/chart-of-accounts/opening-balance`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Opening balance created successfully!');
        setShowOpeningBalanceModal(false);
        setOpeningBalanceForm({
          account_id: '',
          amount: '',
          balance_type: 'debit',
          description: '',
          reference: '',
          opening_balance_date: new Date().toISOString().split('T')[0],
          currency_id: 1
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setOpeningBalanceError(response.data.message || 'Failed to create opening balance.');
      }
    } catch (err) {
      setOpeningBalanceError(err.response?.data?.message || 'Failed to create opening balance.');
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const handleViewAccount = async (accountId) => {
    setShowViewModal(true);
    setViewModalLoading(true);
    setViewAccount(null);
    setViewParent(null);
    setViewBalances([]);
    setViewLedgerEntries([]);
    setViewLedgerPagination({
      current_page: 1,
      total_pages: 1,
      total_records: 0,
      limit: 25
    });
    setViewLedgerFilters({
      search: '',
      startDate: '',
      endDate: '',
      transactionType: ''
    });

    try {
      // Fetch account details
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const accountData = response.data.data;
      setViewAccount(accountData);

      // Fetch parent account if exists
      if (accountData.parent_id) {
        try {
          const parentRes = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${accountData.parent_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (parentRes.data.success) {
            setViewParent(parentRes.data.data);
          }
        } catch (err) {
          console.error('Error fetching parent account:', err);
        }
      }

      // Fetch balances for each currency
      const curRes = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (curRes.data.success) {
        const currencies = curRes.data.data || [];
        const balancesArr = await Promise.all(
          currencies.map(async (cur) => {
            try {
              const balRes = await axios.get(`${BASE_URL}/accounting/account-balances/${accountId}?currency_id=${cur.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                currency: cur,
                balance: balRes.data.data ? balRes.data.data.balance : 0,
                as_of_date: balRes.data.data ? balRes.data.data.as_of_date : '',
              };
            } catch {
              return { currency: cur, balance: 0, as_of_date: '' };
            }
          })
        );
        setViewBalances(balancesArr);
      }

      // Fetch ledger entries
      await fetchViewLedgerEntriesWithFilters(accountId, 1, {
        search: '',
        startDate: '',
        endDate: '',
        transactionType: ''
      });
    } catch (err) {
      console.error('Error fetching account:', err);
    } finally {
      setViewModalLoading(false);
    }
  };


  const handleViewLedgerFilterChange = (field, value) => {
    const newFilters = { ...viewLedgerFilters, [field]: value };
    setViewLedgerFilters(newFilters);
    setViewLedgerPagination(prev => ({ ...prev, current_page: 1 }));
    if (viewAccount) {
      // Use setTimeout to ensure state is updated before fetching
      setTimeout(() => {
        fetchViewLedgerEntriesWithFilters(viewAccount.id, 1, newFilters);
      }, 0);
    }
  };

  const fetchViewLedgerEntriesWithFilters = async (accountId, page = 1, filters = null) => {
    setViewLedgerLoading(true);
    try {
      const params = {
        page: page,
        limit: viewLedgerPagination.limit,
        ...(filters || viewLedgerFilters)
      };

      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/journal-entries/account/${accountId}`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      setViewLedgerEntries(data.data || []);
      setViewLedgerPagination(prev => ({
        ...prev,
        ...(data.pagination || {}),
        current_page: page
      }));
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
    } finally {
      setViewLedgerLoading(false);
    }
  };

  const handleViewLedgerPageChange = (page) => {
    setViewLedgerPagination(prev => ({ ...prev, current_page: page }));
    if (viewAccount) {
      fetchViewLedgerEntriesWithFilters(viewAccount.id, page);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewAccount(null);
    setViewParent(null);
    setViewBalances([]);
    setViewLedgerEntries([]);
    setViewModalLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount || 0).toFixed(2)}`;
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
          <h2 className="report-title">Chart of Accounts</h2>
          <p className="report-subtitle">Manage accounting accounts and structure.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-checklist"
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{ padding: '10px 30px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', flexShrink: 0 }}>
          {success}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white border border-gray-300 w-full max-w-md p-0" style={{ borderRadius: 0 }}>
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-800">Add Account</h2>
              <button className="text-xs text-gray-500 hover:text-gray-800" onClick={() => setShowAddModal(false)} style={{ borderRadius: 0 }}>✕</button>
            </div>
            <form className="px-6 py-4" onSubmit={handleAddSubmit}>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="code"
                  value={addForm.code}
                  readOnly
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 bg-gray-100 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select
                  name="type"
                  value={addForm.type}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="">Select type</option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Parent Account</label>
                <select
                  name="parent_id"
                  value={addForm.parent_id}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                >
                  <option value="">None</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={addForm.is_active}
                  onChange={handleAddChange}
                  className="mr-2 border-gray-300 focus:ring-gray-900"
                  style={{ borderRadius: 0 }}
                  id="is_active"
                />
                <label htmlFor="is_active" className="text-xs text-gray-700">Active</label>
              </div>
              {addError && <div className="text-xs text-red-600 mb-2">{addError}</div>}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 border border-gray-300 mr-2"
                  style={{ borderRadius: 0 }}
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  style={{ borderRadius: 0 }}
                  disabled={addLoading}
                >
                  {addLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading accounts...
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
                <th style={{ padding: '6px 10px' }}>CODE</th>
                <th style={{ padding: '6px 10px' }}>NAME</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>PARENT</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                 <th style={{ padding: '6px 10px', width: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr 
                  key={acc.id}
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px', fontFamily: 'monospace' }}>{acc.code}</td>
                  <td style={{ padding: '4px 10px' }}>{acc.name}</td>
                  <td style={{ padding: '4px 10px' }}>{acc.type}</td>
                  <td style={{ padding: '4px 10px' }}>{acc.parent_id || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{ color: acc.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewAccount(acc.id)}
                        style={{ 
                          color: '#2563eb', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: 0,
                          fontSize: '0.7rem'
                        }}
                        title="View"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openOpeningBalanceModal(acc)}
                        style={{ 
                          color: '#6366f1', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: 0,
                          fontSize: '0.7rem'
                        }}
                        title="Add Opening Balance"
                      >
                        OB
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - accounts.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (accounts.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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
          Showing {accounts.length} account{accounts.length !== 1 ? 's' : ''}.
        </div>
        <div className="table-footer-right">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            All data displayed
          </div>
        </div>
      </div>

      {/* Opening Balance Modal */}
      {showOpeningBalanceModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowOpeningBalanceModal(false)}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Add Opening Balance</h3>
              <button className="modal-close-btn" onClick={() => setShowOpeningBalanceModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleOpeningBalanceSubmit} className="modal-form">
              <div className="modal-body">
                {openingBalanceError && (
                  <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                    {openingBalanceError}
                  </div>
                )}

                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '0.75rem'
                }}>
                  <p style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>⚠️ Use This ONLY for Opening Balances</p>
                  <p style={{ color: '#78350f', margin: 0 }}>
                    This feature is for recording historical balances that existed BEFORE the system was implemented. 
                    Do NOT use this for mid-term adjustments.
                  </p>
                </div>

                <div style={{
                  padding: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Account:</strong> {selectedAccount.code} - {selectedAccount.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedAccount.type}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Balance Type <span className="required">*</span>
                    </label>
                    <select
                      name="balance_type"
                      value={openingBalanceForm.balance_type}
                      onChange={handleOpeningBalanceChange}
                      className="form-control"
                      required
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {selectedAccount.type === 'Asset' || selectedAccount.type === 'Expense' 
                        ? 'Debit = Positive, Credit = Negative' 
                        : 'Credit = Positive, Debit = Negative'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Amount <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={openingBalanceForm.amount}
                      onChange={handleOpeningBalanceChange}
                      step="0.01"
                      min="0"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Currency <span className="required">*</span>
                    </label>
                    <select
                      name="currency_id"
                      value={openingBalanceForm.currency_id}
                      onChange={handleOpeningBalanceChange}
                      className="form-control"
                      required
                    >
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name} {currency.base_currency && '(Base)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Opening Balance Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      name="opening_balance_date"
                      value={openingBalanceForm.opening_balance_date}
                      onChange={handleOpeningBalanceChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Description <span className="required">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={openingBalanceForm.description}
                      onChange={handleOpeningBalanceChange}
                      rows="2"
                      className="form-control"
                      required
                      placeholder="e.g., Opening Balance - Historical balance from previous system"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Reference
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={openingBalanceForm.reference}
                      onChange={handleOpeningBalanceChange}
                      className="form-control"
                      placeholder="Auto-generated if left blank"
                    />
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  marginTop: '20px',
                  fontSize: '0.75rem',
                  color: '#1e40af'
                }}>
                  <p style={{ margin: 0 }}>
                    <strong>Note:</strong> This will create a journal entry using Retained Earnings (3998) 
                    as the offsetting account. This ensures historical balances don't affect current period 
                    financial statements.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowOpeningBalanceModal(false)}
                  disabled={openingBalanceLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm"
                  disabled={openingBalanceLoading}
                >
                  {openingBalanceLoading ? 'Creating...' : 'Create Opening Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Account Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '95vw', maxHeight: '95vh', width: '1200px' }}
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
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading account details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : viewAccount ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Account Details - {viewAccount.code} - {viewAccount.name}
                  </h3>
                  <button className="modal-close-btn" onClick={handleCloseViewModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: 'calc(95vh - 120px)', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Account Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faFileAlt} style={{ color: '#2563eb' }} />
                        Account Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Account Code
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', fontFamily: 'monospace' }}>
                            {viewAccount.code || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Account Name
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {viewAccount.name || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Account Type
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {viewAccount.type || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Status
                          </div>
                          <div style={{ fontSize: '0.85rem', color: viewAccount.is_active ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                            {viewAccount.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        
                        {viewParent && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Parent Account
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {viewParent.code} - {viewParent.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Balances Section */}
                    {viewBalances.length > 0 && (
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                          Account Balances
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                          {viewBalances.map((b) => (
                            <div key={b.currency.id}>
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                {b.currency.code} - {b.currency.name}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                {b.balance === 0 ? '0.00' : `${formatCurrency(Math.abs(b.balance), b.currency.symbol)} ${b.balance < 0 ? 'CR' : 'DR'}`}
                              </div>
                              {b.as_of_date && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  As of: {b.as_of_date.slice(0, 10)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ledger Entries Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faFileAlt} style={{ color: '#6366f1' }} />
                        Ledger Entries & Transactions
                      </h4>

                      {/* Filters */}
                      <div style={{ 
                        padding: '12px', 
                        background: '#f9fafb', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '4px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Search</label>
                            <input
                              type="text"
                              value={viewLedgerFilters.search}
                              onChange={(e) => handleViewLedgerFilterChange('search', e.target.value)}
                              placeholder="Search transactions..."
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                              type="date"
                              value={viewLedgerFilters.startDate}
                              onChange={(e) => handleViewLedgerFilterChange('startDate', e.target.value)}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                              type="date"
                              value={viewLedgerFilters.endDate}
                              onChange={(e) => handleViewLedgerFilterChange('endDate', e.target.value)}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                              value={viewLedgerFilters.transactionType}
                              onChange={(e) => handleViewLedgerFilterChange('transactionType', e.target.value)}
                              className="form-control"
                            >
                              <option value="">All Types</option>
                              <option value="DEBIT">Debit</option>
                              <option value="CREDIT">Credit</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Transactions Table */}
                      <div style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}>
                        {viewLedgerLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
                            Loading transactions...
                          </div>
                        ) : viewLedgerEntries.length === 0 ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '200px', 
                            color: '#64748b' 
                          }}>
                            <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }} />
                            <div style={{ fontSize: '0.75rem' }}>No transactions found</div>
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
                                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right' }}>DEBIT</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right' }}>CREDIT</th>
                                <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewLedgerEntries.map((entry, index) => (
                                <tr 
                                  key={`${entry.source}-${entry.id}`}
                                  style={{ 
                                    height: '32px', 
                                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                                  }}
                                >
                                  <td style={{ padding: '4px 10px' }}>{formatDate(entry.transaction_date)}</td>
                                  <td style={{ padding: '4px 10px' }}>{entry.description || 'N/A'}</td>
                                  <td style={{ padding: '4px 10px', textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                                    {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                                  </td>
                                  <td style={{ padding: '4px 10px', textAlign: 'right', color: '#059669', fontWeight: 500 }}>
                                    {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {entry.reference || entry.receipt_number || entry.reference_number || '-'}
                                  </td>
                                </tr>
                              ))}
                              {/* Empty placeholder rows to always show 25 rows */}
                              {Array.from({ length: Math.max(0, 25 - viewLedgerEntries.length) }).map((_, index) => (
                                <tr 
                                  key={`empty-${index}`}
                                  style={{ 
                                    height: '32px', 
                                    backgroundColor: (viewLedgerEntries.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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

                      {/* Pagination */}
                      {viewLedgerPagination.total_pages > 1 && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: '16px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-color)'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Showing page {viewLedgerPagination.current_page} of {viewLedgerPagination.total_pages} 
                            ({viewLedgerPagination.total_records} total entries)
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewLedgerPageChange(viewLedgerPagination.current_page - 1)}
                              disabled={viewLedgerPagination.current_page === 1}
                              className="pagination-btn"
                              style={{ fontSize: '0.7rem' }}
                            >
                              Previous
                            </button>
                            <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                              Page {viewLedgerPagination.current_page} of {viewLedgerPagination.total_pages}
                            </span>
                            <button
                              onClick={() => handleViewLedgerPageChange(viewLedgerPagination.current_page + 1)}
                              disabled={viewLedgerPagination.current_page === viewLedgerPagination.total_pages}
                              className="pagination-btn"
                              style={{ fontSize: '0.7rem' }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
    </div>
  );
};

export default ChartOfAccounts;
