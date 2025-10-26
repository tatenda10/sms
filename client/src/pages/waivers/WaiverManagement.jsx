import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faEye,
  faCalendarAlt,
  faDollarSign,
  faTag,
  faUser,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import ErrorModal from '../../components/ErrorModal';

const WaiverManagement = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waivers, setWaivers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    start_date: '',
    end_date: '',
    term: '',
    academic_year: ''
  });

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchWaivers();
  }, []);

  useEffect(() => {
    fetchWaivers();
  }, [pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/waivers/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWaivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`${BASE_URL}/waivers/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setWaivers(response.data.data.waivers || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching waivers:', error);
      setErrorMessage('Failed to fetch waivers');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getCategoryName = (description) => {
    // Extract category from description (e.g., "Fee Waiver - Staff Child: reason")
    const match = description.match(/Fee Waiver - ([^:]+):/);
    return match ? match[1] : 'Unknown';
  };

  const getTermAndYear = (waiver) => {
    // Use direct fields if available, otherwise fallback to parsing description
    return {
      term: waiver.term || 'N/A',
      year: waiver.academic_year || 'N/A'
    };
  };

  return (
    <div className="space-y-3">

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-3 mb-3">
          <h3 className="text-xs font-medium text-gray-900 mb-2">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Student name or reg number..."
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <FontAwesomeIcon icon={faTag} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term</label>
              <div className="relative">
                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <select
                  value={filters.term || ''}
                  onChange={(e) => handleFilterChange('term', e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Terms</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
              <div className="relative">
                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={filters.academic_year || ''}
                  onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                  placeholder="e.g., 2025"
                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Waivers List */}
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-medium text-gray-900">
              Waivers ({pagination.total})
            </h3>
            <div className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading waivers...</div>
            </div>
          ) : waivers.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faFilter} className="text-4xl text-gray-300 mb-4" />
              <div className="text-gray-500">No waivers found</div>
              <div className="text-xs text-gray-400 mt-2">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="space-y-3">
              {waivers.map((waiver) => (
                <div
                  key={waiver.id}
                  className="border border-gray-200 p-3 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {waiver.Name} {waiver.Surname}
                        </h4>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {formatAmount(waiver.waiver_amount)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Registration:</span>
                          <span className="ml-1 font-medium">{waiver.student_reg_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <span className="ml-1 font-medium">{getCategoryName(waiver.description)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-1 font-medium">{formatDate(waiver.transaction_date)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Term:</span>
                          <span className="ml-1 font-medium">{getTermAndYear(waiver).term}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Year:</span>
                          <span className="ml-1 font-medium">{getTermAndYear(waiver).year}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Processed by:</span>
                          <span className="ml-1 font-medium">{waiver.created_by || 'System'}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <span className="text-gray-600 text-xs">Reason:</span>
                        <p className="text-xs text-gray-800 mt-1">{waiver.description}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="View details"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 py-1 text-xs border rounded ${
                        pagination.page === page
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          )}
        </div>

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={errorMessage}
        />
    </div>
  );
};

export default WaiverManagement;
