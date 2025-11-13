import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/shared/Dashboard';
import NotFound from './pages/shared/NotFound';
import Students from './pages/students_registrations/Students';
import AddStudent from './pages/students_registrations/AddStudent';
import EditStudent from './pages/students_registrations/EditStudent';
import ViewStudent from './pages/students_registrations/ViewStudent';
import ManualBalanceUpdate from './pages/students/ManualBalanceUpdate';
import Settings from './pages/settings/Settings';
import Employees from './pages/employees/Employees';
import AddEmployee from './pages/employees/AddEmployee';
import ViewEmployee from './pages/employees/ViewEmployee';
import EditEmployee from './pages/employees/EditEmployee';
import Configurations from './pages/configurations/Configurations';
import Classes from './pages/classes/Classes';
import AddGradelevelClass from './pages/classes/gradelevel/AddGradelevelClass';
import EditGradelevelClass from './pages/classes/gradelevel/EditGradelevelClass';
import ViewGradelevelClass from './pages/classes/gradelevel/ViewGradelevelClass';
import CloseToTerm from './pages/classes/CloseToTerm';
import StudentsTab from './pages/classes/gradelevel/StudentsTab';
import ViewSubjectClass from './pages/classes/subject/ViewSubjectClass';
import SubjectClassesTab from './pages/classes/subject/SubjectClassesTab';
import ChartOfAccounts from './pages/accounting/chart_of_accounts/ChartOfAccounts';
import ViewCOA from './pages/accounting/chart_of_accounts/ViewCOA';
import CashBank from './pages/accounting/CashBank';
import TrialBalance from './pages/accounting/TrialBalance';
import Suppliers from './pages/expenses/Suppliers';
import Expenses from './pages/expenses/Expenses';
import AddExpense from './pages/expenses/AddExpense';
import EditExpense from './pages/expenses/EditExpense';
import AccountsPayable from './pages/expenses/AccountsPayable';
// Results Management Pages
import Results from './pages/results/Results';
import GradingCriteria from './pages/results/GradingCriteria';
import ResultsEntry from './pages/results/ResultsEntry';
import ResultsView from './pages/results/ResultsView';
import StudentResults from './pages/results/StudentResults';
import CourseworkEntry from './pages/results/CourseworkEntry';
import Boarding from './pages/boarding/Boarding';
import ViewHostel from './pages/boarding/ViewHostel';
import Enrollments from './pages/boarding/Enrollments';
import FeesPayment from './pages/fees/FeesPayment';
import AllPayments from './pages/fees/AllPayments';
import InvoiceStructures from './pages/fees/InvoiceStructures';
import ClassTermYear from './pages/classes/ClassTermYear';
import ClassConfigurations from './pages/classes/ClassConfigurations';
import StudentStatement from './pages/students/StudentStatement';
import StudentBalances from './pages/students/StudentBalances';
import UnifiedFeePayment from './pages/fees/UnifiedFeePayment';
import StudentFinancialRecord from './pages/fees/StudentFinancialRecord';
import GeneralLedger from './pages/accounting/GeneralLedger';
import BankReconciliation from './pages/accounting/BankReconciliation';
import PeriodEndClosing from './pages/accounting/PeriodEndClosing';
import AccountingPeriods from './pages/accounting/AccountingPeriods';
import IncomeStatement from './pages/reports/IncomeStatement';
import BalanceSheet from './pages/reports/BalanceSheet';
import CashFlow from './pages/reports/CashFlow';
import ExpenseAnalysis from './pages/reports/ExpenseAnalysis';
import RevenueAnalysis from './pages/reports/RevenueAnalysis';
import StudentFinancialAnalytics from './pages/reports/StudentFinancialAnalytics';
import StudentResultsAnalytics from './pages/reports/StudentResultsAnalytics';
// Procurement Pages
import Procurement from './pages/procurement/Procurement';
import PurchaseRequests from './pages/procurement/PurchaseRequests';
import ProcurementSuppliers from './pages/procurement/Suppliers';
import PurchaseOrders from './pages/procurement/PurchaseOrders';
// Payroll Pages
import Payroll from './pages/payroll/Payroll';
import Payslips from './pages/payroll/Payslips';
import CreatePayslip from './pages/payroll/CreatePayslip';

// Transport Pages
import TransportSimplified from './pages/transport/TransportSimplified';
import ManageRoutes from './pages/transport/ManageRoutes';
import StudentRegistration from './pages/transport/StudentRegistration';
import WeeklyFees from './pages/transport/WeeklyFees';
import WeeklySchedule from './pages/transport/WeeklySchedule';
import TransportPayments from './pages/transport/TransportPayments';
import AddStudentRegistration from './pages/transport/AddStudentRegistration';

// Inventory Pages
import Inventory from './pages/inventory/Inventory';
import AddItem from './pages/inventory/AddItem';
import IssueUniform from './pages/inventory/IssueUniform';
import InventoryConfigurations from './pages/inventory/Configurations';
import Announcements from './pages/Announcements';
import AddAnnouncement from './pages/AddAnnouncement';
import EditAnnouncement from './pages/EditAnnouncement';
import AdditionalFees from './pages/billing/AdditionalFees';
import Waivers from './pages/waivers/Waivers';
import Timetables from './pages/timetables/Timetables';
import TemplateView from './pages/timetables/TemplateView';
import TemplateEdit from './pages/timetables/TemplateEdit';
import TestTimetable from './pages/timetables/TestTimetable';
import Sports from './pages/sports/Sports';

// Fixed Assets Pages
import FixedAssets from './pages/assets/FixedAssets';
import AddAsset from './pages/assets/AddAsset';
import AssetDetails from './pages/assets/AssetDetails';
import AssetTypesConfig from './pages/assets/AssetTypesConfig';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Protected Route Component - must be inside AuthProvider scope
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      <Route path="/dashboard" element={
        isAuthenticated ? <Layout /> : <Navigate to="/" replace />
      }>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/edit/:id" element={<EditStudent />} />
        <Route path="students/view/:id" element={<ViewStudent />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/add" element={<AddEmployee />} />
        <Route path="employees/edit/:id" element={<EditEmployee />} />
        <Route path="employees/view/:id" element={<ViewEmployee />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/gradelevel-classes/add" element={<AddGradelevelClass />} />
        <Route path="classes/gradelevel-classes/edit/:id" element={<EditGradelevelClass />} />
        <Route path="classes/gradelevel-classes/view/:id" element={<ViewGradelevelClass />} />
        <Route path="classes/subject-classes/view/:id" element={<ViewSubjectClass />} />
        <Route path="classes/class-term-year" element={<ClassTermYear />} />
        <Route path="classes/configurations" element={<ClassConfigurations />} />
        <Route path="classes/close-to-term" element={<CloseToTerm />} />
        <Route path="configurations" element={<Configurations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="accounting/chart-of-accounts/view/:id" element={<ViewCOA />} />
        <Route path="accounting/cash-bank" element={<CashBank />} />
        <Route path="accounting/general-ledger" element={<GeneralLedger />} />
        <Route path="accounting/trial-balance" element={<TrialBalance />} />
        <Route path="accounting/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="accounting/periods" element={<AccountingPeriods />} />
        <Route path="accounting/period-closing" element={<PeriodEndClosing />} />
        <Route path="expenses/suppliers" element={<Suppliers />} />
        <Route path="expenses/expenses" element={<Expenses />} />
        <Route path="expenses/expenses/add" element={<AddExpense />} />
        <Route path="expenses/expenses/edit/:id" element={<EditExpense />} />
        <Route path="expenses/accounts-payable" element={<AccountsPayable />} />
        {/* Results Management Routes */}
        <Route path="results" element={<Results />} />
        <Route path="results/grading" element={<GradingCriteria />} />
        <Route path="results/entry/:classId" element={<ResultsEntry />} />
        <Route path="results/view/:classId" element={<ResultsView />} />
        <Route path="results/student/:classId/:studentId" element={<StudentResults />} />
        <Route path="results/coursework" element={<CourseworkEntry />} />
        {/* Boarding Management Routes */}
        <Route path="boarding" element={<Boarding />} />
        <Route path="boarding/hostel/:id" element={<ViewHostel />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="fees-payment" element={<FeesPayment />} />
        <Route path="all-payments" element={<AllPayments />} />
        <Route path="invoice-structures" element={<InvoiceStructures />} />
        <Route path="students/statement" element={<StudentStatement />} />
        <Route path="students/balances" element={<StudentBalances />} />
        <Route path="students/manual-balance-update" element={<ManualBalanceUpdate />} />
        <Route path="fees/unified-payment" element={<UnifiedFeePayment />} />
        <Route path="financial-records" element={<StudentFinancialRecord />} />
        <Route path="waivers" element={<Waivers />} />
        
        {/* Fixed Assets Routes */}
        <Route path="assets" element={<FixedAssets />} />
        <Route path="assets/add" element={<AddAsset />} />
        <Route path="assets/configurations" element={<AssetTypesConfig />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        
        {/* Reports Routes */}
        <Route path="reports/income-statement" element={<IncomeStatement />} />
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/cash-flow" element={<CashFlow />} />
        
        {/* Analytics Routes */}
        <Route path="analytics/expense-analysis" element={<ExpenseAnalysis />} />
        <Route path="analytics/revenue-analysis" element={<RevenueAnalysis />} />
        <Route path="analytics/student-financial-analytics" element={<StudentFinancialAnalytics />} />
        <Route path="analytics/student-results-analytics" element={<StudentResultsAnalytics />} />
        
        {/* Procurement Routes */}
        <Route path="procurement" element={<Procurement />} />
        <Route path="procurement/purchase-requests" element={<PurchaseRequests />} />
        <Route path="procurement/suppliers" element={<ProcurementSuppliers />} />
        <Route path="procurement/purchase-orders" element={<PurchaseOrders />} />
        
        {/* Payroll Routes */}
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/create" element={<CreatePayslip />} />
        <Route path="payroll/payslips" element={<Payslips />} />
        
        {/* Transport Routes */}
        <Route path="transport" element={<Navigate to="/dashboard/transport/routes" replace />} />
        <Route path="transport/routes" element={<ManageRoutes />} />
        <Route path="transport/registrations" element={<StudentRegistration />} />
        <Route path="transport/registrations/add" element={<AddStudentRegistration />} />
        <Route path="transport/fees" element={<WeeklyFees />} />
        <Route path="transport/schedule" element={<WeeklySchedule />} />
        <Route path="transport/payments" element={<TransportPayments />} />
        
        {/* Inventory Routes */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/add-item" element={<AddItem />} />
        <Route path="inventory/issue-uniform" element={<IssueUniform />} />
        <Route path="inventory/configurations" element={<InventoryConfigurations />} />
        
        {/* Announcements Routes */}
        <Route path="announcements" element={<Announcements />} />
        <Route path="announcements/add" element={<AddAnnouncement />} />
        <Route path="announcements/edit/:id" element={<EditAnnouncement />} />
        
        {/* Additional Fees Routes */}
        <Route path="billing/additional-fees" element={<AdditionalFees />} />
        
        {/* Timetable Routes */}
        <Route path="timetables" element={<Timetables />} />
        <Route path="timetables/template/:id" element={<TemplateView />} />
        <Route path="timetables/template/:id/edit" element={<TemplateEdit />} />
        <Route path="timetables/test" element={<TestTimetable />} />
        
        {/* Sports Routes */}
        <Route path="sports" element={<Sports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
