import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="main-content-scrollable">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
