import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, 
  faTshirt, 
  faBook, 
  faFlask, 
  faFutbol, 
  faPalette, 
  faBroom, 
  faLaptop,
  faUtensils,
  faChartBar,
  faPlus,
  faSearch,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faEdit,
  faEye,
  faTrash,
  faUserGraduate,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const Inventory = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [inventoryStats, setInventoryStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    total_categories: 0,
    monthly_issues: 0,
    monthly_payments: 0
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);



  useEffect(() => {
    if (token) {
      loadInventoryData();
    }
  }, [token]);

  const loadInventoryData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [summaryResponse, itemsResponse, issuesResponse, categoriesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/inventory/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/inventory/items?page=${page}&limit=${pagination.limit}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/inventory/issues?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/inventory/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('📊 Summary Response:', summaryResponse.data);
      console.log('📦 Items Response:', itemsResponse.data);
      console.log('🎓 Issues Response:', issuesResponse.data);
      console.log('📁 Categories Response:', categoriesResponse.data);

      setInventoryStats(summaryResponse.data.data);
      setInventoryItems(itemsResponse.data.data);
      setPagination(itemsResponse.data.pagination);
      setRecentIssues(issuesResponse.data.data);
      setCategories(categoriesResponse.data.data);

    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
            Low Stock
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
            Out of Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getStockStatus = (currentStock) => {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category_id == categoryFilter;
    const itemStatus = getStockStatus(item.current_stock);
    const matchesStatus = !statusFilter || itemStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];

  const viewItemDetails = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading inventory data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
              </div>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={loadInventoryData}
                className="px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 md:py-6">
      <div className="w-full px-2 md:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-xs md:text-sm text-gray-600">Manage uniforms, track stock levels, and issue items to students</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => loadInventoryData(pagination.page)}
                disabled={loading}
                className="bg-gray-600 text-white px-3 md:px-4 py-2 text-xs hover:bg-gray-700 flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <Link
                to="/dashboard/inventory/add-item"
                className="bg-gray-900 text-white px-3 md:px-4 py-2 text-xs hover:bg-gray-800 flex items-center justify-center w-full sm:w-auto"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Item
              </Link>
              <Link
                to="/dashboard/inventory/issue-uniform"
                className="bg-blue-600 text-white px-3 md:px-4 py-2 text-xs hover:bg-blue-700 flex items-center justify-center w-full sm:w-auto"
              >
                <FontAwesomeIcon icon={faUserGraduate} className="mr-2" />
                Issue Uniform
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white border border-gray-200 p-3 md:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Items</p>
                <p className="text-sm md:text-lg font-semibold text-gray-900">{inventoryStats.total_items?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-blue-100 p-2">
                <FontAwesomeIcon icon={faBoxes} className="text-blue-600 text-xs md:text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 md:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Low Stock</p>
                <p className="text-sm md:text-lg font-semibold text-yellow-600">{inventoryStats.low_stock_items || 0}</p>
              </div>
              <div className="bg-yellow-100 p-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xs md:text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 md:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Out of Stock</p>
                <p className="text-sm md:text-lg font-semibold text-red-600">{inventoryStats.out_of_stock_items || 0}</p>
              </div>
              <div className="bg-red-100 p-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xs md:text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 md:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Monthly Issues</p>
                <p className="text-sm md:text-lg font-semibold text-green-600">{inventoryStats.monthly_issues || 0}</p>
              </div>
              <div className="bg-green-100 p-2">
                <FontAwesomeIcon icon={faUserGraduate} className="text-green-600 text-xs md:text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-3 md:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Categories</p>
                <p className="text-sm md:text-lg font-semibold text-purple-600">{inventoryStats.total_categories || 0}</p>
              </div>
              <div className="bg-purple-100 p-2">
                <FontAwesomeIcon icon={faBoxes} className="text-purple-600 text-xs md:text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Link
            to="/dashboard/inventory/uniforms"
            className="bg-white border border-gray-200 p-3 md:p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-blue-100 p-2">
                <FontAwesomeIcon icon={faTshirt} className="text-blue-600 text-xs md:text-sm" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900">Uniforms</h3>
                <p className="text-xs text-gray-500">School & sports uniforms</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/inventory/issue-uniform"
            className="bg-white border border-gray-200 p-3 md:p-4 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-green-100 p-2">
                <FontAwesomeIcon icon={faUserGraduate} className="text-green-600 text-xs md:text-sm" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900">Issue Uniform</h3>
                <p className="text-xs text-gray-500">Give uniforms to students</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/inventory/payments"
            className="bg-white border border-gray-200 p-3 md:p-4 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-purple-100 p-2">
                <FontAwesomeIcon icon={faCreditCard} className="text-purple-600 text-xs md:text-sm" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900">Payments</h3>
                <p className="text-xs text-gray-500">Track uniform payments</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/inventory/reports"
            className="bg-white border border-gray-200 p-3 md:p-4 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-orange-100 p-2">
                <FontAwesomeIcon icon={faChartBar} className="text-orange-600 text-xs md:text-sm" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900">Reports</h3>
                <p className="text-xs text-gray-500">Analytics & insights</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 p-3 md:p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" 
                />
                <input
                  type="text"
                  placeholder="Search items by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-full sm:w-auto"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-gray-200 overflow-hidden shadow mb-4">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200" style={{ minWidth: '400px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-2 md:px-4 py-6 md:py-8 text-center text-gray-500">
                      <FontAwesomeIcon icon={faBoxes} className="text-xl md:text-2xl mb-2" />
                      <p className="text-xs md:text-sm">No inventory items found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inventoryItems.length === 0 
                          ? "Add your first item to get started" 
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                      <div className="text-xs md:text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                      <div className="text-xs md:text-sm text-gray-900">{item.current_stock || 0}</div>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                      {getStatusBadge(getStockStatus(item.current_stock))}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-center">
                      <button 
                        onClick={() => viewItemDetails(item)}
                        className="text-blue-600 hover:text-blue-900 text-xs p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="bg-white border border-gray-200 p-3 md:p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
              </div>
              <div className="flex items-center justify-center space-x-1 md:space-x-2">
                <button
                  onClick={() => loadInventoryData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-2 md:px-3 py-1 text-xs border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadInventoryData(pageNum)}
                      className={`px-2 md:px-3 py-1 text-xs border ${
                        pageNum === pagination.page
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => loadInventoryData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-2 md:px-3 py-1 text-xs border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Details Modal */}
        {showItemModal && selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-4 md:p-6 border w-full max-w-md shadow-lg bg-white">
              <div className="mb-4">
                <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2">Item Details</h3>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 text-xs md:text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.reference}</span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.category_name || 'No category'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.description || 'No description'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.current_stock || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatCurrency(selectedItem.unit_price || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatCurrency((selectedItem.current_stock || 0) * (selectedItem.unit_price || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.location || 'No location'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Supplier:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedItem.supplier || 'No supplier'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{getStatusBadge(getStockStatus(selectedItem.current_stock))}</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Close
                </button>
                <Link
                  to={`/dashboard/inventory/issue-uniform?item=${selectedItem.id}`}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 text-center w-full sm:w-auto"
                >
                  Issue Item
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
