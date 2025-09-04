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
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../contexts/Api';

const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
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
    loadAnnouncements();
    loadTargetOptions();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/announcements/dashboard?limit=10`);
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetOptions = async () => {
    try {
      const [studentsResponse, employeesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/announcements/targets/student`),
        axios.get(`${BASE_URL}/announcements/targets/employee`)
      ]);
      
      setTargetOptions({
        students: studentsResponse.data.options,
        employees: employeesResponse.data.options
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
      if (editingAnnouncement) {
        await axios.put(`${BASE_URL}/announcements/${editingAnnouncement.id}`, formData);
      } else {
        await axios.post(`${BASE_URL}/announcements`, formData);
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError('Failed to save announcement');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_type: announcement.announcement_type,
      target_type: announcement.target_type,
      target_value: announcement.target_value || '',
      priority: announcement.priority,
      status: announcement.status,
      start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`${BASE_URL}/announcements/${id}`);
        loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        setError('Failed to delete announcement');
      }
    }
  };

  const resetForm = () => {
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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200/30 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/30">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faBullhorn} className="text-blue-600 text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
            <p className="text-sm text-gray-500">Latest updates and notifications</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          New Announcement
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faBullhorn} className="text-gray-300 text-4xl mb-3" />
            <p className="text-gray-500 text-sm">No announcements yet</p>
            <p className="text-gray-400 text-xs mt-1">Create your first announcement to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200/30 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{announcement.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority}
                      </span>
                      {getStatusIcon(announcement.status)}
                    </div>
                    
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {announcement.content}
                    </p>
                    
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
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit announcement"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete announcement"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter announcement content"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    name="announcement_type"
                    value={formData.announcement_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="student">Students</option>
                    <option value="employee">Employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Type
                  </label>
                  <select
                    name="target_type"
                    value={formData.target_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All {formData.announcement_type}s</option>
                    <option value="specific">Specific {formData.announcement_type === 'student' ? 'Class' : 'Department'}</option>
                  </select>
                </div>

                {formData.target_type === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.announcement_type === 'student' ? 'Class' : 'Department'} *
                    </label>
                    <select
                      name="target_value"
                      value={formData.target_value}
                      onChange={handleInputChange}
                      required={formData.target_type === 'specific'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select {formData.announcement_type === 'student' ? 'Class' : 'Department'}</option>
                      {(formData.announcement_type === 'student' ? targetOptions.students : targetOptions.employees).map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsSection;
