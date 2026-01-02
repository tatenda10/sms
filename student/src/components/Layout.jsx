import { useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Settings from '../pages/Settings';

// Create context for Settings modal
const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within Layout');
  }
  return context;
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SettingsContext.Provider value={{ showSettings, setShowSettings }}>
      <div className="dashboard-container">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="main-content-scrollable">
            {children}
          </div>
        </main>
        {showSettings && <Settings />}
      </div>
    </SettingsContext.Provider>
  );
};

export default Layout;
