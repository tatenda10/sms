import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRoute, 
  faBus, 
  faMoneyBillWave, 
  faUsers,
  faPlus,
  faFileInvoiceDollar,
  faCalendarAlt,
  faExclamationTriangle,
  faCheckCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const Transport = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for transport data
  const [transportSummary, setTransportSummary] = useState({
    total_routes: 0,
    active_students: 0,
    total_fees: 0,
    total_paid: 0,
    total_pending: 0,
    total_overdue: 0
  });
  
  const [recentFees, setRecentFees] = useState([]);
  const [overdueFees, setOverdueFees] = useState([]);
  const [routeStats, setRouteStats] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadTransportData();
  }, []);

  const loadTransportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load payment summary
      const summaryResponse = await axios.get(`${BASE_URL}/transport/payments/summary`, {
        headers: authHeaders
      });
      
      if (summaryResponse.data.success) {
        setTransportSummary(summaryResponse.data.data);
      }
      
      // Load recent fees
      const feesResponse = await axios.get(`${BASE_URL}/transport/payments/fees?limit=5`, {
        headers: authHeaders
      });
      
      if (feesResponse.data.success) {
        setRecentFees(feesResponse.data.data);
      }
      
      // Load overdue fees
      const overdueResponse = await axios.get(`${BASE_URL}/transport/payments/overdue`, {
        headers: authHeaders
      });
      
      if (overdueResponse.data.success) {
        setOverdueFees(overdueResponse.data.data);
      }
      
      // Load route statistics
      const routeStatsResponse = await axios.get(`${BASE_URL}/transport/routes/stats/summary`, {
        headers: authHeaders
      });
      
      if (routeStatsResponse.data.success) {
        setRouteStats(routeStatsResponse.data.data);
      }
      
    } catch (err) {
      console.error('Error loading transport data:', err);
      setError('Failed to load transport data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">Transport Management</h1>
            <p className="text-xs text-gray-500 mt-1">Manage routes, vehicles, and transport payments</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/dashboard/transport/routes/create')}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>Add Route</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard/transport/students/register')}
              className="bg-green-600 text-white px-3 py-1.5 text-xs hover:bg-green-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faUsers} className="text-xs" />
              <span>Register Student</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard/transport/payments/record')}
              className="bg-purple-600 text-white px-3 py-1.5 text-xs hover:bg-purple-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-xs" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faRoute} className="text-blue-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Active Routes</p>
              <p className="text-lg font-semibold text-gray-900">{routeStats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="text-green-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Active Students</p>
              <p className="text-lg font-semibold text-gray-900">{transportSummary.active_students}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-yellow-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Pending Fees</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(transportSummary.total_pending, 'USD')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(transportSummary.total_overdue, 'USD')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate('/dashboard/transport/routes')}
          className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faRoute} className="text-blue-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Routes</h3>
              <p className="text-xs text-gray-500">View and manage transport routes</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/transport/vehicles')}
          className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faBus} className="text-green-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Vehicles</h3>
              <p className="text-xs text-gray-500">View and manage transport vehicles</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/transport/payments')}
          className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Payments</h3>
              <p className="text-xs text-gray-500">View and manage transport payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Route Statistics */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Route Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active Students</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Fees</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routeStats.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-900">{route.route_name}</div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">{route.route_code}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(route.monthly_fee, route.currency)}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{route.active_students}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(route.total_paid + route.total_pending + route.total_overdue, route.currency)}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(route.total_paid, route.currency)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => navigate(`/dashboard/transport/routes/${route.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      title="View Details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Fees */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Recent Transport Fees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee Period</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{fee.student_name}</div>
                      <div className="text-xs text-gray-500">{fee.student_number}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">{fee.route_name}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{fee.fee_period}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(fee.amount, fee.currency)}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatDate(fee.due_date)}</td>
                  <td className="px-4 py-2">{getStatusBadge(fee.status)}</td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigate(`/dashboard/transport/payments/fees/${fee.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="View Details"
                      >
                        View
                      </button>
                      {fee.status === 'Pending' && (
                        <button
                          onClick={() => navigate(`/dashboard/transport/payments/record?fee_id=${fee.id}`)}
                          className="text-green-600 hover:text-green-800 text-xs"
                          title="Record Payment"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Fees */}
      {overdueFees.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
            <h2 className="text-sm font-medium text-red-900 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
              Overdue Transport Fees
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Route</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Days Overdue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueFees.slice(0, 5).map((fee) => (
                  <tr key={fee.id} className="hover:bg-red-50">
                    <td className="px-4 py-2">
                      <div>
                        <div className="text-xs font-medium text-gray-900">{fee.student_name}</div>
                        <div className="text-xs text-gray-500">{fee.student_number}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-900">{fee.route_name}</td>
                    <td className="px-4 py-2 text-xs text-red-600 font-medium">{formatCurrency(fee.amount, fee.currency)}</td>
                    <td className="px-4 py-2 text-xs text-gray-900">{formatDate(fee.due_date)}</td>
                    <td className="px-4 py-2 text-xs text-red-600 font-medium">{fee.days_overdue} days</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => navigate(`/dashboard/transport/payments/record?fee_id=${fee.id}`)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                        title="Record Payment"
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {overdueFees.length > 5 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600">
                Showing 5 of {overdueFees.length} overdue fees. 
                <button 
                  onClick={() => navigate('/dashboard/transport/payments/overdue')}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  View all overdue fees
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default Transport;
