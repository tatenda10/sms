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
  faHockeyPuck,
  faTrophy,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CreateTeamModal = ({ isOpen, onClose, onSuccess, editingTeam = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
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
      setIsLoading(true);
      fetchCategories().finally(() => setIsLoading(false));
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
      setFormError('Failed to load sport categories');
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
    setFormError(null);
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
      formData.name &&
      formData.sport_category_id
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
              <h3 className="modal-title">{editingTeam ? 'Edit Team' : 'Add Team'}</h3>
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

                {/* Team Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faTrophy} style={{ color: '#2563eb' }} />
                    Team Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Team Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter team name"
                        value={formData.name}
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
                        placeholder="Enter team description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Coach Information Section */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUserTie} style={{ color: '#10b981' }} />
                    Coach Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Coach Name</label>
                      <input
                        type="text"
                        name="coach_name"
                        className="form-control"
                        placeholder="Enter coach name"
                        value={formData.coach_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Coach Contact</label>
                      <input
                        type="text"
                        name="coach_contact"
                        className="form-control"
                        placeholder="Enter phone or email"
                        value={formData.coach_contact}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="form-label" style={{ margin: 0 }}>Team is active</span>
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
                {loading ? 'Saving...' : editingTeam ? 'Update Team' : 'Save Team'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateTeamModal;
