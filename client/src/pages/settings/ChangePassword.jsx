import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const ChangePassword = () => {
  const { token, user } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(`${BASE_URL}/auth/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Password changed successfully:', response.data);
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error changing password:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('Current password is incorrect');
      } else if (err.response?.status === 400) {
        setError('Invalid password format');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">


      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm text-green-600">
              Password changed successfully!
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}



      {/* Password Change Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-600">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                id="currentPassword"
                required
                value={formData.currentPassword}
                onChange={handleChange}
                className="block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm pr-10"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <FontAwesomeIcon 
                  icon={showPasswords.current ? faEyeSlash : faEye} 
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                />
              </button>
            </div>
          </div>

          {/* Empty div for spacing */}
          <div></div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                id="newPassword"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm pr-10"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <FontAwesomeIcon 
                  icon={showPasswords.new ? faEyeSlash : faEye} 
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm pr-10"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <FontAwesomeIcon 
                  icon={showPasswords.confirm ? faEyeSlash : faEye} 
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-start">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Changing Password...
              </div>
            ) : (
              'Change Password'
            )}
          </button>
        </div>
      </form>

      {/* Security Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4">
        <h4 className="text-xs font-medium text-blue-900 mb-2">Password Security Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use a combination of letters, numbers, and symbols</li>
          <li>• Avoid using personal information</li>
          <li>• Don't reuse passwords from other accounts</li>
          <li>• Change your password regularly</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;
