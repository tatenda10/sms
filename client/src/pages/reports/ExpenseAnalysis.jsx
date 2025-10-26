import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faChartLine, 
  faDollarSign,
  faUsers,
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

const ExpenseAnalysis = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('breakdown');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    start_date: '',
    end_date: '',
    period: 'monthly'
  });

  // Data states
  const [expenseBreakdown, setExpenseBreakdown] = useState(null);
  const [costPerStudent, setCostPerStudent] = useState(null);
  const [expenseTrends, setExpenseTrends] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch expense breakdown
  const fetchExpenseBreakdown = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date && filters.end_date) {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      } else if (filters.year && filters.month) {
        params.append('year', filters.year);
        params.append('month', filters.month);
      } else if (filters.year) {
        params.append('year', filters.year);
      }

      const response = await axios.get(
        `${BASE_URL}/analytics/expenses/monthly-breakdown?${params}`,
        { headers: authHeaders }
      );
      setExpenseBreakdown(response.data.data);
    } catch (err) {
      setError('Failed to fetch expense breakdown');
      console.error('Error fetching expense breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cost per student analysis
  const fetchCostPerStudent = async () => {
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
        `${BASE_URL}/analytics/expenses/cost-per-student?${params}`,
        { headers: authHeaders }
      );
      setCostPerStudent(response.data.data);
    } catch (err) {
      setError('Failed to fetch cost per student analysis');
      console.error('Error fetching cost per student analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch expense trends
  const fetchExpenseTrends = async () => {
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
        `${BASE_URL}/analytics/expenses/trends?${params}`,
        { headers: authHeaders }
      );
      setExpenseTrends(response.data.data);
    } catch (err) {
      setError('Failed to fetch expense trends');
      console.error('Error fetching expense trends:', err);
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
    if (activeTab === 'breakdown') {
      fetchExpenseBreakdown();
    } else if (activeTab === 'cost-per-student') {
      fetchCostPerStudent();
    } else if (activeTab === 'trends') {
      fetchExpenseTrends();
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
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(payload[0].value)}
          </p>
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
              <FontAwesomeIcon icon={faChartPie} className="text-gray-600 text-sm" />
              <h1 className="text-lg font-semibold text-gray-900">Expense Analysis</h1>
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
              <span className="text-xs font-medium text-gray-700">Month:</span>
              <select 
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
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
              { id: 'breakdown', label: 'Expense Breakdown', icon: faChartPie },
              { id: 'cost-per-student', label: 'Cost Per Student', icon: faUsers },
              { id: 'trends', label: 'Expense Trends', icon: faChartLine }
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

          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {expenseBreakdown ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Expenses by Category</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expenseBreakdown.expenses}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category_name, percent }) => `${category_name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="total_amount"
                          >
                            {expenseBreakdown.expenses.map((entry, index) => (
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
                          <span className="text-sm font-medium text-blue-900">Total Expenses</span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(expenseBreakdown.total_expenses)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Period: {expenseBreakdown.period}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Top Categories</h4>
                        {expenseBreakdown.expenses.slice(0, 5).map((expense, index) => (
                          <div key={expense.category_name} className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-700">{expense.category_name}</span>
                            <div className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(expense.total_amount)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({expense.percentage}%)
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
                  Click "Search" to load expense breakdown data
                </div>
              )}
            </div>
          )}

          {activeTab === 'cost-per-student' && (
            <div className="space-y-6">
              {costPerStudent ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Total Expenses</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {formatCurrency(costPerStudent.total_expenses)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Active Students</span>
                        <FontAwesomeIcon icon={faUsers} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {costPerStudent.active_students}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Cost Per Student</span>
                        <FontAwesomeIcon icon={faDollarSign} className="text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-900 mt-1">
                        {formatCurrency(costPerStudent.cost_per_student)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Cost Per Student by Category</h4>
                    <div className="space-y-2">
                      {costPerStudent.expenses_by_category.map((expense, index) => (
                        <div key={expense.category_name} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-xs text-gray-700">{expense.category_name}</span>
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-900">
                              {formatCurrency(expense.cost_per_student)} per student
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {formatCurrency(expense.total_amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load cost per student analysis
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              {expenseTrends ? (
                <>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Expense Trends ({expenseTrends.period_type})</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={expenseTrends.trends}>
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
                          dataKey="total_expenses" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Trend Data</h4>
                    {expenseTrends.trends.map((trend, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-xs text-gray-700">{trend.period_label}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            {formatCurrency(trend.total_expenses)}
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
                  Click "Search" to load expense trends
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalysis;
