import React, { useState } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../components/Layout';

const Settings = () => {
  const { changePassword } = useStudentAuth();
  const { setShowSettings } = useSettings();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (result.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClose = () => {
    setShowSettings(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Change Password</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body">
          {/* Success Message */}
          {success && (
            <div style={{ 
              padding: '10px', 
              background: '#d1fae5', 
              border: '1px solid #86efac',
              color: '#065f46', 
              fontSize: '0.75rem', 
              marginBottom: '16px', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.875rem' }} />
              <span>Password changed successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ 
              padding: '10px', 
              background: '#fee2e2', 
              color: '#dc2626', 
              fontSize: '0.75rem', 
              marginBottom: '16px', 
              borderRadius: '4px' 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">
                Current Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  className="form-control"
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  style={{ paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <FontAwesomeIcon 
                    icon={showPasswords.current ? faEyeSlash : faEye} 
                    style={{ fontSize: '0.875rem' }}
                  />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">
                New Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  className="form-control"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  style={{ paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <FontAwesomeIcon 
                    icon={showPasswords.new ? faEyeSlash : faEye} 
                    style={{ fontSize: '0.875rem' }}
                  />
                </button>
              </div>
              <p style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)', 
                margin: '4px 0 0 0' 
              }}>
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                Confirm New Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  style={{ paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <FontAwesomeIcon 
                    icon={showPasswords.confirm ? faEyeSlash : faEye} 
                    style={{ fontSize: '0.875rem' }}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="modal-btn modal-btn-confirm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      border: '2px solid white', 
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <span>Changing Password...</span>
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Settings;
