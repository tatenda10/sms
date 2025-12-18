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
  faHockeyPuck,
  faCalendarAlt,
  faUsers,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CreateAnnouncementModal = ({ isOpen, onClose, onSuccess, editingAnnouncement = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
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
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
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
          start_date: editingAnnouncement.start_date ? editingAnnouncement.start_date.split('T')[0] : '',
          end_date: editingAnnouncement.end_date ? editingAnnouncement.end_date.split('T')[0] : '',
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
      setFormError('Failed to load data');
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
    setFormError(null);
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
    
    if (!isFormValid()) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setFormError(null);

    try {
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
      formData.content &&
      formData.announcement_type
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
              <h3 className="modal-title">{editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}</h3>
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

                {/* Announcement Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faBullhorn} style={{ color: '#2563eb' }} />
                    Announcement Information
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
                        placeholder="Enter announcement title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Type <span className="required">*</span>
                      </label>
                      <select
                        name="announcement_type"
                        className="form-control"
                        value={formData.announcement_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="general">General</option>
                        <option value="fixture">Fixture</option>
                        <option value="result">Result</option>
                        <option value="training">Training</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Content <span className="required">*</span>
                      </label>
                      <textarea
                        name="content"
                        className="form-control"
                        placeholder="Enter announcement content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={4}
                        style={{ resize: 'vertical' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Related Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ color: '#10b981' }} />
                    Related Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Sport Category</label>
                      <select
                        name="sport_category_id"
                        className="form-control"
                        value={formData.sport_category_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Team</label>
                      <select
                        name="team_id"
                        className="form-control"
                        value={formData.team_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Fixture</label>
                      <select
                        name="fixture_id"
                        className="form-control"
                        value={formData.fixture_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select fixture</option>
                        {fixtures.map(fixture => (
                          <option key={fixture.id} value={fixture.id}>
                            {fixture.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Priority & Status Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ color: '#f59e0b' }} />
                    Priority & Status
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select
                        name="priority"
                        className="form-control"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schedule & Audience Section */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#8b5cf6' }} />
                    Schedule & Audience
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Target Audience</label>
                      <select
                        name="target_audience"
                        className="form-control"
                        value={formData.target_audience}
                        onChange={handleInputChange}
                      >
                        <option value="all">All</option>
                        <option value="students">Students</option>
                        <option value="employees">Employees</option>
                        <option value="teams">Teams</option>
                      </select>
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
                {loading ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Save Announcement'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
