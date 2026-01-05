import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ChangePassword from './ChangePassword';

const Settings = () => {
  const { activeTab } = useSettings();

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Content Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'hidden', 
        minHeight: 0
      }}>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'password' && <ChangePassword />}
      </div>
    </div>
  );
};

export default Settings;
