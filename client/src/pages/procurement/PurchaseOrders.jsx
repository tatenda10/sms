import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faFilter, 
  faEye, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faClock,
  faTruck,
  faExclamationTriangle,
  faDownload,
  faPrint,
  faFileInvoiceDollar,
  faCalendarAlt,
  faBuilding,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  // Mock data for demonstration
  const purchaseOrders = [
    {
      id: 'PO-2025-001',
      supplier: 'ABC Office Supplies',
      contactPerson: 'John Smith',
      orderDate: '2025-01-10',
      expectedDelivery: '2025-01-20',
      actualDelivery: '2025-01-18',
      status: 'delivered',
      totalAmount: 2500,
      items: [
        { name: 'Printer Paper', quantity: 50, unitPrice: 25, total: 1250 },
        { name: 'Pens', quantity: 200, unitPrice: 2.5, total: 500 },
        { name: 'Notebooks', quantity: 100, unitPrice: 7.5, total: 750 }
      ],
      notes: 'Delivered 2 days early. All items in good condition.'
    },
    {
      id: 'PO-2025-002',
      supplier: 'Tech Solutions Inc',
      contactPerson: 'Sarah Johnson',
      orderDate: '2025-01-12',
      expectedDelivery: '2025-01-25',
      actualDelivery: null,
      status: 'in_transit',
      totalAmount: 15000,
      items: [
        { name: 'Laptops', quantity: 10, unitPrice: 1200, total: 12000 },
        { name: 'Monitors', quantity: 10, unitPrice: 300, total: 3000 }
      ],
      notes: 'Order confirmed. Items being prepared for shipment.'
    },
    {
      id: 'PO-2025-003',
      supplier: 'Lab Equipment Pro',
      contactPerson: 'Dr. Michael Brown',
      orderDate: '2025-01-08',
      expectedDelivery: '2025-01-15',
      actualDelivery: '2025-01-15',
      status: 'delivered',
      totalAmount: 8500,
      items: [
        { name: 'Microscopes', quantity: 5, unitPrice: 1200, total: 6000 },
        { name: 'Test Tubes', quantity: 500, unitPrice: 5, total: 2500 }
      ],
      notes: 'Delivered on time. Equipment tested and working properly.'
    },
    {
      id: 'PO-2025-004',
      supplier: 'Sports Equipment Co',
      contactPerson: 'Coach Wilson',
      orderDate: '2025-01-05',
      expectedDelivery: '2025-01-12',
      actualDelivery: null,
      status: 'pending',
      totalAmount: 4500,
      items: [
        { name: 'Basketballs', quantity: 20, unitPrice: 50, total: 1000 },
        { name: 'Soccer Balls', quantity: 15, unitPrice: 40, total: 600 },
        { name: 'Volleyball Nets', quantity: 4, unitPrice: 200, total: 800 },
        { name: 'Tennis Rackets', quantity: 30, unitPrice: 70, total: 2100 }
      ],
      notes: 'Order submitted. Awaiting supplier confirmation.'
    },
    {
      id: 'PO-2025-005',
      supplier: 'Maintenance Tools Ltd',
      contactPerson: 'Robert Garcia',
      orderDate: '2025-01-09',
      expectedDelivery: '2025-01-16',
      actualDelivery: '2025-01-14',
      status: 'delivered',
      totalAmount: 1800,
      items: [
        { name: 'Power Drills', quantity: 3, unitPrice: 300, total: 900 },
        { name: 'Tool Sets', quantity: 5, unitPrice: 180, total: 900 }
      ],
      notes: 'Delivered early. All tools in excellent condition.'
    },
    {
      id: 'PO-2025-006',
      supplier: 'Book World Publishers',
      contactPerson: 'Emily Davis',
      orderDate: '2025-01-11',
      expectedDelivery: '2025-01-22',
      actualDelivery: null,
      status: 'confirmed',
      totalAmount: 3200,
      items: [
        { name: 'Textbooks', quantity: 100, unitPrice: 25, total: 2500 },
        { name: 'Reference Books', quantity: 20, unitPrice: 35, total: 700 }
      ],
      notes: 'Order confirmed by supplier. Processing for shipment.'
    }
  ];

  const suppliers = ['ABC Office Supplies', 'Tech Solutions Inc', 'Lab Equipment Pro', 'Sports Equipment Co', 'Maintenance Tools Ltd', 'Book World Publishers'];
  const statuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'in_transit':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'confirmed':
        return faCheckCircle;
      case 'in_transit':
        return faTruck;
      case 'delivered':
        return faCheckCircle;
      case 'cancelled':
        return faExclamationTriangle;
      default:
        return faExclamationTriangle;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter orders based on search and filters
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || order.supplier === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Purchase Orders</h1>
              <p className="text-xs text-gray-600 mt-1">Track orders and deliveries</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-2 text-xs font-medium">
                <FontAwesomeIcon icon={faDownload} />
                <span>Export</span>
              </button>
              <button className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-700 flex items-center space-x-2 text-xs font-medium">
                <FontAwesomeIcon icon={faPrint} />
                <span>Print</span>
              </button>
              <Link
                to="/dashboard/procurement/purchase-orders/new"
                className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium rounded-md"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>New Order</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-xs" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 rounded"
              >
                <option value="all">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Supplier:</span>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 rounded"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-lg font-semibold text-gray-900">{purchaseOrders.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {purchaseOrders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-2 rounded">
                <FontAwesomeIcon icon={faClock} className="text-yellow-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">In Transit</p>
                <p className="text-lg font-semibold text-purple-600">
                  {purchaseOrders.filter(o => o.status === 'in_transit').length}
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <FontAwesomeIcon icon={faTruck} className="text-purple-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Delivered</p>
                <p className="text-lg font-semibold text-green-600">
                  {purchaseOrders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              Purchase Orders ({filteredOrders.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.supplier}</div>
                        <div className="text-sm text-gray-500">{order.contactPerson}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(order.expectedDelivery).toLocaleDateString()}</div>
                      {order.actualDelivery && (
                        <div className="text-xs text-green-600">
                          Delivered: {new Date(order.actualDelivery).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <FontAwesomeIcon icon={getStatusIcon(order.status)} className="mr-1" />
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/dashboard/procurement/purchase-orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link
                          to={`/dashboard/procurement/purchase-orders/${order.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Order"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Order"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 text-sm">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
