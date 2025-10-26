import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSave, 
  faCalendarAlt, 
  faUsers, 
  faMapMarkerAlt,
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

const CreateFixtureModal = ({ isOpen, onClose, onSuccess, editingFixture = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport_category_id: '',
    home_team_id: '',
    away_team_id: '',
    home_team_name: '',
    away_team_name: '',
    venue: '',
    fixture_date: '',
    fixture_time: '',
    weather_conditions: '',
    referee_name: '',
    referee_contact: '',
    is_home_game: true
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
      fetchCategories();
      if (editingFixture) {
        setFormData({
          title: editingFixture.title || '',
          description: editingFixture.description || '',
          sport_category_id: editingFixture.sport_category_id || '',
          home_team_id: editingFixture.home_team_id || '',
          away_team_id: editingFixture.away_team_id || '',
          home_team_name: editingFixture.home_team_name || '',
          away_team_name: editingFixture.away_team_name || '',
          venue: editingFixture.venue || '',
          fixture_date: editingFixture.fixture_date || '',
          fixture_time: editingFixture.fixture_time || '',
          weather_conditions: editingFixture.weather_conditions || '',
          referee_name: editingFixture.referee_name || '',
          referee_contact: editingFixture.referee_contact || '',
          is_home_game: editingFixture.is_home_game !== undefined ? editingFixture.is_home_game : true
        });
      } else {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, fixture_date: today }));
      }
    }
  }, [isOpen, editingFixture]);

  useEffect(() => {
    if (formData.sport_category_id) {
      fetchTeams(formData.sport_category_id);
    }
  }, [formData.sport_category_id]);

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

  const fetchTeams = async (categoryId) => {
    try {
      const response = await axios.get(`${BASE_URL}/sports/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { sport_category_id: categoryId, limit: 100 }
      });
      setTeams(response.data.data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { ...formData };
      
      // Clean up empty values
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      if (editingFixture) {
        await axios.put(`${BASE_URL}/sports/fixtures/${editingFixture.id}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/sports/fixtures`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving fixture:', err);
      setError(err.response?.data?.message || 'Failed to save fixture');
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
            {editingFixture ? 'Edit Fixture' : 'Create New Fixture'}
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
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., Senior Football vs ABC School"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sport Category *
              </label>
              <select
                name="sport_category_id"
                value={formData.sport_category_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                required
              >
                <option value="">Select Sport Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about the fixture..."
            />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Home Team
              </label>
              <select
                name="home_team_id"
                value={formData.home_team_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">Select Home Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Away Team
              </label>
              <select
                name="away_team_id"
                value={formData.away_team_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              >
                <option value="">Select Away Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* External Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Home Team Name (External)
              </label>
              <input
                type="text"
                name="home_team_name"
                value={formData.home_team_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., ABC School"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Away Team Name (External)
              </label>
              <input
                type="text"
                name="away_team_name"
                value={formData.away_team_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., XYZ School"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-2" />
                Fixture Date *
              </label>
              <input
                type="date"
                name="fixture_date"
                value={formData.fixture_date}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-2" />
                Fixture Time *
              </label>
              <input
                type="time"
                name="fixture_time"
                value={formData.fixture_time}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 mr-2" />
              Venue
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., School Football Ground"
            />
          </div>

          {/* Referee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Referee Name
              </label>
              <input
                type="text"
                name="referee_name"
                value={formData.referee_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., John Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Referee Contact
              </label>
              <input
                type="text"
                name="referee_contact"
                value={formData.referee_contact}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., 1234567890"
              />
            </div>
          </div>

          {/* Weather Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weather Conditions
            </label>
            <input
              type="text"
              name="weather_conditions"
              value={formData.weather_conditions}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Sunny, Rainy, Cloudy"
            />
          </div>

          {/* Home Game Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_home_game"
              checked={formData.is_home_game}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              This is a home game
            </label>
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
                  <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
                  {editingFixture ? 'Update Fixture' : 'Create Fixture'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFixtureModal;
