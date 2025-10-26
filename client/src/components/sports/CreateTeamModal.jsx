import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSave, 
  faUsers, 
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

const CreateTeamModal = ({ isOpen, onClose, onSuccess, editingTeam = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport_category_id: '',
    coach_name: '',
    coach_contact: '',
    is_active: true
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
      if (editingTeam) {
        setFormData({
          name: editingTeam.name || '',
          description: editingTeam.description || '',
          sport_category_id: editingTeam.sport_category_id || '',
          coach_name: editingTeam.coach_name || '',
          coach_contact: editingTeam.coach_contact || '',
          is_active: editingTeam.is_active !== undefined ? editingTeam.is_active : true
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingTeam]);

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sport_category_id: '',
      coach_name: '',
      coach_contact: '',
      is_active: true
    });
    setError(null);
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
    try {
      setLoading(true);
      setError(null);

      const url = editingTeam 
        ? `${BASE_URL}/sports/teams/${editingTeam.id}`
        : `${BASE_URL}/sports/teams`;

      const method = editingTeam ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error saving team:', err);
      setError(err.response?.data?.message || 'Failed to save team');
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
            {editingTeam ? 'Edit Team' : 'Create New Team'}
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
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="e.g., Senior Football Team"
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
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="Team description..."
            />
          </div>

          {/* Coach Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Coach Name
              </label>
              <input
                type="text"
                name="coach_name"
                value={formData.coach_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="Coach name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Coach Contact
              </label>
              <input
                type="text"
                name="coach_contact"
                value={formData.coach_contact}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                placeholder="Phone or email"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
            />
            <label className="ml-2 text-xs font-medium text-gray-700">
              Team is active
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
                  <FontAwesomeIcon icon={faSave} className="h-3 w-3 mr-1" />
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
