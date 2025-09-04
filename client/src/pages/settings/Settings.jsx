import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserShield, 
  faKey,
  faCog,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ChangePassword from './ChangePassword';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500">
              Manage system users, roles, and account settings
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'users', label: 'User Management', icon: faUsers },
            { id: 'roles', label: 'Role Management', icon: faUserShield },
            { id: 'password', label: 'Change Password', icon: faKey }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center ${
                activeTab === tab.id
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2 h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'password' && <ChangePassword />}
      </div>
    </div>
  );
};

export default Settings;
