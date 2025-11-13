import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faArrowUp,
  faArrowDown,
  faChartLine,
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

const CashFlow = () => {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState('comparison'); // 'single' | 'comparison'
  const [reportType, setReportType] = useState('monthly'); // monthly | custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Multi-month comparison settings
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [data, setData] = useState(null);
  const [multiMonthData, setMultiMonthData] = useState(null);
  const [hideEmptyRows, setHideEmptyRows] = useState(false);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      setMultiMonthData(null);

      if (viewMode === 'comparison') {
        // Multi-month comparison view
        const params = new URLSearchParams({
          startMonth: startMonth.toString(),
          startYear: startYear.toString(),
          endMonth: endMonth.toString(),
          endYear: endYear.toString()
        }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/multi-month?${params}`, {
          headers: authHeaders
        });
        setMultiMonthData(resp.data);
      } else {
        // Single month view
      if (reportType === 'monthly') {
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/month/${selectedMonth}/year/${selectedYear}`, {
          headers: authHeaders
        });
        setData(resp.data);
      } else if (reportType === 'custom') {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ start: startDate, end: endDate }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/range?${params}`, {
          headers: authHeaders
        });
        setData(resp.data);
        }
      }
    } catch (e) {
      console.error('Error loading cash flow:', e);
      setError(e.response?.data?.error || 'Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    // Prepare CSV content
    const periodName = data.period?.period_name || 
                      (data.start_date && data.end_date ? `${data.start_date} to ${data.end_date}` : 'Cash Flow Statement');
    
    let csvContent = 'Cash Flow Statement\n';
    csvContent += `${periodName}\n\n`;
    
    // Cash Inflows
    csvContent += 'Cash In\n';
    csvContent += 'Account Code,Account Name,Amount\n';
    if ((data.cash_inflows || []).length === 0) {
      csvContent += 'No cash inflows in this period,,$0.00\n';
    } else {
      (data.cash_inflows || []).forEach(item => {
        csvContent += `${item.account_code},"${item.account_name}",${item.amount}\n`;
      });
    }
    csvContent += `Total Cash In,,${totals.total_inflows}\n\n`;
    
    // Cash Outflows
    csvContent += 'Cash Out\n';
    csvContent += 'Account Code,Account Name,Amount\n';
    if ((data.cash_outflows || []).length === 0) {
      csvContent += 'No cash outflows in this period,,$0.00\n';
    } else {
      (data.cash_outflows || []).forEach(item => {
        csvContent += `${item.account_code},"${item.account_name}",${item.amount}\n`;
      });
    }
    csvContent += `Total Cash Out,,${totals.total_outflows}\n\n`;
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += `Net Cash Flow,,${totals.net_cash_flow}\n`;
    csvContent += `Beginning Cash & Bank Balance,,${totals.beginning_cash}\n`;
    csvContent += `Current Cash & Bank Position,,${totals.ending_cash}\n`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cash_flow_statement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = data?.totals || { 
    total_inflows: 0, 
    total_outflows: 0, 
    net_cash_flow: 0,
    beginning_cash: 0,
    ending_cash: 0
  };

  const handleSaveReport = async () => {
    if (!data) {
      setError('Please generate a cash flow statement first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Cash Flow - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      periodName = `Cash Flow - ${startDate} to ${endDate}`;
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
        report_type: 'cash_flow_statement',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? startDate : null,
        period_end_date: reportType === 'custom' ? endDate : null,
        report_data: data,
        report_summary: {
          total_inflows: totals.total_inflows,
          total_outflows: totals.total_outflows,
          net_cash_flow: totals.net_cash_flow,
          beginning_cash: totals.beginning_cash,
          ending_cash: totals.ending_cash
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
        params: { report_type: 'cash_flow_statement' },
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
        params: { report_type: 'cash_flow_statement' },
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
      const allInflows = new Map();
      const allOutflows = new Map();
      
      reports.forEach((report, idx) => {
        // Process cash inflows
        if (report.report_data.cash_inflows) {
          report.report_data.cash_inflows.forEach(item => {
            if (!allInflows.has(item.account_code)) {
              allInflows.set(item.account_code, {
                account_code: item.account_code,
                account_name: item.account_name,
                amounts: []
              });
            }
            allInflows.get(item.account_code).amounts[idx] = item.amount || 0;
          });
        }

        // Process cash outflows
        if (report.report_data.cash_outflows) {
          report.report_data.cash_outflows.forEach(item => {
            if (!allOutflows.has(item.account_code)) {
              allOutflows.set(item.account_code, {
                account_code: item.account_code,
                account_name: item.account_name,
                amounts: []
              });
            }
            allOutflows.get(item.account_code).amounts[idx] = item.amount || 0;
          });
        }
      });

      // Fill missing amounts with zeros
      [allInflows, allOutflows].forEach(map => {
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
          period: r.period_start_date && r.period_end_date 
            ? `${r.period_start_date} to ${r.period_end_date}`
            : 'N/A',
          totals: r.report_data.totals
        })),
        inflows: Array.from(allInflows.values()),
        outflows: Array.from(allOutflows.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} cash flow statements`);
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
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .bg-gray-50 {
              background-color: white !important;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-2 md:px-4 lg:px-6 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-base md:text-lg font-semibold text-gray-900">Cash Flow Statement</h1>
              <p className="text-xs text-gray-600 mt-1">Cash In & Cash Out Report</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto no-print">
              <button 
                onClick={handleSaveReport}
                disabled={!data}
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
                <FontAwesomeIcon icon={faMoneyBillWave} />
                <span>Compare</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 no-print">
        <div className="px-2 md:px-4 lg:px-6 py-3">
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 flex-1">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">View:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                >
                  <option value="comparison">Monthly Comparison</option>
                  <option value="single">Single Period</option>
                </select>
              </div>

              {viewMode === 'comparison' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">From:</span>
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(parseInt(e.target.value))}
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
                    <select
                      value={startYear}
                      onChange={(e) => setStartYear(parseInt(e.target.value))}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    >
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">To:</span>
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(parseInt(e.target.value))}
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
                    <select
                      value={endYear}
                      onChange={(e) => setEndYear(parseInt(e.target.value))}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    >
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">Report Type:</span>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                >
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
                </>
              )}

              {viewMode === 'single' && reportType === 'monthly' && (
                <>
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
                </>
              )}

              {viewMode === 'single' && reportType === 'custom' && (
                <>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                    <span className="text-xs font-medium text-gray-700">Start Date:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                    <span className="text-xs font-medium text-gray-700">End Date:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-full sm:w-auto"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideEmptyRows}
                  onChange={(e) => setHideEmptyRows(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Hide rows without data</span>
              </label>
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
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700 no-print">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 p-3 mb-4 text-xs text-green-700 no-print">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            {success}
          </div>
        )}

        {loading && (
          <div className="text-center py-6 md:py-8 text-gray-600 text-xs md:text-sm no-print">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            Loading cash flow statement...
          </div>
        )}

        {!loading && !data && !multiMonthData && !error && (
          <div className="bg-white border border-gray-200 p-6 md:p-8 text-center no-print">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Cash Flow Data</h3>
            <p className="text-gray-500 text-xs md:text-sm">Choose filters and click Search.</p>
          </div>
        )}

        {/* Multi-Month Comparison Table */}
        {!loading && !error && multiMonthData && viewMode === 'comparison' && (
          <div className="bg-white border border-gray-200 printable-area overflow-x-auto">
            <div className="px-3 md:px-6 py-3 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Cash Flow Statement</h2>
              <p className="text-xs text-gray-600">Monthly Comparison - {multiMonthData.fiscalYear}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-300">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                      Account
                    </th>
                    {multiMonthData.months.map((month, idx) => (
                      <th key={idx} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300 min-w-[100px]">
                        {month.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-gray-100 min-w-[100px]">
                      FY-{multiMonthData.fiscalYear.split('-')[0].slice(-2)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cash Flows from Operating Activities - Income (Revenue Accounts) */}
                  <tr className="bg-blue-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-b border-gray-300">
                      Cash Flows from Operating Activities
                    </td>
                  </tr>
                  
                  {/* Revenue Accounts - dynamically from COA (ALL accounts) */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const revenueArray = (multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (revenueArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No revenue accounts
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return revenueArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const revenueAccount = monthData.categorizedInflows?.Revenue?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (revenueAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const revenueAccount = monthData.categorizedInflows?.Revenue?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = revenueAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Asset Inflows (Collections from AR, etc.) - Operating Activities */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list
                    const assetInflowArray = (multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (assetInflowArray.length > 0 && assetInflowArray.some(acc => (acc.amount || 0) !== 0)) {
                      return (
                        <>
                          <tr className="bg-green-50">
                            <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                              Collections from Accounts Receivable & Other Assets (Operating)
                            </td>
                          </tr>
                          {assetInflowArray.map((account, idx) => {
                            // Only show accounts that have non-zero amounts in at least one month
                            const hasNonZero = multiMonthData.monthlyData.some(monthData => {
                              const accountData = monthData.categorizedInflows?.Asset?.find(
                                acc => acc.account_code === account.account_code
                              );
                              return (accountData?.amount || 0) !== 0;
                            }) || (account.amount || 0) !== 0;
                            
                            if (!hasNonZero) return null;
                            
                            return (
                              <tr key={account.account_code}>
                                <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                  {account.account_name}
                                </td>
                                {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                                  const assetAccount = monthData.categorizedInflows?.Asset?.find(
                                    acc => acc.account_code === account.account_code
                                  );
                                  const amount = assetAccount?.amount || 0;
                                  return (
                                    <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      {amount !== 0 ? formatCurrency(amount) : '-'}
                                    </td>
                                  );
                                })}
                                <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                                  {formatCurrency(account.amount || 0)}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Total Operating Income */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-gray-100">Total Cash Flows from Operating Activities (Income)</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const revenueTotal = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const total = revenueTotal + assetInflowTotal;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-gray-200">
                      {formatCurrency(
                        (multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0) +
                        (multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0)
                      )}
                    </td>
                  </tr>
                  
                  {/* Operating Activities - Expenses (Expense Accounts from COA) */}
                  <tr className="bg-red-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Operating Activities (Expense Section)
                    </td>
                  </tr>
                  
                  {/* Expense Accounts - dynamically from COA (ALL accounts) */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const expenseArray = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (expenseArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No expense accounts
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return expenseArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const expenseAccount = monthData.categorizedOutflows?.Expense?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (expenseAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const expenseAccount = monthData.categorizedOutflows?.Expense?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = expenseAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Total Operating Expenses */}
                  <tr className="bg-red-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-red-100">Total Operating Expenses</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const total = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-red-200">
                      {formatCurrency(
                        multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0
                      )}
                    </td>
                  </tr>
                  
                  {/* Total Cash Flows from Operating Activities */}
                  <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-gray-200">Total Cash Flows from Operating Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      // Calculate: (Total Revenue + Asset Inflows) - Total Expenses
                      const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const operatingTotal = (totalRevenue + assetInflowTotal) - totalExpenses;
                      return (
                        <td key={idx} className={`px-3 py-2 text-right border-r border-gray-300 ${operatingTotal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(operatingTotal)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right font-bold bg-gray-300 ${
                      (() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperatingTotal = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        return fyOperatingTotal < 0 ? 'text-red-600' : 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperatingTotal = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        return formatCurrency(fyOperatingTotal);
                      })()}
                    </td>
                  </tr>
                  
                  {/* Cash Flows From Investing Activities (Asset Accounts from COA) */}
                  <tr className="bg-purple-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Cash Flows From Investing Activities
                    </td>
                  </tr>
                  
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const assetArray = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (assetArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No investing activities
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return assetArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const assetAccount = monthData.categorizedOutflows?.Asset?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (assetAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const assetAccount = monthData.categorizedOutflows?.Asset?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = assetAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  <tr className="bg-purple-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-purple-100">Total Cash Flows From Investing Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const total = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-purple-200">
                      {formatCurrency(
                        multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0
                      )}
                    </td>
                  </tr>
                  
                  {/* Cash Flows From Financing Activities (Liability/Equity Accounts from COA) */}
                  <tr className="bg-indigo-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Cash Flows From Financing Activities
                    </td>
                  </tr>
                  
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    // Combine Liability and Equity accounts
                    const liabilityAccounts = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability || []).map(acc => ({...acc, account_type: 'Liability'}));
                    const equityAccounts = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity || []).map(acc => ({...acc, account_type: 'Equity'}));
                    const financingArray = [...liabilityAccounts, ...equityAccounts].sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (financingArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No financing activities
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return financingArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const financingAccount = monthData.categorizedOutflows?.[account.account_type]?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (financingAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const financingAccount = monthData.categorizedOutflows?.[account.account_type]?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = financingAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  <tr className="bg-indigo-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-indigo-100">Total Cash Flows From Financing Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const total = liabilityTotal + equityTotal;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {total !== 0 ? formatCurrency(total) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-indigo-200">
                      {formatCurrency(
                        (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0) +
                        (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0)
                      )}
                    </td>
                  </tr>
                  
                  {/* Net increase in cash */}
                  <tr className="bg-gray-300 font-bold border-t-2 border-gray-500">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-400 sticky left-0 bg-gray-300">Net increase in cash and cash equivalents</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      // Calculate: Operating - Investing - Financing
                      const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const operating = (totalRevenue + assetInflowTotal) - totalExpenses;
                      const investing = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const financing = liabilityTotal + equityTotal;
                      const netIncrease = operating - investing - financing; // Investing and financing are outflows
                      return (
                        <td key={idx} className={`px-3 py-2 text-right border-r border-gray-400 ${netIncrease < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(netIncrease)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right font-bold bg-gray-400 ${
                      (() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return fyNetIncrease < 0 ? 'text-red-600' : 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return formatCurrency(fyNetIncrease);
                      })()}
                    </td>
                  </tr>
                  
                  {/* Cash and cash equivalents at end of period */}
                  <tr className="bg-gray-900 text-white font-bold">
                    <td className="px-3 py-2 border-r border-gray-700 sticky left-0 bg-gray-900">Cash and cash equivalents at end of period</td>
                    {(() => {
                      // Calculate cumulative ending cash
                      let cumulativeCash = multiMonthData.monthlyData[0]?.totals?.beginning_cash || 0;
                      return multiMonthData.monthlyData.map((monthData, idx) => {
                        const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const operating = (totalRevenue + assetInflowTotal) - totalExpenses;
                        const investing = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const financing = liabilityTotal + equityTotal;
                        const netIncrease = operating - investing - financing;
                        cumulativeCash += netIncrease;
                        return (
                          <td key={idx} className="px-3 py-2 text-right border-r border-gray-700">
                            {formatCurrency(cumulativeCash)}
                          </td>
                        );
                      });
                    })()}
                    <td className="px-3 py-2 text-right font-bold bg-black">
                      {(() => {
                        const startingCash = multiMonthData.monthlyData[0]?.totals?.beginning_cash || 0;
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return formatCurrency(startingCash + fyNetIncrease);
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && data && viewMode === 'single' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4 no-print">
              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Inflows</p>
                    <p className="text-base font-semibold text-green-600">{formatCurrency(totals.total_inflows)}</p>
                  </div>
                  <div className="bg-green-100 p-1.5">
                    <FontAwesomeIcon icon={faArrowDown} className="text-green-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Outflows</p>
                    <p className="text-base font-semibold text-red-600">{formatCurrency(totals.total_outflows)}</p>
                  </div>
                  <div className="bg-red-100 p-1.5">
                    <FontAwesomeIcon icon={faArrowUp} className="text-red-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Net Cash Flow</p>
                    <p className={`text-base font-semibold ${totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.net_cash_flow)}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-1.5">
                    <FontAwesomeIcon icon={faChartLine} className="text-gray-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Current Cash Position</p>
                    <p className="text-base font-semibold text-gray-900">{formatCurrency(totals.ending_cash)}</p>
                  </div>
                  <div className="bg-gray-100 p-1.5">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-600 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Statement Details */}
            <div className="bg-white border border-gray-200 printable-area">
              <div className="px-3 md:px-6 py-3 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-gray-900">Cash Flow Statement</h2>
                <p className="text-xs text-gray-600">
                  {data.period?.period_name ? data.period.period_name : 
                   (data.start_date && data.end_date ? `${data.start_date} to ${data.end_date}` : '')}
                </p>
              </div>

              <div className="p-3 md:p-6">
                {/* Cash Inflows */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
                    Cash In
                  </h3>
                  <div className="space-y-0">
                    {(data.cash_inflows || []).length === 0 ? (
                      <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50">
                        <span className="text-xs text-gray-500 italic">No cash inflows in this period</span>
                        <span className="text-xs font-medium text-gray-500">$0.00</span>
                      </div>
                    ) : (
                      (data.cash_inflows || [])
                        .filter(item => !hideEmptyRows || (item.amount || 0) !== 0)
                        .map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-700">{item.account_code} - {item.account_name}</span>
                          <span className="text-xs font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-900">Total Cash In</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_inflows)}</span>
                    </div>
                  </div>
                </div>

                {/* Cash Outflows */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                    Cash Out
                  </h3>
                  <div className="space-y-0">
                    {(data.cash_outflows || []).length === 0 ? (
                      <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50">
                        <span className="text-xs text-gray-500 italic">No cash outflows in this period</span>
                        <span className="text-xs font-medium text-gray-500">$0.00</span>
                      </div>
                    ) : (
                      (data.cash_outflows || [])
                        .filter(item => !hideEmptyRows || (item.amount || 0) !== 0)
                        .map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-700">{item.account_code} - {item.account_name}</span>
                          <span className="text-xs font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-900">Total Cash Out</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_outflows)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Cash Flow and Balances */}
                <div className="border-t-2 border-gray-300 pt-3 md:pt-4">
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-100 mb-1">
                    <span className="text-xs font-bold text-gray-900">Net Cash Flow</span>
                    <span className={`text-xs font-bold ${totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.net_cash_flow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-50 mb-1">
                    <span className="text-xs font-semibold text-gray-700">Beginning Cash & Bank Balance</span>
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(totals.beginning_cash)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-900 text-white">
                    <span className="text-xs font-bold">Current Cash & Bank Position</span>
                    <span className="text-xs font-bold">{formatCurrency(totals.ending_cash)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Comparison View */}
        {showComparisonView && comparisonData && !loading && (
          <div className="bg-white border border-gray-200 mb-6 no-print">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900">
                Cash Flow Comparison ({comparisonData.reports.length} Reports)
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
                        <div className="text-xs font-normal text-gray-600 mt-1">{report.period}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {/* Cash Inflows Section */}
                  <tr className="bg-green-50">
                    <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t border-b border-gray-300">
                      <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
                      CASH IN
                    </td>
                  </tr>
                  {comparisonData.inflows.map((account, idx) => (
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
                  <tr className="bg-green-100 font-semibold border-t border-gray-300">
                    <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Cash In</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                        {formatCurrency(report.totals.total_inflows)}
                      </td>
                    ))}
                  </tr>

                  {/* Cash Outflows Section */}
                  <tr className="bg-red-50">
                    <td colSpan={2 + comparisonData.reports.length} className="px-3 py-2 font-bold text-gray-900 text-sm border-t-2 border-b border-gray-300">
                      <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                      CASH OUT
                    </td>
                  </tr>
                  {comparisonData.outflows.map((account, idx) => (
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
                  <tr className="bg-red-100 font-semibold border-t border-gray-300">
                    <td colSpan="2" className="px-3 py-2.5 text-gray-900 border-r border-gray-300">Total Cash Out</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-300 text-gray-900">
                        {formatCurrency(report.totals.total_outflows)}
                      </td>
                    ))}
                  </tr>

                  {/* Summary */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <td colSpan="2" className="px-3 py-3 text-gray-900 text-sm border-r border-gray-300">Net Cash Flow</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className={`px-4 py-3 text-right tabular-nums text-sm border-l border-gray-300 font-bold ${report.totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(report.totals.net_cash_flow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="px-3 py-2.5 text-gray-700 border-r border-gray-200">Beginning Cash</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-right tabular-nums border-l border-gray-200 text-gray-900">
                        {formatCurrency(report.totals.beginning_cash)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-900 text-white font-bold">
                    <td colSpan="2" className="px-3 py-3 text-sm border-r border-gray-700">Ending Cash</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} className="px-4 py-3 text-right tabular-nums text-sm border-l border-gray-700">
                        {formatCurrency(report.totals.ending_cash)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Save Cash Flow Statement</h2>
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
                  placeholder="e.g., Cash Flow - October 2024"
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
              <h2 className="text-lg font-bold text-gray-900">Load Saved Cash Flow Statement</h2>
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
                <p className="text-gray-500 text-sm">No saved cash flow statements found</p>
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
                            <span className={report.report_summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Net: {formatCurrency(report.report_summary.net_cash_flow)}
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
                <h2 className="text-lg font-bold text-gray-900">Compare Cash Flow Statements</h2>
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
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No saved cash flow statements found</p>
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
                              <span className={report.report_summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                Net: {formatCurrency(report.report_summary.net_cash_flow)}
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
                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
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

export default CashFlow;
