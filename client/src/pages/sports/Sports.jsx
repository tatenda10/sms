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
import { useSports } from '../../contexts/SportsContext';
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
  const { activeTab, setActiveTab, showCalendar, setShowCalendar } = useSports();
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
    items_per_page: 25
  });
  
  // Fixtures-specific states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Teams-specific states
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [activeTeamSearchTerm, setActiveTeamSearchTerm] = useState('');
  const [teamCategoryFilter, setTeamCategoryFilter] = useState('');
  
  // Announcements-specific states
  const [announcementSearchTerm, setAnnouncementSearchTerm] = useState('');
  const [activeAnnouncementSearchTerm, setActiveAnnouncementSearchTerm] = useState('');
  const [announcementTypeFilter, setAnnouncementTypeFilter] = useState('');
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState('');
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState('');
  
  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });
  
  // Fixtures modal states
  const [showAddFixtureModal, setShowAddFixtureModal] = useState(false);
  const [showViewFixtureModal, setShowViewFixtureModal] = useState(false);
  const [showEditFixtureModal, setShowEditFixtureModal] = useState(false);
  const [showDeleteFixtureModal, setShowDeleteFixtureModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [fixtureToDelete, setFixtureToDelete] = useState(null);
  const [isDeletingFixture, setIsDeletingFixture] = useState(false);
  
  // Teams modal states
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showViewTeamModal, setShowViewTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  
  // Announcements modal states
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [showViewAnnouncementModal, setShowViewAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [showDeleteAnnouncementModal, setShowDeleteAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [isDeletingAnnouncement, setIsDeletingAnnouncement] = useState(false);

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
    if (!showCalendar) {
      if (activeTab === 'fixtures') {
        fetchFixtures();
      } else if (activeTab === 'teams') {
        fetchTeams();
      } else if (activeTab === 'announcements') {
        fetchAnnouncements();
      } else {
        fetchData();
      }
    }
  }, [activeTab, pagination.current_page, activeSearchTerm, statusFilter, categoryFilter, activeTeamSearchTerm, teamCategoryFilter, activeAnnouncementSearchTerm, announcementTypeFilter, announcementPriorityFilter, announcementCategoryFilter, showCalendar]);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        search: activeSearchTerm,
        status: statusFilter,
        sport_category_id: categoryFilter
      };

      const response = await axios.get(`${BASE_URL}/sports/fixtures`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });
      
      const fixturesData = response.data.data || [];
      setFixtures(fixturesData);
      
      // Update pagination
      const paginationData = response.data.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: fixturesData.length,
        items_per_page: pagination.items_per_page
      };
      setPagination(paginationData);
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError('Failed to fetch fixtures');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        search: activeTeamSearchTerm,
        sport_category_id: teamCategoryFilter
      };

      const response = await axios.get(`${BASE_URL}/sports/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });
      
      const teamsData = response.data.data || [];
      setTeams(teamsData);
      
      // Update pagination
      const paginationData = response.data.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: teamsData.length,
        items_per_page: pagination.items_per_page
      };
      setPagination(paginationData);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        search: activeAnnouncementSearchTerm,
        announcement_type: announcementTypeFilter,
        priority: announcementPriorityFilter,
        sport_category_id: announcementCategoryFilter
      };

      const response = await axios.get(`${BASE_URL}/sports/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });
      
      const announcementsData = response.data.data || [];
      setAnnouncements(announcementsData);
      
      // Update pagination
      const paginationData = response.data.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: announcementsData.length,
        items_per_page: pagination.items_per_page
      };
      setPagination(paginationData);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

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

      if (type === 'fixture') {
        fetchFixtures();
        showToast('Fixture deleted successfully', 'success');
      } else {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
      showToast('Failed to delete item', 'error');
    }
  };
  
  // Toast functions
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        setTimeout(() => {
          setToast({ message: null, type: 'success', visible: false });
        }, 300);
      }, duration);
    }
  };

  const getToastIcon = (type) => {
    const iconProps = {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    if (type === 'success') {
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    }
    if (type === 'error') {
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#2563eb';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };
  
  // Fixtures handlers
  const handleSearchFixtures = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };
  
  const handleViewFixture = async (fixture) => {
    setSelectedFixture(fixture);
    setShowViewFixtureModal(true);
  };
  
  const handleEditFixture = (fixture) => {
    setEditingItem(fixture);
    setShowEditFixtureModal(true);
  };
  
  const handleDeleteFixtureClick = (fixture) => {
    setFixtureToDelete(fixture);
    setShowDeleteFixtureModal(true);
  };
  
  const handleConfirmDeleteFixture = async () => {
    if (!fixtureToDelete) return;

    setIsDeletingFixture(true);
    try {
      await axios.delete(`${BASE_URL}/sports/fixtures/${fixtureToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await fetchFixtures();
      setShowDeleteFixtureModal(false);
      setFixtureToDelete(null);
      showToast('Fixture deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting fixture:', err);
      showToast('Failed to delete fixture', 'error');
    } finally {
      setIsDeletingFixture(false);
    }
  };
  
  const handleFixtureModalSuccess = () => {
    fetchFixtures();
    setShowAddFixtureModal(false);
    setShowEditFixtureModal(false);
    setEditingItem(null);
  };
  
  // Teams handlers
  const handleSearchTeams = (e) => {
    e.preventDefault();
    setActiveTeamSearchTerm(teamSearchTerm);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };
  
  const handleViewTeam = async (team) => {
    setSelectedTeam(team);
    setShowViewTeamModal(true);
  };
  
  const handleEditTeam = (team) => {
    setEditingItem(team);
    setShowEditTeamModal(true);
  };
  
  const handleDeleteTeamClick = (team) => {
    setTeamToDelete(team);
    setShowDeleteTeamModal(true);
  };
  
  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsDeletingTeam(true);
    try {
      await axios.delete(`${BASE_URL}/sports/teams/${teamToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await fetchTeams();
      setShowDeleteTeamModal(false);
      setTeamToDelete(null);
      showToast('Team deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting team:', err);
      showToast('Failed to delete team', 'error');
    } finally {
      setIsDeletingTeam(false);
    }
  };
  
  const handleTeamModalSuccess = () => {
    fetchTeams();
    setShowAddTeamModal(false);
    setShowEditTeamModal(false);
    setEditingItem(null);
  };
  
  // Announcements handlers
  const handleSearchAnnouncements = (e) => {
    e.preventDefault();
    setActiveAnnouncementSearchTerm(announcementSearchTerm);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };
  
  const handleViewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewAnnouncementModal(true);
  };
  
  const handleEditAnnouncement = (announcement) => {
    setEditingItem(announcement);
    setShowEditAnnouncementModal(true);
  };
  
  const handleDeleteAnnouncementClick = (announcement) => {
    setAnnouncementToDelete(announcement);
    setShowDeleteAnnouncementModal(true);
  };
  
  const handleConfirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    setIsDeletingAnnouncement(true);
    try {
      await axios.delete(`${BASE_URL}/sports/announcements/${announcementToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await fetchAnnouncements();
      setShowDeleteAnnouncementModal(false);
      setAnnouncementToDelete(null);
      showToast('Announcement deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting announcement:', err);
      showToast('Failed to delete announcement', 'error');
    } finally {
      setIsDeletingAnnouncement(false);
    }
  };
  
  const handleAnnouncementModalSuccess = () => {
    fetchAnnouncements();
    setShowAddAnnouncementModal(false);
    setShowEditAnnouncementModal(false);
    setEditingItem(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: { background: '#dbeafe', color: '#1e40af' },
      ongoing: { background: '#fef3c7', color: '#92400e' },
      completed: { background: '#d1fae5', color: '#065f46' },
      cancelled: { background: '#fee2e2', color: '#991b1b' },
      postponed: { background: '#f3f4f6', color: '#374151' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  };
  
  const getStatusColorClass = (status) => {
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
      urgent: { background: '#fee2e2', color: '#991b1b' },
      high: { background: '#fed7aa', color: '#9a3412' },
      medium: { background: '#dbeafe', color: '#1e40af' },
      low: { background: '#f3f4f6', color: '#374151' }
    };
    return colors[priority] || { background: '#f3f4f6', color: '#374151' };
  };
  
  const getPriorityColorClass = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const renderFixtures = () => {
    const displayStart = fixtures.length > 0 ? (pagination.current_page - 1) * pagination.items_per_page + 1 : 0;
    const displayEnd = Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items || fixtures.length);
    const hasData = fixtures.length > 0;

    return (
      <div className="reports-container" style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative' 
      }}>
        {/* Report Header */}
        <div className="report-header" style={{ flexShrink: 0 }}>
          <div className="report-header-content">
            <h2 className="report-title">Fixtures</h2>
            <p className="report-subtitle">Manage sports fixtures and matches.</p>
          </div>
          <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddFixtureModal(true);
              }}
              className="btn-checklist"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Fixture
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="report-filters" style={{ flexShrink: 0 }}>
          <div className="report-filters-left">
            {/* Search Bar */}
            <form onSubmit={handleSearchFixtures} className="filter-group">
              <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, teams, or venue..."
                  className="filter-input search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSearchTerm('');
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      padding: '4px 6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>
            
            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '150px', width: '150px' }}
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
              {statusFilter && (
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear status filter"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '180px', width: '180px' }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoryFilter && (
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear category filter"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="report-content-container ecl-table-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          overflow: 'auto', 
          minHeight: 0,
          padding: 0,
          height: '100%'
        }}>
          {loading && fixtures.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
              Loading fixtures...
            </div>
          ) : (
            <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
              <thead style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                background: 'var(--sidebar-bg)' 
              }}>
                <tr>
                  <th style={{ padding: '6px 10px' }}>TITLE</th>
                  <th style={{ padding: '6px 10px' }}>DATE</th>
                  <th style={{ padding: '6px 10px' }}>TEAMS</th>
                  <th style={{ padding: '6px 10px' }}>VENUE</th>
                  <th style={{ padding: '6px 10px' }}>STATUS</th>
                  <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map((fixture, index) => (
                  <tr 
                    key={fixture.id} 
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {fixture.title}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {new Date(fixture.fixture_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {fixture.home_team_name} vs {fixture.away_team_name}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {fixture.venue || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <span 
                        className="px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: getStatusColor(fixture.status).background,
                          color: getStatusColor(fixture.status).color,
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}
                      >
                        {fixture.status}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleViewFixture(fixture)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="View"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleEditFixture(fixture)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteFixtureClick(fixture)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty placeholder rows to always show 25 rows */}
                {Array.from({ length: Math.max(0, 25 - fixtures.length) }).map((_, index) => (
                  <tr 
                    key={`empty-${index}`}
                    style={{ 
                      height: '32px', 
                      backgroundColor: (fixtures.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
          <div className="table-footer-left">
            Showing {displayStart} to {displayEnd} of {pagination.total_items || fixtures.length} results.
          </div>
          <div className="table-footer-right">
            {!activeSearchTerm && pagination.total_pages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.total_pages, prev.current_page + 1) }))}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </button>
              </div>
            )}
            {!activeSearchTerm && pagination.total_pages <= 1 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                All data displayed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeams = () => {
    const displayStart = teams.length > 0 ? (pagination.current_page - 1) * pagination.items_per_page + 1 : 0;
    const displayEnd = Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items || teams.length);
    const hasData = teams.length > 0;

    return (
      <div className="reports-container" style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative' 
      }}>
        {/* Report Header */}
        <div className="report-header" style={{ flexShrink: 0 }}>
          <div className="report-header-content">
            <h2 className="report-title">Teams</h2>
            <p className="report-subtitle">Manage sports teams and members.</p>
          </div>
          <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddTeamModal(true);
              }}
              className="btn-checklist"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Team
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="report-filters" style={{ flexShrink: 0 }}>
          <div className="report-filters-left">
            {/* Search Bar */}
            <form onSubmit={handleSearchTeams} className="filter-group">
              <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  placeholder="Search by team name, coach, or category..."
                  className="filter-input search-input"
                />
                {teamSearchTerm && (
                  <button
                    onClick={() => {
                      setTeamSearchTerm('');
                      setActiveTeamSearchTerm('');
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      padding: '4px 6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>
            
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Category:</label>
              <select
                value={teamCategoryFilter}
                onChange={(e) => {
                  setTeamCategoryFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '180px', width: '180px' }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {teamCategoryFilter && (
                <button
                  onClick={() => {
                    setTeamCategoryFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear category filter"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="report-content-container ecl-table-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          overflow: 'auto', 
          minHeight: 0,
          padding: 0,
          height: '100%'
        }}>
          {loading && teams.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
              Loading teams...
            </div>
          ) : (
            <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
              <thead style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                background: 'var(--sidebar-bg)' 
              }}>
                <tr>
                  <th style={{ padding: '6px 10px' }}>TEAM NAME</th>
                  <th style={{ padding: '6px 10px' }}>CATEGORY</th>
                  <th style={{ padding: '6px 10px' }}>COACH</th>
                  <th style={{ padding: '6px 10px' }}>MEMBERS</th>
                  <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr 
                    key={team.id} 
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {team.name}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {team.sport_category_name || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {team.coach_name || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {team.participant_count || 0}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleViewTeam(team)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="View"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleEditTeam(team)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeamClick(team)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty placeholder rows to always show 25 rows */}
                {Array.from({ length: Math.max(0, 25 - teams.length) }).map((_, index) => (
                  <tr 
                    key={`empty-${index}`}
                    style={{ 
                      height: '32px', 
                      backgroundColor: (teams.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
          <div className="table-footer-left">
            Showing {displayStart} to {displayEnd} of {pagination.total_items || teams.length} results.
          </div>
          <div className="table-footer-right">
            {!activeTeamSearchTerm && pagination.total_pages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.total_pages, prev.current_page + 1) }))}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </button>
              </div>
            )}
            {!activeTeamSearchTerm && pagination.total_pages <= 1 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                All data displayed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => {
    const displayStart = announcements.length > 0 ? (pagination.current_page - 1) * pagination.items_per_page + 1 : 0;
    const displayEnd = Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items || announcements.length);
    const hasData = announcements.length > 0;

    return (
      <div className="reports-container" style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative' 
      }}>
        {/* Report Header */}
        <div className="report-header" style={{ flexShrink: 0 }}>
          <div className="report-header-content">
            <h2 className="report-title">Announcements</h2>
            <p className="report-subtitle">Manage sports announcements and updates.</p>
          </div>
          <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddAnnouncementModal(true);
              }}
              className="btn-checklist"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Announcement
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="report-filters" style={{ flexShrink: 0 }}>
          <div className="report-filters-left">
            {/* Search Bar */}
            <form onSubmit={handleSearchAnnouncements} className="filter-group">
              <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  value={announcementSearchTerm}
                  onChange={(e) => setAnnouncementSearchTerm(e.target.value)}
                  placeholder="Search by title, content, or type..."
                  className="filter-input search-input"
                />
                {announcementSearchTerm && (
                  <button
                    onClick={() => {
                      setAnnouncementSearchTerm('');
                      setActiveAnnouncementSearchTerm('');
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      padding: '4px 6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>
            
            {/* Type Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Type:</label>
              <select
                value={announcementTypeFilter}
                onChange={(e) => {
                  setAnnouncementTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '150px', width: '150px' }}
              >
                <option value="">All Types</option>
                <option value="fixture">Fixture</option>
                <option value="result">Result</option>
                <option value="general">General</option>
                <option value="training">Training</option>
                <option value="meeting">Meeting</option>
              </select>
              {announcementTypeFilter && (
                <button
                  onClick={() => {
                    setAnnouncementTypeFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear type filter"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Priority Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Priority:</label>
              <select
                value={announcementPriorityFilter}
                onChange={(e) => {
                  setAnnouncementPriorityFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '150px', width: '150px' }}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {announcementPriorityFilter && (
                <button
                  onClick={() => {
                    setAnnouncementPriorityFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear priority filter"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Category:</label>
              <select
                value={announcementCategoryFilter}
                onChange={(e) => {
                  setAnnouncementCategoryFilter(e.target.value);
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
                className="filter-input"
                style={{ minWidth: '180px', width: '180px' }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {announcementCategoryFilter && (
                <button
                  onClick={() => {
                    setAnnouncementCategoryFilter('');
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                  title="Clear category filter"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="report-content-container ecl-table-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          overflow: 'auto', 
          minHeight: 0,
          padding: 0,
          height: '100%'
        }}>
          {loading && announcements.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
              Loading announcements...
            </div>
          ) : (
            <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
              <thead style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                background: 'var(--sidebar-bg)' 
              }}>
                <tr>
                  <th style={{ padding: '6px 10px' }}>TITLE</th>
                  <th style={{ padding: '6px 10px' }}>TYPE</th>
                  <th style={{ padding: '6px 10px' }}>PRIORITY</th>
                  <th style={{ padding: '6px 10px' }}>CATEGORY</th>
                  <th style={{ padding: '6px 10px' }}>CREATED</th>
                  <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement, index) => (
                  <tr 
                    key={announcement.id} 
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {announcement.title}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {announcement.announcement_type || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <span 
                        className="px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: getPriorityColor(announcement.priority).background,
                          color: getPriorityColor(announcement.priority).color,
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}
                      >
                        {announcement.priority || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {announcement.sport_category_name || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleViewAnnouncement(announcement)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="View"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncementClick(announcement)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty placeholder rows to always show 25 rows */}
                {Array.from({ length: Math.max(0, 25 - announcements.length) }).map((_, index) => (
                  <tr 
                    key={`empty-${index}`}
                    style={{ 
                      height: '32px', 
                      backgroundColor: (announcements.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
          <div className="table-footer-left">
            Showing {displayStart} to {displayEnd} of {pagination.total_items || announcements.length} results.
          </div>
          <div className="table-footer-right">
            {!activeAnnouncementSearchTerm && pagination.total_pages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.total_pages, prev.current_page + 1) }))}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </button>
              </div>
            )}
            {!activeAnnouncementSearchTerm && pagination.total_pages <= 1 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                All data displayed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

  if (loading && activeTab !== 'fixtures') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sports data...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showCalendar ? (
        <SportsCalendar />
      ) : (
        <>
          {activeTab === 'fixtures' && renderFixtures()}
          {activeTab === 'teams' && renderTeams()}
          {activeTab === 'announcements' && renderAnnouncements()}
        </>
      )}

      {/* Fixtures Modals */}
      {activeTab === 'fixtures' && (
        <>
          <CreateFixtureModal
            isOpen={showAddFixtureModal || showEditFixtureModal}
            onClose={() => {
              setShowAddFixtureModal(false);
              setShowEditFixtureModal(false);
              setEditingItem(null);
            }}
            onSuccess={handleFixtureModalSuccess}
            editingFixture={editingItem}
          />
          
          {/* View Fixture Modal */}
          {showViewFixtureModal && selectedFixture && (
            <div className="modal-overlay" onClick={() => setShowViewFixtureModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '600px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Fixture Details</h3>
                  <button className="modal-close-btn" onClick={() => setShowViewFixtureModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedFixture.title}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {new Date(selectedFixture.fixture_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          <span 
                            className="px-2 py-0.5 text-xs font-medium"
                            style={{
                              background: getStatusColor(selectedFixture.status).background,
                              color: getStatusColor(selectedFixture.status).color,
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}
                          >
                            {selectedFixture.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Teams</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedFixture.home_team_name} vs {selectedFixture.away_team_name}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Venue</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedFixture.venue || 'N/A'}
                      </div>
                    </div>
                    
                    {selectedFixture.result_home_score !== null && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label className="form-label">Home Score</label>
                            <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                              {selectedFixture.result_home_score}
                            </div>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Away Score</label>
                            <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                              {selectedFixture.result_away_score}
                            </div>
                          </div>
                        </div>
                        
                        {selectedFixture.result_notes && (
                          <div className="form-group">
                            <label className="form-label">Result Notes</label>
                            <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                              {selectedFixture.result_notes}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowViewFixtureModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Fixture Modal */}
          {showDeleteFixtureModal && fixtureToDelete && (
            <div className="modal-overlay" onClick={() => setShowDeleteFixtureModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Delete Fixture</h3>
                  <button className="modal-close-btn" onClick={() => setShowDeleteFixtureModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Are you sure you want to delete this fixture? This action cannot be undone.
                  </p>
                  
                  <div style={{ 
                    padding: '12px', 
                    background: '#f9fafb', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Fixture Information
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Title:</strong> {fixtureToDelete.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Date:</strong> {new Date(fixtureToDelete.fixture_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowDeleteFixtureModal(false)}
                    disabled={isDeletingFixture}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-delete" 
                    onClick={handleConfirmDeleteFixture}
                    disabled={isDeletingFixture}
                  >
                    {isDeletingFixture ? 'Deleting...' : 'Delete Fixture'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Teams Modals */}
      {activeTab === 'teams' && (
        <>
          <CreateTeamModal
            isOpen={showAddTeamModal || showEditTeamModal}
            onClose={() => {
              setShowAddTeamModal(false);
              setShowEditTeamModal(false);
              setEditingItem(null);
            }}
            onSuccess={handleTeamModalSuccess}
            editingTeam={editingItem}
          />
          
          {/* View Team Modal */}
          {showViewTeamModal && selectedTeam && (
            <div className="modal-overlay" onClick={() => setShowViewTeamModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '600px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Team Details</h3>
                  <button className="modal-close-btn" onClick={() => setShowViewTeamModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Team Name</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedTeam.name}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Sport Category</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedTeam.sport_category_name || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Members</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedTeam.participant_count || 0}
                        </div>
                      </div>
                    </div>
                    
                    {selectedTeam.coach_name && (
                      <div className="form-group">
                        <label className="form-label">Coach</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedTeam.coach_name}
                        </div>
                      </div>
                    )}
                    
                    {selectedTeam.description && (
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', minHeight: '60px' }}>
                          {selectedTeam.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowViewTeamModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Team Modal */}
          {showDeleteTeamModal && teamToDelete && (
            <div className="modal-overlay" onClick={() => setShowDeleteTeamModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Delete Team</h3>
                  <button className="modal-close-btn" onClick={() => setShowDeleteTeamModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Are you sure you want to delete this team? This action cannot be undone.
                  </p>
                  
                  <div style={{ 
                    padding: '12px', 
                    background: '#f9fafb', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Team Information
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Name:</strong> {teamToDelete.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Category:</strong> {teamToDelete.sport_category_name || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowDeleteTeamModal(false)}
                    disabled={isDeletingTeam}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-delete" 
                    onClick={handleConfirmDeleteTeam}
                    disabled={isDeletingTeam}
                  >
                    {isDeletingTeam ? 'Deleting...' : 'Delete Team'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Announcements Modals */}
      {activeTab === 'announcements' && (
        <>
          <CreateAnnouncementModal
            isOpen={showAddAnnouncementModal || showEditAnnouncementModal}
            onClose={() => {
              setShowAddAnnouncementModal(false);
              setShowEditAnnouncementModal(false);
              setEditingItem(null);
            }}
            onSuccess={handleAnnouncementModalSuccess}
            editingAnnouncement={editingItem}
          />
          
          {/* View Announcement Modal */}
          {showViewAnnouncementModal && selectedAnnouncement && (
            <div className="modal-overlay" onClick={() => setShowViewAnnouncementModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '600px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Announcement Details</h3>
                  <button className="modal-close-btn" onClick={() => setShowViewAnnouncementModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedAnnouncement.title}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedAnnouncement.announcement_type || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          <span 
                            className="px-2 py-0.5 text-xs font-medium"
                            style={{
                              background: getPriorityColor(selectedAnnouncement.priority).background,
                              color: getPriorityColor(selectedAnnouncement.priority).color,
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}
                          >
                            {selectedAnnouncement.priority || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedAnnouncement.sport_category_name && (
                      <div className="form-group">
                        <label className="form-label">Sport Category</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedAnnouncement.sport_category_name}
                        </div>
                      </div>
                    )}
                    
                    {selectedAnnouncement.team_name && (
                      <div className="form-group">
                        <label className="form-label">Team</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                          {selectedAnnouncement.team_name}
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Content</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', minHeight: '60px' }}>
                        {selectedAnnouncement.content}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Created</label>
                      <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowViewAnnouncementModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Announcement Modal */}
          {showDeleteAnnouncementModal && announcementToDelete && (
            <div className="modal-overlay" onClick={() => setShowDeleteAnnouncementModal(false)}>
              <div 
                className="modal-dialog" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
              >
                <div className="modal-header">
                  <h3 className="modal-title">Delete Announcement</h3>
                  <button className="modal-close-btn" onClick={() => setShowDeleteAnnouncementModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Are you sure you want to delete this announcement? This action cannot be undone.
                  </p>
                  
                  <div style={{ 
                    padding: '12px', 
                    background: '#f9fafb', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Announcement Information
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Title:</strong> {announcementToDelete.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Type:</strong> {announcementToDelete.announcement_type || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-btn modal-btn-cancel" 
                    onClick={() => setShowDeleteAnnouncementModal(false)}
                    disabled={isDeletingAnnouncement}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-delete" 
                    onClick={handleConfirmDeleteAnnouncement}
                    disabled={isDeletingAnnouncement}
                  >
                    {isDeletingAnnouncement ? 'Deleting...' : 'Delete Announcement'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Success Toast */}
      {toast.visible && toast.message && (
        <div className="success-toast">
          <div 
            className="success-toast-content" 
            style={{ background: getToastBackgroundColor(toast.type) }}
          >
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sports;
