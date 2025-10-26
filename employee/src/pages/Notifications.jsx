import { useState, useEffect } from 'react';
import { Bell, Clock, User, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    // Simulate loading notifications
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          title: 'New Payslip Available',
          message: 'Your payslip for December 2024 is now available for download.',
          type: 'payslip',
          isRead: false,
          date: '2024-12-31T10:30:00Z',
          priority: 'high'
        },
        {
          id: 2,
          title: 'Holiday Schedule Update',
          message: 'Please note that the office will be closed from December 24th to January 2nd.',
          type: 'announcement',
          isRead: true,
          date: '2024-12-15T14:20:00Z',
          priority: 'medium'
        },
        {
          id: 3,
          title: 'Profile Update Required',
          message: 'Please update your emergency contact information in your profile.',
          type: 'profile',
          isRead: false,
          date: '2024-12-10T09:15:00Z',
          priority: 'low'
        },
        {
          id: 4,
          title: 'System Maintenance',
          message: 'The employee portal will be under maintenance on Sunday from 2 AM to 4 AM.',
          type: 'system',
          isRead: true,
          date: '2024-12-05T16:45:00Z',
          priority: 'medium'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payslip':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'profile':
        return <User className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-2 text-gray-600">
              Stay updated with important information and updates
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "No notifications found for this filter."
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-l-4 ${getPriorityColor(notification.priority)} bg-white shadow rounded-lg p-6 ${
                !notification.isRead ? 'ring-2 ring-blue-100' : ''
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : notification.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {notification.priority}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(notification.date).toLocaleString()}
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
