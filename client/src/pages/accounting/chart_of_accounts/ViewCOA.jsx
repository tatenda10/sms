import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faUser, 
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';

const ViewCOA = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parent, setParent] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [balances, setBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ balance: '', as_of_date: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // New state for ledger entries
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPagination, setLedgerPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 10
  });
  const [ledgerFilters, setLedgerFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  });

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (account) {
      fetchCurrenciesAndBalances();
      fetchLedgerEntries();
    }
    // eslint-disable-next-line
  }, [account, ledgerFilters, ledgerPagination.current_page]);

  const fetchAccount = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAccount(response.data.data);
        if (response.data.data.parent_id) {
          // Fetch parent account for display
          const parentRes = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${response.data.data.parent_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (parentRes.data.success) setParent(parentRes.data.data);
        }
      } else {
        setError('Failed to load account.');
      }
    } catch (err) {
      setError('Failed to load account.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrenciesAndBalances = async () => {
    setBalancesLoading(true);
    try {
      const curRes = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (curRes.data.success) {
        setCurrencies(curRes.data.data || []);
        // Fetch balances for each currency
        const balancesArr = await Promise.all(
          (curRes.data.data || []).map(async (cur) => {
            try {
              const balRes = await axios.get(`${BASE_URL}/accounting/account-balances/${id}?currency_id=${cur.id}`, {
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
        setBalances(balancesArr);
      }
    } catch {
      setBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  };

  const fetchLedgerEntries = async () => {
    if (!account) return;
    
    setLedgerLoading(true);
    try {
      const params = {
        page: ledgerPagination.current_page,
        limit: ledgerPagination.limit,
        ...ledgerFilters,
        accountId: id // Filter by this specific account
      };

      // Use the journal entries endpoint instead of general ledger
      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/journal-entries/account/${id}`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      setLedgerEntries(data.data || []);
      setLedgerPagination(data.pagination || ledgerPagination);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleEditClick = (idx) => {
    setEditIdx(idx);
    setEditError('');
    setEditForm({
      balance: balances[idx].balance,
      as_of_date: balances[idx].as_of_date || new Date().toISOString().slice(0, 10),
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (idx) => {
    setEditLoading(true);
    setEditError('');
    const bal = balances[idx];
    try {
      await axios.put(
        `${BASE_URL}/accounting/account-balances/${id}`,
        {
          balance: parseFloat(editForm.balance),
          as_of_date: editForm.as_of_date,
          currency_id: bal.currency.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditIdx(null);
      fetchCurrenciesAndBalances();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update balance.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditError('');
  };

  const handleLedgerFilterChange = (field, value) => {
    setLedgerFilters(prev => ({ ...prev, [field]: value }));
    setLedgerPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleLedgerPageChange = (page) => {
    setLedgerPagination(prev => ({ ...prev, current_page: page }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getSourceIcon = (source) => {
    return source === 'fee_payment' ? faDollarSign : faUser;
  };

  return (
    <div className="px-2 md:px-4 lg:px-8 w-full max-w-full">
      {loading ? (
        <div className="p-3 md:p-6 text-xs text-gray-500">Loading account...</div>
      ) : error ? (
        <div className="p-3 md:p-6 text-xs text-red-600">{error}</div>
      ) : !account ? (
        <div className="p-3 md:p-6 text-xs text-gray-500">Account not found.</div>
      ) : (
        <>
          {/* Account Info Header */}
          <div className="mb-4 md:mb-8 border-b border-gray-200 pb-3 md:pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
              <div className="flex-1">
                <div className="text-base md:text-lg font-bold text-gray-900 mb-1">
                  {account.code} &mdash; {account.name}
                </div>
                <div className="text-xs text-gray-500 mb-1">{account.type}</div>
                <div className="text-xs text-gray-500">
                  {account.parent_id && parent ? `Parent: ${parent.code} - ${parent.name}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Balances Table */}
          <div className="mb-4 md:mb-8">
            <div className="mb-2 text-xs font-semibold text-gray-700">Account Balances</div>
            <div className="border border-gray-200 overflow-hidden">
              {balancesLoading ? (
                <div className="p-3 md:p-4 text-xs text-gray-500">Loading balances...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 text-xs" style={{ minWidth: '400px' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Currency</th>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider hidden sm:table-cell">Symbol</th>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Balance</th>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider hidden md:table-cell">As of Date</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {balances.map((b, idx) => (
                      <tr key={b.currency.id}>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{b.currency.code} - {b.currency.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{b.currency.symbol || '-'}</div>
                          </td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap hidden sm:table-cell">{b.currency.symbol || '-'}</td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                            <span className={`text-xs font-medium ${b.balance < 0 ? 'text-green-600' : b.balance > 0 ? 'text-red-600' : ''}`}>
                              {b.balance === 0 ? '0.00' : `${formatCurrency(Math.abs(b.balance), b.currency.symbol)} ${b.balance < 0 ? 'CR' : 'DR'}`}
                            </span>
                          </td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap hidden md:table-cell">{b.as_of_date ? b.as_of_date.slice(0, 10) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Entries Section */}
          <div className="mb-4 md:mb-8">
            <div className="mb-3 md:mb-4">
              <div className="text-xs font-semibold text-gray-700 mb-2">Ledger Entries & Transactions</div>
              <p className="text-xs text-gray-500 mb-4">Transactions affecting this account</p>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={ledgerFilters.search}
                    onChange={(e) => handleLedgerFilterChange('search', e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={ledgerFilters.startDate}
                    onChange={(e) => handleLedgerFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                            <input
                    type="date"
                    value={ledgerFilters.endDate}
                    onChange={(e) => handleLedgerFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={ledgerFilters.transactionType}
                    onChange={(e) => handleLedgerFilterChange('transactionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                  >
                    <option value="">All Types</option>
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ledger Entries Table */}
            <div className="border border-gray-200 overflow-hidden">
              {ledgerLoading ? (
                <div className="p-3 md:p-4 text-xs text-gray-500">Loading ledger entries...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 text-xs" style={{ minWidth: '500px' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Date</th>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Description</th>
                        <th className="px-2 md:px-3 py-2 text-right font-medium tracking-wider">DR</th>
                        <th className="px-2 md:px-3 py-2 text-right font-medium tracking-wider">CR</th>
                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ledgerEntries.map((entry) => (
                        <tr key={`${entry.source}-${entry.id}`} className="hover:bg-gray-50">
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap text-gray-900">
                            {formatDate(entry.transaction_date)}
                          </td>
                          <td className="px-2 md:px-3 py-2 text-gray-900">
                            <div className="flex items-center">
                              <FontAwesomeIcon 
                                icon={getSourceIcon(entry.source)} 
                                className="mr-2 text-gray-400 h-3 w-3 flex-shrink-0" 
                              />
                              <div>
                                <div className="text-xs font-medium">{entry.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap text-right font-medium text-red-600">
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                          </td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap text-right font-medium text-green-600">
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                          </td>
                          <td className="px-2 md:px-3 py-2 whitespace-nowrap text-gray-500">
                            {entry.reference || entry.receipt_number || entry.reference_number || '-'}
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {/* Empty State */}
              {!ledgerLoading && ledgerEntries.length === 0 && (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faFileAlt} className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No ledger entries found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {ledgerFilters.search || ledgerFilters.startDate || ledgerFilters.endDate 
                      ? 'Try adjusting your filters.' 
                      : 'No transactions have been recorded for this account yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {ledgerPagination.total_pages > 1 && (
              <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-gray-700 text-center sm:text-left">
                  Showing page {ledgerPagination.current_page} of {ledgerPagination.total_pages} 
                  ({ledgerPagination.total_records} total entries)
                </div>
                <div className="flex justify-center sm:justify-end space-x-2">
                  <button
                    onClick={() => handleLedgerPageChange(ledgerPagination.current_page - 1)}
                    disabled={ledgerPagination.current_page === 1}
                    className="px-3 py-1 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleLedgerPageChange(ledgerPagination.current_page + 1)}
                    disabled={ledgerPagination.current_page === ledgerPagination.total_pages}
                    className="px-3 py-1 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ViewCOA;
