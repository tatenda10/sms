import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBalanceScale, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faBuilding,
  faMoneyBillWave,
  faChartPie
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
  const [data, setData] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Balance Sheet</h1>
              <p className="text-xs text-gray-600 mt-1">Financial Position Report</p>
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
                <option value="custom">Custom (As of Date)</option>
              </select>
            </div>

            {reportType === 'monthly' && (
              <>
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
              </>
            )}

            {reportType === 'custom' && (
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
                <span className="text-xs font-medium text-gray-700">As of (End Date):</span>
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
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-600">Loading balance sheet...</div>
        )}

        {!loading && !data && !error && (
          <div className="bg-white border border-gray-200 p-8 text-center">
            <FontAwesomeIcon icon={faBalanceScale} className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Balance Sheet Data</h3>
            <p className="text-gray-500 text-sm">Choose filters and click Search.</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Assets</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.total_assets)}</p>
                  </div>
                  <div className="bg-gray-100 p-2">
                    <FontAwesomeIcon icon={faBuilding} className="text-gray-600 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Liabilities</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.total_liabilities)}</p>
                  </div>
                  <div className="bg-gray-100 p-2">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-600 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Equity</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.total_equity)}</p>
                  </div>
                  <div className="bg-gray-100 p-2">
                    <FontAwesomeIcon icon={faChartPie} className="text-gray-600 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Sheet - Traditional Accounting Format */}
            <div className="bg-white border border-gray-200">
              <div className="px-6 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Balance Sheet</h2>
                <p className="text-xs text-gray-600">
                  {data.period?.period_name ? `${data.period.period_name} (As of ${data.period.end_date})` : (data.as_of_date ? `As of ${data.as_of_date}` : '')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Assets Column */}
                <div className="border-r border-gray-200">
                  <div className="px-6 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">ASSETS</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      {(data.assets || []).map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-700">{item.account_name}</span>
                          <span className="text-xs font-medium text-gray-900">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                        <span className="text-xs font-bold text-gray-900">Total Assets</span>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_assets)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div>
                  <div className="px-6 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">LIABILITIES & EQUITY</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      {/* Liabilities Section */}
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Liabilities</h4>
                        {(data.liabilities || []).map((item, index) => (
                          <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <span className="text-xs text-gray-700">{item.account_name}</span>
                            <span className="text-xs font-medium text-gray-900">{formatCurrency(item.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                          <span className="text-xs font-bold text-gray-900">Total Liabilities</span>
                          <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_liabilities)}</span>
                        </div>
                      </div>

                      {/* Equity Section */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Equity</h4>
                        {(data.equity || []).map((item, index) => (
                          <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <span className="text-xs text-gray-700">{item.account_name}</span>
                            <span className="text-xs font-medium text-gray-900">{formatCurrency(item.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                          <span className="text-xs font-bold text-gray-900">Total Equity</span>
                          <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_equity)}</span>
                        </div>
                      </div>

                      {/* Total Liabilities & Equity */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center py-2 px-2 border-t-2 border-gray-300 bg-gray-100">
                          <span className="text-xs font-bold text-gray-900">Total Liabilities & Equity</span>
                          <span className="text-xs font-bold text-gray-900">{formatCurrency(totalLiabilitiesAndEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BalanceSheet;
