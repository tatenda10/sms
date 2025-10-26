import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faLock,
  faUnlock,
  faChartLine,
  faExclamationTriangle,
  faTimes,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const PeriodEndClosing = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isPeriodClosed, setIsPeriodClosed] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [periods, setPeriods] = useState([]);
  const [closingPreview, setClosingPreview] = useState(null);
  
  // Period selection states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Load periods on component mount
  useEffect(() => {
    fetchPeriods();
  }, []);

  // Load closing preview when period changes
  useEffect(() => {
    if (selectedPeriod) {
      fetchClosingPreview();
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/periods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPeriods(response.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
      setError('Failed to fetch periods');
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      { value: 1, name: 'January' },
      { value: 2, name: 'February' },
      { value: 3, name: 'March' },
      { value: 4, name: 'April' },
      { value: 5, name: 'May' },
      { value: 6, name: 'June' },
      { value: 7, name: 'July' },
      { value: 8, name: 'August' },
      { value: 9, name: 'September' },
      { value: 10, name: 'October' },
      { value: 11, name: 'November' },
      { value: 12, name: 'December' }
    ];
  };

  const handlePeriodSelection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const periodResponse = await axios.get(`${BASE_URL}/accounting/periods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const matchingPeriod = periodResponse.data.find(p => {
        const startDate = new Date(p.start_date);
        return startDate.getMonth() + 1 === selectedMonth && startDate.getFullYear() === selectedYear;
      });
      
      if (matchingPeriod) {
        setSelectedPeriod(matchingPeriod.id);
        setIsPeriodClosed(matchingPeriod.status === 'closed');
      } else {
        setSelectedPeriod(null);
        setClosingPreview(null);
        setError(`No period found for ${generateMonths().find(m => m.value === selectedMonth)?.name} ${selectedYear}`);
      }
      
    } catch (error) {
      console.error('Error fetching period data:', error);
      setError('Failed to fetch period data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClosingPreview = async () => {
    if (!selectedPeriod) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/accounting/period-closing/preview/${selectedPeriod}`, { headers });
      setClosingPreview(response.data.data);
    } catch (error) {
      console.error('Error fetching closing preview:', error);
      setError('Failed to fetch closing preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = () => {
    setShowClosingModal(true);
  };

  const confirmClosePeriod = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/accounting/period-closing/close/${selectedPeriod}`, {
        closed_by: 'admin'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setIsPeriodClosed(true);
      setShowClosingModal(false);
      
      await handlePeriodSelection();
      
      alert(`Period closed successfully!\n\nNet Income: ${formatCurrency(response.data.data.net_income)}\nRevenue Accounts Closed: ${response.data.data.revenue_accounts_closed}\nExpense Accounts Closed: ${response.data.data.expense_accounts_closed}`);
    } catch (error) {
      console.error('Error closing period:', error);
      alert(error.response?.data?.error || error.response?.data?.details || 'Failed to close period');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Period Management</h1>
            <p className="text-xs text-gray-600 mt-1">Close accounting periods and manage financial period transitions</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/dashboard/reports/income-statement')}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faChartLine} />
              <span>View Financial Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {generateMonths().map(month => (
                <option key={month.value} value={month.value}>{month.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period Status</label>
            <div className="text-xs text-gray-900 py-1.5 px-2 border border-gray-300 bg-gray-50">
              {closingPreview?.period?.status?.toUpperCase() || 'NOT SELECTED'}
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handlePeriodSelection}
              className="w-full bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800"
            >
              <FontAwesomeIcon icon={faEye} className="mr-1" />
              Load Period
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-xs" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Closing Preview */}
      {closingPreview && (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Closing Preview - {closingPreview.period?.period_name}</h2>
                <p className="text-xs text-gray-600 mt-1">
                  {closingPreview.is_closed ? 'Period is already closed' : 'Preview of what will happen when period is closed'}
                </p>
              </div>
              {!closingPreview.is_closed && (
                <button
                  onClick={handleClosePeriod}
                  disabled={loading}
                  className="bg-red-600 text-white px-3 py-1.5 text-xs hover:bg-red-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faLock} className="mr-1" />
                  Close Period
                </button>
              )}
            </div>
          </div>
          <div className="p-4">
            {/* Summary */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(closingPreview.summary?.total_revenue || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(closingPreview.summary?.total_expenses || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Net Income:</span>
                  <span className="ml-2 font-medium text-blue-600">{formatCurrency(closingPreview.summary?.net_income || 0)}</span>
                </div>
              </div>
            </div>

            {/* Revenue Accounts */}
            {closingPreview.revenue_accounts && closingPreview.revenue_accounts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Revenue Accounts to Close ({closingPreview.summary?.revenue_accounts_count || 0})</h3>
                <div className="space-y-1">
                  {closingPreview.revenue_accounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-green-50">
                      <span className="text-gray-700">{acc.code} - {acc.name}</span>
                      <span className="text-green-600 font-medium">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense Accounts */}
            {closingPreview.expense_accounts && closingPreview.expense_accounts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Expense Accounts to Close ({closingPreview.summary?.expense_accounts_count || 0})</h3>
                <div className="space-y-1">
                  {closingPreview.expense_accounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 px-2 bg-red-50">
                      <span className="text-gray-700">{acc.code} - {acc.name}</span>
                      <span className="text-red-600 font-medium">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Activity Message */}
            {(!closingPreview.revenue_accounts || closingPreview.revenue_accounts.length === 0) && 
             (!closingPreview.expense_accounts || closingPreview.expense_accounts.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-2">No transactions found for this period</p>
                <p className="text-gray-400 text-xs">
                  This period has no activity yet. You can still close it to create opening balances for the next period.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Close Period</h2>
              <button
                onClick={() => setShowClosingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <p className="text-xs text-gray-600">
                Are you sure you want to close the period <strong>{closingPreview?.period?.period_name}</strong>?
              </p>
              <p className="text-xs text-gray-600">
                This action will:
              </p>
              <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                <li>Close all revenue accounts to Income Summary</li>
                <li>Close all expense accounts to Income Summary</li>
                <li>Transfer Net Income to Retained Earnings</li>
                <li>Lock the period for further transactions</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClosingModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmClosePeriod}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Closing...' : 'Close Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodEndClosing;

