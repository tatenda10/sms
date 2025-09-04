import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullhorn, 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye, 
  faEyeSlash,
  faCalendarAlt,
  faUser,
  faUsers,
  faGraduationCap,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faTimes,
  faSearch,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../contexts/Api';

const Announcements = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [targetOptions, setTargetOptions] = useState({ students: [], employees: [] });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    status: 'published',
    target_type: '',
    priority: '',
    search: ''
  });



  useEffect(() => {
    loadAnnouncements();
    loadTargetOptions();
  }, [filters, pagination.current_page]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filters
      });

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${BASE_URL}/announcements?${params}`, { headers: authHeaders });
      setAnnouncements(response.data.announcements);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetOptions = async () => {
    try {
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const [studentsResponse, employeesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/announcements/targets/student`, { headers: authHeaders }),
        axios.get(`${BASE_URL}/announcements/targets/employee`, { headers: authHeaders })
      ]);
      
      setTargetOptions({
        students: studentsResponse.data.options,
        employees: employeesResponse.data.options
      });
    } catch (error) {
      console.error('Error loading target options:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleEdit = (announcement) => {
    // Navigate to edit page with announcement data
    navigate(`/dashboard/announcements/edit/${announcement.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`${BASE_URL}/announcements/${id}`, { headers: authHeaders });
        loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        setError('Failed to delete announcement');
      }
    }
  };



  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />;
      case 'high':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500" />;
      case 'medium':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" />;
      case 'low':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <FontAwesomeIcon icon={faEye} className="text-green-500" />;
      case 'draft':
        return <FontAwesomeIcon icon={faEyeSlash} className="text-yellow-500" />;
      case 'archived':
        return <FontAwesomeIcon icon={faTimes} className="text-gray-500" />;
      default:
        return <FontAwesomeIcon icon={faEyeSlash} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Announcements</h1>
              <p className="text-xs text-gray-600">Manage and publish announcements for students and employees</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/announcements/add')}
                className="bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700 flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 shadow mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search announcements..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Types</option>
                  <option value="student">Students</option>
                  <option value="employee">Employees</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
                <select
                  name="target_type"
                  value={filters.target_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">All Targets</option>
                  <option value="all">All</option>
                  <option value="specific">Specific</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 shadow">
          {error && (
            <div className="p-4 border-b border-gray-200">
              <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faBullhorn} className="text-gray-300 text-4xl mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-500 text-xs mb-4">Create your first announcement to get started</p>
              <button
                onClick={() => navigate('/dashboard/announcements/add')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Create Announcement
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm">{announcement.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                          {getStatusIcon(announcement.status)}
                        </div>
                        
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{announcement.content}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={announcement.announcement_type === 'student' ? faGraduationCap : faUsers} className="text-xs" />
                            <span>{announcement.announcement_type === 'student' ? 'Students' : 'Employees'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faUser} className="text-xs" />
                            <span>{announcement.target_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>By: {announcement.created_by_username}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit announcement"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete announcement"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-xs text-gray-700">
                    Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of {pagination.total_items} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="px-3 py-1 text-xs border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-xs text-gray-700">
                      Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="px-3 py-1 text-xs border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default Announcements;
