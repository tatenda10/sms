import { Menu, Bell, LogOut } from 'lucide-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { student, logout } = useStudentAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Spacer */}
      <div className="flex flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

        {/* Student info */}
        <div className="flex items-center gap-x-2">
          <div className="text-right">
            <span className="text-xs font-medium text-gray-900">
              {student?.Name} {student?.Surname}
            </span>
            <div className="text-xs text-gray-500">
              {student?.RegNumber}
            </div>
          </div>
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
