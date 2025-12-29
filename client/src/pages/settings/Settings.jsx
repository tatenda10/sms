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

  const tabs = [
    { id: 'users', name: 'User Management', icon: faUsers },
    { id: 'roles', name: 'Role Management', icon: faUserShield },
    { id: 'password', name: 'Change Password', icon: faKey }
  ];

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Settings</h2>
          <p className="report-subtitle">Manage system users, roles, and account settings.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: `1px solid ${activeTab === tab.id ? '#2563eb' : 'var(--border-color)'}`,
                  borderRadius: '4px',
                  background: activeTab === tab.id ? '#2563eb' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.7rem' }} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

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
