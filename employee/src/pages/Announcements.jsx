import { useState, useEffect, useRef } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { Bell, Calendar, User, Search, Filter } from 'lucide-react';

const Announcements = () => {
  const { employee } = useEmployeeAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    search: ''
  });
  const hasFetched = useRef(false);

  const fetchAnnouncements = async () => {
    if (!employee?.id || hasFetched.current) return;
    
    try {
      console.log('📢 Fetching employee announcements for:', employee.id);
      setIsLoading(true);
      setError(null);
      hasFetched.current = true;
      
      const queryParams = new URLSearchParams();
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      
      const url = `http://localhost:5000/api/employee-announcements?${queryParams}`;
      console.log('🌐 API URL:', url);
      
      const token = localStorage.getItem('employeeToken');
      console.log('🔑 Token exists:', !!token);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      hasFetched.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('👤 Employee data:', employee);
    console.log('🔍 Filters:', filters);
    
    if (employee?.id) {
      console.log('✅ Employee ID found, fetching announcements...');
      fetchAnnouncements();
    } else {
      console.log('❌ No employee ID found, skipping fetch');
    }
  }, [employee?.id, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    hasFetched.current = false;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading announcements</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500">Stay updated with company news and important information</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => {
              setFilters({ priority: '', search: '' });
              hasFetched.current = false;
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no announcements at this time.
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{announcement.content}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{announcement.created_by_username || 'System'}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.target_name && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-blue-600">{announcement.target_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
