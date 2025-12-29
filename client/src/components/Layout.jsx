import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SportsProvider } from '../contexts/SportsContext';
import { AccountingProvider } from '../contexts/AccountingContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SportsProvider>
      <AccountingProvider>
        <div className="dashboard-container">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="main-content">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div className="main-content-scrollable">
              <Outlet />
            </div>
          </main>
        </div>
      </AccountingProvider>
    </SportsProvider>
  );
};

export default Layout;
