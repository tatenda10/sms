import React, { createContext, useContext, useState } from 'react';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    return { activeTab: 'dashboard', setActiveTab: () => {} };
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <InventoryContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

