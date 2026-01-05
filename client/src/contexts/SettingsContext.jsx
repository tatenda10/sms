import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return { activeTab: 'users', setActiveTab: () => {} };
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('users'); // Default to User Management

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <SettingsContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

