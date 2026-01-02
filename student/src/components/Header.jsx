import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faCog,
  faSignOutAlt,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './Layout';
import logo from '../assets/brooklyne.png';

const Header = ({ onMenuClick }) => {
  const { student, logout } = useStudentAuth();
  const navigate = useNavigate();
  const { setShowSettings } = useSettings();
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
    navigate('/login');
    setShowDropdown(false);
  };

  // Get student initials for avatar
  const getInitials = () => {
    if (!student) return 'S';
    const name = student.Name || '';
    const surname = student.Surname || '';
    if (name && surname) {
      return (name[0] + surname[0]).toUpperCase();
    }
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return 'S';
  };

  // Get student name display
  const getStudentName = () => {
    if (!student) return 'Student';
    return `${student.Name || ''} ${student.Surname || ''}`.trim() || 'Student';
  };

  // Get student role display
  const getStudentRole = () => {
    if (!student) return 'Student';
    return student.RegNumber || 'Student';
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
          <span className="hidden md:inline" style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginLeft: '4px',
            whiteSpace: 'nowrap'
          }}>Brooklyn Private School</span>
        </div>

        {/* Center - Empty for student portal */}
        <div className="top-nav-center">
          {/* Empty when not on special pages */}
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
              <p className="top-nav-username">{getStudentName()}</p>
              <p className="top-nav-user-role">{getStudentRole()}</p>
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
                    navigate('/profile');
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                  <span>Profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowSettings(true);
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
