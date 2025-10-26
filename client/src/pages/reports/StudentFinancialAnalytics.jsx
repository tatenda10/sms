import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faChartBar,
  faDollarSign,
  faPercentage,
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const StudentFinancialAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('outstanding-balances');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    term: '',
    start_date: '',
    end_date: ''
  });

  // Data states
  const [outstandingBalances, setOutstandingBalances] = useState(null);
  const [paymentCompletion, setPaymentCompletion] = useState(null);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch outstanding balances
  const fetchOutstandingBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.term) params.append('term', filters.term);

      const response = await axios.get(
        `${BASE_URL}/analytics/student-financial/outstanding-balances?${params}`,
        { headers: authHeaders }
      );
      setOutstandingBalances(response.data.data);
    } catch (err) {
      setError('Failed to fetch outstanding balances');
      console.error('Error fetching outstanding balances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment completion rates
  const fetchPaymentCompletion = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year && filters.term) {
        params.append('year', filters.year);
        params.append('term', filters.term);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/student-financial/payment-completion-rates?${params}`,
        { headers: authHeaders }
      );
      setPaymentCompletion(response.data.data);
    } catch (err) {
      setError('Failed to fetch payment completion rates');
      console.error('Error fetching payment completion rates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch efficiency metrics
  const fetchEfficiencyMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year && filters.term) {
        params.append('year', filters.year);
        params.append('term', filters.term);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/student-financial/efficiency-metrics?${params}`,
        { headers: authHeaders }
      );
      setEfficiencyMetrics(response.data.data);
    } catch (err) {
      setError('Failed to fetch efficiency metrics');
      console.error('Error fetching efficiency metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch health summary
  const fetchHealthSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/analytics/student-financial/health-summary`,
        { headers: authHeaders }
      );
      setHealthSummary(response.data.data);
    } catch (err) {
      setError('Failed to fetch health summary');
      console.error('Error fetching health summary:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'outstanding-balances') {
      fetchOutstandingBalances();
    } else if (activeTab === 'completion-rates') {
      fetchPaymentCompletion();
    } else if (activeTab === 'efficiency') {
      fetchEfficiencyMetrics();
    } else if (activeTab === 'health-summary') {
      fetchHealthSummary();
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Outstanding: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get status color based on completion rate
  const getCompletionColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get status icon based on completion rate
  const getCompletionIcon = (rate) => {
    if (rate >= 90) return faCheckCircle;
    if (rate >= 70) return faExclamationCircle;
    return faTimesCircle;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-sm" />
              <h1 className="text-lg font-semibold text-gray-900">Student Financial Analytics</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                Export
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                <FontAwesomeIcon icon={faPrint} className="mr-1" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Year:</span>
              <input 
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                className="border border-gray-300 px-2 py-1 text-xs w-20 focus:outline-none focus:border-gray-400"
                placeholder="2024"
                min="2000"
                max="2100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Term:</span>
              <select 
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="">All Terms</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
              ) : (
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'outstanding-balances', label: 'Outstanding Balances', icon: faDollarSign },
              { id: 'completion-rates', label: 'Completion Rates', icon: faPercentage },
              { id: 'efficiency', label: 'Efficiency Metrics', icon: faChartBar },
              { id: 'health-summary', label: 'Health Summary', icon: faUsers }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-xs font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="mr-1" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              {error}
            </div>
          )}

          {activeTab === 'outstanding-balances' && (
            <div className="space-y-6">
              {outstandingBalances ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-900">Total Outstanding</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-900 mt-1">
                        {formatCurrency(outstandingBalances.total_outstanding_amount)}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-900">Students with Balances</span>
                        <FontAwesomeIcon icon={faUsers} className="text-orange-600" />
                      </div>
                      <div className="text-lg font-bold text-orange-900 mt-1">
                        {outstandingBalances.total_students_with_balances}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Average Outstanding</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {formatCurrency(outstandingBalances.total_outstanding_amount / Math.max(outstandingBalances.total_students_with_balances, 1))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Outstanding Balances by Class</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={outstandingBalances.balances_by_class}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="class_name" 
                          tick={{ fontSize: 12 }}
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="total_outstanding" 
                          fill="#ef4444" 
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Class Details</h4>
                    {outstandingBalances.balances_by_class.map((balance, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <span className="text-xs font-medium text-gray-900">{balance.class_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({balance.stream_name})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            {formatCurrency(balance.total_outstanding)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {balance.student_count} students
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load outstanding balances
                </div>
              )}
            </div>
          )}

          {activeTab === 'completion-rates' && (
            <div className="space-y-6">
              {paymentCompletion ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Completion Rate</span>
                        <FontAwesomeIcon icon={faPercentage} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {paymentCompletion.overall_completion_rate}%
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Total Charged</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {formatCurrency(paymentCompletion.total_charged)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Total Paid</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {formatCurrency(paymentCompletion.total_paid)}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-900">Outstanding</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-900 mt-1">
                        {formatCurrency(paymentCompletion.outstanding_amount)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Completion by Class</h4>
                    {paymentCompletion.completion_by_class.map((cls, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <span className="text-xs font-medium text-gray-900">{cls.class_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({cls.stream_name})</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-900">
                              {cls.completion_rate}% complete
                            </div>
                            <div className="text-xs text-gray-500">
                              {cls.students_paid_up}/{cls.total_students} students
                            </div>
                          </div>
                          <FontAwesomeIcon 
                            icon={getCompletionIcon(parseFloat(cls.completion_rate))} 
                            className={`text-sm ${getCompletionColor(parseFloat(cls.completion_rate))}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load payment completion rates
                </div>
              )}
            </div>
          )}

          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              {efficiencyMetrics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Collection Rate</span>
                        <FontAwesomeIcon icon={faPercentage} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {efficiencyMetrics.efficiency_metrics.collection_rate}%
                      </div>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Success Rate</span>
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {efficiencyMetrics.efficiency_metrics.success_rate}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Avg Payment/Student</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-900 mt-1">
                        {formatCurrency(efficiencyMetrics.efficiency_metrics.average_payment_per_student)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Methods</h4>
                      <div className="space-y-2">
                        {Object.entries(efficiencyMetrics.payment_methods).map(([method, count]) => (
                          <div key={method} className="flex justify-between items-center">
                            <span className="text-xs text-gray-700 capitalize">{method.replace('_', ' ')}</span>
                            <span className="text-xs font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Status</h4>
                      <div className="space-y-2">
                        {Object.entries(efficiencyMetrics.payment_status).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-xs text-gray-700 capitalize">{status}</span>
                            <span className="text-xs font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load efficiency metrics
                </div>
              )}
            </div>
          )}

          {activeTab === 'health-summary' && (
            <div className="space-y-6">
              {healthSummary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Total Students</span>
                        <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {healthSummary.total_students}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Paid Up</span>
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {healthSummary.students_paid_up}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-900">Total Outstanding</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-900 mt-1">
                        {formatCurrency(healthSummary.total_outstanding)}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Avg Outstanding</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-900 mt-1">
                        {formatCurrency(healthSummary.average_outstanding)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900">Small Balance</span>
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-600" />
                      </div>
                      <div className="text-lg font-bold text-yellow-900 mt-1">
                        {healthSummary.students_small_balance}
                      </div>
                      <div className="text-xs text-yellow-700">$0 - $100</div>
                    </div>
                    <div className="bg-orange-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-900">Medium Balance</span>
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-orange-600" />
                      </div>
                      <div className="text-lg font-bold text-orange-900 mt-1">
                        {healthSummary.students_medium_balance}
                      </div>
                      <div className="text-xs text-orange-700">$100 - $500</div>
                    </div>
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-900">Large Balance</span>
                        <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-900 mt-1">
                        {healthSummary.students_large_balance}
                      </div>
                      <div className="text-xs text-red-700">$500+</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Activity (Last 30 Days)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Payments Made</span>
                        <span className="text-xs font-medium text-gray-900">
                          {healthSummary.recent_activity.payments_last_30_days}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Amount Collected</span>
                        <span className="text-xs font-medium text-gray-900">
                          {formatCurrency(healthSummary.recent_activity.amount_last_30_days)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load health summary
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFinancialAnalytics;
