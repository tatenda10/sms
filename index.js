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

// Helper function to generate CREATE TABLE SQL from structure
function generateCreateTableSQL(tableName, structure) {
  const columns = structure.map(col => {
    let columnDef = `\`${col.COLUMN_NAME}\` ${col.DATA_TYPE}`;
    
    // Add length for certain data types
    if (col.DATA_TYPE.includes('varchar') || col.DATA_TYPE.includes('char')) {
      columnDef += '(255)';
    }
    
    // Add NOT NULL constraint
    if (col.IS_NULLABLE === 'NO') {
      columnDef += ' NOT NULL';
    }
    
    // Add default value
    if (col.COLUMN_DEFAULT !== null) {
      if (col.COLUMN_DEFAULT === 'CURRENT_TIMESTAMP') {
        columnDef += ' DEFAULT CURRENT_TIMESTAMP';
      } else {
        columnDef += ` DEFAULT '${col.COLUMN_DEFAULT}'`;
      }
    }
    
    return columnDef;
  }).join(',\n  ');
  
  return `CREATE TABLE \`${tableName}\` (\n  ${columns}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

// Full database sync endpoint
app.post('/api/sync-full-db.php', async (req, res) => {
  try {
    const { database_export, timestamp, source } = req.body;
    
    console.log(`📥 Full sync request received from ${source} at ${timestamp}`);
    console.log(`📊 Tables to sync: ${Object.keys(database_export).length}`);
    
    // Log table names for verification
    const tableNames = Object.keys(database_export);
    console.log(`📋 Tables: ${tableNames.join(', ')}`);
    
    // Import database connection
    const mysql = require('mysql2/promise');
    
    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'oxfordstudycenter-do-user-16839730-0.l.db.ondigitalocean.com',
      user: process.env.DB_USER || 'doadmin',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sms',
      port: process.env.DB_PORT || 25060,
      ssl: process.env.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : false,
      charset: 'utf8mb4'
    };
    
    // Debug: Log the actual database configuration being used
    console.log('🔍 Database Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***hidden***' : 'empty'
    });
    
    // Debug: Log environment variables
    console.log('🔍 Environment Variables:', {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD ? '***hidden***' : 'empty',
      DB_NAME: process.env.DB_NAME
    });
    
    // Connect to database
    const connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Connected to database');
    
    let processedTables = 0;
    let processedRecords = 0;
    const errors = [];
    
    // Process each table
    console.log(`🔄 Starting to process ${Object.keys(database_export).length} tables...`);
    
    for (const [tableName, tableData] of Object.entries(database_export)) {
      if (tableName === '_metadata') {
        console.log(`⏭️ Skipping metadata table`);
        continue;
      }
      
      try {
        console.log(`📦 Processing table: ${tableName}`);
        console.log(`📊 Table data:`, {
          hasSchema: !!tableData.schema,
          hasStructure: !!tableData.structure,
          hasData: !!tableData.data,
          recordCount: tableData.record_count || 0,
          dataLength: tableData.data ? tableData.data.length : 0
        });
        
                   // Check if table exists
           console.log(`🔍 Checking if table ${tableName} exists...`);
           const [tables] = await connection.execute(`SHOW TABLES LIKE ?`, [tableName]);
           const tableExists = tables.length > 0;
           console.log(`📋 Table check result: ${tableExists ? 'EXISTS' : 'NOT EXISTS'}`);
        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist, attempting to create...`);
          
          // Try to create table from schema if available
          if (tableData.schema) {
            try {
              await connection.execute(tableData.schema);
              console.log(`✅ Created table ${tableName} from schema`);
            } catch (createError) {
              console.log(`❌ Failed to create table ${tableName}: ${createError.message}`);
              continue;
            }
          } else if (tableData.structure && tableData.structure.length > 0) {
            // Create table from structure if no schema available
            try {
              const createSQL = generateCreateTableSQL(tableName, tableData.structure);
              await connection.execute(createSQL);
              console.log(`✅ Created table ${tableName} from structure`);
            } catch (createError) {
              console.log(`❌ Failed to create table ${tableName} from structure: ${createError.message}`);
              continue;
            }
          } else {
            console.log(`⚠️ No schema or structure available for table ${tableName}, skipping`);
            continue;
          }
        } else {
          console.log(`✅ Table ${tableName} already exists, will update data`);
        }
        
                   // Clear existing data
           console.log(`🗑️ Clearing existing data from ${tableName}...`);
           await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
           console.log(`✅ Cleared existing data from ${tableName}`);
        
        // Insert new data
        if (tableData.data && tableData.data.length > 0) {
          console.log(`📥 Inserting ${tableData.data.length} records into ${tableName}...`);
          const columns = Object.keys(tableData.data[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
          
          console.log(`🔧 SQL: ${sql}`);
          console.log(`📋 Columns: ${columns.join(', ')}`);
          
          const stmt = await connection.prepare(sql);
          
          for (const row of tableData.data) {
            console.log(`📝 Inserting row:`, Object.values(row));
            await stmt.execute(Object.values(row));
            processedRecords++;
          }
          
          console.log(`✅ Inserted ${tableData.data.length} records into ${tableName}`);
        } else {
          console.log(`⚠️ No data to insert for table ${tableName}`);
        }
        
        processedTables++;
        console.log(`✅ Successfully processed table ${tableName}. Total processed so far: ${processedTables} tables, ${processedRecords} records`);
        
      } catch (error) {
        const errorMsg = `Error processing table ${tableName}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        console.error(`❌ Full error:`, error);
        errors.push(errorMsg);
      }
    }
    
    console.log(`🏁 Finished processing all tables. Final count: ${processedTables} tables, ${processedRecords} records`);
    
    await connection.end();
    console.log('🔌 Database connection closed');
    
    console.log(`🎉 Sync completed - Tables: ${processedTables}, Records: ${processedRecords}`);
    
    res.json({
      success: true,
      message: 'Database sync completed successfully',
      processedTables: processedTables,
      processedRecords: processedRecords,
      errors: errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Full sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Full sync failed',
      error: error.message
    });
  }
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
