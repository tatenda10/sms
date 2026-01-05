import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SportsProvider } from '../contexts/SportsContext';
import { AccountingProvider } from '../contexts/AccountingContext';
import { InventoryProvider } from '../contexts/InventoryContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SportsProvider>
      <AccountingProvider>
        <InventoryProvider>
          <div className="dashboard-container">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            <main className="main-content">
              <Header onMenuClick={() => setSidebarOpen(true)} />
              <div className="main-content-scrollable">
                <Outlet />
              </div>
            </main>
          </div>
        </InventoryProvider>
      </AccountingProvider>
    </SportsProvider>
  );
};

export default Layout;
