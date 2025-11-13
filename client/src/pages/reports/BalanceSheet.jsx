import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBalanceScale, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faSave,
  faFolderOpen,
  faTimes,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const BalanceSheet = () => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('monthly'); // monthly | custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [data, setData] = useState(null);

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

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(absAmount);
    
    // Use parentheses for negative values
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (reportType === 'monthly') {
        const resp = await axios.get(`${BASE_URL}/accounting/balance-sheet/month/${selectedMonth}/year/${selectedYear}`, {
          headers: authHeaders
        });
        setData(resp.data);
      } else if (reportType === 'custom') {
        if (!customEnd) {
          setError('Please select an as-of end date');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ end: customEnd }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/balance-sheet/range?${params}`, {
          headers: authHeaders
        });
        setData(resp.data);
      }
    } catch (e) {
      console.error('Error loading balance sheet:', e);
      setError(e.response?.data?.error || 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const totals = data?.totals || { total_assets: 0, total_liabilities: 0, total_equity: 0 };
  const totalLiabilitiesAndEquity = (totals.total_liabilities || 0) + (totals.total_equity || 0);

  const handleSaveReport = async () => {
    if (!data) {
      setError('Please generate a balance sheet first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Balance Sheet - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      periodName = `Balance Sheet - As of ${customEnd}`;
    }
    setReportName(periodName);
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/accounting/saved-reports`, {
        report_type: 'balance_sheet',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? customEnd : null,
        period_end_date: reportType === 'custom' ? customEnd : null,
        report_data: data,
        report_summary: {
          total_assets: totals.total_assets,
          total_liabilities: totals.total_liabilities,
          total_equity: totals.total_equity,
          is_balanced: Math.abs((totals.total_assets || 0) - totalLiabilitiesAndEquity) < 0.01
        },
        tags: reportTags
      }, {
        headers: authHeaders
      });

      setSuccess('Report saved successfully!');
      setShowSaveModal(false);
      setReportName('');
      setReportDescription('');
      setReportTags('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.response?.data?.error || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'balance_sheet' },
        headers: authHeaders
      });
      setSavedReports(response.data.data.reports);
      setShowLoadModal(true);
    } catch (err) {
      console.error('Error loading saved reports:', err);
      setError(err.response?.data?.error || 'Failed to load saved reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports/${reportId}`, {
        headers: authHeaders
      });

      const report = response.data.data;
      setData(report.report_data);
      setShowLoadModal(false);
      setShowComparisonView(false);
      setSuccess(`Loaded: ${report.report_name}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const openCompareModal = async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'balance_sheet' },
        headers: authHeaders
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
        if (prev.length >= 5) {
          setError('You can only compare up to 5 reports at once');
          setTimeout(() => setError(null), 3000);
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
      setError(null);

      const reportPromises = selectedReportsForComparison.map(id =>
        axios.get(`${BASE_URL}/accounting/saved-reports/${id}`, {
          headers: authHeaders
        })
      );

      const responses = await Promise.all(reportPromises);
      const reports = responses.map(r => r.data.data);

      // Build comparison data for all account types
      const allAssets = new Map();
      const allLiabilities = new Map();
      const allEquity = new Map();
      
      reports.forEach((report, idx) => {
        // Process all asset categories
        ['current_assets', 'fixed_assets', 'other_assets'].forEach(category => {
          if (report.report_data[category]) {
            report.report_data[category].forEach(account => {
              if (!allAssets.has(account.account_code)) {
                allAssets.set(account.account_code, {
                  account_code: account.account_code,
                  account_name: account.account_name,
                  category: category,
                  amounts: []
                });
              }
              allAssets.get(account.account_code).amounts[idx] = account.balance || 0;
            });
          }
        });

        // Process all liability categories
        ['current_liabilities', 'long_term_liabilities'].forEach(category => {
          if (report.report_data[category]) {
            report.report_data[category].forEach(account => {
              if (!allLiabilities.has(account.account_code)) {
                allLiabilities.set(account.account_code, {
                  account_code: account.account_code,
                  account_name: account.account_name,
                  category: category,
                  amounts: []
                });
              }
              allLiabilities.get(account.account_code).amounts[idx] = account.balance || 0;
            });
          }
        });

        // Process equity
        if (report.report_data.equity) {
          report.report_data.equity.forEach(account => {
            if (!allEquity.has(account.account_code)) {
              allEquity.set(account.account_code, {
                account_code: account.account_code,
                account_name: account.account_name,
                amounts: []
              });
            }
            allEquity.get(account.account_code).amounts[idx] = account.balance || 0;
          });
        }
      });

      // Fill missing amounts with zeros
      [allAssets, allLiabilities, allEquity].forEach(map => {
        map.forEach(account => {
          for (let i = 0; i < reports.length; i++) {
            if (!account.amounts[i]) account.amounts[i] = 0;
          }
        });
      });

      setComparisonData({
        reports: reports.map(r => ({
          id: r.id,
          name: r.report_name,
          date: r.period_start_date || 'N/A',
          totals: r.report_data.totals
        })),
        assets: Array.from(allAssets.values()),
        liabilities: Array.from(allLiabilities.values()),
        equity: Array.from(allEquity.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} balance sheets`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error comparing reports:', err);
      setError('Failed to load reports for comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-xs text-gray-600">Financial Position Report</p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={handleSaveReport}
              disabled={!data}
              className="bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 text-xs font-medium justify-center"
            >
              <FontAwesomeIcon icon={faSave} />
              <span>Save</span>
            </button>
            <button 
              onClick={loadSavedReports}
              disabled={loadingReports}
              className="bg-purple-600 text-white px-3 py-1.5 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 text-xs font-medium justify-center"
            >
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>Load</span>
            </button>
            <button 
              onClick={openCompareModal}
              disabled={loadingReports}
              className="bg-orange-600 text-white px-3 py-1.5 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 text-xs font-medium justify-center"
            >
              <FontAwesomeIcon icon={faBalanceScale} />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faFilter} className="mr-1" />
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="monthly">Monthly</option>
                <option value="custom">Custom (As of Date)</option>
              </select>
            </div>

            {reportType === 'monthly' && (
              <>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                  </select>
                </div>
              </>
            )}

            {reportType === 'custom' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                  As of Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-900 text-white px-4 py-1.5 hover:bg-gray-800 disabled:opacity-50 text-xs font-medium"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-1" />
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 p-3 mb-4 text-xs text-green-700">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
          {success}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-600 text-xs">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          Loading balance sheet...
        </div>
      )}

      {/* Comparison View */}
      {showComparisonView && comparisonData && !loading && (
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">
              Balance Sheet Comparison ({comparisonData.reports.length} Reports)
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
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-r border-gray-300 w-24">Code</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 border-r border-gray-300">Account Name</th>
                  {comparisonData.reports.map((report, idx) => (
                    <th key={idx} className="px-4 py-3 text-right font-semibold text-gray-700 border-l border-gray-300 bg-gray-100 min-w-[140px]">
                      <div className="font-bold text-sm">{report.name}</div>
                      <div className="text-xs font-normal text-gray-600 mt-1">
                        {report.date !== 'N/A' ? new Date(report.date).toLocaleDateString() : report.date}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* Assets Section */}
                <tr className="bg-gray-100">
                  <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t border-b border-gray-300">
                    ASSETS
                  </td>
                </tr>
                {comparisonData.assets.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 border-r border-gray-200">{account.account_code}</td>
                    <td className="px-3 py-2 text-gray-700 border-r border-gray-200">{account.account_name}</td>
                    {account.amounts.map((amount, aidx) => (
                      <td key={aidx} className="px-4 py-2 text-right tabular-nums border-l border-gray-200 text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold border-t border-gray-300">
                  <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Assets</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                      {formatCurrency(report.totals.total_assets)}
                    </td>
                  ))}
                </tr>

                {/* Liabilities Section */}
                <tr className="bg-gray-100">
                  <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t-2 border-b border-gray-300">
                    LIABILITIES
                  </td>
                </tr>
                {comparisonData.liabilities.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 border-r border-gray-200">{account.account_code}</td>
                    <td className="px-3 py-2 text-gray-700 border-r border-gray-200">{account.account_name}</td>
                    {account.amounts.map((amount, aidx) => (
                      <td key={aidx} className="px-4 py-2 text-right tabular-nums border-l border-gray-200 text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold border-t border-gray-300">
                  <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Liabilities</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                      {formatCurrency(report.totals.total_liabilities)}
                    </td>
                  ))}
                </tr>

                {/* Equity Section */}
                <tr className="bg-gray-100">
                  <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t-2 border-b border-gray-300">
                    EQUITY
                  </td>
                </tr>
                {comparisonData.equity.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 border-r border-gray-200">{account.account_code}</td>
                    <td className="px-3 py-2 text-gray-700 border-r border-gray-200">{account.account_name}</td>
                    {account.amounts.map((amount, aidx) => (
                      <td key={aidx} className="px-4 py-2 text-right tabular-nums border-l border-gray-200 text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold border-t border-gray-300">
                  <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Equity</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                      {formatCurrency(report.totals.total_equity)}
                    </td>
                  ))}
                </tr>

                {/* Total Liabilities & Equity */}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                  <td colSpan="2" className="px-3 py-3 text-gray-900 text-sm border-r border-gray-300">Total Liabilities & Equity</td>
                  {comparisonData.reports.map((report, idx) => (
                    <td key={idx} className="px-4 py-3 text-right tabular-nums text-sm border-l border-gray-300 text-gray-900">
                      {formatCurrency((report.totals.total_liabilities || 0) + (report.totals.total_equity || 0))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !data && !error && !showComparisonView && (
        <div className="bg-white border border-gray-200 p-8 text-center">
          <FontAwesomeIcon icon={faBalanceScale} className="text-gray-400 text-4xl mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Balance Sheet Data</h3>
          <p className="text-gray-500 text-xs">Choose filters and click Generate Report.</p>
        </div>
      )}

      {!loading && !error && data && !showComparisonView && (
        <div className="bg-white border border-gray-200 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">BALANCE SHEET</h2>
            <p className="text-xs text-gray-600 mt-1">
              {data.period?.period_name ? `${data.period.period_name} (As of ${data.period.end_date})` : (data.as_of_date ? `As of ${data.as_of_date}` : '')}
            </p>
            {/* Period Status Badge */}
            {data.period && (
              <div className="mt-2">
                {data.period.is_closed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-600 text-white">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Period Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    Period Open
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-4">
            {/* ASSETS SECTION */}
            <div className="mb-6">
              <div className="bg-gray-100 px-3 py-1.5 mb-2">
                <h3 className="text-xs font-bold text-gray-900">ASSETS</h3>
              </div>

              {/* Current Assets */}
              {(data.current_assets && data.current_assets.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Current Assets</h4>
                  {data.current_assets.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                      <span className="text-xs text-gray-600">{item.account_name}</span>
                      <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1 px-3 border-t border-gray-300 mt-1">
                    <span className="text-xs font-semibold text-gray-900">Total Current Assets</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(totals.total_current_assets || 0)}</span>
                  </div>
                </div>
              )}

              {/* Fixed Assets */}
              {(data.fixed_assets && data.fixed_assets.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Fixed Assets</h4>
                  {data.fixed_assets.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                      <span className="text-xs text-gray-600">{item.account_name}</span>
                      <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1 px-3 border-t border-gray-300 mt-1">
                    <span className="text-xs font-semibold text-gray-900">Total Fixed Assets</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(totals.total_fixed_assets || 0)}</span>
                  </div>
                </div>
              )}

              {/* Other Assets */}
              {(data.other_assets && data.other_assets.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Other Assets</h4>
                  {data.other_assets.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                      <span className="text-xs text-gray-600">{item.account_name}</span>
                      <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1 px-3 border-t border-gray-300 mt-1">
                    <span className="text-xs font-semibold text-gray-900">Total Other Assets</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(totals.total_other_assets || 0)}</span>
                  </div>
                </div>
              )}

              {/* TOTAL ASSETS */}
              <div className="flex justify-between items-center py-2 px-3 bg-gray-200 border-y border-gray-300">
                <span className="text-xs font-bold text-gray-900">TOTAL ASSETS</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_assets)}</span>
              </div>
            </div>

            {/* LIABILITIES SECTION */}
            <div className="mb-6">
              <div className="bg-gray-100 px-3 py-1.5 mb-2">
                <h3 className="text-xs font-bold text-gray-900">LIABILITIES</h3>
              </div>

              {/* Current Liabilities */}
              {(data.current_liabilities && data.current_liabilities.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Current Liabilities</h4>
                  {data.current_liabilities.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                      <span className="text-xs text-gray-600">{item.account_name}</span>
                      <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1 px-3 border-t border-gray-300 mt-1">
                    <span className="text-xs font-semibold text-gray-900">Total Current Liabilities</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(totals.total_current_liabilities || 0)}</span>
                  </div>
                </div>
              )}

              {/* Long-term Liabilities */}
              {(data.long_term_liabilities && data.long_term_liabilities.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Long-term Liabilities</h4>
                  {data.long_term_liabilities.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                      <span className="text-xs text-gray-600">{item.account_name}</span>
                      <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1 px-3 border-t border-gray-300 mt-1">
                    <span className="text-xs font-semibold text-gray-900">Total Long-term Liabilities</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(totals.total_long_term_liabilities || 0)}</span>
                  </div>
                </div>
              )}

              {/* TOTAL LIABILITIES */}
              <div className="flex justify-between items-center py-2 px-3 bg-gray-200 border-y border-gray-300">
                <span className="text-xs font-bold text-gray-900">TOTAL LIABILITIES</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_liabilities)}</span>
              </div>
            </div>

            {/* EQUITY SECTION */}
            <div className="mb-6">
              <div className="bg-gray-100 px-3 py-1.5 mb-2">
                <h3 className="text-xs font-bold text-gray-900">EQUITY</h3>
              </div>

              {(data.equity || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 hover:bg-gray-50">
                  <span className="text-xs text-gray-600">{item.account_name}</span>
                  <span className="text-xs text-gray-900">{formatCurrency(item.balance)}</span>
                </div>
              ))}
              
              {/* TOTAL EQUITY */}
              <div className="flex justify-between items-center py-2 px-3 bg-gray-200 border-y border-gray-300 mt-2">
                <span className="text-xs font-bold text-gray-900">TOTAL EQUITY</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_equity)}</span>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div className="flex justify-between items-center py-2 px-3 bg-gray-300 border-y-2 border-gray-400">
              <span className="text-xs font-bold text-gray-900">TOTAL LIABILITIES & EQUITY</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrency(totalLiabilitiesAndEquity)}</span>
            </div>

            {/* Balance Check Indicator */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              {Math.abs(totals.total_assets - totalLiabilitiesAndEquity) < 0.01 ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-xs font-medium">Balance Sheet is Balanced</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-xs font-medium">
                    Out of Balance: {formatCurrency(Math.abs(totals.total_assets - totalLiabilitiesAndEquity))} difference
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Save Balance Sheet</h2>
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
                  placeholder="e.g., Balance Sheet - October 2024"
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
              <h2 className="text-lg font-bold text-gray-900">Load Saved Balance Sheet</h2>
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
                <p className="text-gray-500 text-sm">No saved balance sheets found</p>
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
                            Saved: {new Date(report.saved_at).toLocaleDateString()}
                          </span>
                          {report.report_summary && (
                            <span className={report.report_summary.is_balanced ? 'text-green-600' : 'text-red-600'}>
                              {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Out of Balance'}
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
                <h2 className="text-lg font-bold text-gray-900">Compare Balance Sheets</h2>
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
                <p className="text-gray-500 text-sm">No saved balance sheets found</p>
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
                              Saved: {new Date(report.saved_at).toLocaleDateString()}
                            </span>
                            {report.report_summary && (
                              <span className={report.report_summary.is_balanced ? 'text-green-600' : 'text-red-600'}>
                                {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Out of Balance'}
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

export default BalanceSheet;
