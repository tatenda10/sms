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
  faExclamationTriangle
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
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Income Statement</h1>
              <p className="text-xs text-gray-600 mt-1">Profit & Loss Report</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-2 text-xs font-medium">
                <FontAwesomeIcon icon={faDownload} />
                <span>Export</span>
              </button>
              <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-2 text-xs font-medium">
                <FontAwesomeIcon icon={faPrint} />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Report Type:</span>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
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
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
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
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
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
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
                >
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
              </div>
            )}

            {reportType === 'custom' && (
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">Start:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
                />
                <span className="text-xs font-medium text-gray-700 ml-2">End:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-gray-900 text-white px-4 py-1.5 hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2 text-xs font-medium"
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>{loading ? 'Loading...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-2xl animate-spin mr-2" />
            <span className="text-gray-600">Loading income statement...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && incomeStatementData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(incomeStatementData.totals?.total_revenue)}
                  </p>
                </div>
                <div className="bg-gray-100 p-2">
                  <FontAwesomeIcon icon={faArrowUp} className="text-gray-600 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(incomeStatementData.totals?.total_expenses)}
                  </p>
                </div>
                <div className="bg-red-100 p-2">
                  <FontAwesomeIcon icon={faArrowDown} className="text-red-600 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Net Income</p>
                  <p className={`text-lg font-semibold ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(incomeStatementData.totals?.net_income)}
                  </p>
                </div>
                <div className={`p-2 ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'bg-gray-100' : 'bg-red-100'}`}>
                  <FontAwesomeIcon 
                    icon={(incomeStatementData.totals?.net_income || 0) >= 0 ? faArrowUp : faArrowDown} 
                    className={`text-sm ${(incomeStatementData.totals?.net_income || 0) >= 0 ? 'text-gray-600' : 'text-red-600'}`} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Statement Details */}
        {!loading && !error && incomeStatementData && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Income Statement</h2>
              <p className="text-xs text-gray-600">
                {reportType === 'monthly' && `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                {reportType === 'quarterly' && `Q${selectedQuarter} ${selectedYear}`}
                {reportType === 'ytd' && `${selectedYear} Year-to-Date`}
                {reportType === 'custom' && `${customStart || 'Start'} to ${customEnd || 'End'}`}
              </p>
            </div>

            <div className="p-6">
              {/* Revenue Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue</h3>
                <div className="space-y-0">
                  {incomeStatementData.revenue && incomeStatementData.revenue.length > 0 ? (
                    <>
                      {incomeStatementData.revenue.map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <span className="text-xs text-gray-700">{item.account_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({item.account_code})</span>
                          </div>
                          <div className="text-right">
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
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Expenses</h3>
                <div className="space-y-0">
                  {incomeStatementData.expenses && incomeStatementData.expenses.length > 0 ? (
                    <>
                      {incomeStatementData.expenses.map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <span className="text-xs text-gray-700">{item.account_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({item.account_code})</span>
                          </div>
                          <div className="text-right">
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
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center py-3 px-3 bg-gray-100 border-b border-gray-300">
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
        {!loading && !error && !incomeStatementData && (
          <div className="bg-white border border-gray-200 p-8 text-center">
            <FontAwesomeIcon icon={faChartLine} className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Income Statement Data</h3>
            <p className="text-gray-500 text-sm">
              Select a period to view the income statement data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeStatement;
