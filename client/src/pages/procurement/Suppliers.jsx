import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faFilter, 
  faEye, 
  faEdit, 
  faTrash,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faGlobe,
  faStar,
  faDownload,
  faPrint,
  faBuilding,
  faUser,
  faCheckCircle,
  faClipboardList,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for demonstration
  const suppliers = [
    {
      id: 1,
      name: 'ABC Office Supplies',
      contactPerson: 'John Smith',
      email: 'john.smith@abcoffice.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      website: 'www.abcoffice.com',
      category: 'Office Supplies',
      status: 'active',
      rating: 4.5,
      totalOrders: 45,
      totalSpent: 125000,
      lastOrder: '2025-01-10'
    },
    {
      id: 2,
      name: 'Tech Solutions Inc',
      contactPerson: 'Sarah Johnson',
      email: 'sarah.johnson@techsolutions.com',
      phone: '+1 (555) 234-5678',
      address: '456 Tech Ave, City, State 12345',
      website: 'www.techsolutions.com',
      category: 'Technology',
      status: 'active',
      rating: 4.8,
      totalOrders: 32,
      totalSpent: 89000,
      lastOrder: '2025-01-12'
    },
    {
      id: 3,
      name: 'Lab Equipment Pro',
      contactPerson: 'Dr. Michael Brown',
      email: 'michael.brown@labequipment.com',
      phone: '+1 (555) 345-6789',
      address: '789 Science Blvd, City, State 12345',
      website: 'www.labequipment.com',
      category: 'Laboratory',
      status: 'active',
      rating: 4.2,
      totalOrders: 18,
      totalSpent: 67000,
      lastOrder: '2025-01-08'
    },
    {
      id: 4,
      name: 'Book World Publishers',
      contactPerson: 'Emily Davis',
      email: 'emily.davis@bookworld.com',
      phone: '+1 (555) 456-7890',
      address: '321 Library Lane, City, State 12345',
      website: 'www.bookworld.com',
      category: 'Books',
      status: 'inactive',
      rating: 3.9,
      totalOrders: 25,
      totalSpent: 45000,
      lastOrder: '2024-12-15'
    },
    {
      id: 5,
      name: 'Sports Equipment Co',
      contactPerson: 'Coach Wilson',
      email: 'coach.wilson@sportsequipment.com',
      phone: '+1 (555) 567-8901',
      address: '654 Sports Way, City, State 12345',
      website: 'www.sportsequipment.com',
      category: 'Sports',
      status: 'active',
      rating: 4.6,
      totalOrders: 12,
      totalSpent: 28000,
      lastOrder: '2025-01-05'
    },
    {
      id: 6,
      name: 'Maintenance Tools Ltd',
      contactPerson: 'Robert Garcia',
      email: 'robert.garcia@maintools.com',
      phone: '+1 (555) 678-9012',
      address: '987 Tool Street, City, State 12345',
      website: 'www.maintools.com',
      category: 'Tools',
      status: 'active',
      rating: 4.3,
      totalOrders: 28,
      totalSpent: 52000,
      lastOrder: '2025-01-09'
    }
  ];

  const categories = ['Office Supplies', 'Technology', 'Laboratory', 'Books', 'Sports', 'Tools'];
  const statuses = ['active', 'inactive'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Office Supplies': 'text-blue-600 bg-blue-100',
      'Technology': 'text-purple-600 bg-purple-100',
      'Laboratory': 'text-green-600 bg-green-100',
      'Books': 'text-orange-600 bg-orange-100',
      'Sports': 'text-red-600 bg-red-100',
      'Tools': 'text-gray-600 bg-gray-100'
    };
    return colors[category] || 'text-gray-600 bg-gray-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-xs" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon key="half" icon={faStar} className="text-yellow-400 text-xs opacity-50" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="text-gray-300 text-xs" />
      );
    }

    return stars;
  };

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
              <p className="text-xs text-gray-600 mt-1">Manage vendor relationships and supplier information</p>
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
                to="/dashboard/procurement/suppliers/new"
                className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium rounded-md"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Supplier</span>
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
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 rounded"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
                <p className="text-xs font-medium text-gray-600">Total Suppliers</p>
                <p className="text-lg font-semibold text-gray-900">{suppliers.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Suppliers</p>
                <p className="text-lg font-semibold text-green-600">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-lg font-semibold text-blue-600">
                  {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Spent</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(suppliers.reduce((sum, s) => sum + s.totalSpent, 0))}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <FontAwesomeIcon icon={faChartBar} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{supplier.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(supplier.category)}`}>
                      {supplier.category}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    {renderStars(supplier.rating)}
                    <span className="text-xs text-gray-500 ml-1">({supplier.rating})</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/dashboard/procurement/suppliers/${supplier.id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Link>
                  <Link
                    to={`/dashboard/procurement/suppliers/${supplier.id}/edit`}
                    className="text-green-600 hover:text-green-900"
                    title="Edit Supplier"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Link>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    title="Delete Supplier"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">{supplier.address}</span>
                </div>
                {supplier.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faGlobe} className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.website}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Orders</p>
                    <p className="font-medium text-gray-900">{supplier.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Spent</p>
                    <p className="font-medium text-gray-900">{formatCurrency(supplier.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Order</p>
                    <p className="font-medium text-gray-900">{new Date(supplier.lastOrder).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Rating</p>
                    <p className="font-medium text-gray-900">{supplier.rating}/5</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500 text-sm">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
