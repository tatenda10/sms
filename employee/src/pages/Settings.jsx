import { useState } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
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
      }
    } catch (error) {
      setPasswordMessage(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-sm font-medium text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500">Change your password to keep your account secure</p>
      </div>

      {/* Password Change Form */}
      <div className="bg-white border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Change Password</h2>
        
        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            passwordMessage.includes('success') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {passwordMessage.includes('success') ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium">{passwordMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-700">
              Current Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                required
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="block w-full pl-8 pr-8 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your current password"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                required
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="block w-full pl-8 pr-8 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your new password"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                required
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="block w-full pl-8 pr-8 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your new password"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
