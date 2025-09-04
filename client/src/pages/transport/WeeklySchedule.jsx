import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faRoute, faUserGraduate, faCheckCircle, 
  faExclamationTriangle, faTimesCircle, faClock
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const WeeklySchedule = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [schedule, setSchedule] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadRoutes();
    // Set default week to current week
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    setSelectedWeek(monday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadWeeklySchedule();
    }
  }, [selectedWeek, selectedRoute]);

  const loadRoutes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transport/routes?limit=100`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  const loadWeeklySchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        week_start_date: selectedWeek
      });
      
      if (selectedRoute) {
        params.append('route_id', selectedRoute);
      }
      
      const response = await axios.get(`${BASE_URL}/transport/schedules/weekly?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setSchedule(response.data.data);
      }
      
    } catch (err) {
      console.error('Error loading weekly schedule:', err);
      setError('Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
            Pending
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getDayOfWeek = (day) => {
    const days = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    return days[day] || 0;
  };

  const sortScheduleByDay = (scheduleData) => {
    return scheduleData.sort((a, b) => {
      const dayA = getDayOfWeek(a.day_of_week);
      const dayB = getDayOfWeek(b.day_of_week);
      if (dayA !== dayB) return dayA - dayB;
      return a.pickup_time.localeCompare(b.pickup_time);
    });
  };

  const groupedSchedule = () => {
    const sorted = sortScheduleByDay(schedule);
    const grouped = {};
    
    sorted.forEach(item => {
      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = [];
      }
      grouped[item.day_of_week].push(item);
    });
    
    return grouped;
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weekly Transport Schedule</h1>
            <p className="text-xs text-gray-600">View transport schedule and student payment status for the week</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Starting</label>
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route (Optional)</label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">All Routes</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.route_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Display */}
        {schedule.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Found</h3>
            <p className="text-sm text-gray-500">
              {selectedWeek ? `No transport schedule found for the week starting ${formatDate(selectedWeek)}` : 'Please select a week to view the schedule'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSchedule()).map(([day, daySchedule]) => (
              <div key={day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">{day}</h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {daySchedule.map((item, index) => (
                    <div key={`${day}-${index}`} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faRoute} className="text-blue-500 text-sm" />
                              <span className="text-sm font-medium text-gray-900">{item.route_name}</span>
                              <span className="text-xs text-gray-500">({item.route_code})</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faClock} className="text-green-500 text-xs" />
                              <span className="text-sm text-gray-600">
                                Pickup: {formatTime(item.pickup_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faClock} className="text-red-500 text-xs" />
                              <span className="text-sm text-gray-600">
                                Dropoff: {formatTime(item.dropoff_time)}
                              </span>
                            </div>
                          </div>
                          
                          {item.students && item.students.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                Registered Students ({item.students.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.students.map((student, studentIndex) => (
                                  <div key={studentIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FontAwesomeIcon icon={faUserGraduate} className="text-blue-500 text-xs" />
                                      <span className="text-sm font-medium text-gray-900">
                                        {student.student_name}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                      ID: {student.student_reg_number}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">
                                        Fee: {student.weekly_fee} {student.currency}
                                      </span>
                                      {student.payment_status && (
                                        <div className="ml-2">
                                          {getStatusBadge(student.payment_status)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No students registered for this route on {day}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;
