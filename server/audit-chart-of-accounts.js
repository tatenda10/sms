const { pool } = require('./config/database');

/**
 * Comprehensive audit of Chart of Accounts
 * Checks for all required accounts that the system expects
 */

const REQUIRED_ACCOUNTS = {
  // Assets (1000-1999)
  assets: [
    { code: '1000', name: 'Cash on Hand', type: 'Asset', description: 'Physical cash kept on premises' },
    { code: '1010', name: 'Bank Account', type: 'Asset', description: 'Main bank account for deposits' },
    { code: '1100', name: 'Accounts Receivable - Tuition', type: 'Asset', description: 'Amounts owed by students for tuition fees' },
    { code: '1110', name: 'Accounts Receivable - Boarding', type: 'Asset', description: 'Amounts owed by students for boarding fees' },
    { code: '1500', name: 'Land', type: 'Asset', description: 'School land and property' },
    { code: '1510', name: 'Buildings & Improvements', type: 'Asset', description: 'School buildings and improvements' },
    { code: '1520', name: 'Vehicles', type: 'Asset', description: 'School vehicles' },
    { code: '1530', name: 'Furniture & Fixtures', type: 'Asset', description: 'Furniture and fixtures' },
    { code: '1540', name: 'Computer Equipment', type: 'Asset', description: 'Computer equipment and IT assets' },
    { code: '1550', name: 'Office Equipment', type: 'Asset', description: 'Office equipment and machinery' },
  ],
  
  // Liabilities (2000-2999)
  liabilities: [
    { code: '2000', name: 'Accounts Payable', type: 'Liability', description: 'Amounts owed to suppliers and vendors' },
    { code: '2100', name: 'Accrued Expenses', type: 'Liability', description: 'Expenses incurred but not yet paid' },
    { code: '2200', name: 'Tax Payable', type: 'Liability', description: 'Taxes owed to government' },
    { code: '2201', name: 'PAYE Payable', type: 'Liability', description: 'Pay As You Earn tax payable' },
    { code: '2202', name: 'NHIF Payable', type: 'Liability', description: 'National Health Insurance Fund payable' },
    { code: '2203', name: 'NSSF Payable', type: 'Liability', description: 'National Social Security Fund payable' },
  ],
  
  // Equity (3000-3999)
  equity: [
    { code: '3000', name: 'Owner\'s Equity', type: 'Equity', description: 'Owner\'s capital investment' },
    { code: '3998', name: 'Retained Earnings', type: 'Equity', description: 'Retained earnings for opening balances' },
    { code: '3999', name: 'Income Summary', type: 'Equity', description: 'Temporary account for period closing' },
  ],
  
  // Revenue (4000-4999)
  revenue: [
    { code: '4000', name: 'Tuition Revenue', type: 'Revenue', description: 'Revenue from student tuition fees' },
    { code: '4100', name: 'Boarding Revenue', type: 'Revenue', description: 'Revenue from boarding fees' },
    { code: '4200', name: 'Transport Revenue', type: 'Revenue', description: 'Revenue from transport fees' },
    { code: '4300', name: 'Uniform Sales Revenue', type: 'Revenue', description: 'Revenue from uniform sales' },
    { code: '4400', name: 'Additional Fees Revenue', type: 'Revenue', description: 'Revenue from additional fees' },
    { code: '4900', name: 'Other Revenue', type: 'Revenue', description: 'Other miscellaneous revenue' },
  ],
  
  // Expenses (5000-5999)
  expenses: [
    { code: '5000', name: 'General Expenses', type: 'Expense', description: 'General operating expenses' },
    { code: '5001', name: 'Salaries & Wages', type: 'Expense', description: 'Employee salaries and wages' },
    { code: '5100', name: 'Utilities', type: 'Expense', description: 'Electricity, water, internet expenses' },
    { code: '5200', name: 'Maintenance & Repairs', type: 'Expense', description: 'Building and equipment maintenance' },
    { code: '5300', name: 'Office Supplies', type: 'Expense', description: 'Office supplies and stationery' },
    { code: '5400', name: 'Transportation Expenses', type: 'Expense', description: 'Vehicle fuel and maintenance' },
    { code: '5500', name: 'Marketing & Advertising', type: 'Expense', description: 'Marketing and advertising costs' },
    { code: '5600', name: 'Professional Fees', type: 'Expense', description: 'Legal, accounting, consulting fees' },
    { code: '5700', name: 'Insurance', type: 'Expense', description: 'Insurance premiums' },
    { code: '5800', name: 'Depreciation', type: 'Expense', description: 'Depreciation expense' },
    { code: '5900', name: 'Other Expenses', type: 'Expense', description: 'Other miscellaneous expenses' },
  ]
};

async function auditChartOfAccounts() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔍 Starting Chart of Accounts audit...\n');

    // Get all existing accounts
    const [existingAccounts] = await conn.execute(`
      SELECT code, name, type, is_active 
      FROM chart_of_accounts 
      ORDER BY code
    `);

    const existingCodes = new Set(existingAccounts.map(acc => acc.code));
    const missingAccounts = [];
    const duplicateCodes = [];
    const inactiveAccounts = [];

    // Check all required accounts
    const allRequired = [
      ...REQUIRED_ACCOUNTS.assets,
      ...REQUIRED_ACCOUNTS.liabilities,
      ...REQUIRED_ACCOUNTS.equity,
      ...REQUIRED_ACCOUNTS.revenue,
      ...REQUIRED_ACCOUNTS.expenses
    ];

    console.log(`📊 Checking ${allRequired.length} required accounts...\n`);

    for (const account of allRequired) {
      if (!existingCodes.has(account.code)) {
        missingAccounts.push(account);
      } else {
        const existing = existingAccounts.find(a => a.code === account.code);
        if (!existing.is_active) {
          inactiveAccounts.push({ ...account, existing });
        }
      }
    }

    // Check for duplicate codes
    const codeCounts = {};
    existingAccounts.forEach(acc => {
      codeCounts[acc.code] = (codeCounts[acc.code] || 0) + 1;
    });
    
    Object.keys(codeCounts).forEach(code => {
      if (codeCounts[code] > 1) {
        duplicateCodes.push({
          code,
          count: codeCounts[code],
          accounts: existingAccounts.filter(a => a.code === code)
        });
      }
    });

    // Summary
    console.log('='.repeat(80));
    console.log('📋 CHART OF ACCOUNTS AUDIT SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Total Accounts in System: ${existingAccounts.length}`);
    console.log(`✅ Required Accounts Found: ${allRequired.length - missingAccounts.length}`);
    console.log(`❌ Missing Accounts: ${missingAccounts.length}`);
    console.log(`⚠️  Inactive Accounts: ${inactiveAccounts.length}`);
    console.log(`🔴 Duplicate Codes: ${duplicateCodes.length}`);

    // Missing Accounts Report
    if (missingAccounts.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ MISSING ACCOUNTS');
      console.log('='.repeat(80));
      
      const byType = {
        Asset: [],
        Liability: [],
        Equity: [],
        Revenue: [],
        Expense: []
      };
      
      missingAccounts.forEach(acc => {
        byType[acc.type].push(acc);
      });

      Object.keys(byType).forEach(type => {
        if (byType[type].length > 0) {
          console.log(`\n📌 ${type} Accounts (${byType[type].length} missing):`);
          byType[type].forEach(acc => {
            console.log(`   ${acc.code} - ${acc.name}`);
            console.log(`      ${acc.description}`);
          });
        }
      });
    }

    // Inactive Accounts Report
    if (inactiveAccounts.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  INACTIVE ACCOUNTS');
      console.log('='.repeat(80));
      
      inactiveAccounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (Currently: ${acc.existing.name})`);
      });
    }

    // Duplicate Codes Report
    if (duplicateCodes.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🔴 DUPLICATE ACCOUNT CODES');
      console.log('='.repeat(80));
      
      duplicateCodes.forEach(dup => {
        console.log(`\n   Code ${dup.code} appears ${dup.count} times:`);
        dup.accounts.forEach(acc => {
          console.log(`      - ID ${acc.id}: ${acc.name} (${acc.type}) - Active: ${acc.is_active}`);
        });
      });
    }

    // Generate SQL to create missing accounts
    if (missingAccounts.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('💡 SQL TO CREATE MISSING ACCOUNTS');
      console.log('='.repeat(80));
      console.log('\n-- Run this SQL to create missing accounts:\n');
      
      missingAccounts.forEach(acc => {
        console.log(
          `INSERT INTO chart_of_accounts (code, name, type, is_active) VALUES ` +
          `('${acc.code}', '${acc.name}', '${acc.type}', TRUE);`
        );
      });
    }

    // Accounts that exist but may have different names
    console.log('\n' + '='.repeat(80));
    console.log('ℹ️  ACCOUNTS WITH POTENTIAL NAME MISMATCHES');
    console.log('='.repeat(80));
    
    const nameMismatches = [];
    allRequired.forEach(required => {
      const existing = existingAccounts.find(a => a.code === required.code);
      if (existing && existing.name.toLowerCase() !== required.name.toLowerCase()) {
        nameMismatches.push({
          code: required.code,
          required: required.name,
          existing: existing.name,
          type: required.type
        });
      }
    });

    if (nameMismatches.length > 0) {
      nameMismatches.forEach(mismatch => {
        console.log(`\n   Code ${mismatch.code} (${mismatch.type}):`);
        console.log(`      Expected: ${mismatch.required}`);
        console.log(`      Current:  ${mismatch.existing}`);
      });
    } else {
      console.log('\n   ✅ No name mismatches found');
    }

    // Summary statistics by type
    console.log('\n' + '='.repeat(80));
    console.log('📊 ACCOUNTS BY TYPE');
    console.log('='.repeat(80));
    
    const byTypeCount = {};
    existingAccounts.forEach(acc => {
      byTypeCount[acc.type] = (byTypeCount[acc.type] || 0) + 1;
    });

    ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].forEach(type => {
      const count = byTypeCount[type] || 0;
      const required = allRequired.filter(a => a.type === type).length;
      const missing = missingAccounts.filter(a => a.type === type).length;
      console.log(`\n   ${type}: ${count} existing, ${required} required, ${missing} missing`);
    });

    console.log('\n' + '='.repeat(80));
    
    if (missingAccounts.length === 0 && inactiveAccounts.length === 0 && duplicateCodes.length === 0) {
      console.log('✅ All required accounts are present and active!');
    } else {
      console.log('\n💡 RECOMMENDATIONS:');
      if (missingAccounts.length > 0) {
        console.log('   1. Create missing accounts using the SQL provided above');
      }
      if (inactiveAccounts.length > 0) {
        console.log('   2. Activate inactive accounts that are required by the system');
      }
      if (duplicateCodes.length > 0) {
        console.log('   3. Resolve duplicate account codes - each code should be unique');
      }
    }

    return {
      totalAccounts: existingAccounts.length,
      missingAccounts: missingAccounts.length,
      inactiveAccounts: missingAccounts.length,
      duplicateCodes: duplicateCodes.length,
      missing: missingAccounts,
      inactive: inactiveAccounts,
      duplicates: duplicateCodes,
      nameMismatches
    };

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the audit
auditChartOfAccounts()
  .then((results) => {
    console.log('\n✅ Audit completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });

