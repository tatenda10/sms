import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';
import { 
  User, 
  CreditCard, 
  Bell, 
  Calendar,
  TrendingUp,
  Clock,
  Building2,
  Calculator,
  Settings,
  FileText,
  BookOpen,
  GraduationCap,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { employee } = useEmployeeAuth();
  const [stats, setStats] = useState({
    payslips: 0,
    announcements: 0,
    upcomingEvents: 0
  });
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState(null);
  const hasFetchedClasses = useRef(false);

  useEffect(() => {
    // Simulate loading stats - in real app, fetch from API
    setStats({
      payslips: 12,
      announcements: 3,
      upcomingEvents: 2
    });
  }, []);

  // Fetch employee classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!employee?.id || hasFetchedClasses.current) return;
      
      try {
        console.log('📚 Fetching classes for employee:', employee.id);
        setIsLoadingClasses(true);
        setClassesError(null);
        hasFetchedClasses.current = true;
        
        const url = `http://localhost:5000/api/employee-classes/${employee.id}`;
        console.log('🌐 API URL:', url);
        
        const token = localStorage.getItem('employeeToken');
        console.log('🔑 Token exists:', !!token);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Classes data:', data);
        setClasses(data.data || []);
      } catch (err) {
        console.error('❌ Fetch classes error:', err);
        setClassesError(err.message);
        hasFetchedClasses.current = false;
      } finally {
        setIsLoadingClasses(false);
      }
    };

    if (employee?.id) {
      console.log('✅ Employee ID found, fetching classes...');
      fetchClasses();
    } else {
      console.log('❌ No employee ID found, skipping classes fetch');
    }
  }, [employee?.id]);

  const handleClassClick = (classItem) => {
    if (classItem.class_type === 'Subject Class') {
      navigate(`/classes/subject/${classItem.id}`);
    } else if (classItem.class_type === 'Grade-Level Class') {
      navigate(`/classes/gradelevel/${classItem.id}`);
    }
  };

  const quickActions = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'View your profile information',
      color: 'bg-indigo-500'
    },
    {
      name: 'Announcements',
      href: '/announcements',
      icon: Bell,
      description: 'Read company announcements',
      color: 'bg-blue-500'
    },
    {
      name: 'Payroll',
      href: '/payslips',
      icon: Calculator,
      description: 'Access your salary information',
      color: 'bg-green-500'
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      description: 'View your notifications',
      color: 'bg-yellow-500'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Manage your account settings',
      color: 'bg-purple-500'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'payslip',
      title: 'Payslip for December 2024',
      time: '2 days ago',
      status: 'available'
    },
    {
      id: 2,
      type: 'announcement',
      title: 'Holiday Schedule Update',
      time: '1 week ago',
      status: 'read'
    },
    {
      id: 3,
      type: 'profile',
      title: 'Profile information updated',
      time: '2 weeks ago',
      status: 'completed'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">
              Welcome back, {employee?.full_name || 'Employee'}!
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {employee?.job_title} • {employee?.department_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="text-sm font-semibold text-gray-900">
                {employee?.employee_id}
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">
                    Available Payslips
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.payslips}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">
                    New Announcements
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.announcements}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">
                    Upcoming Events
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.upcomingEvents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* My Classes Section */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">My Classes</h3>
              <p className="text-xs text-gray-500">Classes you are assigned to teach</p>
            </div>
            <div className="p-6">
              {isLoadingClasses ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : classesError ? (
                <div className="bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-xs font-medium text-red-800">Error loading classes</h3>
                      <div className="mt-1 text-xs text-red-700">
                        <p>{classesError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-xs font-medium text-gray-900">No classes assigned</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    You haven't been assigned to any classes yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Subject Classes */}
                  {classes.filter(cls => cls.class_type === 'Subject Class').length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Subject Classes ({classes.filter(cls => cls.class_type === 'Subject Class').length})
                      </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {classes.filter(cls => cls.class_type === 'Subject Class').map((cls) => (
                                  <div 
                                    key={`subject-${cls.id}`} 
                                    className="bg-blue-50 border border-blue-200 p-3 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                    onClick={() => handleClassClick(cls)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="text-xs font-medium text-blue-900">{cls.subject_name}</h5>
                                        <p className="text-xs text-blue-700">{cls.subject_code}</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          {cls.stream_name} {cls.gradelevel_class_name ? `• ${cls.gradelevel_class_name}` : ''}
                                        </p>
                                        {cls.room_id && (
                                          <p className="text-xs text-blue-500 mt-1">Room ID: {cls.room_id}</p>
                                        )}
                                        {cls.capacity && (
                                          <p className="text-xs text-blue-500">Capacity: {cls.capacity}</p>
                                        )}
                                      </div>
                                      <div className="ml-2">
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                          Subject
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                      </div>
                    </div>
                  )}

                  {/* Grade-Level Classes */}
                  {classes.filter(cls => cls.class_type === 'Grade-Level Class').length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Grade-Level Classes ({classes.filter(cls => cls.class_type === 'Grade-Level Class').length})
                      </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {classes.filter(cls => cls.class_type === 'Grade-Level Class').map((cls) => (
                                  <div 
                                    key={`gradelevel-${cls.id}`} 
                                    className="bg-green-50 border border-green-200 p-3 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-colors"
                                    onClick={() => handleClassClick(cls)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="text-xs font-medium text-green-900">{cls.name}</h5>
                                        <p className="text-xs text-green-700">{cls.stream_name}</p>
                                        <p className="text-xs text-green-600 mt-1">Stage: {cls.stream_stage}</p>
                                        {cls.capacity && (
                                          <p className="text-xs text-green-500 mt-1">Capacity: {cls.capacity}</p>
                                        )}
                                      </div>
                                      <div className="ml-2">
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                          Homeroom
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <a
                    key={action.name}
                    href={action.href}
                    className="group relative bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <span className={`rounded-lg inline-flex p-2 ${action.color} text-white`}>
                        <action.icon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {action.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.type === 'payslip' ? 'bg-green-500' :
                              activity.type === 'announcement' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}>
                              {activity.type === 'payslip' ? (
                                <CreditCard className="h-3 w-3 text-white" />
                              ) : activity.type === 'announcement' ? (
                                <Bell className="h-3 w-3 text-white" />
                              ) : (
                                <User className="h-3 w-3 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs text-gray-900">
                                {activity.title}
                              </p>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
