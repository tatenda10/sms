const mysql = require('mysql2/promise');
require('dotenv').config();

const runPayrollMigration = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Running payroll migration...');

    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', 'payroll_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await connection.query(migrationSQL);

    console.log('✅ Payroll migration completed successfully!');
    console.log('Created tables:');
    console.log('  - payslips');
    console.log('  - payslip_earnings');
    console.log('  - payslip_deductions');
    console.log('  - payroll_runs');
    console.log('  - payroll_run_details');

  } catch (error) {
    console.error('❌ Error running payroll migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run the migration
runPayrollMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
