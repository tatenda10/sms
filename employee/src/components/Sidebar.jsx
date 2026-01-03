import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUser,
  faBookOpen,
  faBell,
  faCalculator,
  faCog,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo(2).png';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  // Employee navigation items
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: faHome },
    { name: 'Profile', href: '/profile', icon: faUser },
    { name: 'Test Marks', href: '/test-marks', icon: faBookOpen },
    { name: 'Announcements', href: '/announcements', icon: faBell },
    { name: 'Payroll', href: '/payslips', icon: faCalculator },
    { name: 'Notifications', href: '/notifications', icon: faBell },
    { name: 'Settings', href: '/settings', icon: faCog },
  ];

  const renderNavItem = (item) => {
    const currentPath = location.pathname.trim();
    const shouldBeActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={() => {
          return `nav-item ${shouldBeActive ? 'active' : ''}`;
        }}
        onClick={() => setOpen(false)}
      >
        <FontAwesomeIcon icon={item.icon} className="nav-icon" />
        <span className="nav-text">{item.name}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="sidebar-mobile-backdrop lg:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Mobile Sidebar */}
          <aside className="sidebar-mobile lg:hidden">
            <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
              <img src={logo} alt="Logo" className="sidebar-logo" />
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-900 p-1"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            </div>
            <nav className="sidebar-nav">
              {navigationItems.map(renderNavItem)}
            </nav>
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="sidebar hidden lg:block">
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          {navigationItems.map(renderNavItem)}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
