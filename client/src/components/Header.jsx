import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser, faCog, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

        {/* Center - Menu Items (optional, can be added later) */}
        <div className="top-nav-center">
          {/* Add menu items here if needed */}
        </div>

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
