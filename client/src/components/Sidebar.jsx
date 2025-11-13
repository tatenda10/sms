import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faUserGraduate, 
  faUsers,
  faBuilding,
  faChalkboardTeacher, 
  faSchool, 
  faBook, 
  faCalendarCheck, 
  faFileAlt, 
  faChartBar, 
  faChartPie,
  faCreditCard, 
  faBus, 
  faBookOpen, 
  faChartLine, 
  faCog,
  faSignOutAlt,
  faMoneyBillWave,
  faGraduationCap,
  faEdit,
  faEye,
  faClipboardList,
  faBed,
  faList,
  faReceipt,
  faFileInvoiceDollar,
  faArrowLeft,
  faHome,
  faCalendarAlt,
  faLock,
  faBalanceScale,
  faShoppingCart,
  faCalculator,
  faPlus,
  faRoute,
  faBullhorn,
  faDollarSign,
  faTrophy,
  faTag,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ open, setOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();

  // Main navigation sections
  const mainSections = [
    { name: 'Dashboard', href: '/dashboard', icon: faHome },
    { name: 'Students', href: '/dashboard/students', icon: faUserGraduate },
    { name: 'Classes', href: '/dashboard/classes', icon: faSchool },
    { name: 'Timetables', href: '/dashboard/timetables', icon: faCalendarAlt },
    { name: 'Results', href: '/dashboard/results', icon: faChartBar },
    { name: 'Boarding', href: '/dashboard/boarding', icon: faBed },
    { name: 'Transport', href: '/dashboard/transport/routes', icon: faRoute },
    { name: 'Sports', href: '/dashboard/sports', icon: faTrophy },
    { name: 'Student Billing', href: '/dashboard/fees-payment', icon: faCreditCard },
    { name: 'Accounting', href: '/dashboard/accounting/chart-of-accounts', icon: faMoneyBillWave },
    { name: 'Expenses', href: '/dashboard/expenses/expenses', icon: faShoppingCart },
    { name: 'Procurement', href: '/dashboard/procurement', icon: faList },
    { name: 'Payroll', href: '/dashboard/payroll', icon: faCalculator },
    { name: 'Inventory', href: '/dashboard/inventory', icon: faFileAlt },
    { name: 'Fixed Assets', href: '/dashboard/assets', icon: faWarehouse },
    { name: 'Financial Reports', href: '/dashboard/reports/income-statement', icon: faChartLine },
    { name: 'Analytics', href: '/dashboard/analytics/expense-analysis', icon: faChartPie },
    { name: 'Admin', href: '/dashboard/admin', icon: faCog },
    { name: 'Help & Tutorials', href: '/dashboard/help', icon: faFileAlt },
  ];

  // Section-specific navigation using existing items
  const sectionNavigation = {
    students: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Students', href: '/dashboard/students', icon: faUserGraduate },
      { name: 'Add Student', href: '/dashboard/students/add', icon: faUserGraduate },
    ],
    classes: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Classes', href: '/dashboard/classes', icon: faSchool },
      { name: 'Class Term Year', href: '/dashboard/classes/class-term-year', icon: faCalendarCheck },
      { name: 'Add Gradelevel Class', href: '/dashboard/classes/gradelevel-classes/add', icon: faSchool },
      { name: 'Class Configurations', href: '/dashboard/classes/configurations', icon: faCog },
      { name: 'Close to Term', href: '/dashboard/classes/close-to-term', icon: faCalendarAlt },
    ],
    timetables: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Timetables', href: '/dashboard/timetables', icon: faCalendarAlt },
      { name: 'Test Timetable', href: '/dashboard/timetables/test', icon: faCalendarCheck },
    ],
    results: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Results', href: '/dashboard/results', icon: faChartBar },
      { name: 'Grading Criteria', href: '/dashboard/results/grading', icon: faGraduationCap },
    ],
    boarding: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Boarding', href: '/dashboard/boarding', icon: faBed },
    ],

    billing: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Record Payment', href: '/dashboard/fees-payment', icon: faCreditCard },
      { name: 'Boarding Fee Payments', href: '/dashboard/all-payments', icon: faList },
      { name: 'Outstanding Balances', href: '/dashboard/students/balances', icon: faMoneyBillWave },
      { name: 'Student Opening Balances', href: '/dashboard/students/manual-balance-update', icon: faEdit },
      { name: 'Additional Fees', href: '/dashboard/billing/additional-fees', icon: faDollarSign },
      { name: 'Waivers', href: '/dashboard/waivers', icon: faTag },
      { name: 'Invoice Structures', href: '/dashboard/invoice-structures', icon: faFileAlt },
      { name: 'Student Financial Record', href: '/dashboard/financial-records', icon: faFileInvoiceDollar },
    ],
    accounting: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Chart of Accounts', href: '/dashboard/accounting/chart-of-accounts', icon: faFileAlt },
      { name: 'General Ledger', href: '/dashboard/accounting/general-ledger', icon: faBook },
      { name: 'Cash & Bank', href: '/dashboard/accounting/cash-bank', icon: faDollarSign },
      { name: 'Bank Reconciliation', href: '/dashboard/accounting/bank-reconciliation', icon: faCreditCard },
      { name: 'Accounting Periods', href: '/dashboard/accounting/periods', icon: faCalendarAlt },
      { name: 'Period Management', href: '/dashboard/accounting/period-closing', icon: faLock },
    ],
    expenses: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Expenses', href: '/dashboard/expenses/expenses', icon: faFileAlt },
      { name: 'Add Expense', href: '/dashboard/expenses/expenses/add', icon: faPlus },
      { name: 'Accounts Payable', href: '/dashboard/expenses/accounts-payable', icon: faMoneyBillWave },
      { name: 'Suppliers', href: '/dashboard/expenses/suppliers', icon: faUsers },
    ],
    procurement: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Procurement Dashboard', href: '/dashboard/procurement', icon: faList },
      { name: 'Purchase Requests', href: '/dashboard/procurement/purchase-requests', icon: faClipboardList },
      { name: 'Suppliers', href: '/dashboard/procurement/suppliers', icon: faShoppingCart },
      { name: 'Purchase Orders', href: '/dashboard/procurement/purchase-orders', icon: faFileInvoiceDollar },
    ],
    payroll: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Payroll Dashboard', href: '/dashboard/payroll', icon: faCalculator },
      { name: 'Create Payslip', href: '/dashboard/payroll/create', icon: faPlus },
      { name: 'View Payslips', href: '/dashboard/payroll/payslips', icon: faFileInvoiceDollar },
    ],
    transport: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Manage Routes', href: '/dashboard/transport/routes', icon: faRoute },
      { name: 'Student Registration', href: '/dashboard/transport/registrations', icon: faUserGraduate },
      { name: 'Transport Payments', href: '/dashboard/transport/payments', icon: faCreditCard },
    ],
    sports: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Sports', href: '/dashboard/sports', icon: faTrophy },
    ],
    inventory: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Inventory', href: '/dashboard/inventory', icon: faFileAlt },
      { name: 'Add Item', href: '/dashboard/inventory/add-item', icon: faPlus },
      { name: 'Issue Uniform', href: '/dashboard/inventory/issue-uniform', icon: faUserGraduate },
      { name: 'Configurations', href: '/dashboard/inventory/configurations', icon: faCog },
    ],
    assets: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Fixed Assets', href: '/dashboard/assets', icon: faWarehouse },
      { name: 'Add Asset', href: '/dashboard/assets/add', icon: faPlus },
      { name: 'Configurations', href: '/dashboard/assets/configurations', icon: faCog },
    ],
    announcements: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Announcements', href: '/dashboard/announcements', icon: faBullhorn },
      { name: 'Add Announcement', href: '/dashboard/announcements/add', icon: faPlus },
    ],
    reports: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Trial Balance', href: '/dashboard/accounting/trial-balance', icon: faBalanceScale },
      { name: 'Income Statement', href: '/dashboard/reports/income-statement', icon: faChartLine },
      { name: 'Balance Sheet', href: '/dashboard/reports/balance-sheet', icon: faBalanceScale },
      { name: 'Cash Flow Statement', href: '/dashboard/reports/cash-flow', icon: faMoneyBillWave },
    ],
    analytics: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Expense Analysis', href: '/dashboard/analytics/expense-analysis', icon: faChartPie },
      { name: 'Revenue Analysis', href: '/dashboard/analytics/revenue-analysis', icon: faChartLine },
      { name: 'Student Financial Analytics', href: '/dashboard/analytics/student-financial-analytics', icon: faUsers },
      { name: 'Student Results Analytics', href: '/dashboard/analytics/student-results-analytics', icon: faGraduationCap },
    ],
    admin: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Employees', href: '/dashboard/employees', icon: faUsers },
      { name: 'Add Employee', href: '/dashboard/employees/add', icon: faUsers },
      { name: 'Configurations', href: '/dashboard/configurations', icon: faBuilding },
      { name: 'Settings', href: '/dashboard/settings', icon: faCog },
    ],
    help: [
      { name: 'Home', href: '/dashboard', icon: faHome },
      { name: 'Help & Tutorials', href: '/dashboard/help', icon: faFileAlt },
    ],
  };

  // Determine current section based on pathname
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') return 'dashboard';
    
    const section = path.split('/')[2]; // /dashboard/students -> students
    return section || 'dashboard';
  };

  const currentSection = getCurrentSection();
  
  // Get navigation items to display
  const getNavigationItems = () => {
    // If we're on the main dashboard, show main sections
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      return mainSections;
    }
    
    // Check if we're in a specific section - use explicit priority order
    let sectionKey = null;
    
    // Check reports section first (for financial reports)
    if (location.pathname.startsWith('/dashboard/reports') ||
        location.pathname.startsWith('/dashboard/accounting/trial-balance')) {
      sectionKey = 'reports';
    }
    // Check billing section (highest priority for student balance routes)
    else if (location.pathname.startsWith('/dashboard/fees') || 
        location.pathname.startsWith('/dashboard/invoice') ||
        location.pathname.startsWith('/dashboard/financial') ||
        location.pathname.startsWith('/dashboard/all-payments') ||
        location.pathname.startsWith('/dashboard/students/balances') ||
        location.pathname.startsWith('/dashboard/students/manual-balance-update') ||
        location.pathname.startsWith('/dashboard/billing') ||
        location.pathname.startsWith('/dashboard/waivers')) {
      sectionKey = 'billing';
    }
    // Check accounting section
    else if (location.pathname.startsWith('/dashboard/accounting')) {
      sectionKey = 'accounting';
    }
    // Check expenses section
    else if (location.pathname.startsWith('/dashboard/expenses')) {
      sectionKey = 'expenses';
    }
    // Check assets section
    else if (location.pathname.startsWith('/dashboard/assets')) {
      sectionKey = 'assets';
    }
    // Check admin section
    else if (location.pathname.startsWith('/dashboard/settings') || 
             location.pathname.startsWith('/dashboard/configurations') ||
             location.pathname.startsWith('/dashboard/employees')) {
      sectionKey = 'admin';
    }
    // Check other sections
    else {
      sectionKey = Object.keys(sectionNavigation).find(key => {
        return location.pathname.startsWith(`/dashboard/${key}`);
      });
    }
    
    if (sectionKey && sectionNavigation[sectionKey]) {
      return sectionNavigation[sectionKey];
    }
    
    // Fallback to main sections
    return mainSections;
  };

  const navigationItems = getNavigationItems();

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
            <FontAwesomeIcon icon={item.icon} className="text-sm" />
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
                   <div className="h-5 w-5 rounded-lg bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">U</span>
                   </div>
                  <h1 className="text-sm font-bold text-gray-900">Brooklyn</h1>
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
                      {navigationItems.map(renderNavItem)}
                     </ul>
                   </li>
                   <li className="mt-auto">
                     <button
                       onClick={logout}
                       className="flex w-full items-center gap-x-3 rounded-md p-2 text-xs leading-5 font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 border-t border-gray-200/50"
                     >
                       <div className="h-5 w-5 shrink-0 text-gray-600 flex items-center justify-center">
                         <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
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
              <div className="h-5 w-5 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <h1 className="text-sm font-bold text-gray-900">Brooklyn</h1>
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map(renderNavItem)}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-x-3 rounded-md p-2 text-xs leading-5 font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 border-t border-gray-200/50"
                >
                  <div className="h-5 w-5 shrink-0 text-gray-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
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
