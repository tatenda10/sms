import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';

const SettingsModal = ({ onClose }) => {
  const { changePassword } = useEmployeeAuth();
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Password change handlers
  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
    // Clear message when user starts typing
    if (passwordMessage) {
      setPasswordMessage('');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      
      if (result.success) {
        setPasswordMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Close modal after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setPasswordMessage(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClose = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordMessage('');
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Change Password</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {passwordMessage && (
            <div style={{ 
              padding: '10px', 
              background: passwordMessage.includes('success') ? '#d1fae5' : '#fee2e2', 
              color: passwordMessage.includes('success') ? '#065f46' : '#dc2626', 
              fontSize: '0.75rem', 
              marginBottom: '16px', 
              borderRadius: '4px' 
            }}>
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="modal-form">
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Current Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)',
                  zIndex: 1
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.7rem' }} />
                </div>
                <input
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  placeholder="Enter your current password"
                  style={{ paddingLeft: '28px', paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} style={{ fontSize: '0.7rem' }} />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)',
                  zIndex: 1
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.7rem' }} />
                </div>
                <input
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  placeholder="Enter your new password"
                  style={{ paddingLeft: '28px', paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} style={{ fontSize: '0.7rem' }} />
                </button>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label">Confirm New Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)',
                  zIndex: 1
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.7rem' }} />
                </div>
                <input
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  placeholder="Confirm your new password"
                  style={{ paddingLeft: '28px', paddingRight: '32px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} style={{ fontSize: '0.7rem' }} />
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-confirm"
            onClick={handlePasswordSubmit}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
