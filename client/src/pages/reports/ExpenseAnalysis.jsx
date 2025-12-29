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

  const tabs = [
    { id: 'breakdown', name: 'Expense Breakdown', icon: faChartPie },
    { id: 'cost-per-student', name: 'Cost Per Student', icon: faUsers },
    { id: 'trends', name: 'Expense Trends', icon: faChartLine }
  ];

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Expense Analysis</h2>
          <p className="report-subtitle">Analyze and track expense trends and breakdowns.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn-checklist"
            style={{ fontSize: '0.7rem', padding: '6px 12px' }}
          >
            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
            Export
          </button>
          <button 
            className="btn-checklist"
            style={{ fontSize: '0.7rem', padding: '6px 12px' }}
          >
            <FontAwesomeIcon icon={faPrint} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
            Print
          </button>
        </div>
      </div>

      {/* Filters and Tabs Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: `1px solid ${activeTab === tab.id ? '#2563eb' : 'var(--border-color)'}`,
                  borderRadius: '4px',
                  background: activeTab === tab.id ? '#2563eb' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.7rem' }} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-primary)' }}>Year:</span>
              <input 
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
                placeholder="2024"
                min="2000"
                max="2100"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-primary)' }}>Month:</span>
              <select 
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  outline: 'none',
                  minWidth: '120px'
                }}
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-primary)' }}>Period:</span>
              <select 
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  outline: 'none',
                  minWidth: '100px'
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="btn-checklist"
              style={{ fontSize: '0.7rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ marginRight: '4px', fontSize: '0.7rem' }} />
              ) : (
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '4px', fontSize: '0.7rem' }} />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="report-content-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: '20px 30px'
      }}>
        {error && (
          <div style={{ 
            padding: '10px', 
            background: '#fee2e2', 
            border: '1px solid #fecaca', 
            color: '#dc2626', 
            fontSize: '0.75rem', 
            marginBottom: '16px', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '0.7rem' }} />
            {error}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {expenseBreakdown ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Expenses by Category</h4>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e40af' }}>Total Expenses</span>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e40af' }}>
                          {formatCurrency(expenseBreakdown.total_expenses)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#1e3a8a', marginTop: '4px' }}>
                        Period: {expenseBreakdown.period}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Top Categories</h4>
                      {expenseBreakdown.expenses.slice(0, 5).map((expense, index) => (
                        <div key={expense.category_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{expense.category_name}</span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {formatCurrency(expense.total_amount)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
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
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Click "Search" to load expense breakdown data
              </div>
            )}
          </div>
        )}

        {activeTab === 'cost-per-student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {costPerStudent ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e40af' }}>Total Expenses</span>
                      <FontAwesomeIcon icon={faDollarSign} style={{ color: '#2563eb', fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e40af', marginTop: '4px' }}>
                      {formatCurrency(costPerStudent.total_expenses)}
                    </div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#166534' }}>Active Students</span>
                      <FontAwesomeIcon icon={faUsers} style={{ color: '#10b981', fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534', marginTop: '4px' }}>
                      {costPerStudent.active_students}
                    </div>
                  </div>
                  <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '4px', border: '1px solid #e9d5ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b21a8' }}>Cost Per Student</span>
                      <FontAwesomeIcon icon={faDollarSign} style={{ color: '#8b5cf6', fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6b21a8', marginTop: '4px' }}>
                      {formatCurrency(costPerStudent.cost_per_student)}
                    </div>
                  </div>
                </div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Cost Per Student by Category</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {costPerStudent.expenses_by_category.map((expense, index) => (
                      <div key={expense.category_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < costPerStudent.expenses_by_category.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{expense.category_name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {formatCurrency(expense.cost_per_student)} per student
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Total: {formatCurrency(expense.total_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Click "Search" to load cost per student analysis
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {expenseTrends ? (
              <>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Expense Trends ({expenseTrends.period_type})</h4>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Trend Data</h4>
                  {expenseTrends.trends.map((trend, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < expenseTrends.trends.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{trend.period_label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {formatCurrency(trend.total_expenses)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {trend.transaction_count} transactions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Click "Search" to load expense trends
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseAnalysis;
