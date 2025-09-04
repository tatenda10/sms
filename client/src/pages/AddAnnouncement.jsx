import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullhorn, 
  faSave,
  faTimes,
  faUserGraduate,
  faUsers,
  faExclamationTriangle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../contexts/Api';

const AddAnnouncement = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [targetOptions, setTargetOptions] = useState({ students: [], employees: [] });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'student',
    target_type: 'all',
    target_value: '',
    priority: 'medium',
    status: 'draft',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadTargetOptions();
  }, []);

  const loadTargetOptions = async () => {
    try {
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const [studentsResponse, employeesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/announcements/targets/student`, { headers: authHeaders }),
        axios.get(`${BASE_URL}/announcements/targets/employee`, { headers: authHeaders })
      ]);
      
      console.log('📢 Students response:', studentsResponse.data);
      console.log('📢 Employees response:', employeesResponse.data);
      
      setTargetOptions({
        students: studentsResponse.data.options || [],
        employees: employeesResponse.data.options || []
      });
    } catch (error) {
      console.error('Error loading target options:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Prepare data - convert empty strings to null for dates
      const submitData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        target_value: formData.target_value || null
      };
      
      console.log('📢 Frontend submitting data:', submitData);
      console.log('📢 Original formData:', formData);
      
      await axios.post(`${BASE_URL}/announcements`, submitData, { headers: authHeaders });
      
      setSuccess('Announcement created successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          title: '',
          content: '',
          announcement_type: 'student',
          target_type: 'all',
          target_value: '',
          priority: 'medium',
          status: 'draft',
          start_date: '',
          end_date: ''
        });
        setSuccess(null);
        navigate('/dashboard/announcements');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create announcements.');
      } else {
        setError('Failed to create announcement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/announcements');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Add New Announcement</h1>
              <p className="text-xs text-gray-600">Create announcements for students or employees</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/announcements')}
                className="bg-gray-600 text-white px-3 py-2 text-xs hover:bg-gray-700 flex items-center"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Announcement Details</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 text-xs">
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    name="announcement_type"
                    value={formData.announcement_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="student">Students</option>
                    <option value="employee">Employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Target Type
                  </label>
                  <select
                    name="target_type"
                    value={formData.target_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="all">All {formData.announcement_type}s</option>
                    <option value="specific">Specific {formData.announcement_type === 'student' ? 'Class' : 'Department'}</option>
                  </select>
                </div>

                {formData.target_type === 'specific' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {formData.announcement_type === 'student' ? 'Class' : 'Department'}
                    </label>
                    <select
                      name="target_value"
                      value={formData.target_value}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Select {formData.announcement_type === 'student' ? 'Class' : 'Department'}</option>
                      {(formData.announcement_type === 'student' ? targetOptions.students : targetOptions.employees).length > 0 ? (
                        (formData.announcement_type === 'student' ? targetOptions.students : targetOptions.employees).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.stream_name ? `${option.name} (${option.stream_name})` : option.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No {formData.announcement_type === 'student' ? 'classes' : 'departments'} available</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter announcement content..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs font-medium border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                ) : (
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                )}
                {loading ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAnnouncement;
