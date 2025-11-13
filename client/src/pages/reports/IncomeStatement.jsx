import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faArrowUp,
  faArrowDown,
  faSpinner,
  faExclamationTriangle,
  faSave,
  faFolderOpen,
  faTimes,
  faCheckCircle,
  faBalanceScale
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const IncomeStatement = () => {
  const { token } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('monthly'); // monthly, quarterly, ytd, custom
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  
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

  // Fetch available periods on component mount
  useEffect(() => {
    fetchAvailablePeriods();
  }, []);

  // Remove automatic data fetching - only load when search button is clicked

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const handleSearch = () => {
    if (reportType === 'monthly') {
      fetchIncomeStatement();
    } else if (reportType === 'quarterly') {
      fetchQuarterlyIncomeStatement();
    } else if (reportType === 'ytd') {
      fetchYearToDateIncomeStatement();
    } else if (reportType === 'custom') {
      fetchCustomRange();
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/periods`, {
        headers: authHeaders
      });
      setAvailablePeriods(response.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/month/${selectedMonth}/year/${selectedYear}` , {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching income statement:', error);
      setError('Failed to load income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterlyIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/year/${selectedYear}/quarter/${selectedQuarter}`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching quarterly income statement:', error);
      setError('Failed to load quarterly income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearToDateIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/year/${selectedYear}/ytd`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching year-to-date income statement:', error);
      setError('Failed to load year-to-date income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRange = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      if (!customStart || !customEnd) {
        throw new Error('Please select start and end dates');
      }
      const params = new URLSearchParams({ start: customStart, end: customEnd }).toString();
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/range?${params}`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching custom range income statement:', error);
      setError(error.response?.data?.error || 'Failed to load custom range income statement');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0.00%';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const handleSaveReport = async () => {
    if (!incomeStatementData) {
      setError('Please generate an income statement first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Income Statement - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (reportType === 'quarterly') {
      periodName = `Income Statement - Q${selectedQuarter} ${selectedYear}`;
    } else if (reportType === 'ytd') {
      periodName = `Income Statement - ${selectedYear} YTD`;
    } else {
      periodName = `Income Statement - ${customStart} to ${customEnd}`;
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
        report_type: 'income_statement',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? customStart : null,
        period_end_date: reportType === 'custom' ? customEnd : null,
        report_data: incomeStatementData,
        report_summary: {
          total_revenue: incomeStatementData.totals?.total_revenue,
          total_expenses: incomeStatementData.totals?.total_expenses,
          net_income: incomeStatementData.totals?.net_income
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
        params: { report_type: 'income_statement' },
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
      setIncomeStatementData(report.report_data);
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
        params: { report_type: 'income_statement' },
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

      // Build comparison data
      const allRevenueAccounts = new Map();
      const allExpenseAccounts = new Map();
      
      reports.forEach((report, idx) => {
        // Process revenue
        report.report_data.revenue.forEach(account => {
          if (!allRevenueAccounts.has(account.account_code)) {
            allRevenueAccounts.set(account.account_code, {
              account_code: account.account_code,
              account_name: account.account_name,
              amounts: []
            });
          }
          allRevenueAccounts.get(account.account_code).amounts[idx] = account.amount || 0;
        });

        // Process expenses
        report.report_data.expenses.forEach(account => {
          if (!allExpenseAccounts.has(account.account_code)) {
            allExpenseAccounts.set(account.account_code, {
              account_code: account.account_code,
              account_name: account.account_name,
              amounts: []
            });
          }
          allExpenseAccounts.get(account.account_code).amounts[idx] = account.amount || 0;
        });
      });

      // Fill missing amounts with zeros
      allRevenueAccounts.forEach(account => {
        for (let i = 0; i < reports.length; i++) {
          if (!account.amounts[i]) account.amounts[i] = 0;
        }
      });
      allExpenseAccounts.forEach(account => {
        for (let i = 0; i < reports.length; i++) {
          if (!account.amounts[i]) account.amounts[i] = 0;
        }
      });

      setComparisonData({
        reports: reports.map(r => ({
          id: r.id,
          name: r.report_name,
          date: r.period_start_date || 'N/A',
          totals: r.report_data.totals
        })),
        revenue: Array.from(allRevenueAccounts.values()),
        expenses: Array.from(allExpenseAccounts.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} income statements`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error comparing reports:', err);
      setError('Failed to load reports for comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-2 md:px-4 lg:px-6 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Income Statement</h1>
              <p className="text-xs text-gray-600 mt-1">Profit & Loss Report</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <button 
                onClick={handleSaveReport}
                disabled={!incomeStatementData}
                className="bg-blue-600 text-white px-2 md:px-3 py-1.5 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2 text-xs font-medium justify-center"
              >
                <FontAwesomeIcon icon={faSave} />
                <span>Save</span>
              </button>
              <button 
                onClick={loadSavedReports}
                disabled={loadingReports}
                className="bg-purple-600 text-white px-2 md:px-3 py-1.5 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2 text-xs font-medium justify-center"
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>Load</span>
              </button>
              <button 
                onClick={openCompareModal}
                disabled={loadingReports}
                className="bg-orange-600 text-white px-2 md:px-3 py-1.5 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2 text-xs font-medium justify-center"
              >
                <FontAwesomeIcon icon={faBalanceScale} />
                <span>Compare</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-2 md:px-4 lg:px-6 py-3">
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 flex-1">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">Report Type:</span>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="ytd">Year-to-Date</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {reportType === 'monthly' && (
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                  <span className="text-xs font-medium text-gray-700">Month:</span>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
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
              )}
              
              {reportType === 'quarterly' && (
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                  <span className="text-xs font-medium text-gray-700">Quarter:</span>
                  <select 
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                  >
                    <option value={1}>Q1 (Jan - Mar)</option>
                    <option value={2}>Q2 (Apr - Jun)</option>
                    <option value={3}>Q3 (Jul - Sep)</option>
                    <option value={4}>Q4 (Oct - Dec)</option>
                  </select>
                </div>
              )}
              
              {reportType !== 'custom' && (
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                  <span className="text-xs font-medium text-gray-700">Year:</span>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                  >
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                  </select>
                </div>
              )}

              {reportType === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                    <span className="text-xs font-medium text-gray-700">Start:</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">End:</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-gray-900 text-white px-3 md:px-4 py-1.5 hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2 text-xs font-medium w-full sm:w-auto justify-center"
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>{loading ? 'Loading...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 md:p-4 lg:p-6">
        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-6 md:py-8">
            <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl md:text-2xl animate-spin mr-2" />
            <span className="text-gray-600 text-xs md:text-sm">Loading income statement...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mr-2 text-xs" />
              <span className="text-red-800 text-xs md:text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mr-2 text-xs" />
              <span className="text-green-800 text-xs md:text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {showComparisonView && comparisonData && !loading && (
          <div className="bg-white border border-gray-200 mb-6">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900">
                Income Statement Comparison ({comparisonData.reports.length} Reports)
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
                  {/* Revenue Section */}
                  <tr className="bg-gray-100">
                    <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t border-b border-gray-300">
                      Revenue
                    </td>
                  </tr>
                  {comparisonData.revenue.map((account, idx) => (
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
                    <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Revenue</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                        {formatCurrency(report.totals.total_revenue)}
                      </td>
                    ))}
                  </tr>

                  {/* Expenses Section */}
                  <tr className="bg-gray-100">
                    <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t-2 border-b border-gray-300">
                      Expenses
                    </td>
                  </tr>
                  {comparisonData.expenses.map((account, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700 border-r border-gray-200">{account.account_code}</td>
                      <td className="px-3 py-2 text-gray-700 border-r border-gray-200">{account.account_name}</td>
                      {account.amounts.map((amount, aidx) => (
                        <td key={aidx} className="px-4 py-2 text-right tabular-nums border-l border-gray-200 text-red-600">
                          {formatCurrency(amount)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold border-t border-gray-300">
                    <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Expenses</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-red-600">
                        {formatCurrency(report.totals.total_expenses)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Income */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <td colSpan="2" className="px-3 py-3 text-gray-900 text-sm border-r border-gray-300">Net Income</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className={`px-4 py-3 text-right tabular-nums text-sm border-l border-gray-300 ${
                        report.totals.net_income >= 0 ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {formatCurrency(report.totals.net_income)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && incomeStatementData && !showComparisonView && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white border border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900">
                    {formatCurrency(incomeStatementData.totals?.total_revenue)}
                  </p>
                </div>
                <div className="bg-gray-100 p-2">
                  <FontAwesomeIcon icon={faArrowUp} className="text-gray-600 text-xs md:text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                  <p className="text-sm md:text-lg font-semibold text-red-600">
                    {formatCurrency(incomeStatementData.totals?.total_expenses)}
                  </p>
                </div>
                <div className="bg-red-100 p-2">
                  <FontAwesomeIcon icon={faArrowDown} className="text-red-600 text-xs md:text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-3 md:p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Net Income</p>
                  <p className={`text-sm md:text-lg font-semibold ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(incomeStatementData.totals?.net_income)}
                  </p>
                </div>
                <div className={`p-2 ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'bg-gray-100' : 'bg-red-100'}`}>
                  <FontAwesomeIcon 
                    icon={(incomeStatementData.totals?.net_income || 0) >= 0 ? faArrowUp : faArrowDown} 
                    className={`text-xs md:text-sm ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'text-gray-600' : 'text-red-600'}`} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Statement Details */}
        {!loading && !error && incomeStatementData && !showComparisonView && (
          <div className="bg-white border border-gray-200">
            <div className="px-3 md:px-6 py-3 border-b border-gray-200">
              <h2 className="text-sm md:text-base font-semibold text-gray-900">Income Statement</h2>
              <p className="text-xs text-gray-600">
                {reportType === 'monthly' && `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                {reportType === 'quarterly' && `Q${selectedQuarter} ${selectedYear}`}
                {reportType === 'ytd' && `${selectedYear} Year-to-Date`}
                {reportType === 'custom' && `${customStart || 'Start'} to ${customEnd || 'End'}`}
              </p>
            </div>

            <div className="p-3 md:p-6">
              {/* Revenue Section */}
              <div className="mb-4 md:mb-6">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Revenue</h3>
                <div className="space-y-0">
                  {incomeStatementData.revenue && incomeStatementData.revenue.length > 0 ? (
                    <>
                      {incomeStatementData.revenue.map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-700 block truncate">{item.account_name}</span>
                            <span className="text-xs text-gray-500">({item.account_code})</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className={`text-xs font-medium ${parseFloat(item.amount || 0) > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                        <span className="text-xs font-bold text-gray-900">Total Revenue</span>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(incomeStatementData.totals?.total_revenue)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      No revenue accounts configured
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses Section */}
              <div className="mb-4 md:mb-6">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Expenses</h3>
                <div className="space-y-0">
                  {incomeStatementData.expenses && incomeStatementData.expenses.length > 0 ? (
                    <>
                      {incomeStatementData.expenses.map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-700 block truncate">{item.account_name}</span>
                            <span className="text-xs text-gray-500">({item.account_code})</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className={`text-xs font-medium ${parseFloat(item.amount || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                        <span className="text-xs font-bold text-gray-900">Total Expenses</span>
                        <span className="text-xs font-bold text-red-600">{formatCurrency(incomeStatementData.totals?.total_expenses)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      No expense accounts configured
                    </div>
                  )}
                </div>
              </div>

              {/* Net Income */}
              <div className="border-t border-gray-300 pt-3 md:pt-4">
                <div className="flex justify-between items-center py-2 md:py-3 px-2 md:px-3 bg-gray-100 border-b border-gray-300">
                  <span className="text-xs font-bold text-gray-900">Net Income</span>
                  <span className={`text-xs font-bold ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(incomeStatementData.totals?.net_income)}
                  </span>
                </div>
                <div className="border-b-2 border-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && !incomeStatementData && !showComparisonView && (
          <div className="bg-white border border-gray-200 p-6 md:p-8 text-center">
            <FontAwesomeIcon icon={faChartLine} className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Income Statement Data</h3>
            <p className="text-gray-500 text-xs md:text-sm">
              Select a period to view the income statement data.
            </p>
          </div>
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Save Income Statement</h2>
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
                  placeholder="e.g., Income Statement - October 2024"
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
              <h2 className="text-lg font-bold text-gray-900">Load Saved Income Statement</h2>
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
                <p className="text-gray-500 text-sm">No saved income statements found</p>
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
                            <span className={report.report_summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Net Income: {formatCurrency(report.report_summary.net_income)}
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
                <h2 className="text-lg font-bold text-gray-900">Compare Income Statements</h2>
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
                <p className="text-gray-500 text-sm">No saved income statements found</p>
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
                              <span className={report.report_summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                                Net Income: {formatCurrency(report.report_summary.net_income)}
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

export default IncomeStatement;
