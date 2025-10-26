import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSave, 
  faBullhorn,
  faFutbol,
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
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CreateAnnouncementModal = ({ isOpen, onClose, onSuccess, editingAnnouncement = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    sport_category_id: '',
    team_id: '',
    fixture_id: '',
    priority: 'medium',
    status: 'published',
    start_date: '',
    end_date: '',
    target_audience: 'all'
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

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editingAnnouncement) {
        setFormData({
          title: editingAnnouncement.title || '',
          content: editingAnnouncement.content || '',
          announcement_type: editingAnnouncement.announcement_type || 'general',
          sport_category_id: editingAnnouncement.sport_category_id || '',
          team_id: editingAnnouncement.team_id || '',
          fixture_id: editingAnnouncement.fixture_id || '',
          priority: editingAnnouncement.priority || 'medium',
          status: editingAnnouncement.status || 'published',
          start_date: editingAnnouncement.start_date || '',
          end_date: editingAnnouncement.end_date || '',
          target_audience: editingAnnouncement.target_audience || 'all'
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingAnnouncement]);

  const fetchData = async () => {
    try {
      const [categoriesRes, teamsRes, fixturesRes] = await Promise.all([
        axios.get(`${BASE_URL}/sports/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/sports/teams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/sports/fixtures`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setCategories(categoriesRes.data.data || []);
      setTeams(teamsRes.data.data || []);
      setFixtures(fixturesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      announcement_type: 'general',
      sport_category_id: '',
      team_id: '',
      fixture_id: '',
      priority: 'medium',
      status: 'published',
      start_date: '',
      end_date: '',
      target_audience: 'all'
    });
    setError(null);
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

      const url = editingAnnouncement 
        ? `${BASE_URL}/sports/announcements/${editingAnnouncement.id}`
        : `${BASE_URL}/sports/announcements`;

      const method = editingAnnouncement ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="Announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="announcement_type"
                value={formData.announcement_type}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                required
              >
                <option value="general">General</option>
                <option value="fixture">Fixture</option>
                <option value="result">Result</option>
                <option value="training">Training</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="Announcement content..."
              required
            />
          </div>

          {/* Related Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sport Category
              </label>
              <select
                name="sport_category_id"
                value={formData.sport_category_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Team
              </label>
              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fixture
              </label>
              <select
                name="fixture_id"
                value={formData.fixture_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">Select Fixture</option>
                {fixtures.map(fixture => (
                  <option key={fixture.id} value={fixture.id}>
                    {fixture.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
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
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <select
              name="target_audience"
              value={formData.target_audience}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="employees">Employees</option>
              <option value="teams">Teams</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-gray-700 bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-gray-700 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faSave} className="h-3 w-3 mr-1" />
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
