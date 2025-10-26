import { useState, useEffect, useRef } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { User, Mail, Phone, MapPin, Calendar, Building, CreditCard, Clock } from 'lucide-react';

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
        hasFetched.current = false; // Reset on error so it can retry
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
        <User className="mx-auto h-12 w-12 text-gray-400" />
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
    { id: 'personal', name: 'Personal', icon: User },
    { id: 'employment', name: 'Employment', icon: Building },
    { id: 'account', name: 'Account', icon: Clock },
    { id: 'status', name: 'Status', icon: Calendar }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{profileData.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{profileData.phone_number || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{profileData.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'employment':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <Building className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm text-gray-900">{profileData.department_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="text-sm text-gray-900">{profileData.job_title || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Hire Date</p>
                <p className="text-sm text-gray-900">{formatDate(profileData.hire_date)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Salary</p>
                <p className="text-sm text-gray-900">{profileData.salary ? `$${profileData.salary.toLocaleString()}` : 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'account':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm text-gray-900">{profileData.username || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm text-gray-900">{formatDateTime(profileData.last_login)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Password Set</p>
                <p className="text-sm text-gray-900">{profileData.password_set ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Password Created</p>
                <p className="text-sm text-gray-900">{formatDateTime(profileData.password_created_at)}</p>
              </div>
            </div>
          </div>
        );
      
      case 'status':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="mr-3">
                <p className="text-xs text-gray-500">Status</p>
                <div className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                  profileData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profileData.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">{formatDateTime(profileData.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Updated</p>
                <p className="text-sm text-gray-900">{formatDateTime(profileData.updated_at)}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-gray-300 flex items-center justify-center mr-4">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-900">
              {profileData.full_name || 'N/A'}
            </h1>
            <p className="text-sm text-gray-500">
              {profileData.job_title || 'N/A'} • {profileData.department_name || 'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              Employee ID: {profileData.employee_id || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <div className="bg-white border border-gray-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;