import { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import BASE_URL from '../contexts/Api';
import {
  Bell,
  Calendar,
  User,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  X,
  Loader2
} from 'lucide-react';

const Announcements = () => {
  const { student, token } = useStudentAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (student?.RegNumber) {
      fetchAnnouncements();
    }
  }, [student?.RegNumber]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      console.log('📢 Fetching announcements for student:', student?.RegNumber);
      
      const response = await fetch(`${BASE_URL}/student-announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Announcements data:', data);
        setAnnouncements(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching announcements:', errorData);
        setError(errorData.message || 'Failed to fetch announcements');
      }
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnnouncementTypeIcon = (type) => {
    switch (type) {
      case 'general':
        return <Bell className="h-4 w-4" />;
      case 'academic':
        return <CheckCircle className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading announcements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600">Stay updated with the latest school news and information</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(announcement.priority)}`}
              onClick={() => handleViewAnnouncement(announcement)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {announcement.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        announcement.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.priority}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getAnnouncementTypeIcon(announcement.announcement_type)}
                        <span className="ml-1 capitalize">{announcement.announcement_type}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{announcement.created_by_name || 'Admin'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(announcement.created_at)}</span>
                      </div>
                      {announcement.start_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Starts: {formatDate(announcement.start_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAnnouncement(announcement);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
          <p className="text-gray-500">There are no announcements at the moment.</p>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {getPriorityIcon(selectedAnnouncement.priority)}
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedAnnouncement.priority === 'high' ? 'bg-red-100 text-red-800' :
                  selectedAnnouncement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAnnouncement.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedAnnouncement.priority}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getAnnouncementTypeIcon(selectedAnnouncement.announcement_type)}
                  <span className="ml-1 capitalize">{selectedAnnouncement.announcement_type}</span>
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>By: {selectedAnnouncement.created_by_name || 'Admin'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Posted: {formatDate(selectedAnnouncement.created_at)}</span>
                </div>
                {selectedAnnouncement.start_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Starts: {formatDate(selectedAnnouncement.start_date)}</span>
                  </div>
                )}
                {selectedAnnouncement.end_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Expires: {formatDate(selectedAnnouncement.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Content</h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
