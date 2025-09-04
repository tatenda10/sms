import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faCheck,
  faTimes,
  faEye,
  faCalendarAlt,
  faMoneyBillWave,
  faBuilding,
  faFileAlt,
  faCalculator,
  faChartLine,
  faBalanceScale,
  faLock,
  faUnlock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const PeriodEndClosing = () => {
  const { token } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedView, setSelectedView] = useState('trial-balance');
  const [isPeriodClosed, setIsPeriodClosed] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [periods, setPeriods] = useState([]);
  const [trialBalance, setTrialBalance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [closingEntries, setClosingEntries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState(null);
  
  // Period selection states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Load periods and currencies on component mount
  useEffect(() => {
    fetchPeriods();
    fetchCurrencies();
  }, []);

  // Load data when period changes (only for non-trial-balance views)
  useEffect(() => {
    if (selectedPeriod && selectedView !== 'trial-balance') {
      fetchPeriodData();
    }
  }, [selectedPeriod, selectedView]);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCurrencies(response.data.data || response.data);
      
      // Find base currency
      const base = (response.data.data || response.data).find(c => c.base_currency);
      setBaseCurrency(base);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/periods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPeriods(response.data);
      
      // Set default to current month/year if no periods exist
      if (response.data.length === 0) {
        const currentDate = new Date();
        setSelectedYear(currentDate.getFullYear());
        setSelectedMonth(currentDate.getMonth() + 1);
        // Don't set selectedPeriod until user clicks "Find Period"
      } else if (!selectedPeriod) {
        // If periods exist, use the first one as default
        const firstPeriod = response.data[0];
        const periodDate = new Date(firstPeriod.start_date);
        setSelectedYear(periodDate.getFullYear());
        setSelectedMonth(periodDate.getMonth() + 1);
        setSelectedPeriod(firstPeriod.id);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      setError('Failed to fetch periods');
      
      // Set default to current month/year on error
      const currentDate = new Date();
      setSelectedYear(currentDate.getFullYear());
      setSelectedMonth(currentDate.getMonth() + 1);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0';
    
    // Try to get currency from the current data
    let currency = null;
    if (trialBalance?.currency) currency = trialBalance.currency;
    else if (incomeStatement?.currency) currency = incomeStatement.currency;
    else if (balanceSheet?.currency) currency = balanceSheet.currency;
    else if (baseCurrency) currency = baseCurrency;
    
    if (!currency) return `${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    
    return `${currency.symbol || currency.code} ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Generate years for dropdown (current year + 5 years back)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  // Generate months for dropdown
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

  // Handle period selection
  const handlePeriodSelection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new dynamic endpoint to get or create the period
      const response = await axios.get(`${BASE_URL}/accounting/periods/month/${selectedMonth}/year/${selectedYear}/trial-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Set the trial balance data
      setTrialBalance(response.data);
      
      // Set the selected period ID for other operations
      if (response.data.period) {
        setSelectedPeriod(response.data.period.id);
      }
      
    } catch (error) {
      console.error('Error fetching period data:', error);
      setError('Failed to fetch period data');
      
      // Show empty trial balance for periods with no data
      setTrialBalance({
        period: {
          period_name: `${generateMonths().find(m => m.value === selectedMonth)?.name} ${selectedYear}`,
          status: 'open'
        },
        trial_balance: [],
        totals: {
          total_debit: 0,
          total_credit: 0,
          difference: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch trial balance data specifically
  const fetchTrialBalanceData = async (periodId) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/accounting/periods/${periodId}/trial-balance`, { headers });
      setTrialBalance(response.data);
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      setError('Failed to fetch trial balance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodData = async () => {
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
      
      switch (selectedView) {
        case 'trial-balance':
          const tbResponse = await axios.get(`${BASE_URL}/accounting/periods/${selectedPeriod}/trial-balance`, { headers });
          setTrialBalance(tbResponse.data);
          break;
        case 'income-statement':
          const isResponse = await axios.get(`${BASE_URL}/accounting/periods/${selectedPeriod}/income-statement`, { headers });
          setIncomeStatement(isResponse.data);
          break;
        case 'balance-sheet':
          const bsResponse = await axios.get(`${BASE_URL}/accounting/periods/${selectedPeriod}/balance-sheet`, { headers });
          setBalanceSheet(bsResponse.data);
          break;
        case 'closing-entries':
          const ceResponse = await axios.get(`${BASE_URL}/accounting/periods/${selectedPeriod}/closing-entries`, { headers });
          setClosingEntries(ceResponse.data);
          break;
      }
    } catch (error) {
      console.error('Error fetching period data:', error);
      setError('Failed to fetch period data');
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
      const response = await axios.post(`${BASE_URL}/accounting/periods/${selectedPeriod}/close`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setIsPeriodClosed(true);
      setShowClosingModal(false);
      
      // Refresh the trial balance data to show updated status
      await handlePeriodSelection();
      
      alert('Period closed successfully!');
    } catch (error) {
      console.error('Error closing period:', error);
      alert(error.response?.data?.error || 'Failed to close period');
    } finally {
      setLoading(false);
    }
  };

  const renderTrialBalance = () => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">Loading trial balance...</div>
        </div>
      );
    }

    if (!trialBalance) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">No trial balance data available</div>
        </div>
      );
    }

    if (!trialBalance.trial_balance || trialBalance.trial_balance.length === 0) {
      return (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Trial Balance - {trialBalance.period?.period_name}</h2>
          </div>
          <div className="p-8">
            <div className="text-center">
              <div className="text-gray-500 mb-2">No transactions found for this period</div>
              <div className="text-sm text-gray-400">
                {trialBalance.period?.status === 'closed' 
                  ? 'This period has been closed. Opening balances may be available for the next period.'
                  : trialBalance.trial_balance?.length === 0
                    ? 'This period has no activity yet. Opening balances will appear when the previous period is closed.'
                    : 'This period has no transactions but may have opening balances.'
                }
              </div>
              {trialBalance.period?.status === 'open' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> This period is open but has no transactions. 
                    You can close it to create opening balances for the next period.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Trial Balance - {trialBalance.period?.period_name}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trialBalance.trial_balance.map((account) => (
                <tr key={account.account_code} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900">{account.account_code}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{account.account_name}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{account.account_type}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {account.total_debit > 0 ? formatCurrency(account.total_debit) : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {account.total_credit > 0 ? formatCurrency(account.total_credit) : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(account.balance))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="px-4 py-2 text-xs font-medium text-gray-900">Total</td>
                <td className="px-4 py-2 text-xs font-medium text-gray-900">
                  {formatCurrency(trialBalance.totals?.total_debit || 0)}
                </td>
                <td className="px-4 py-2 text-xs font-medium text-gray-900">
                  {formatCurrency(trialBalance.totals?.total_credit || 0)}
                </td>
                <td className="px-4 py-2 text-xs font-medium text-gray-900">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">Loading income statement...</div>
        </div>
      );
    }

    if (!incomeStatement) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">No income statement data available</div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Income Statement - {incomeStatement.period?.period_name}</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {/* Revenue Section */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Revenue</h3>
              <div className="space-y-1">
                {incomeStatement.revenue?.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                )) || []}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-medium">
                  <span className="text-gray-900">Total Revenue</span>
                  <span className="text-gray-900">{formatCurrency(incomeStatement.totals?.total_revenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Expenses</h3>
              <div className="space-y-1">
                {incomeStatement.expenses?.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                )) || []}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-medium">
                  <span className="text-gray-900">Total Expenses</span>
                  <span className="text-gray-900">{formatCurrency(incomeStatement.totals?.total_expenses || 0)}</span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-900">Net Income</span>
                <span className={incomeStatement.totals?.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(incomeStatement.totals?.net_income || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">Loading balance sheet...</div>
        </div>
      );
    }

    if (!balanceSheet) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">No balance sheet data available</div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Balance Sheet - {balanceSheet.period?.period_name}</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Assets */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Assets</h3>
              <div className="space-y-1">
                {balanceSheet.assets?.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="text-gray-900">{formatCurrency(item.balance)}</span>
                  </div>
                )) || []}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-medium">
                  <span className="text-gray-900">Total Assets</span>
                  <span className="text-gray-900">{formatCurrency(balanceSheet.totals?.total_assets || 0)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Liabilities</h3>
              <div className="space-y-1">
                {balanceSheet.liabilities?.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="text-gray-900">{formatCurrency(item.balance)}</span>
                  </div>
                )) || []}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-medium">
                  <span className="text-gray-900">Total Liabilities</span>
                  <span className="text-gray-900">{formatCurrency(balanceSheet.totals?.total_liabilities || 0)}</span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Equity</h3>
              <div className="space-y-1">
                {balanceSheet.equity?.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="text-gray-900">{formatCurrency(item.balance)}</span>
                  </div>
                )) || []}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-medium">
                  <span className="text-gray-900">Total Equity</span>
                  <span className="text-gray-900">{formatCurrency(balanceSheet.totals?.total_equity || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClosingEntries = () => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">Loading closing entries...</div>
        </div>
      );
    }

    if (!closingEntries || closingEntries.length === 0) {
      return (
        <div className="bg-white border border-gray-200 p-8">
          <div className="text-center text-gray-500">No closing entries available</div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Closing Entries - {periods.find(p => p.id === selectedPeriod)?.period_name}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {closingEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900">{entry.entry_date}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{entry.journal_description}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{entry.account_name}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">{entry.entry_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">Period End Closing</h1>
            <p className="text-xs text-gray-500 mt-1">Close accounting periods and generate financial statements</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1">
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
              <span>Export Reports</span>
            </button>
            <button 
              onClick={handleClosePeriod}
              disabled={!selectedPeriod || trialBalance?.period?.status === 'closed'}
              className={`px-3 py-1.5 text-xs flex items-center space-x-1 ${
                !selectedPeriod || trialBalance?.period?.status === 'closed'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              title={
                !selectedPeriod 
                  ? 'Select a period first' 
                  : trialBalance?.period?.status === 'closed'
                    ? 'This period is already closed'
                    : trialBalance?.trial_balance?.length === 0
                      ? 'Close period to create opening balances for next period'
                      : 'Close this period'
              }
            >
              <FontAwesomeIcon icon={!selectedPeriod || trialBalance?.period?.status === 'closed' ? faLock : faUnlock} className="text-xs" />
              <span>
                {!selectedPeriod 
                  ? 'Select Period' 
                  : trialBalance?.period?.status === 'closed' 
                    ? 'Period Closed' 
                    : trialBalance?.trial_balance?.length === 0
                      ? 'Close (No Transactions)'
                      : 'Close Period'
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faCalculator} className="text-blue-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Trial Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                {trialBalance?.totals && trialBalance.totals.total_debit > 0 
                  ? formatCurrency(trialBalance.totals.total_debit) 
                  : trialBalance?.trial_balance?.length === 0 
                    ? 'No Transactions' 
                    : 'No Data'
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Net Income</p>
              <p className="text-lg font-semibold text-gray-900">
                {incomeStatement?.totals && incomeStatement.totals.net_income !== 0
                  ? formatCurrency(incomeStatement.totals.net_income) 
                  : trialBalance?.period?.status === 'closed'
                    ? 'Period Closed'
                    : 'No Activity'
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faBalanceScale} className="text-purple-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total Assets</p>
              <p className="text-lg font-semibold text-gray-900">
                {balanceSheet?.totals && balanceSheet.totals.total_assets > 0
                  ? formatCurrency(balanceSheet.totals.total_assets) 
                  : trialBalance?.period?.status === 'closed'
                    ? 'Period Closed'
                    : 'No Activity'
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-yellow-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Period Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {trialBalance?.period?.status 
                  ? trialBalance.period.status.toUpperCase() 
                  : selectedMonth && selectedYear 
                    ? 'SELECT PERIOD'
                    : 'No Period Selected'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Navigation */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                         <select
               value={selectedYear}
               onChange={(e) => {
                 const newYear = parseInt(e.target.value);
                 setSelectedYear(newYear);
               }}
               className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
             >
              {generateYears().map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                         <select
               value={selectedMonth}
               onChange={(e) => {
                 const newMonth = parseInt(e.target.value);
                 setSelectedMonth(newMonth);
               }}
               className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
             >
              {generateMonths().map(month => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period Status</label>
            <div className="text-xs text-gray-900 py-1.5 px-2 border border-gray-300 bg-gray-50">
              {trialBalance?.period?.status?.toUpperCase() || 'No Period Selected'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">View</label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="trial-balance">Trial Balance</option>
              <option value="income-statement">Income Statement</option>
              <option value="balance-sheet">Balance Sheet</option>
              <option value="closing-entries">Closing Entries</option>
            </select>
          </div>
                     <div className="flex items-end">
             <button 
               onClick={handlePeriodSelection}
               className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
             >
               <FontAwesomeIcon icon={faSearch} className="text-xs" />
               <span>Find Period</span>
             </button>
           </div>
        </div>
      </div>

      

       {/* Content Area */}
       <div>
         {selectedView === 'trial-balance' && renderTrialBalance()}
         {selectedView === 'income-statement' && renderIncomeStatement()}
         {selectedView === 'balance-sheet' && renderBalanceSheet()}
         {selectedView === 'closing-entries' && renderClosingEntries()}
       </div>

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
                Are you sure you want to close the period <strong>{trialBalance?.period?.period_name}</strong>?
              </p>
              <p className="text-xs text-gray-600">
                This action will:
              </p>
              <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                <li>Generate closing entries</li>
                <li>Update account balances</li>
                <li>Lock the period for further transactions</li>
                <li>Create opening balances for the next period</li>
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
                className="px-3 py-1.5 bg-red-600 text-white text-xs hover:bg-red-700"
              >
                Close Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodEndClosing;
