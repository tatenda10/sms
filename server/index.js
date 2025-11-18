const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/users/auth');
const userRoutes = require('./routes/users/users');
const managementRoutes = require('./routes/users/management');
const auditRoutes = require('./routes/audit/audit');
const studentRoutes = require('./routes/students_registrations/students');
const classRoutes = require('./routes/classes/index');
const employeeRoutes = require('./routes/employees/employees');
const employeeAuthRoutes = require('./routes/employees/employeeAuth');
const employeeClassRoutes = require('./routes/employees/employeeClasses');
const studentAuthRoutes = require('./routes/students/studentAuth');
const configurationRoutes = require('./routes/employees/configurations');
const accountingRoutes = require('./routes/accounting/index');
const generalLedgerRoutes = require('./routes/accounting/generalLedger');
const cashBankRoutes = require('./routes/accounting/cashBank');
const trialBalanceRoutes = require('./routes/accounting/trialBalance');
const periodClosingRoutes = require('./routes/accounting/periodClosing');
const savedReportsRoutes = require('./routes/accounting/savedReports');
const expensesRoutes = require('./routes/expenses/index');
const resultsRoutes = require('./routes/results/index');
const boardingRoutes = require('./routes/boarding/index');
const feesRoutes = require('./routes/fees');
const studentBalanceRoutes = require('./routes/students/balance');
const studentTransactionRoutes = require('./routes/students/transactions');
const studentFinancialRecordRoutes = require('./routes/students/financialRecords');
const feePaymentRoutes = require('./routes/fees/payments');
const payrollRoutes = require('./routes/payroll/index');
const employeePayrollRoutes = require('./routes/payroll/employeePayslips');
const transportRoutes = require('./routes/transport/index');
const inventoryRoutes = require('./routes/inventory/index');
const announcementsRoutes = require('./routes/announcements');
const employeeAnnouncementsRoutes = require('./routes/announcements/employeeAnnouncements');
const employeeGradelevelEnrollmentsRoutes = require('./routes/employees/employeeGradelevelEnrollments');
const employeeStudentsRoutes = require('./routes/employees/employeeStudents');
const employeeResultsRoutes = require('./routes/employees/employeeResults');
const employeeResultsEntryRoutes = require('./routes/employees/employeeResultsEntry');
const employeeGradingRoutes = require('./routes/employees/employeeGrading');
const employeeTestMarksRoutes = require('./routes/employees/employeeTestMarks');
const employeeTestsRoutes = require('./routes/employees/employeeTests');
const employeeSubjectEnrollmentsRoutes = require('./routes/employees/employeeSubjectEnrollments');
const closeToTermRoutes = require('./routes/classes/closeToTerm');
const additionalFeesRoutes = require('./routes/fees/additionalFees');
const studentFinancialRoutes = require('./routes/students/studentFinancial');
const studentResultsRoutes = require('./routes/students/studentResults');
const studentEnrollmentRoutes = require('./routes/students/studentEnrollments');
const studentAnnouncementRoutes = require('./routes/students/studentAnnouncements');
const studentAttendanceRoutes = require('./routes/students/studentAttendance');
const employeeAttendanceRoutes = require('./routes/attendance/employeeAttendance');
const adminAttendanceRoutes = require('./routes/attendance/adminAttendance');
const timetableRoutes = require('./routes/timetable/timetable');
const timetableGenerationRoutes = require('./routes/timetable/timetableGeneration');
const sportsRoutes = require('./routes/sports/index');
const studentSportsRoutes = require('./routes/students/sports');
const analyticsRoutes = require('./routes/analytics/index');
const waiversRoutes = require('./routes/waivers/waivers');
const assetTypesRoutes = require('./routes/assets/assetTypes');
const fixedAssetsRoutes = require('./routes/assets/fixedAssets');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (required for cPanel hosting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
 
// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware 
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});




// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);
app.use('/api/employee-classes', employeeClassRoutes);
app.use('/api/student-auth', studentAuthRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/accounting/general-ledger', generalLedgerRoutes);
app.use('/api/accounting/cash-bank', cashBankRoutes);
app.use('/api/accounting/trial-balance', trialBalanceRoutes);
app.use('/api/accounting/period-closing', periodClosingRoutes);
app.use('/api/accounting/saved-reports', savedReportsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/student-balances', studentBalanceRoutes);
app.use('/api/transactions', studentTransactionRoutes);
app.use('/api/student-financial-records', studentFinancialRecordRoutes);
app.use('/api/fees/payments', feePaymentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/employee-payroll', employeePayrollRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/employee-announcements', employeeAnnouncementsRoutes);
app.use('/api/employee-gradelevel-enrollments', employeeGradelevelEnrollmentsRoutes);
app.use('/api/employee-students', employeeStudentsRoutes);
app.use('/api/employee-results', employeeResultsRoutes);
app.use('/api/employee-results-entry', employeeResultsEntryRoutes);
app.use('/api/employee-grading', employeeGradingRoutes);
app.use('/api/employee-test-marks', employeeTestMarksRoutes);
app.use('/api/employee-tests', employeeTestsRoutes);
app.use('/api/employee-subject-enrollments', employeeSubjectEnrollmentsRoutes);
app.use('/api/close-to-term', closeToTermRoutes);
app.use('/api/additional-fees', additionalFeesRoutes);
app.use('/api/student-financial', studentFinancialRoutes);
app.use('/api/student-results', studentResultsRoutes);
app.use('/api/student-enrollments', studentEnrollmentRoutes);
app.use('/api/student-announcements', studentAnnouncementRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/student-sports', studentSportsRoutes);
app.use('/api/employee-attendance', employeeAttendanceRoutes);
app.use('/api/attendance', adminAttendanceRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/timetable-generation', timetableGenerationRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/waivers', waiversRoutes);
app.use('/api/assets/types', assetTypesRoutes);
app.use('/api/assets', fixedAssetsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Auto-generate accounting periods for current year
    const PeriodController = require('./controllers/accounting/periodController');
    await PeriodController.autoGenerateCurrentYearPeriods();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation:`);
  console.log(`  - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`  - Users: http://localhost:${PORT}/api/users`);
  console.log(`  - Management: http://localhost:${PORT}/api/management`);
  console.log(`  - Audit: http://localhost:${PORT}/api/audit`);
  console.log(`  - Students: http://localhost:${PORT}/api/students`);
  console.log(`  - Classes: http://localhost:${PORT}/api/classes`);
  console.log(`  - Employees: http://localhost:${PORT}/api/employees`);
  console.log(`  - Configurations: http://localhost:${PORT}/api/configurations`);
  console.log(`  - Accounting: http://localhost:${PORT}/api/accounting`);
  console.log(`  - Expenses: http://localhost:${PORT}/api/expenses`);
  console.log(`  - Results: http://localhost:${PORT}/api/results`);
  console.log(`  - Boarding: http://localhost:${PORT}/api/boarding`);
  console.log(`  - Fees: http://localhost:${PORT}/api/fees`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
