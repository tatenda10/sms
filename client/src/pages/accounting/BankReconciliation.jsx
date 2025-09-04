import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faUpload,
  faCheck,
  faTimes,
  faEye,
  faCalendarAlt,
  faMoneyBillWave,
  faBuilding,
  faFileAlt,
  faPlus,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const BankReconciliation = () => {
  const { token } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [selectedBank, setSelectedBank] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showNewReconciliationModal, setShowNewReconciliationModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // State for API data
  const [reconciliations, setReconciliations] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New reconciliation form state
  const [newReconciliation, setNewReconciliation] = useState({
    bank_account_id: '',
    reconciliation_date: new Date().toISOString().split('T')[0],
    bank_balance: '',
    book_balance: '',
    description: ''
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Load data on component mount
  useEffect(() => {
    loadBankReconciliations();
    loadBankAccounts();
  }, []);

  const loadBankReconciliations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/bank-reconciliation`, {
        headers: authHeaders
      });
      setReconciliations(response.data);
    } catch (error) {
      console.error('Error loading reconciliations:', error);
      setError('Failed to load bank reconciliations');
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/bank-reconciliation/accounts`, {
        headers: authHeaders
      });
      setBankAccounts(response.data);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      setError('Failed to load bank accounts');
    }
  };

  const createNewReconciliation = async () => {
    try {
      if (!newReconciliation.bank_account_id || !newReconciliation.bank_balance) {
        setError('Please fill in required fields');
        return;
      }

      const response = await axios.post(`${BASE_URL}/accounting/bank-reconciliation`, newReconciliation, {
        headers: authHeaders
      });
      
      setReconciliations([response.data, ...reconciliations]);
      setShowNewReconciliationModal(false);
      setNewReconciliation({
        bank_account_id: '',
        reconciliation_date: new Date().toISOString().split('T')[0],
        bank_balance: '',
        book_balance: '',
        description: ''
      });
      setError(null);
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      setError(error.response?.data?.error || 'Failed to create reconciliation');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  // Selected reconciliation and details
  const [selectedReconciliationId, setSelectedReconciliationId] = useState('');
  const [currentReconciliation, setCurrentReconciliation] = useState(null);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [systemTransactions, setSystemTransactions] = useState([]);

  // Load reconciliation details when selection changes
  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedReconciliationId) {
        setCurrentReconciliation(null);
        setBankTransactions([]);
        setSystemTransactions([]);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/accounting/bank-reconciliation/${selectedReconciliationId}`, {
          headers: authHeaders
        });
        setCurrentReconciliation(response.data.reconciliation);
        // Map bank_statement_items -> bankTransactions table format
        const bankItems = (response.data.bank_statements || []).map(it => ({
          id: it.id,
          date: it.transaction_date,
          description: it.description,
          reference: it.reference,
          debit: parseFloat(it.amount) < 0 ? Math.abs(parseFloat(it.amount)) : 0,
          credit: parseFloat(it.amount) > 0 ? parseFloat(it.amount) : 0,
          balance: null,
          status: it.is_reconciled ? 'reconciled' : 'unreconciled',
          reconciled_date: it.reconciled_at || null,
        }));
        setBankTransactions(bankItems);

        // Map book_transactions -> systemTransactions table format
        const bookItems = (response.data.book_transactions || []).map(bt => ({
          id: bt.id,
          date: bt.transaction_date || bt.entry_date,
          description: bt.description,
          reference: bt.reference,
          amount: parseFloat(bt.amount || bt.debit || bt.credit || 0),
          type: (parseFloat(bt.amount || 0) >= 0 || parseFloat(bt.credit || 0) > 0) ? 'credit' : 'debit',
          status: bt.is_reconciled ? 'reconciled' : 'unreconciled'
        }));
        setSystemTransactions(bookItems);
      } catch (err) {
        console.error('Error loading reconciliation details:', err);
        setError('Failed to load reconciliation details');
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [selectedReconciliationId]);

  // Filter transactions based on search and filters
  const filteredBankTransactions = bankTransactions.filter(transaction => {
    const matchesBank = selectedBank === 'all' || transaction.bank_id === parseInt(selectedBank);
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBank && matchesSearch;
  });

  const filteredSystemTransactions = systemTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals from reconciliations
  const totalReconciled = reconciliations.filter(r => r.status === 'completed').length;
  const totalUnreconciled = reconciliations.filter(r => r.status === 'open').length;
  const totalBalance = bankAccounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);

  const handleReconcile = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReconcileModal(true);
  };

  const confirmReconciliation = () => {
    // In a real implementation, this would update the backend
    console.log('Reconciling transaction:', selectedTransaction);
    setShowReconcileModal(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">Bank Reconciliation</h1>
            <p className="text-xs text-gray-500 mt-1">Reconcile bank statements with system transactions</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowNewReconciliationModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>New Reconciliation</span>
            </button>
            <button 
              onClick={loadBankReconciliations}
              className="bg-gray-600 text-white px-3 py-1.5 text-xs hover:bg-gray-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faSync} className="text-xs" />
              <span>Refresh</span>
            </button>
            <button className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1">
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Reconciled</p>
              <p className="text-lg font-semibold text-gray-900">{totalReconciled}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faTimes} className="text-yellow-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Unreconciled</p>
              <p className="text-lg font-semibold text-gray-900">{totalUnreconciled}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-blue-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total Balance</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faBuilding} className="text-purple-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Banks</p>
              <p className="text-lg font-semibold text-gray-900">{bankAccounts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reconciliation</label>
            <select
              value={selectedReconciliationId}
              onChange={(e) => setSelectedReconciliationId(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Select Reconciliation</option>
              {reconciliations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.reconciliation_date} - {r.account_name || r.bank_account_id} ({r.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="all">All Banks</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1">
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bank Transactions */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Bank Statement Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBankTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.date}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.description}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.reference}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {transaction.debit > 0 ? `KES ${transaction.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {transaction.credit > 0 ? `KES ${transaction.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">KES {transaction.balance.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'reconciled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'reconciled' ? 'Reconciled' : 'Unreconciled'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleReconcile(transaction)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Transactions */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">System Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSystemTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.date}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.description}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{transaction.reference}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">KES {transaction.amount.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.type === 'credit' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'reconciled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'reconciled' ? 'Reconciled' : 'Unreconciled'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-1">
                      <button className="text-blue-600 hover:text-blue-800 text-xs">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* New Reconciliation Modal */}
      {showNewReconciliationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">New Bank Reconciliation</h2>
              <button
                onClick={() => setShowNewReconciliationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account *</label>
                <select
                  value={newReconciliation.bank_account_id}
                  onChange={(e) => setNewReconciliation({...newReconciliation, bank_account_id: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name} ({account.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reconciliation Date *</label>
                <input
                  type="date"
                  value={newReconciliation.reconciliation_date}
                  onChange={(e) => setNewReconciliation({...newReconciliation, reconciliation_date: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bank Balance *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newReconciliation.bank_balance}
                  onChange={(e) => setNewReconciliation({...newReconciliation, bank_balance: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Book Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={newReconciliation.book_balance}
                  onChange={(e) => setNewReconciliation({...newReconciliation, book_balance: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newReconciliation.description}
                  onChange={(e) => setNewReconciliation({...newReconciliation, description: e.target.value})}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewReconciliationModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewReconciliation}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs hover:bg-blue-700"
              >
                Create Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {showReconcileModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Reconcile Transaction</h2>
              <button
                onClick={() => setShowReconcileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <p className="text-xs text-gray-900">{selectedTransaction.description}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                <p className="text-xs text-gray-900">{selectedTransaction.reference}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                <p className="text-xs text-gray-900">
                  {selectedTransaction.debit > 0 ? `KES ${selectedTransaction.debit.toLocaleString()}` : 
                   selectedTransaction.credit > 0 ? `KES ${selectedTransaction.credit.toLocaleString()}` : '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <p className="text-xs text-gray-900">{selectedTransaction.date}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReconcileModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReconciliation}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800"
              >
                Reconcile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;
