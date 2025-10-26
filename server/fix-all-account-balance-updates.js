const fs = require('fs');
const path = require('path');

// List of controller files that create journal entries
const controllersToCheck = [
  'controllers/expenses/expenseAccountPayablesController.js',
  'controllers/accounting/periodClosingController.js',
  'controllers/boarding/boardingFeesPaymentsController.js',
  'controllers/boarding/enrollmentController.js',
  'controllers/classes/gradelevelEnrollmentController.js',
  'controllers/students/studentTransactionController.js',
  'controllers/fees/feePaymentController.js',
  'controllers/fees/additionalFeeController.js',
  'controllers/accounting/cashBankController.js',
  'controllers/transport/weeklyFeeController.js',
  'controllers/transport/transportPaymentController.js',
  'controllers/inventory/uniformIssueController.js',
  'controllers/payroll/payrollRunController.js',
  'controllers/expenses/expenseController.js'
];

console.log('🔍 Checking controllers for missing account balance updates...\n');

const missingUpdates = [];

controllersToCheck.forEach(controllerPath => {
  const fullPath = path.join(__dirname, controllerPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${controllerPath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const hasJournalEntryLines = content.includes('INSERT INTO journal_entry_lines');
  const hasAccountBalanceImport = content.includes("require('../../services/accountBalanceService')") || 
                                   content.includes('AccountBalanceService');
  const hasAccountBalanceUpdate = content.includes('updateAccountBalancesFromJournalEntry') ||
                                  content.includes('recalculateAllAccountBalances');
  
  if (hasJournalEntryLines) {
    const status = hasAccountBalanceUpdate ? '✅' : '❌';
    console.log(`${status} ${controllerPath}`);
    
    if (!hasAccountBalanceUpdate) {
      missingUpdates.push({
        file: controllerPath,
        hasImport: hasAccountBalanceImport
      });
    }
  }
});

console.log(`\n\n📊 Summary:`);
console.log(`Total controllers checked: ${controllersToCheck.length}`);
console.log(`Controllers missing account balance updates: ${missingUpdates.length}\n`);

if (missingUpdates.length > 0) {
  console.log('⚠️  The following controllers need to be fixed:\n');
  missingUpdates.forEach(item => {
    console.log(`   - ${item.file} ${item.hasImport ? '(has import)' : '(needs import)'}`);
  });
  
  console.log('\n💡 Fix Instructions:');
  console.log('   1. Import AccountBalanceService at the top:');
  console.log('      const AccountBalanceService = require(\'../../services/accountBalanceService\');\n');
  console.log('   2. After creating journal entries, add:');
  console.log('      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);');
  console.log('   3. After deleting journal entries, add:');
  console.log('      await AccountBalanceService.recalculateAllAccountBalances();\n');
} else {
  console.log('✅ All controllers are properly updating account balances!');
}

console.log('\nℹ️  Note: This script only checks for the presence of account balance update calls.');
console.log('   Manual review is recommended to ensure they are called in the correct places.');

