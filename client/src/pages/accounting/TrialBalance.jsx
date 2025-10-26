import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faCalendarAlt, 
  faBalanceScale,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const TrialBalance = () => {
  const { token } = useAuth();
  const [trialBalance, setTrialBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/trial-balance`, {
        params: { as_of_date: asOfDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      setTrialBalance(response.data.data);
    } catch (err) {
      console.error('Error fetching trial balance:', err);
      setError(err.response?.data?.message || 'Failed to fetch trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/trial-balance/export`, {
        params: { as_of_date: asOfDate },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trial_balance_${asOfDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting trial balance:', err);
      setError('Failed to export trial balance');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatBalance = (balance) => {
    const absBalance = Math.abs(balance);
    const type = balance < 0 ? 'CR' : 'DR';
    return (
      <span className={balance < 0 ? 'text-green-600' : 'text-red-600'}>
        {formatCurrency(absBalance)} {type}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Trial Balance</h1>
        <p className="text-xs text-gray-600">View account balances and verify books are balanced</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchTrialBalance}
              disabled={loading}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
                  Loading...
                </>
              ) : (
                'Generate Trial Balance'
              )}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={loading || !trialBalance}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-xs" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Trial Balance Status */}
      {trialBalance && (
        <div className={`border p-3 mb-4 ${
          trialBalance.is_balanced 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={trialBalance.is_balanced ? faCheckCircle : faExclamationTriangle} 
                className={`text-lg mr-2 ${
                  trialBalance.is_balanced ? 'text-green-600' : 'text-red-600'
                }`}
              />
              <div>
                <h3 className={`text-sm font-semibold ${
                  trialBalance.is_balanced ? 'text-green-900' : 'text-red-900'
                }`}>
                  {trialBalance.is_balanced ? 'Books are Balanced' : 'Books are NOT Balanced'}
                </h3>
                <p className={`text-xs ${trialBalance.is_balanced ? 'text-green-700' : 'text-red-700'}`}>
                  {trialBalance.is_balanced 
                    ? 'Total debits equal total credits' 
                    : `Difference: ${formatCurrency(Math.abs(trialBalance.totals.difference))}`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">As of</div>
              <div className="text-sm font-semibold text-gray-900">
                {new Date(trialBalance.as_of_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      {trialBalance && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">
                    Account Code
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">
                    Account Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">
                    Debit
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">
                    Credit
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trialBalance.trial_balance.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">
                      {account.account_code}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {account.account_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        account.account_type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                        account.account_type === 'Liability' ? 'bg-red-100 text-red-800' :
                        account.account_type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                        account.account_type === 'Revenue' ? 'bg-green-100 text-green-800' :
                        account.account_type === 'Expense' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-red-600">
                      {account.total_debit > 0 ? formatCurrency(account.total_debit) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-green-600">
                      {account.total_credit > 0 ? formatCurrency(account.total_credit) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium">
                      {formatBalance(account.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="3" className="px-3 py-2 text-xs font-bold text-gray-900">
                    <FontAwesomeIcon icon={faBalanceScale} className="mr-1" />
                    Total
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-red-600">
                    {formatCurrency(trialBalance.totals.total_debit)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-green-600">
                    {formatCurrency(trialBalance.totals.total_credit)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-gray-900">
                    {trialBalance.totals.difference !== 0 ? formatCurrency(Math.abs(trialBalance.totals.difference)) : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Empty State */}
          {trialBalance.trial_balance.length === 0 && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faBalanceScale} className="text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No account activity found for this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrialBalance;

