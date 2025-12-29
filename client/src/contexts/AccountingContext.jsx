import React, { createContext, useContext, useState } from 'react';

const AccountingContext = createContext();

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    return { activeTab: 'chart-of-accounts', setActiveTab: () => {} };
  }
  return context;
};

export const AccountingProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('chart-of-accounts');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <AccountingContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange
    }}>
      {children}
    </AccountingContext.Provider>
  );
};

