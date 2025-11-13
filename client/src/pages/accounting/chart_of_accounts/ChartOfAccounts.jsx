import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Chart of Accounts</h1>
          <button
            className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            style={{ borderRadius: 0 }}
            onClick={() => setShowAddModal(true)}
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-xs text-green-800">
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

      {/* Card/Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700">Accounts List</h3>
        </div>
        <div className="border-t border-gray-200">
          {loading ? (
            <div className="p-6 text-xs ">Loading accounts...</div>
          ) : error ? (
            <div className="p-6 text-xs text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Type</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Parent</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{acc.code}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{acc.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{acc.type}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{acc.parent_id || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={acc.is_active ? 'text-gray-700' : 'text-gray-400'}>
                          {acc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Link
                            to={`/dashboard/accounting/chart-of-accounts/view/${acc.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                            style={{ borderRadius: 0 }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openOpeningBalanceModal(acc)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            style={{ borderRadius: 0 }}
                            title="Add Opening Balance"
                          >
                            Opening Balance
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Opening Balance Modal */}
      {showOpeningBalanceModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white border border-gray-300 w-full max-w-md p-0" style={{ borderRadius: 0 }}>
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-800">
                Add Opening Balance - {selectedAccount.code} - {selectedAccount.name}
              </h2>
              <button 
                className="text-xs text-gray-500 hover:text-gray-800" 
                onClick={() => setShowOpeningBalanceModal(false)} 
                style={{ borderRadius: 0 }}
              >
                ✕
              </button>
            </div>
            <form className="px-6 py-4" onSubmit={handleOpeningBalanceSubmit}>
              <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4">
                <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Use This ONLY for Opening Balances</p>
                <p className="text-xs text-yellow-700">
                  This feature is for recording historical balances that existed BEFORE the system was implemented. 
                  Do NOT use this for mid-term adjustments.
                </p>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account
                </label>
                <input
                  type="text"
                  value={`${selectedAccount.code} - ${selectedAccount.name} (${selectedAccount.type})`}
                  readOnly
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 bg-gray-100"
                  style={{ borderRadius: 0 }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Balance Type <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({selectedAccount.type === 'Asset' || selectedAccount.type === 'Expense' 
                      ? 'Debit = Positive, Credit = Negative' 
                      : 'Credit = Positive, Debit = Negative'})
                  </span>
                </label>
                <select
                  name="balance_type"
                  value={openingBalanceForm.balance_type}
                  onChange={handleOpeningBalanceChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={openingBalanceForm.amount}
                  onChange={handleOpeningBalanceChange}
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  name="currency_id"
                  value={openingBalanceForm.currency_id}
                  onChange={handleOpeningBalanceChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name} {currency.base_currency && '(Base)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Opening Balance Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="opening_balance_date"
                  value={openingBalanceForm.opening_balance_date}
                  onChange={handleOpeningBalanceChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={openingBalanceForm.description}
                  onChange={handleOpeningBalanceChange}
                  rows="2"
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  required
                  placeholder="e.g., Opening Balance - Historical balance from previous system"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={openingBalanceForm.reference}
                  onChange={handleOpeningBalanceChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
                  style={{ borderRadius: 0 }}
                  placeholder="Auto-generated if left blank"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This will create a journal entry using Retained Earnings (3998) 
                  as the offsetting account. This ensures historical balances don't affect current period 
                  financial statements.
                </p>
              </div>

              {openingBalanceError && (
                <div className="text-xs text-red-600 mb-3">{openingBalanceError}</div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 border border-gray-300 mr-2"
                  style={{ borderRadius: 0 }}
                  onClick={() => setShowOpeningBalanceModal(false)}
                  disabled={openingBalanceLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  style={{ borderRadius: 0 }}
                  disabled={openingBalanceLoading}
                >
                  {openingBalanceLoading ? 'Creating...' : 'Create Opening Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
