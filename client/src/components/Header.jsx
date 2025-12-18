import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faUser, 
  faCog, 
  faSignOutAlt, 
  faBars,
  faCalendarAlt,
  faUsers,
  faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSports } from '../contexts/SportsContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get sports context (will return default if not in provider)
  const sportsContext = useSports();
  const { activeTab: activeSportsTab, setActiveTab: onSportsTabChange, showCalendar } = sportsContext;
  
  // Check if we're on the sports page
  const isSportsPage = location.pathname.startsWith('/dashboard/sports');
  
  // Determine active tab for display (calendar is shown separately)
  const displayActiveTab = showCalendar ? 'calendar' : activeSportsTab;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.username) return 'U';
    const parts = user.username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Get user role display text
  const getUserRole = () => {
    if (!user || !user.roles) return 'User';
    if (user.roles.includes('admin')) return 'Administrator';
    return user.roles[0] || 'User';
  };

  return (
    <nav className="top-nav-bar">
      <div className="top-nav-content">
        {/* Left - Menu Button (Mobile) & Logo */}
        <div className="top-nav-left flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 text-gray-700"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" aria-hidden="true" />
          </button>
          <img src={logo} alt="Logo" className="top-nav-logo" />
        </div>

        {/* Center - Sports Navigation Menu */}
        {isSportsPage && (
          <div className="top-nav-center" style={{ 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0'
          }}>
            {[
              { id: 'fixtures', label: 'Fixtures', icon: faCalendarAlt },
              { id: 'teams', label: 'Teams', icon: faUsers },
              { id: 'announcements', label: 'Announcements', icon: faBullhorn },
              { id: 'calendar', label: 'Calendar', icon: faCalendarAlt }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onSportsTabChange && onSportsTabChange(tab.id)}
                className={`top-nav-menu-item ${displayActiveTab === tab.id ? 'active' : ''}`}
                style={{
                  padding: '12px 20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: displayActiveTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                  borderBottom: displayActiveTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (displayActiveTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (displayActiveTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {!isSportsPage && (
          <div className="top-nav-center">
            {/* Empty when not on sports page */}
          </div>
        )}

        {/* Right - User Info */}
        <div className="top-nav-right">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <FontAwesomeIcon icon={faBell} className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* User Info with Dropdown */}
          <div className="top-nav-user-info" ref={dropdownRef}>
            <div className="top-nav-user-details">
              <p className="top-nav-username">{user?.username || 'User'}</p>
              <p className="top-nav-user-role">{getUserRole()}</p>
            </div>
            <div 
              className="top-nav-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {getInitials()}
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="avatar-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/dashboard/settings');
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                  <span>Profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/dashboard/settings');
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCog} className="dropdown-icon" />
                  <span>Settings</span>
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
