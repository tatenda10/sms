import { NavLink, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { 
  Bell, 
  Settings,
  LogOut,
  User,
  BookOpen,
  Award,
  DollarSign
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const { student, logout } = useStudentAuth();
  const location = useLocation();

  // Student navigation items
  const navigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Results', href: '/results', icon: Award },
    { name: 'Test Marks', href: '/test-marks', icon: BookOpen },
    { name: 'Financial', href: '/financial', icon: DollarSign },
    { name: 'Announcements', href: '/announcements', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  const renderNavItem = (item) => {
    // Check if this item is currently active
    const isCurrentlyActive = location.pathname === item.href;
    
    return (
      <li key={item.name}>
        <NavLink
          to={item.href}
          className={`group flex gap-x-3 rounded-md p-2 text-xs leading-5 font-medium border-b border-gray-200/30 ${
            isCurrentlyActive
              ? 'bg-gray-50 text-blue-600'
              : item.name === 'Home'
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
          onClick={() => setOpen(false)}
        >
          <div className="h-5 w-5 shrink-0 text-gray-600 flex items-center justify-center">
            <item.icon className="text-sm" />
          </div>
          {item.name}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/80 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          
          {/* Sidebar */}
         <div className="fixed inset-y-0 left-0 z-50 w-56 bg-white lg:hidden overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex grow flex-col gap-y-4 px-4 pb-4">
              {/* Header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-lg bg-green-600 flex items-center justify-center">
                   <span className="text-white text-xs font-bold">S</span>
                  </div>
                 <h1 className="text-sm font-bold text-gray-900">UbuntuLearn</h1>
                </div>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md hover:bg-gray-300"
                >
                  <span className="text-gray-600 text-lg font-bold">×</span>
                </button>
              </div>
              
              
              {/* Navigation */}
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                     {navigation.map(renderNavItem)}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-x-3 rounded-md p-2 text-xs leading-5 font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 border-t border-gray-200/50"
                    >
                      <div className="h-5 w-5 shrink-0 text-gray-600 flex items-center justify-center">
                        <LogOut className="text-sm" />
                      </div>
                      Logout
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex grow flex-col gap-y-4 border-r border-gray-200 bg-gray-200/30 px-4 pb-4">
          <div className="flex h-14 shrink-0 items-center border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <h1 className="text-sm font-bold text-gray-900">UbuntuLearn</h1>
            </div>
          </div>
          
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map(renderNavItem)}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-x-3 rounded-md p-2 text-xs leading-5 font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 border-t border-gray-200/50"
                >
                  <div className="h-5 w-5 shrink-0 text-gray-600 flex items-center justify-center">
                    <LogOut className="text-sm" />
                  </div>
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
