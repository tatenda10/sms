import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBalanceScale, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter
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

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-xs text-gray-600">Financial Position Report</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-1 text-xs font-medium w-full sm:w-auto justify-center">
              <FontAwesomeIcon icon={faDownload} />
              <span>Export</span>
            </button>
            <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-1 text-xs font-medium w-full sm:w-auto justify-center">
              <FontAwesomeIcon icon={faPrint} />
              <span>Print</span>
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
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-600 text-xs">Loading balance sheet...</div>
      )}

      {!loading && !data && !error && (
        <div className="bg-white border border-gray-200 p-8 text-center">
          <FontAwesomeIcon icon={faBalanceScale} className="text-gray-400 text-4xl mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Balance Sheet Data</h3>
          <p className="text-gray-500 text-xs">Choose filters and click Generate Report.</p>
        </div>
      )}

      {!loading && !error && data && (
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
    </div>
  );
};

export default BalanceSheet;
