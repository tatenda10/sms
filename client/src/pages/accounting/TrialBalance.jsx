import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faCalendarAlt, 
  faBalanceScale,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faSave,
  faFolderOpen,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const TrialBalance = () => {
  const { token } = useAuth();
  const [trialBalance, setTrialBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Save/Load Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportTags, setReportTags] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReportsForComparison, setSelectedReportsForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparisonView, setShowComparisonView] = useState(false);

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

  const handleSaveReport = async () => {
    if (!trialBalance) {
      setError('Please generate a trial balance first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    setReportName(`Trial Balance - ${new Date(asOfDate).toLocaleDateString()}`);
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/accounting/saved-reports`, {
        report_type: 'trial_balance',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: asOfDate,
        period_end_date: asOfDate,
        report_data: trialBalance,
        report_summary: {
          total_debit: trialBalance.totals.total_debit,
          total_credit: trialBalance.totals.total_credit,
          is_balanced: trialBalance.is_balanced,
          difference: trialBalance.totals.difference
        },
        tags: reportTags
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Report saved successfully!');
      setShowSaveModal(false);
      setReportName('');
      setReportDescription('');
      setReportTags('');
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.response?.data?.error || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    setLoadingReports(true);
    setError('');
    try {
      console.log('📂 Loading saved reports...');
      console.log('URL:', `${BASE_URL}/accounting/saved-reports`);
      
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'trial_balance' },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Response:', response.data);
      setSavedReports(response.data.data.reports);
      setShowLoadModal(true);
    } catch (err) {
      console.error('❌ Error loading saved reports:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);
      setError(err.response?.data?.error || err.message || 'Failed to load saved reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const report = response.data.data;
      setTrialBalance(report.report_data);
      setAsOfDate(report.period_start_date);
      setShowLoadModal(false);
      setShowComparisonView(false);
      setSuccess(`Loaded: ${report.report_name}`);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const openCompareModal = async () => {
    setLoadingReports(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'trial_balance' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedReports(response.data.data.reports);
      setSelectedReportsForComparison([]);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Error loading saved reports:', err);
      setError(err.response?.data?.error || 'Failed to load saved reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReportsForComparison(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        // Limit to 5 reports for comparison
        if (prev.length >= 5) {
          setError('You can only compare up to 5 reports at once');
          return prev;
        }
        return [...prev, reportId];
      }
    });
  };

  const compareReports = async () => {
    if (selectedReportsForComparison.length < 2) {
      setError('Please select at least 2 reports to compare');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch all selected reports
      const reportPromises = selectedReportsForComparison.map(id =>
        axios.get(`${BASE_URL}/accounting/saved-reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const responses = await Promise.all(reportPromises);
      const reports = responses.map(r => r.data.data);

      // Build comparison data
      const allAccounts = new Map();
      
      reports.forEach((report, idx) => {
        report.report_data.trial_balance.forEach(account => {
          if (!allAccounts.has(account.account_code)) {
            allAccounts.set(account.account_code, {
              account_code: account.account_code,
              account_name: account.account_name,
              type: account.type,
              balances: []
            });
          }
          
          const accountData = allAccounts.get(account.account_code);
          accountData.balances[idx] = {
            debit: account.debit_balance,
            credit: account.credit_balance,
            balance: account.balance
          };
        });
      });

      // Fill missing balances with zeros
      allAccounts.forEach(account => {
        for (let i = 0; i < reports.length; i++) {
          if (!account.balances[i]) {
            account.balances[i] = { debit: 0, credit: 0, balance: 0 };
          }
        }
      });

      setComparisonData({
        reports: reports.map(r => ({
          id: r.id,
          name: r.report_name,
          date: r.period_start_date,
          totals: r.report_data.totals
        })),
        accounts: Array.from(allAccounts.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} trial balance reports`);
    } catch (err) {
      console.error('Error comparing reports:', err);
      setError('Failed to load reports for comparison');
    } finally {
      setLoading(false);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-end">
            <button
              onClick={handleSaveReport}
              disabled={loading || !trialBalance}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faSave} className="mr-1" />
              Save Report
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadSavedReports}
              disabled={loadingReports}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faFolderOpen} className="mr-1" />
              Load Report
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={openCompareModal}
              disabled={loadingReports}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faBalanceScale} className="mr-1" />
              Compare Reports
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

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-xs" />
          <span className="text-xs">{success}</span>
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

      {/* Comparison View */}
      {showComparisonView && comparisonData && (
        <div className="bg-white border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">
              Trial Balance Comparison ({comparisonData.reports.length} Reports)
            </h2>
            <button
              onClick={() => setShowComparisonView(false)}
              className="text-xs px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-1" />
              Close Comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Code</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Account Name</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Type</th>
                  {comparisonData.reports.map((report, idx) => (
                    <th key={idx} className="px-4 py-3 text-right font-semibold text-gray-700 border-l border-gray-300 bg-gray-100">
                      <div className="font-bold">{report.name}</div>
                      <div className="text-xs font-normal text-gray-600 mt-1">
                        {new Date(report.date).toLocaleDateString()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {comparisonData.accounts.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-900 font-mono border-r border-gray-200">{account.account_code}</td>
                    <td className="px-3 py-2.5 text-gray-900 border-r border-gray-200">{account.account_name}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        account.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                        account.type === 'Liability' ? 'bg-red-100 text-red-800' :
                        account.type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                        account.type === 'Revenue' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    {account.balances.map((balance, bidx) => (
                      <td key={bidx} className={`px-4 py-2.5 text-right font-mono border-l border-gray-200 ${
                        balance.balance < 0 ? 'text-red-600' : balance.balance > 0 ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        <span className="font-semibold">
                          {balance.balance < 0 
                            ? `(${formatCurrency(Math.abs(balance.balance))})`
                            : formatCurrency(balance.balance)
                          }
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr className="border-b border-gray-200">
                  <td colSpan="3" className="px-3 py-3 text-gray-900 text-sm">Total Debits</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono text-sm border-l border-gray-300">
                      {formatCurrency(report.totals.total_debit)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td colSpan="3" className="px-3 py-3 text-gray-900 text-sm">Total Credits</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-3 text-right font-mono text-sm border-l border-gray-300">
                      {formatCurrency(report.totals.total_credit)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan="3" className="px-3 py-3 text-gray-900 text-sm">Difference</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className={`px-4 py-3 text-right font-mono text-sm border-l border-gray-300 ${
                      report.totals.difference === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(report.totals.difference)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      {trialBalance && !showComparisonView && (
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

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Save Trial Balance</h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Trial Balance - October 2024"
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Add any notes or description..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={reportTags}
                  onChange={(e) => setReportTags(e.target.value)}
                  placeholder="e.g., monthly, approved, october"
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReport}
                  disabled={loading || !reportName.trim()}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-1" />
                  Save Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Report Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Load Saved Trial Balance</h2>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {savedReports.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faFolderOpen} className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No saved trial balance reports found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadReport(report.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{report.report_name}</h3>
                        {report.report_description && (
                          <p className="text-xs text-gray-600 mt-1">{report.report_description}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span>
                            Date: {new Date(report.period_start_date).toLocaleDateString()}
                          </span>
                          <span>
                            Saved: {new Date(report.saved_at).toLocaleDateString()}
                          </span>
                          {report.report_summary && (
                            <span className={report.report_summary.is_balanced ? 'text-green-600' : 'text-red-600'}>
                              {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
                            </span>
                          )}
                        </div>
                        {report.tags && (
                          <div className="mt-2">
                            {report.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 mr-1">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-4">
                        Load →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Reports Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Compare Trial Balance Reports</h2>
                <p className="text-xs text-gray-600 mt-1">
                  Select 2-5 reports to compare ({selectedReportsForComparison.length} selected)
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {savedReports.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faBalanceScale} className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No saved trial balance reports found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className={`border p-3 cursor-pointer transition-all ${
                        selectedReportsForComparison.includes(report.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleReportSelection(report.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={selectedReportsForComparison.includes(report.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{report.report_name}</h3>
                          {report.report_description && (
                            <p className="text-xs text-gray-600 mt-1">{report.report_description}</p>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>
                              Date: {new Date(report.period_start_date).toLocaleDateString()}
                            </span>
                            <span>
                              Saved: {new Date(report.saved_at).toLocaleDateString()}
                            </span>
                            {report.report_summary && (
                              <span className={report.report_summary.is_balanced ? 'text-green-600' : 'text-red-600'}>
                                {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={compareReports}
                    disabled={selectedReportsForComparison.length < 2}
                    className="flex-1 px-4 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faBalanceScale} className="mr-1" />
                    Compare {selectedReportsForComparison.length} Reports
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

export default TrialBalance;

