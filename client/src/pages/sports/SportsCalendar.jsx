import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faCalendarAlt,
  faFutbol,
  faBasketballBall,
  faRunning,
  faVolleyballBall,
  faTableTennis,
  faSwimmer,
  faBaseball,
  faFootballBall,
  faHockeyPuck,
  faTrophy,
  faUsers,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const SportsCalendar = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFixtures, setSelectedFixtures] = useState([]);

  // Icon mapping for sports categories
  const getSportIcon = (iconName) => {
    const iconMap = {
      'fa-futbol': faFutbol,
      'fa-basketball-ball': faBasketballBall,
      'fa-running': faRunning,
      'fa-volleyball-ball': faVolleyballBall,
      'fa-table-tennis': faTableTennis,
      'fa-swimmer': faSwimmer,
      'fa-baseball': faBaseball,
      'fa-football-ball': faFootballBall,
      'fa-hockey-puck': faHockeyPuck
    };
    return iconMap[iconName] || faFutbol;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      ongoing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      postponed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  useEffect(() => {
    fetchFixtures();
  }, [currentDate]);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await axios.get(`${BASE_URL}/sports/fixtures`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
          limit: 100
        }
      });

      setFixtures(response.data.data || []);
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getFixturesForDate = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fixtures.filter(fixture => fixture.fixture_date === dateStr);
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    setSelectedDate(day);
    setSelectedFixtures(getFixturesForDate(day));
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Sports Calendar</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </button>
          <h2 className="text-sm font-medium text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-200">
          <div className="p-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayFixtures = getFixturesForDate(day);
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() && 
                               currentDate.getFullYear() === new Date().getFullYear();
                const isSelected = selectedDate === day;

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`
                      min-h-[80px] p-1.5 border border-gray-200 cursor-pointer transition-colors
                      ${!day ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
                      ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                      ${isSelected ? 'bg-blue-100 border-blue-400' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayFixtures.slice(0, 2).map((fixture, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-1 border ${getStatusColor(fixture.status)}`}
                            >
                              <div className="flex items-center space-x-1">
                                <FontAwesomeIcon 
                                  icon={getSportIcon(fixture.sport_category_icon)} 
                                  className="h-2 w-2" 
                                />
                                <span className="truncate text-xs">{fixture.title}</span>
                              </div>
                              <div className="text-xs opacity-75">
                                {formatTime(fixture.fixture_time)}
                              </div>
                            </div>
                          ))}
                          {dayFixtures.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayFixtures.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white shadow-sm border border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {selectedDate ? `${monthNames[currentDate.getMonth()]} ${selectedDate}` : 'Select a date'}
            </h3>

            {selectedFixtures.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">{selectedDate ? 'No fixtures on this date' : 'No date selected'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedFixtures.map((fixture) => (
                  <div key={fixture.id} className="p-3 bg-gray-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <FontAwesomeIcon 
                        icon={getSportIcon(fixture.sport_category_icon)} 
                        className="h-4 w-4 text-gray-600" 
                      />
                      <h4 className="text-sm font-medium text-gray-800">{fixture.title}</h4>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" />
                        <span>{fixture.home_team_name} vs {fixture.away_team_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3" />
                        <span>{formatTime(fixture.fixture_time)}</span>
                      </div>
                      
                      {fixture.venue && (
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3" />
                          <span>{fixture.venue}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(fixture.status)}`}>
                          {fixture.status}
                        </span>
                      </div>
                    </div>

                    {fixture.result_home_score !== null && (
                      <div className="mt-2 p-2 bg-white border">
                        <div className="text-xs font-medium text-gray-700 mb-1">Result</div>
                        <div className="text-sm font-bold text-gray-900">
                          {fixture.result_home_score} - {fixture.result_away_score}
                        </div>
                        {fixture.result_notes && (
                          <div className="text-xs text-gray-600 mt-1">{fixture.result_notes}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsCalendar;
