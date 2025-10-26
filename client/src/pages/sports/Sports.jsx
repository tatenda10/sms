import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFutbol, 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye, 
  faSearch,
  faFilter,
  faCalendarAlt,
  faUsers,
  faTrophy,
  faBullhorn,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faBasketballBall,
  faRunning,
  faVolleyballBall,
  faTableTennis,
  faSwimmer,
  faBaseball,
  faFootballBall,
  faHockeyPuck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import CreateFixtureModal from '../../components/sports/CreateFixtureModal';
import CreateTeamModal from '../../components/sports/CreateTeamModal';
import CreateAnnouncementModal from '../../components/sports/CreateAnnouncementModal';
import SportsCalendar from './SportsCalendar';

const Sports = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fixtures');
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Pagination states
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    sport_category_id: '',
    status: '',
    team_id: '',
    announcement_type: '',
    priority: ''
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.current_page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filters
      };

      let response;
      switch (activeTab) {
        case 'fixtures':
          response = await axios.get(`${BASE_URL}/sports/fixtures`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params
          });
          setFixtures(response.data.data || []);
          setPagination(response.data.pagination || pagination);
          break;
        case 'teams':
          response = await axios.get(`${BASE_URL}/sports/teams`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params
          });
          setTeams(response.data.data || []);
          setPagination(response.data.pagination || pagination);
          break;
        case 'announcements':
          response = await axios.get(`${BASE_URL}/sports/announcements`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params
          });
          setAnnouncements(response.data.data || []);
          setPagination(response.data.pagination || pagination);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filters
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sports/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchData();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowCreateModal(true);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      let endpoint;
      switch (type) {
        case 'fixture':
          endpoint = `${BASE_URL}/sports/fixtures/${id}`;
          break;
        case 'team':
          endpoint = `${BASE_URL}/sports/teams/${id}`;
          break;
        case 'announcement':
          endpoint = `${BASE_URL}/sports/announcements/${id}`;
          break;
        default:
          return;
      }

      await axios.delete(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
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

  const renderFixtures = () => (
    <div className="space-y-3">
      {fixtures.map((fixture) => (
        <div key={fixture.id} className="bg-white shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FontAwesomeIcon 
                  icon={getSportIcon(fixture.sport_category_icon)} 
                  className="h-4 w-4 text-gray-600" 
                />
                <h3 className="text-sm font-semibold text-gray-800">{fixture.title}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(fixture.status)}`}>
                  {fixture.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3" />
                  <span>{new Date(fixture.fixture_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                  <span>{fixture.home_team_name} vs {fixture.away_team_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" />
                  <span>{fixture.venue}</span>
                </div>
              </div>

              {fixture.result_home_score !== null && (
                <div className="mt-2 p-2 bg-gray-50">
                  <div className="text-xs font-medium text-gray-700">Result</div>
                  <div className="text-sm font-bold text-gray-900">
                    {fixture.result_home_score} - {fixture.result_away_score}
                  </div>
                  {fixture.result_notes && (
                    <div className="text-xs text-gray-600 mt-1">{fixture.result_notes}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => handleEdit(fixture)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                title="Edit Fixture"
              >
                <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDelete(fixture.id, 'fixture')}
                className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                title="Delete Fixture"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTeams = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <div key={team.id} className="bg-white shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-2 mb-3">
            <FontAwesomeIcon 
              icon={getSportIcon(team.sport_category_icon)} 
              className="h-4 w-4 text-gray-600" 
            />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{team.name}</h3>
              <p className="text-xs text-gray-600">{team.sport_category_name}</p>
            </div>
          </div>

          {team.description && (
            <p className="text-xs text-gray-600 mb-3">{team.description}</p>
          )}

          <div className="space-y-1 text-xs text-gray-600">
            {team.coach_name && (
              <div className="flex items-center space-x-1">
                <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                <span>Coach: {team.coach_name}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
              <span>{team.participant_count} members</span>
            </div>
          </div>

          <div className="flex space-x-1 mt-3">
            <button
              onClick={() => navigate(`/dashboard/sports/teams/${team.id}`)}
              className="flex-1 px-2 py-1 text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
            >
              View Details
            </button>
            <button
              onClick={() => handleEdit(team)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Edit Team"
            >
              <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleDelete(team.id, 'team')}
              className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Team"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="bg-white shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">{announcement.title}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                  {announcement.priority}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(announcement.status)}`}>
                  {announcement.status}
                </span>
              </div>

              <p className="text-xs text-gray-600 mb-3">{announcement.content}</p>

              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>Type: {announcement.announcement_type}</span>
                {announcement.sport_category_name && (
                  <span>Sport: {announcement.sport_category_name}</span>
                )}
                {announcement.team_name && (
                  <span>Team: {announcement.team_name}</span>
                )}
                <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => handleEdit(announcement)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                title="Edit Announcement"
              >
                <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDelete(announcement.id, 'announcement')}
                className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                title="Delete Announcement"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white shadow-sm border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="Search..."
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" 
            />
          </div>
        </div>

        {activeTab === 'fixtures' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sport Category</label>
              <select
                value={filters.sport_category_id}
                onChange={(e) => handleFilterChange('sport_category_id', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'announcements' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.announcement_type}
                onChange={(e) => handleFilterChange('announcement_type', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="fixture">Fixture</option>
                <option value="result">Result</option>
                <option value="general">General</option>
                <option value="training">Training</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </>
        )}

        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full px-3 py-1.5 bg-gray-700 text-white text-sm hover:bg-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={faSearch} className="h-3 w-3 mr-1" />
            Search
          </button>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-600">
          Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
          {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
          {pagination.total_items} results
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={!pagination.has_previous_page}
            className="px-2 py-1 border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-2 py-1 border text-xs ${
                page === pagination.current_page
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={!pagination.has_next_page}
            className="px-2 py-1 border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sports data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Sports Management</h1>
          <p className="text-sm text-gray-600">Manage sports fixtures, teams, and announcements</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 bg-gray-700 text-white text-sm hover:bg-gray-800 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
          Add {activeTab === 'fixtures' ? 'Fixture' : activeTab === 'teams' ? 'Team' : 'Announcement'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <nav className="-mb-px flex space-x-6">
          {[
            { id: 'fixtures', label: 'Fixtures', icon: faCalendarAlt },
            { id: 'teams', label: 'Teams', icon: faUsers },
            { id: 'announcements', label: 'Announcements', icon: faBullhorn }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-1 border-b-2 font-medium text-xs ${
                activeTab === tab.id
                  ? 'border-gray-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="h-3 w-3 mr-1" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`py-1.5 px-1 border-b-2 font-medium text-xs ${
              showCalendar
                ? 'border-gray-600 text-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3 mr-1" />
            Calendar
          </button>
        </nav>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {showCalendar ? (
          <SportsCalendar />
        ) : (
          <>
            {activeTab === 'fixtures' && renderFixtures()}
            {activeTab === 'teams' && renderTeams()}
            {activeTab === 'announcements' && renderAnnouncements()}
          </>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Modals */}
      {activeTab === 'fixtures' && (
        <CreateFixtureModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          editingFixture={editingItem}
        />
      )}
      
      {activeTab === 'teams' && (
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          editingTeam={editingItem}
        />
      )}
      
      {activeTab === 'announcements' && (
        <CreateAnnouncementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          editingAnnouncement={editingItem}
        />
      )}
    </div>
  );
};

export default Sports;
