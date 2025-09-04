import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the dashboard (index route)
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - only show if not on dashboard */}
      {!isDashboard && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
      
      {/* Main content */}
      <div className={isDashboard ? "" : "lg:pl-64"}>
        {/* Top navbar - only show if not on dashboard */}
        {!isDashboard && <Header onMenuClick={() => setSidebarOpen(true)} />}
        
        {/* Page content */}
        <main className={isDashboard ? "" : "py-6"}>
          <div className={isDashboard ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
