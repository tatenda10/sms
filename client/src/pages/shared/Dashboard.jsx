import { Users, BookOpen, BarChart3, Home, Truck, CreditCard, Calculator, ShoppingCart, Package, FileText, Settings, HelpCircle, DollarSign, Megaphone, Calendar, Trophy, PieChart, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation tabs configuration with descriptions and required roles
  const navigationTabs = [
    { 
      name: 'Students', 
      icon: Users, 
      href: '/dashboard/students',
      description: 'Manage student profiles, registrations, and personal information',
      requiredRoles: ['admin', 'STUDENT_REGISTRATIONS']
    },
    { 
      name: 'Classes', 
      icon: BookOpen, 
      href: '/dashboard/classes',
      description: 'Create and manage classes, subjects, and academic schedules',
      requiredRoles: ['admin', 'CLASS_MANAGEMENT']
    },
    // { 
    //   name: 'Timetables', 
    //   icon: Calendar, 
    //   href: '/dashboard/timetables',
    //   description: 'Create and manage school timetables with day-specific periods',
    //   requiredRoles: ['admin', 'CLASS_MANAGEMENT']
    // },
    { 
      name: 'Results', 
      icon: BarChart3, 
      href: '/dashboard/results',
      description: 'Enter, view, and analyze student academic performance and grades',
      requiredRoles: ['admin', 'VIEW_RESULTS', 'ADD_RESULTS', 'EDIT_RESULTS', 'ADD_GRADES', 'EDIT_GRADES']
    },
    { 
      name: 'Boarding', 
      icon: Home, 
      href: '/dashboard/boarding',
      description: 'Manage hostel facilities, room assignments, and boarding enrollments',
      requiredRoles: ['admin', 'BOARDING_MANAGEMENT', 'BOARDING_VIEW']
    },
    { 
      name: 'Transport', 
      icon: Truck, 
      href: '/dashboard/transport/routes',
      description: 'Manage transport routes, student registrations, and weekly fee payments',
      requiredRoles: ['admin', 'TRANSPORT_MANAGEMENT']
    },
    { 
      name: 'Announcements', 
      icon: Megaphone, 
      href: '/dashboard/announcements',
      description: 'Create and manage announcements for students and employees',
      requiredRoles: ['admin', 'user'] // Basic access for announcements
    },
    { 
      name: 'Sports', 
      icon: Trophy, 
      href: '/dashboard/sports',
      description: 'Manage sports fixtures, teams, and sports announcements',
      requiredRoles: ['admin', 'teacher', 'user'] // Basic access for sports
    },
    { 
      name: 'Student Billing', 
      icon: CreditCard, 
      href: '/dashboard/fees-payment',
      description: 'Generate invoices, process payments, and manage fee structures',
      requiredRoles: ['admin', 'STUDENT_BILLING', 'INVOICE_CREATE', 'INVOICE_VIEW', 'INVOICE_UPDATE', 'INVOICE_DELETE']
    },
    { 
      name: 'Accounting', 
      icon: Calculator, 
      href: '/dashboard/accounting/chart-of-accounts',
      description: 'Track financial transactions, manage accounts, and generate reports',
      requiredRoles: ['admin', 'ACCOUNTING_MANAGEMENT']
    },
    { 
      name: 'Expenses', 
      icon: ShoppingCart, 
      href: '/dashboard/expenses/expenses',
      description: 'Record expenses, manage suppliers, and track accounts payable',
      requiredRoles: ['admin', 'ACCOUNTING_MANAGEMENT', 'EXPENSE_MANAGEMENT']
    },
    // { 
    //   name: 'Procurement', 
    //   icon: ShoppingCart, 
    //   href: '/dashboard/procurement',
    //   description: 'Manage purchasing, suppliers, and procurement processes'
    // },
    { 
      name: 'Payroll', 
      icon: DollarSign, 
      href: '/dashboard/payroll',
      description: 'Create payslips and process employee payroll',
      requiredRoles: ['admin'] // Only admin for now
    },
    { 
      name: 'Inventory', 
      icon: Package, 
      href: '/dashboard/inventory',
      description: 'Track school supplies, equipment, and inventory management',
      requiredRoles: ['admin'] // Only admin for now
    },
    { 
      name: 'Fixed Assets', 
      icon: Warehouse, 
      href: '/dashboard/assets',
      description: 'Manage school property, vehicles, land, buildings, and equipment',
      requiredRoles: ['admin', 'ACCOUNTING_MANAGEMENT']
    },
    { 
      name: 'Financial Reports', 
      icon: FileText, 
      href: '/dashboard/reports/income-statement',
      description: 'Generate comprehensive financial reports and analytics',
      requiredRoles: ['admin', 'ACCOUNTING_MANAGEMENT']
    },
    { 
      name: 'Analytics', 
      icon: PieChart, 
      href: '/dashboard/analytics/expense-analysis',
      description: 'Interactive analytics and data visualization for insights',
      requiredRoles: ['admin', 'ACCOUNTING_MANAGEMENT']
    },
    { 
      name: 'Admin', 
      icon: Settings, 
      href: '/dashboard/settings',
      description: 'System administration, user management, and configuration settings',
      requiredRoles: ['admin']
    },
    // { 
    //   name: 'Help & Tutorials', 
    //   icon: HelpCircle, 
    //   href: '/dashboard/help',
    //   description: 'Access user guides, tutorials, and support documentation'
    // },
  ];

  // Function to check if user has required roles for a tab
  const hasRequiredRole = (requiredRoles) => {
    if (!user || !user.roles) return false;
    
    // Admin has access to everything
    if (user.roles.includes('admin')) return true;
    
    // Check if user has any of the required roles
    return requiredRoles.some(role => user.roles.includes(role));
  };

  // Filter navigation tabs based on user roles
  const filteredNavigationTabs = navigationTabs.filter(tab => hasRequiredRole(tab.requiredRoles));

  // Debug logging
  console.log('🔍 User roles:', user?.roles);
  console.log('🔍 Filtered tabs:', filteredNavigationTabs.map(tab => tab.name));

  const handleTabClick = (href) => {
    navigate(href);
    };

    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Welcome to Brooklyn</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredNavigationTabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.href)}
              className="group relative flex flex-col items-center p-4 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg hover:scale-105 min-h-[120px]"
            >
              <div className="flex items-center justify-center w-8 h-8 mb-3 bg-gray-200 rounded-full">
                <tab.icon className="h-4 w-4 text-gray-600" />
        </div>
              <span className="text-sm font-semibold text-center mb-1">{tab.name}</span>
              <span className="text-xs text-gray-600 text-center leading-tight">{tab.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
