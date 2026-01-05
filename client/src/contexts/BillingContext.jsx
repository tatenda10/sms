import React, { createContext, useContext, useState } from 'react';

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    return { activeTab: 'record-payment', setActiveTab: () => {} };
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('record-payment');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <BillingContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange
    }}>
      {children}
    </BillingContext.Provider>
  );
};

