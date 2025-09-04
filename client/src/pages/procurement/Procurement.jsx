import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faFileInvoiceDollar, 
  faTruck, 
  faClipboardList,
  faChartBar,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faSearch,
  faFilter,
  faDownload,
  faPrint,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const Procurement = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // State for procurement data
  const [procurementStats, setProcurementStats] = useState({
    totalRequests: 0,
    pendingApproval: 0,
    approved: 0,
    delivered: 0,
    totalValue: 0
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [searchParams, setSearchParams] = useState({
    search: '',
    status: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10
  });

  // Fetch procurement data on component mount
  useEffect(() => {
    fetchProcurementData();
  }, []);

  // Fetch procurement statistics and recent requests
  const fetchProcurementData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch procurement statistics
      const statsResponse = await axios.get(`${BASE_URL}/procurement/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProcurementStats(statsResponse.data.data);

      // Fetch recent purchase requests
      const requestsResponse = await axios.get(`${BASE_URL}/procurement/purchase-requests`, {
        params: {
          page: 1,
          limit: 5,
          sort: 'created_at',
          order: 'desc'
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentRequests(requestsResponse.data.data || []);

    } catch (error) {
      console.error('Error fetching procurement data:', error);
      setError(error.response?.data?.message || 'Failed to fetch procurement data');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this purchase request?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/procurement/purchase-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Purchase request deleted successfully');
      setShowSuccessModal(true);
      fetchProcurementData(); // Refresh data
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      setError(error.response?.data?.message || 'Failed to delete purchase request');
      setShowErrorModal(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'approved':
        return faCheckCircle;
      case 'delivered':
        return faTruck;
      case 'rejected':
        return faExclamationTriangle;
      default:
        return faExclamationTriangle;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading procurement data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Procurement Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage purchase requests and procurement activities</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard/procurement/purchase-requests/new"
                className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>New Purchase Request</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                <p className="text-lg font-semibold text-gray-900">{procurementStats.totalRequests}</p>
              </div>
              <div className="bg-blue-100 p-2">
                <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending Approval</p>
                <p className="text-lg font-semibold text-yellow-600">{procurementStats.pendingApproval}</p>
              </div>
              <div className="bg-yellow-100 p-2">
                <FontAwesomeIcon icon={faClock} className="text-yellow-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-semibold text-blue-600">{procurementStats.approved}</p>
              </div>
              <div className="bg-blue-100 p-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Delivered</p>
                <p className="text-lg font-semibold text-green-600">{procurementStats.delivered}</p>
              </div>
              <div className="bg-green-100 p-2">
                <FontAwesomeIcon icon={faTruck} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(procurementStats.totalValue)}</p>
              </div>
              <div className="bg-green-100 p-2">
                <FontAwesomeIcon icon={faChartBar} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Link
            to="/dashboard/procurement/purchase-requests"
            className="bg-white border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2">
                <FontAwesomeIcon icon={faClipboardList} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Purchase Requests</h3>
                <p className="text-xs text-gray-500">View and manage requests</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/procurement/suppliers"
            className="bg-white border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2">
                <FontAwesomeIcon icon={faShoppingCart} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Suppliers</h3>
                <p className="text-xs text-gray-500">Manage vendor relationships</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/procurement/purchase-orders"
            className="bg-white border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Purchase Orders</h3>
                <p className="text-xs text-gray-500">Track orders and deliveries</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/procurement/reports"
            className="bg-white border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2">
                <FontAwesomeIcon icon={faChartBar} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Reports</h3>
                <p className="text-xs text-gray-500">Analytics and insights</p>
              </div>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 p-4 hover:border-red-300 hover:shadow-md transition-all cursor-default">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2">
                <FontAwesomeIcon icon={faUserShield} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Admin</h3>
                <p className="text-xs text-gray-500">User management & configuration</p>
                <div className="mt-2 space-y-1">
                  <Link
                    to="/dashboard/settings"
                    className="block text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    User Management
                  </Link>
                  <Link
                    to="/dashboard/configurations"
                    className="block text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    System Configurations
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Purchase Requests */}
        <div className="bg-white border border-gray-200 shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Purchase Requests</h2>
              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard/procurement/purchase-requests"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
                <button
                  onClick={() => window.print()}
                  className="text-gray-600 hover:text-gray-700 p-1"
                  title="Print"
                >
                  <FontAwesomeIcon icon={faPrint} className="text-sm" />
                </button>
                <button
                  onClick={() => {/* Export functionality */}}
                  className="text-gray-600 hover:text-gray-700 p-1"
                  title="Export"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                        <div className="text-xs text-gray-500">#{request.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.requester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(request.amount)}</div>
                      </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${getStatusColor(request.status)}`}>
                        <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(request.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/dashboard/procurement/purchase-requests/${request.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <Link
                            to={`/dashboard/procurement/purchase-requests/${request.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          <button 
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No purchase requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={success}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={error}
      />
    </div>
  );
};

export default Procurement;
