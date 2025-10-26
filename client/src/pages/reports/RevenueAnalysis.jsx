import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faChartPie,
  faDollarSign,
  faCreditCard,
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const RevenueAnalysis = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('trends');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    period: 'monthly'
  });

  // Data states
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [feeCollectionTrends, setFeeCollectionTrends] = useState(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch revenue trends
  const fetchRevenueTrends = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', filters.period);
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/revenue/trends?${params}`,
        { headers: authHeaders }
      );
      setRevenueTrends(response.data.data);
    } catch (err) {
      setError('Failed to fetch revenue trends');
      console.error('Error fetching revenue trends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch fee collection trends
  const fetchFeeCollectionTrends = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/revenue/fee-collection-trends?${params}`,
        { headers: authHeaders }
      );
      setFeeCollectionTrends(response.data.data);
    } catch (err) {
      setError('Failed to fetch fee collection trends');
      console.error('Error fetching fee collection trends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch revenue breakdown
  const fetchRevenueBreakdown = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/revenue/breakdown?${params}`,
        { headers: authHeaders }
      );
      setRevenueBreakdown(response.data.data);
    } catch (err) {
      setError('Failed to fetch revenue breakdown');
      console.error('Error fetching revenue breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/revenue/payment-methods?${params}`,
        { headers: authHeaders }
      );
      setPaymentMethods(response.data.data);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error('Error fetching payment methods:', err);
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
    if (activeTab === 'trends') {
      fetchRevenueTrends();
    } else if (activeTab === 'fee-collection') {
      fetchFeeCollectionTrends();
    } else if (activeTab === 'breakdown') {
      fetchRevenueBreakdown();
    } else if (activeTab === 'payment-methods') {
      fetchPaymentMethods();
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faChartLine} className="text-gray-600 text-sm" />
              <h1 className="text-lg font-semibold text-gray-900">Revenue Analysis</h1>
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
              <span className="text-xs font-medium text-gray-700">Period:</span>
              <select 
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
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
              { id: 'trends', label: 'Revenue Trends', icon: faChartLine },
              { id: 'fee-collection', label: 'Fee Collection', icon: faDollarSign },
              { id: 'breakdown', label: 'Revenue Breakdown', icon: faChartPie },
              { id: 'payment-methods', label: 'Payment Methods', icon: faCreditCard }
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

          {activeTab === 'trends' && (
            <div className="space-y-6">
              {revenueTrends ? (
                <>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Revenue Trends ({revenueTrends.period_type})</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueTrends.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period_label" 
                          tick={{ fontSize: 12 }}
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="total_revenue" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Trend Data</h4>
                    {revenueTrends.trends.map((trend, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-xs text-gray-700">{trend.period_label}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            {formatCurrency(trend.total_revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {trend.transaction_count} transactions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load revenue trends
                </div>
              )}
            </div>
          )}

          {activeTab === 'fee-collection' && (
            <div className="space-y-6">
              {feeCollectionTrends ? (
                <>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Fee Collection Trends by Type</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={feeCollectionTrends.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period_label" 
                          tick={{ fontSize: 12 }}
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tuition" stackId="a" fill="#3b82f6" name="Tuition" />
                        <Bar dataKey="boarding" stackId="a" fill="#10b981" name="Boarding" />
                        <Bar dataKey="transport" stackId="a" fill="#f59e0b" name="Transport" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Collection Data</h4>
                    {feeCollectionTrends.trends.map((trend, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-xs text-gray-700">{trend.period_label}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            Total: {formatCurrency(trend.total)}
                          </div>
                          <div className="text-xs text-gray-500">
                            T: {formatCurrency(trend.tuition)} | B: {formatCurrency(trend.boarding)} | Tr: {formatCurrency(trend.transport)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load fee collection trends
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {revenueBreakdown ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Revenue by Source</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={revenueBreakdown.revenue_sources}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ source_name, percent }) => `${source_name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="total_amount"
                          >
                            {revenueBreakdown.revenue_sources.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">Total Revenue</span>
                          <span className="text-lg font-bold text-green-900">
                            {formatCurrency(revenueBreakdown.total_revenue)}
                          </span>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          Period: {revenueBreakdown.period}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Revenue Sources</h4>
                        {revenueBreakdown.revenue_sources.map((source, index) => (
                          <div key={source.source_name} className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-700">{source.source_name}</span>
                            <div className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(source.total_amount)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({source.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load revenue breakdown
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              {paymentMethods ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Methods Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={paymentMethods.payment_methods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ payment_method, percent }) => `${payment_method} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="total_amount"
                          >
                            {paymentMethods.payment_methods.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">Total Collected</span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(paymentMethods.total_amount)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Period: {paymentMethods.period}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Payment Methods</h4>
                        {paymentMethods.payment_methods.map((method, index) => (
                          <div key={method.payment_method} className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-700 capitalize">{method.payment_method}</span>
                            <div className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(method.total_amount)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({method.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load payment methods analysis
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;
