import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFutbol, 
  faCalendarAlt, 
  faTrophy, 
  faBullhorn,
  faUsers,
  faBasketballBall,
  faRunning,
  faVolleyballBall,
  faTableTennis,
  faSwimmer,
  faBaseball,
  faFootballBall,
  faHockeyPuck,
  faChevronRight,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../contexts/Api';
import { useAuth } from '../contexts/AuthContext';

const SportsDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    totalFixtures: 0,
    totalTeams: 0,
    totalAnnouncements: 0,
    upcomingGames: 0
  });

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
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      postponed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchSportsData();
  }, []);

  const fetchSportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch upcoming fixtures
      const fixturesResponse = await axios.get(`${BASE_URL}/sports/fixtures/upcoming`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 5 }
      });
      setUpcomingFixtures(fixturesResponse.data.data || []);

      // Fetch recent announcements
      const announcementsResponse = await axios.get(`${BASE_URL}/sports/announcements/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 3 }
      });
      setRecentAnnouncements(announcementsResponse.data.data || []);

      // Fetch stats (we'll need to create these endpoints or calculate from existing data)
      const [fixturesStats, teamsStats, announcementsStats] = await Promise.all([
        axios.get(`${BASE_URL}/sports/fixtures`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 1 }
        }),
        axios.get(`${BASE_URL}/sports/teams`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 1 }
        }),
        axios.get(`${BASE_URL}/sports/announcements`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 1 }
        })
      ]);

      setStats({
        totalFixtures: fixturesStats.data.pagination?.total_items || 0,
        totalTeams: teamsStats.data.pagination?.total_items || 0,
        totalAnnouncements: announcementsStats.data.pagination?.total_items || 0,
        upcomingGames: upcomingFixtures.length
      });

    } catch (err) {
      console.error('Error fetching sports data:', err);
      setError('Failed to load sports data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center text-red-600">
          <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fixtures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFixtures}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faTrophy} className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Games</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingGames}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faBullhorn} className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnnouncements}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Fixtures */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Fixtures</h3>
              <button
                onClick={() => navigate('/dashboard/sports')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {upcomingFixtures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming fixtures</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingFixtures.map((fixture) => (
                  <div key={fixture.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FontAwesomeIcon 
                      icon={getSportIcon(fixture.sport_category_icon)} 
                      className="h-5 w-5 text-blue-600" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fixture.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(fixture.fixture_date)} at {formatTime(fixture.fixture_time)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fixture.status)}`}>
                      {fixture.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sports News</h3>
              <button
                onClick={() => navigate('/dashboard/sports')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faBullhorn} className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent announcements</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 text-blue-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{announcement.title}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                          <span>{announcement.sport_category_name}</span>
                          <span>•</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dashboard/sports')}
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Manage Fixtures</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/sports')}
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-green-600" />
            <span className="text-green-700 font-medium">Manage Teams</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/sports')}
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <FontAwesomeIcon icon={faBullhorn} className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium">Create Announcement</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SportsDashboard;
