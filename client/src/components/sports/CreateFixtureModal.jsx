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
  faHockeyPuck,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CreateFixtureModal = ({ isOpen, onClose, onSuccess, editingFixture = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
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
      setIsLoading(true);
      fetchCategories().finally(() => setIsLoading(false));
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
          fixture_date: editingFixture.fixture_date ? editingFixture.fixture_date.split('T')[0] : '',
          fixture_time: editingFixture.fixture_time || '',
          weather_conditions: editingFixture.weather_conditions || '',
          referee_name: editingFixture.referee_name || '',
          referee_contact: editingFixture.referee_contact || '',
          is_home_game: editingFixture.is_home_game !== undefined ? editingFixture.is_home_game : true
        });
      } else {
        // Reset form
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          title: '',
          description: '',
          sport_category_id: '',
          home_team_id: '',
          away_team_id: '',
          home_team_name: '',
          away_team_name: '',
          venue: '',
          fixture_date: today,
          fixture_time: '',
          weather_conditions: '',
          referee_name: '',
          referee_contact: '',
          is_home_game: true
        });
        setFormError(null);
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
      setFormError('Failed to load sport categories');
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
    
    if (!isFormValid()) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setFormError(null);

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
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const isFormValid = () => {
    return (
      formData.title &&
      formData.sport_category_id &&
      formData.fixture_date &&
      formData.fixture_time
    );
  };
  
  const handleCloseModal = () => {
    setFormError(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '800px', minHeight: isLoading ? '400px' : 'auto' }}
      >
        {isLoading ? (
          // Loading State
          <>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
              <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
              <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            </div>
          </>
        ) : (
          // Content State
          <>
            <div className="modal-header">
              <h3 className="modal-title">{editingFixture ? 'Edit Fixture' : 'Add Fixture'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {formError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="modal-form">

                {/* Fixture Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faTrophy} style={{ color: '#2563eb' }} />
                    Fixture Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Title <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Enter fixture title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Sport Category <span className="required">*</span>
                      </label>
                      <select
                        name="sport_category_id"
                        className="form-control"
                        value={formData.sport_category_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select sport category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        placeholder="Enter fixture description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Teams Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ color: '#10b981' }} />
                    Teams
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Home Team</label>
                      <select
                        name="home_team_id"
                        className="form-control"
                        value={formData.home_team_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select home team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Away Team</label>
                      <select
                        name="away_team_id"
                        className="form-control"
                        value={formData.away_team_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select away team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Home Team Name (External)</label>
                      <input
                        type="text"
                        name="home_team_name"
                        className="form-control"
                        placeholder="e.g., ABC School"
                        value={formData.home_team_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Away Team Name (External)</label>
                      <input
                        type="text"
                        name="away_team_name"
                        className="form-control"
                        placeholder="e.g., XYZ School"
                        value={formData.away_team_name}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule & Location Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#f59e0b' }} />
                    Schedule & Location
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Fixture Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        name="fixture_date"
                        className="form-control"
                        value={formData.fixture_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Fixture Time <span className="required">*</span>
                      </label>
                      <input
                        type="time"
                        name="fixture_time"
                        className="form-control"
                        value={formData.fixture_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Venue</label>
                      <input
                        type="text"
                        name="venue"
                        className="form-control"
                        placeholder="Enter venue"
                        value={formData.venue}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#8b5cf6' }} />
                    Additional Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Referee Name</label>
                      <input
                        type="text"
                        name="referee_name"
                        className="form-control"
                        placeholder="Enter referee name"
                        value={formData.referee_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Referee Contact</label>
                      <input
                        type="text"
                        name="referee_contact"
                        className="form-control"
                        placeholder="Enter referee contact"
                        value={formData.referee_contact}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Weather Conditions</label>
                      <input
                        type="text"
                        name="weather_conditions"
                        className="form-control"
                        placeholder="e.g., Sunny, Rainy, Cloudy"
                        value={formData.weather_conditions}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="is_home_game"
                          checked={formData.is_home_game}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="form-label" style={{ margin: 0 }}>This is a home game</span>
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={handleSubmit}
                disabled={!isFormValid() || loading}
              >
                {loading ? 'Saving...' : editingFixture ? 'Update Fixture' : 'Save Fixture'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateFixtureModal;
