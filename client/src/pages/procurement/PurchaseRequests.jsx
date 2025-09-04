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
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const PurchaseRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Mock data for demonstration
  const purchaseRequests = [
    {
      id: 1,
      title: 'Office Supplies',
      requester: 'John Doe',
      department: 'Administration',
      amount: 2500,
      status: 'pending',
      date: '2025-01-15',
      priority: 'medium',
      description: 'Office supplies including paper, pens, and other stationery items'
    },
    {
      id: 2,
      title: 'Computer Equipment',
      requester: 'Jane Smith',
      department: 'IT',
      amount: 15000,
      status: 'approved',
      date: '2025-01-14',
      priority: 'high',
      description: 'New computers and peripherals for IT department'
    },
    {
      id: 3,
      title: 'Laboratory Materials',
      requester: 'Dr. Johnson',
      department: 'Science',
      amount: 8500,
      status: 'delivered',
      date: '2025-01-13',
      priority: 'high',
      description: 'Laboratory equipment and chemicals for science department'
    },
    {
      id: 4,
      title: 'Library Books',
      requester: 'Mary Wilson',
      department: 'Library',
      amount: 3200,
      status: 'pending',
      date: '2025-01-12',
      priority: 'low',
      description: 'New books for library collection'
    },
    {
      id: 5,
      title: 'Sports Equipment',
      requester: 'Coach Brown',
      department: 'Physical Education',
      amount: 4500,
      status: 'approved',
      date: '2025-01-11',
      priority: 'medium',
      description: 'Sports equipment for physical education classes'
    },
    {
      id: 6,
      title: 'Maintenance Tools',
      requester: 'Mike Davis',
      department: 'Facilities',
      amount: 1800,
      status: 'delivered',
      date: '2025-01-10',
      priority: 'medium',
      description: 'Tools and equipment for facility maintenance'
    }
  ];

  const departments = ['Administration', 'IT', 'Science', 'Library', 'Physical Education', 'Facilities'];
  const statuses = ['pending', 'approved', 'delivered', 'rejected'];

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter requests based on search and filters
  const filteredRequests = purchaseRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || request.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Purchase Requests</h1>
              <p className="text-xs text-gray-600 mt-1">Manage and track purchase requests</p>
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
                to="/dashboard/procurement/purchase-requests/new"
                className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium rounded-md"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>New Request</span>
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
                  placeholder="Search requests..."
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
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 rounded"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
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
                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                <p className="text-lg font-semibold text-gray-900">{purchaseRequests.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <FontAwesomeIcon icon={faClock} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {purchaseRequests.filter(r => r.status === 'pending').length}
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
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-semibold text-blue-600">
                  {purchaseRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Delivered</p>
                <p className="text-lg font-semibold text-green-600">
                  {purchaseRequests.filter(r => r.status === 'delivered').length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <FontAwesomeIcon icon={faTruck} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              Purchase Requests ({filteredRequests.length})
            </h2>
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
                    Priority
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                      </div>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(request.date).toLocaleDateString()}</div>
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
                          title="Edit Request"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Delete Request"
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

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
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

export default PurchaseRequests;
