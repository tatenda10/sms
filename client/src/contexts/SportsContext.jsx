import React, { createContext, useContext, useState } from 'react';

const SportsContext = createContext();

export const useSports = () => {
  const context = useContext(SportsContext);
  if (!context) {
    return { activeTab: 'fixtures', setActiveTab: () => {} };
  }
  return context;
};

export const SportsProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('fixtures');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleTabChange = (tabId) => {
    if (tabId === 'calendar') {
      setShowCalendar(true);
      setActiveTab('fixtures'); // Keep fixtures as active when calendar is shown
    } else {
      setShowCalendar(false);
      setActiveTab(tabId);
    }
  };

  return (
    <SportsContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange,
      showCalendar,
      setShowCalendar
    }}>
      {children}
    </SportsContext.Provider>
  );
};

