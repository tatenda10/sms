import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUserGraduate,
  faUsers,
  faSchool,
  faCalendarAlt,
  faChartBar,
  faBed,
  faRoute,
  faTrophy,
  faCreditCard,
  faMoneyBillWave,
  faShoppingCart,
  faList,
  faCalculator,
  faFileAlt,
  faWarehouse,
  faChartLine,
  faChartPie,
  faCog,
  faSignOutAlt,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo(2).png';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  // Main navigation sections for dashboard - arranged by workflow
  const mainSections = [
    // 1. Overview & Entry Point
    { name: 'Dashboard', href: '/dashboard', icon: faHome },

    // 2. Student Management (Core Workflow)
    { name: 'Students', href: '/dashboard/students', icon: faUserGraduate },
    { name: 'Employees', href: '/dashboard/employees', icon: faUsers },
    { name: 'Classes', href: '/dashboard/classes', icon: faSchool },
    { name: 'Timetables', href: '/dashboard/timetables', icon: faCalendarAlt },
    { name: 'Results', href: '/dashboard/results', icon: faChartBar },

    // 3. Student Services (Optional Services)
    { name: 'Boarding', href: '/dashboard/boarding', icon: faBed },
    { name: 'Transport', href: '/dashboard/transport/routes', icon: faRoute },
    { name: 'Sports', href: '/dashboard/sports', icon: faTrophy },

    // 4. Financial Management (Billing & Payments)
    { name: 'Student Billing', href: '/dashboard/billing', icon: faCreditCard },

    // 5. Accounting & Operations
    { name: 'Accounting', href: '/dashboard/accounting/chart-of-accounts', icon: faMoneyBillWave },
    { name: 'Payroll', href: '/dashboard/payroll', icon: faCalculator },

    // 6. Asset & Inventory Management
    { name: 'Inventory', href: '/dashboard/inventory', icon: faFileAlt },

    // 7. Reporting & Analytics
    { name: 'Analytics', href: '/dashboard/analytics/expense-analysis', icon: faChartPie },

    // 8. System Administration
    { name: 'Admin', href: '/dashboard/settings', icon: faCog },
  ];

  // Always show main sections - static menu
  const navigationItems = mainSections;

  const renderNavItem = (item) => {
    // Determine if this item should be active - only one at a time
    const currentPath = location.pathname.trim();
    let shouldBeActive = false;

    if (item.name === 'Dashboard') {
      // Dashboard is ONLY active when exactly on /dashboard or /dashboard/ (no sub-routes)
      shouldBeActive = (currentPath === '/dashboard' || currentPath === '/dashboard/');
    } else {
      // For other items, check if current path matches or starts with their href
      // Make sure we're not on the base dashboard route
      const isOnDashboard = currentPath === '/dashboard' || currentPath === '/dashboard/';
      if (!isOnDashboard) {
        shouldBeActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
      }
    }

    return (
      <NavLink
        key={item.name}
        to={item.href}
        end={item.name === 'Dashboard'} // Use 'end' prop to prevent Dashboard from matching sub-routes
        className={() => {
          // Completely override NavLink's isActive - use our custom logic only
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
