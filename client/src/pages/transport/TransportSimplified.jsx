import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRoute, faUserGraduate, faMoneyBillWave, faExclamationTriangle,
  faPlus, faCalendarAlt, faSearch, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const TransportSimplified = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeRoutes: 0,
    activeStudents: 0,
    pendingFees: 0,
    overdueFees: 0
  });
  const [recentFees, setRecentFees] = useState([]);
  const [overdueFees, setOverdueFees] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 Token:', token);
      console.log('📡 Auth Headers:', authHeaders);
      console.log('🌐 Base URL:', BASE_URL);

      // Load route stats
      const routesResponse = await axios.get(`${BASE_URL}/transport/routes/stats/summary`, {
        headers: authHeaders
      });

      // Load registration summary
      const registrationsResponse = await axios.get(`${BASE_URL}/transport/registrations/summary`, {
        headers: authHeaders
      });

      // Load payment summary
      const paymentsResponse = await axios.get(`${BASE_URL}/transport/payments/summary`, {
        headers: authHeaders
      });

      // Load recent fees
      const feesResponse = await axios.get(`${BASE_URL}/transport/fees?limit=5`, {
        headers: authHeaders
      });

      // Load overdue fees
      const overdueResponse = await axios.get(`${BASE_URL}/transport/payments/overdue`, {
        headers: authHeaders
      });

      if (routesResponse.data.success && registrationsResponse.data.success && 
          paymentsResponse.data.success && feesResponse.data.success) {
        
        const routeStats = routesResponse.data.data;
        const registrationStats = registrationsResponse.data.data;
        const paymentStats = paymentsResponse.data.data;

        setStats({
          activeRoutes: routeStats.active_routes || 0,
          activeStudents: registrationStats.active_registrations || 0,
          pendingFees: paymentStats.pending_fees || 0,
          overdueFees: paymentStats.overdue_fees || 0
        });

        setRecentFees(feesResponse.data.data || []);
        setOverdueFees(overdueResponse.data.success ? overdueResponse.data.data : []);
      }

    } catch (err) {
      console.error('❌ Error loading transport dashboard data:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error code:', err.code);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please check if you are logged in and have the required permissions.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to access transport management.');
      } else {
        setError(`Failed to load transport dashboard data: ${err.response?.status} - ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
                         <div className="animate-spin h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transport Management</h1>
            <p className="text-xs text-gray-600">Manage transport routes, student registrations, and weekly fees</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faRoute} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRoutes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faMoneyBillWave} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Fees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue Fees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueFees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to="/dashboard/transport/routes"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <FontAwesomeIcon icon={faRoute} className="mr-2 text-blue-600" />
              Manage Routes
            </Link>
            
            <Link
              to="/dashboard/transport/registrations"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <FontAwesomeIcon icon={faUserGraduate} className="mr-2 text-green-600" />
              Student Registration
            </Link>
            
            <Link
              to="/dashboard/transport/fees"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-blue-600" />
              Weekly Fees
            </Link>
            
            <Link
              to="/dashboard/transport/schedule"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-purple-600" />
              Weekly Schedule
            </Link>
          </div>
        </div>

        {/* Route Statistics */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Route Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.activeRoutes}</p>
              <p className="text-xs text-gray-500">Active Routes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.activeStudents}</p>
              <p className="text-xs text-gray-500">Registered Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingFees}</p>
              <p className="text-xs text-gray-500">Pending Payments</p>
            </div>
          </div>
        </div>

        {/* Recent Weekly Fees */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Recent Weekly Fees</h3>
            <Link
              to="/dashboard/transport/fees"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          
          {recentFees.length > 0 ? (
            <div className="space-y-3">
              {recentFees.slice(0, 5).map((fee) => (
                                 <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fee.student_name}</p>
                    <p className="text-xs text-gray-500">{fee.route_name} • Week of {formatDate(fee.week_start_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(fee.amount, fee.currency)}</p>
                                         <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                       fee.status === 'Paid' ? 'bg-green-100 text-green-800' :
                       fee.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                       'bg-red-100 text-red-800'
                     }`}>
                       {fee.status}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No weekly fees found</p>
          )}
        </div>

        {/* Overdue Fees Alert */}
                 {overdueFees.length > 0 && (
           <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Overdue Fees Alert</h3>
            </div>
            <p className="text-sm text-red-700 mb-3">
              There are {overdueFees.length} overdue transport fees that require immediate attention.
            </p>
                         <Link
               to="/dashboard/transport/fees"
               className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200"
             >
               View Overdue Fees
             </Link>
          </div>
        )}

                 {/* Error Message */}
         {error && (
           <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportSimplified;
