import { useState, useEffect, useRef } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faBuilding,
  faCreditCard,
  faClock,
  faBriefcase,
  faUserCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
  const { employee, getProfile } = useEmployeeAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (hasFetched.current) return;

      try {
        setLoading(true);
        setError(null);
        hasFetched.current = true;
        const data = await getProfile();
        setProfileData(data);
      } catch (err) {
        setError(err.message);
        hasFetched.current = false;
      } finally {
        setLoading(false);
      }
    };

    if (employee) {
      fetchProfile();
    }
  }, [employee, getProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={faUserCircle} className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load employee profile information.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'personal', name: 'Personal', icon: faUser },
    { id: 'employment', name: 'Employment', icon: faBriefcase },
    { id: 'account', name: 'Account', icon: faClock },
    { id: 'status', name: 'Status', icon: faInfoCircle }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Email Address</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Phone Number</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.phone_number || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Home Address</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'employment':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Department</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.department_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Position / Job Title</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.job_title || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Hire Date</p>
                <p className="text-sm text-gray-900 font-medium">{formatDate(profileData.hire_date)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCreditCard} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Salary Tier / Amount</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.salary ? `$${profileData.salary.toLocaleString()}` : 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">System Username</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.username || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Last Login Session</p>
                <p className="text-sm text-gray-900 font-medium">{formatDateTime(profileData.last_login)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Initial Password Status</p>
                <p className="text-sm text-gray-900 font-medium">{profileData.password_set ? 'Password Locked' : 'Temporary Password active'}</p>
              </div>
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="mr-4">
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Employment Status</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-[0.7rem] font-bold ${profileData.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {profileData.is_active ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Record Created At</p>
                <p className="text-sm text-gray-900 font-medium">{formatDateTime(profileData.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400 mr-4" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Last Record Update</p>
                <p className="text-sm text-gray-900 font-medium">{formatDateTime(profileData.updated_at)}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content flex items-center gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faUser} className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="report-title truncate">{profileData.full_name || 'My Profile'}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <p className="report-subtitle mb-0 flex items-center">
                <span className="font-bold text-gray-700">{profileData.job_title || 'N/A'}</span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>{profileData.department_name || 'N/A'}</span>
              </p>
              <span className="text-[0.65rem] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                ID: {profileData.employee_id || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Acting as Filters) */}
      <div className="report-filters" style={{ flexShrink: 0, paddingBottom: '0' }}>
        <div className="report-filters-left" style={{ overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .report-filters-left::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                `}
              >
                <FontAwesomeIcon icon={tab.icon} className={`mr-2 h-3.5 w-3.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto" style={{ paddingTop: '10px' }}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;