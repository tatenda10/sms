import { Users, BookOpen, BarChart3, Home, Truck, CreditCard, Calculator, ShoppingCart, Package, FileText, Settings, HelpCircle, DollarSign, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Navigation tabs configuration with descriptions
  const navigationTabs = [
    { 
      name: 'Students', 
      icon: Users, 
      href: '/dashboard/students',
      description: 'Manage student profiles, registrations, and personal information'
    },
    { 
      name: 'Classes', 
      icon: BookOpen, 
      href: '/dashboard/classes',
      description: 'Create and manage classes, subjects, and academic schedules'
    },
    { 
      name: 'Results', 
      icon: BarChart3, 
      href: '/dashboard/results',
      description: 'Enter, view, and analyze student academic performance and grades'
    },
    { 
      name: 'Boarding', 
      icon: Home, 
      href: '/dashboard/boarding',
      description: 'Manage hostel facilities, room assignments, and boarding enrollments'
    },
    { 
      name: 'Transport', 
      icon: Truck, 
      href: '/dashboard/transport',
      description: 'Manage transport routes, student registrations, and weekly fee payments'
    },
    { 
      name: 'Announcements', 
      icon: Megaphone, 
      href: '/dashboard/announcements',
      description: 'Create and manage announcements for students and employees'
    },
    { 
      name: 'Student Billing', 
      icon: CreditCard, 
      href: '/dashboard/fees-payment',
      description: 'Generate invoices, process payments, and manage fee structures'
    },
    { 
      name: 'Accounting', 
      icon: Calculator, 
      href: '/dashboard/accounting/chart-of-accounts',
      description: 'Track financial transactions, manage accounts, and generate reports'
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
      description: 'Create payslips and process employee payroll'
    },
    { 
      name: 'Inventory', 
      icon: Package, 
      href: '/dashboard/inventory',
      description: 'Track school supplies, equipment, and inventory management'
    },
    { 
      name: 'Financial Reports', 
      icon: FileText, 
      href: '/dashboard/reports/income-statement',
      description: 'Generate comprehensive financial reports and analytics'
    },
    { 
      name: 'Admin', 
      icon: Settings, 
      href: '/dashboard/settings',
      description: 'System administration, user management, and configuration settings'
    },
    // { 
    //   name: 'Help & Tutorials', 
    //   icon: HelpCircle, 
    //   href: '/dashboard/help',
    //   description: 'Access user guides, tutorials, and support documentation'
    // },
  ];

  const handleTabClick = (href) => {
    navigate(href);
    };

    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Welcome to UbuntuLearn</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {navigationTabs.map((tab) => (
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
