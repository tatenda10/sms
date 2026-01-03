import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faClock,
  faUser,
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';

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
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'announcement':
        return <FontAwesomeIcon icon={faBell} className="text-blue-500" />;
      case 'profile':
        return <FontAwesomeIcon icon={faUser} className="text-yellow-500" />;
      case 'system':
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500" />;
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-header-content">
          <h2 className="report-title">Notifications</h2>
          <p className="report-subtitle">Stay updated with important information and updates.</p>
        </div>
        <div className="report-header-right">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-checklist"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FontAwesomeIcon icon={faCheckDouble} />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Report Filters (Tabs) */}
      <div className="report-filters">
        <div className="report-filters-left">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`top-nav-menu-item ${filter === tab.key ? 'active' : ''}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[0.65rem] bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Report Content Container */}
      <div className="report-content-container">
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faBell} className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-900">No notifications</h3>
              <p className="text-sm text-gray-500">
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
                className={`p-4 border rounded-lg transition-all ${!notification.isRead
                    ? 'bg-blue-50/30 border-blue-100'
                    : 'bg-white border-gray-100'
                  } hover:shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                        {notification.title}
                      </h4>
                      <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-medium ${notification.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : notification.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[0.7rem] text-gray-400">
                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                        {new Date(notification.date).toLocaleString()}
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
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
    </div>
  );
};

export default Notifications;
