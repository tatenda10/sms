import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';

const Dashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    activeClasses: 0,
    totalEmployees: 0,
    pendingPayments: 0,
    outstandingBalances: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0
  });
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);
  const [revenueBySource, setRevenueBySource] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [expenseTrends, setExpenseTrends] = useState([]);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);

  // Colors for charts
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const authHeaders = { Authorization: `Bearer ${token}` };

      // Initialize local metrics
      let totalStudents = 0;
      let totalEmployees = 0;
      let activeClasses = 0;
      let allClasses = [];
      let studentChanges = null;
      let revenueChanges = null;
      let balanceChanges = null;

      // Fetch students count and calculate change (approximate based on creation date)
      try {
        const studentsRes = await axios.get(`${BASE_URL}/students?page=1&limit=1000`, { headers: authHeaders });
        const students = studentsRes.data.data || [];
        totalStudents = students.length || studentsRes.data.pagination?.totalStudents || 0;

        if (students.length > 0) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const newStudents = students.filter(s => new Date(s.CreatedAt || s.created_at) > thirtyDaysAgo).length;
          const oldStudents = totalStudents - newStudents;
          if (oldStudents > 0) {
            const percentChange = ((newStudents / oldStudents) * 100).toFixed(0);
            studentChanges = { value: `${percentChange}% from last month`, type: 'increase' };
          }
        }
      } catch (err) {
        console.log('Students data not available');
      }

      // Fetch employees count
      try {
        const employeesRes = await axios.get(`${BASE_URL}/employees?page=1&limit=1`, { headers: authHeaders });
        totalEmployees = employeesRes.data.pagination?.totalRecords || employeesRes.data.pagination?.totalEmployees || 0;
      } catch (err) {
        console.log('Employees count not available');
      }

      // Fetch classes count
      try {
        const classesRes = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, { headers: authHeaders });
        allClasses = classesRes.data.data || [];
        activeClasses = allClasses.filter(c => (c.student_count || c.StudentCount || 0) > 0).length;
      } catch (err) {
        console.log('Classes count not available');
      }

      // Fetch revenue analytics and calculate change
      let monthlyRevenue = 0;
      let revenueTrendsData = [];
      try {
        const currentYear = new Date().getFullYear();
        const revenueRes = await axios.get(`${BASE_URL}/analytics/revenue/trends?year=${currentYear}&period=monthly`, { headers: authHeaders });
        if (revenueRes.data.data?.trends) {
          revenueTrendsData = revenueRes.data.data.trends;
          const currentMonth = new Date().getMonth() + 1;
          const currentMonthData = revenueTrendsData.find(t => (Number(t.month) === currentMonth || Number(t.period) === currentMonth));
          const prevMonthData = revenueTrendsData.find(t => (Number(t.month) === (currentMonth - 1) || Number(t.period) === (currentMonth - 1)));

          monthlyRevenue = currentMonthData?.total_revenue || 0;
          const prevRevenue = prevMonthData?.total_revenue || 0;

          if (prevRevenue > 0) {
            const diff = Number(monthlyRevenue) - Number(prevRevenue);
            const percent = ((Math.abs(diff) / Number(prevRevenue)) * 100).toFixed(0);
            revenueChanges = {
              value: `${percent}% from last month`,
              type: diff >= 0 ? 'increase' : 'decrease'
            };
          } else if (currentMonth === 1) {
            revenueChanges = { value: "New Year", type: 'increase' };
          }
        }
      } catch (err) {
        console.log('Revenue trends not available');
      }

      // Fetch student balances and calculate health trend
      // Fetch student balances summary from the primary endpoint
      let outstandingBalances = 0;
      try {
        const balancesRes = await axios.get(`${BASE_URL}/students/balances/summary`, { headers: authHeaders });
        outstandingBalances = balancesRes.data.data?.total_outstanding_debt || balancesRes.data.data?.total_outstanding || 0;
      } catch (err) {
        console.log('Primary balance summary failed');
      }

      // Fetch health summary for trend
      try {
        const healthRes = await axios.get(`${BASE_URL}/analytics/student-finance/health-summary`, { headers: authHeaders });
        if (healthRes.data.data) {
          const health = healthRes.data.data;
          if (outstandingBalances === 0) outstandingBalances = health.total_outstanding || 0;
          const recentCollected = health.recent_activity?.amount_last_30_days || 0;

          if (outstandingBalances > 0 && recentCollected > 0) {
            const collectPercentage = ((recentCollected / (outstandingBalances + recentCollected)) * 100).toFixed(0);
            balanceChanges = { value: `${collectPercentage}% decrease`, type: 'decrease' };
          }
        }
      } catch (err) {
        console.log('Finance health summary not available');
      }

      // Fetch payment statistics (last 6 months)
      let paymentStatsData = [];
      try {
        const paymentsRes = await axios.get(`${BASE_URL}/fees/all-payments?page=1&limit=100`, { headers: authHeaders });
        if (paymentsRes.data.data) {
          const payments = paymentsRes.data.data;
          const monthlyPayments = {};
          payments.forEach(payment => {
            const date = new Date(payment.PaymentDate || payment.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            if (!monthlyPayments[month]) {
              monthlyPayments[month] = { month, amount: 0, count: 0 };
            }
            monthlyPayments[month].amount += parseFloat(payment.Amount || payment.amount || 0);
            monthlyPayments[month].count += 1;
          });
          paymentStatsData = Object.values(monthlyPayments).slice(-6);
        }
      } catch (err) {
        console.log('Payment stats not available');
      }

      // Try to fetch expense trends
      let expenseTrendsData = [];
      try {
        const currentYear = new Date().getFullYear();
        const expenseRes = await axios.get(`${BASE_URL}/analytics/expenses/trends?year=${currentYear}&period=monthly`, { headers: authHeaders });
        if (expenseRes.data.data?.trends) {
          expenseTrendsData = expenseRes.data.data.trends;
        }
      } catch (err) {
        console.log('Expense trends not available');
      }

      // Try to fetch revenue breakdown
      let revenueBySourceData = [];
      try {
        const currentYear = new Date().getFullYear();
        const breakdownRes = await axios.get(`${BASE_URL}/analytics/revenue/breakdown?year=${currentYear}`, { headers: authHeaders });
        if (breakdownRes.data.data?.revenue_sources) {
          revenueBySourceData = breakdownRes.data.data.revenue_sources;
        }
      } catch (err) {
        console.log('Revenue breakdown not available');
      }

      // Try to fetch expense breakdown
      let expenseBreakdownData = [];
      try {
        const currentYear = new Date().getFullYear();
        const expenseBreakdownRes = await axios.get(`${BASE_URL}/analytics/expenses/monthly-breakdown?year=${currentYear}`, { headers: authHeaders });
        if (expenseBreakdownRes.data.data?.breakdown) {
          expenseBreakdownData = expenseBreakdownRes.data.data.breakdown;
        }
      } catch (err) {
        console.log('Expense breakdown not available');
      }

      // Try to fetch payment methods
      let paymentMethodsData = [];
      try {
        const currentYear = new Date().getFullYear();
        const paymentMethodsRes = await axios.get(`${BASE_URL}/analytics/revenue/payment-methods?year=${currentYear}`, { headers: authHeaders });
        if (paymentMethodsRes.data.data?.payment_methods) {
          paymentMethodsData = paymentMethodsRes.data.data.payment_methods;
        }
      } catch (err) {
        console.log('Payment methods not available');
      }

      // Fetch students for gender distribution
      let genderData = [];
      try {
        const studentsListRes = await axios.get(`${BASE_URL}/students?page=1&limit=1000`, { headers: authHeaders });
        const students = studentsListRes.data.data || [];
        if (students.length > 0) {
          const genderCount = { Male: 0, Female: 0, Other: 0, Unknown: 0 };
          students.forEach(student => {
            const gender = student.Gender || 'Unknown';
            if (genderCount.hasOwnProperty(gender)) {
              genderCount[gender]++;
            } else {
              genderCount[gender] = 1;
            }
          });
          genderData = Object.entries(genderCount)
            .filter(([_, count]) => count > 0)
            .map(([gender, count]) => ({ name: gender, value: count }));
        }
      } catch (err) {
        console.log('Gender distribution not available');
      }

      // Create revenue vs expenses comparison
      const revenueVsExpensesData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (revenueTrendsData.length > 0) {
        revenueTrendsData.forEach((revenueItem, index) => {
          const expenseItem = expenseTrendsData.find(e => e.period === revenueItem.period) || { total_expense: 0 };
          revenueVsExpensesData.push({
            month: revenueItem.period_label || months[index] || `Month ${index + 1}`,
            revenue: revenueItem.total_revenue || 0,
            expenses: expenseItem.total_expense || 0
          });
        });
      }

      // Fetch fee collection efficiency metrics for pending and total collections
      let pendingPayments = 0;
      let totalCollectedFees = 0;
      try {
        const efficiencyRes = await axios.get(`${BASE_URL}/analytics/student-finance/efficiency-metrics`, { headers: authHeaders });
        if (efficiencyRes.data.data) {
          const efficiency = efficiencyRes.data.data;
          pendingPayments = efficiency.payment_status?.pending || 0;
          totalCollectedFees = (efficiency.total_collected || 0) + (efficiency.total_boarding_collected || 0);
        }
      } catch (err) {
        console.log('Efficiency metrics not available');
      }

      // Summarize metrics
      const totalRevenue = revenueTrendsData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
      const monthlyExpenses = expenseTrendsData.length > 0 ? expenseTrendsData[expenseTrendsData.length - 1]?.total_expense || 0 : 0;

      setMetrics({
        totalStudents,
        totalRevenue,
        activeClasses,
        totalEmployees,
        pendingPayments,
        outstandingBalances,
        monthlyRevenue,
        monthlyExpenses,
        totalCollectedFees,
        studentChanges,
        revenueChanges,
        balanceChanges
      });

      setRevenueTrends(revenueTrendsData);
      setPaymentStats(paymentStatsData);
      setRevenueBySource(revenueBySourceData);
      setExpenseTrends(expenseTrendsData);
      setRevenueVsExpenses(revenueVsExpensesData);
      setPaymentMethods(paymentMethodsData);
      setExpenseBreakdown(expenseBreakdownData);
      setGenderDistribution(genderData);

      // Student stats by class
      const classStats = (allClasses || [])
        .filter(cls => (cls.student_count || cls.StudentCount || 0) > 0)
        .map(cls => ({
          name: cls.name || cls.Name || 'Unknown',
          students: cls.student_count || cls.StudentCount || 0
        }))
        .sort((a, b) => b.students - a.students);
      setStudentStats(classStats);

    } catch (error) {
      console.error('Critical error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const MetricCard = ({ title, value, icon: Icon, change, changeType, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      purple: 'bg-purple-50 text-purple-600',
      red: 'bg-red-50 text-red-600'
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow relative" style={{ minHeight: '100px' }}>
        <div className={`absolute top-3 right-3 p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="pr-12">
          <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '0.75rem' }}>{title}</p>
          <p className="font-bold text-gray-900 mb-1" style={{ fontSize: '1.1rem' }}>{value}</p>
          {change && (
            <div className={`flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: '0.7rem' }}>
              {changeType === 'increase' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="report-title">Welcome to Brooklyn</h3>
        <p className="report-subtitle">Dashboard Overview</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={formatNumber(metrics.totalStudents)}
          icon={Users}
          change={metrics.studentChanges?.value}
          changeType={metrics.studentChanges?.type}
          color="blue"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          change={metrics.revenueChanges?.value}
          changeType={metrics.revenueChanges?.type}
          color="green"
        />
        <MetricCard
          title="Active Classes"
          value={formatNumber(metrics.activeClasses)}
          icon={BookOpen}
          color="purple"
        />
        <MetricCard
          title="Total Employees"
          value={formatNumber(metrics.totalEmployees)}
          icon={Users}
          color="orange"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={TrendingUp}
          change={metrics.revenueChanges?.value}
          changeType={metrics.revenueChanges?.type}
          color="green"
        />
        <MetricCard
          title="Outstanding Balances"
          value={formatCurrency(metrics.outstandingBalances)}
          icon={CreditCard}
          change={metrics.balanceChanges?.value}
          changeType={metrics.balanceChanges?.type}
          color="red"
        />
        <MetricCard
          title="Pending Payments"
          value={formatNumber(metrics.pendingPayments)}
          icon={CreditCard}
          color="orange"
        />
        <MetricCard
          title="Payment Collections"
          value={formatCurrency(metrics.totalCollectedFees)}
          icon={TrendingUp}
          change={metrics.revenueChanges?.value}
          changeType={metrics.revenueChanges?.type}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends Line Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Revenue Trends</h4>
          {revenueTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No revenue data available
            </div>
          )}
        </div>

        {/* Payment Statistics Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Payment Statistics</h4>
          {paymentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No payment data available
            </div>
          )}
        </div>

        {/* Revenue by Source Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Revenue by Source</h4>
          {revenueBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source_name, percent }) => `${source_name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_amount"
                >
                  {revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No revenue breakdown data available
            </div>
          )}
        </div>

        {/* Students by Class Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Students by Class</h4>
          {studentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6b7280" width={80} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="students" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No student data available
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue vs Expenses Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Revenue vs Expenses</h4>
          {revenueVsExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No comparison data available
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Payment Methods</h4>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method_name, percent }) => `${method_name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_amount"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No payment method data available
            </div>
          )}
        </div>

        {/* Expense Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Expense Trends</h4>
          {expenseTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <Line
                  type="monotone"
                  dataKey="total_expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No expense trend data available
            </div>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Student Gender Distribution</h4>
          {genderDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No gender distribution data available
            </div>
          )}
        </div>

        {/* Expense Breakdown by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1.1rem' }}>Expenses by Category</h4>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis dataKey="category_name" type="category" tick={{ fontSize: 11 }} stroke="#6b7280" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total_amount" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No expense breakdown data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
