import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faCalendarAlt,
  faEye,
  faDollarSign,
  faCreditCard,
  faReceipt,
  faUser,
  faClock,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const GeneralLedger = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('journal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalPagination, setJournalPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 20
  });
  const [journalFilters, setJournalFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  });

  // Account Balances State
  const [accountBalances, setAccountBalances] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');

  // Transaction Summary State
  const [transactionSummary, setTransactionSummary] = useState({
    summary: [],
    totals: { total_debits: 0, total_credits: 0, net_amount: 0 }
  });

  useEffect(() => {
    if (activeTab === 'journal') {
      fetchJournalEntries();
    } else if (activeTab === 'balances') {
      fetchAccountBalances();
    } else if (activeTab === 'summary') {
      fetchTransactionSummary();
    }
  }, [activeTab, journalFilters, journalPagination.current_page, selectedCurrency]);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: journalPagination.current_page,
        limit: journalPagination.limit,
        ...journalFilters
      };

      const response = await axios.get(`${BASE_URL}/accounting/general-ledger`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      setJournalEntries(data.data || []);
      setJournalPagination(data.pagination || journalPagination);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError(err.response?.data?.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedCurrency) {
        params.currency_id = selectedCurrency;
      }

      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/account-balances`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setAccountBalances(response.data.data || []);
    } catch (err) {
      console.error('Error fetching account balances:', err);
      setError(err.response?.data?.message || 'Failed to fetch account balances');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (journalFilters.startDate) params.startDate = journalFilters.startDate;
      if (journalFilters.endDate) params.endDate = journalFilters.endDate;

      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/transaction-summary`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setTransactionSummary(response.data.data || { summary: [], totals: { total_debits: 0, total_credits: 0, net_amount: 0 } });
    } catch (err) {
      console.error('Error fetching transaction summary:', err);
      setError(err.response?.data?.message || 'Failed to fetch transaction summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/currencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCurrencies(response.data.data || []);
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const handleJournalFilterChange = (field, value) => {
    setJournalFilters(prev => ({ ...prev, [field]: value }));
    setJournalPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setJournalPagination(prev => ({ ...prev, current_page: page }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getTransactionTypeColor = (type) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (type) => {
    return type === 'CREDIT' ? faCreditCard : faReceipt;
  };

  const getSourceIcon = (source) => {
    return source === 'fee_payment' ? faDollarSign : faUser;
  };

  const renderJournalEntries = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={journalFilters.search}
              onChange={(e) => handleJournalFilterChange('search', e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={journalFilters.startDate}
              onChange={(e) => handleJournalFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={journalFilters.endDate}
              onChange={(e) => handleJournalFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={journalFilters.transactionType}
              onChange={(e) => handleJournalFilterChange('transactionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Journal Entries</h3>
          <p className="text-sm text-gray-500">All financial transactions recorded in the system</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journalEntries.map((entry) => (
                <tr key={`${entry.source}-${entry.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.student_reg_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getSourceIcon(entry.source)} 
                        className="mr-2 text-gray-400 h-4 w-4" 
                      />
                      {entry.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(entry.transaction_type)}`}>
                      <FontAwesomeIcon 
                        icon={getTransactionTypeIcon(entry.transaction_type)} 
                        className="mr-1 h-3 w-3" 
                      />
                      {entry.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={getTransactionTypeColor(entry.transaction_type)}>
                      {formatCurrency(entry.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.receipt_number || entry.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.created_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && journalEntries.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faFileAlt} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No journal entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {journalFilters.search || journalFilters.startDate || journalFilters.endDate 
                ? 'Try adjusting your filters.' 
                : 'No transactions have been recorded yet.'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading journal entries...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {journalPagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {journalPagination.current_page} of {journalPagination.total_pages} 
            ({journalPagination.total_records} total entries)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(journalPagination.current_page - 1)}
              disabled={journalPagination.current_page === 1}
              className="px-3 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(journalPagination.current_page + 1)}
              disabled={journalPagination.current_page === journalPagination.total_pages}
              className="px-3 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountBalances = () => (
    <div className="space-y-6">
      {/* Currency Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Currency:</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Currencies</option>
            {currencies.map(currency => (
              <option key={currency.id} value={currency.id}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account Balances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Balances</h3>
          <p className="text-sm text-gray-500">Current balances for all chart of accounts</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Account</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">As of Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountBalances.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.parent_account_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {account.balance ? formatCurrency(account.balance, account.currency_symbol) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.currency_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.as_of_date ? formatDate(account.as_of_date) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && accountBalances.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faDollarSign} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No account balances found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No account balances have been recorded yet.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading account balances...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTransactionSummary = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faReceipt} className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Debits</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(transactionSummary.totals.total_debits)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faCreditCard} className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Credits</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(transactionSummary.totals.total_credits)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faDollarSign} className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Amount</p>
              <p className={`text-2xl font-semibold ${transactionSummary.totals.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transactionSummary.totals.net_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaction Summary</h3>
          <p className="text-sm text-gray-500">Summary of all transactions by type</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionSummary.summary.map((item) => (
                <tr key={item.transaction_type} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(item.transaction_type)}`}>
                      <FontAwesomeIcon 
                        icon={getTransactionTypeIcon(item.transaction_type)} 
                        className="mr-1 h-3 w-3" 
                      />
                      {item.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={getTransactionTypeColor(item.transaction_type)}>
                      {formatCurrency(item.total_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {item.transaction_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && transactionSummary.summary.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faFileAlt} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transaction summary available</h3>
            <p className="mt-1 text-sm text-gray-500">
              No transactions have been recorded yet.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading transaction summary...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">General Ledger</h1>
        <p className="text-sm text-gray-600">
          View journal entries, account balances, and financial summaries
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('journal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'journal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
            Journal Entries
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'balances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
            Account Balances
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faReceipt} className="mr-2" />
            Transaction Summary
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'journal' && renderJournalEntries()}
      {activeTab === 'balances' && renderAccountBalances()}
      {activeTab === 'summary' && renderTransactionSummary()}
    </div>
  );
};

export default GeneralLedger;
