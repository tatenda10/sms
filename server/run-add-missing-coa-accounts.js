const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

/**
 * Script to add missing Chart of Accounts
 * This adds all accounts required by the system
 */

async function addMissingAccounts() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Adding missing Chart of Accounts...\n');

    await conn.beginTransaction();

    const accountsToAdd = [
      // Asset Accounts (1510-1550)
      { code: '1510', name: 'Buildings & Improvements', type: 'Asset' },
      { code: '1520', name: 'Vehicles', type: 'Asset' },
      { code: '1530', name: 'Furniture & Fixtures', type: 'Asset' },
      { code: '1540', name: 'Computer Equipment', type: 'Asset' },
      { code: '1550', name: 'Office Equipment', type: 'Asset' },
      
      // Liability Accounts (2201-2203) - Payroll Tax Accounts
      { code: '2201', name: 'PAYE Payable', type: 'Liability' },
      { code: '2202', name: 'NHIF Payable', type: 'Liability' },
      { code: '2203', name: 'NSSF Payable', type: 'Liability' },
      
      // Revenue Accounts (4100-4900)
      { code: '4100', name: 'Boarding Revenue', type: 'Revenue' },
      { code: '4200', name: 'Transport Revenue', type: 'Revenue' },
      { code: '4300', name: 'Uniform Sales Revenue', type: 'Revenue' },
      { code: '4400', name: 'Additional Fees Revenue', type: 'Revenue' },
      { code: '4900', name: 'Other Revenue', type: 'Revenue' },
      
      // Expense Accounts (5200-5900)
      { code: '5200', name: 'Maintenance & Repairs', type: 'Expense' },
      { code: '5300', name: 'Office Supplies', type: 'Expense' },
      { code: '5400', name: 'Transportation Expenses', type: 'Expense' },
      { code: '5500', name: 'Marketing & Advertising', type: 'Expense' },
      { code: '5600', name: 'Professional Fees', type: 'Expense' },
      { code: '5700', name: 'Insurance', type: 'Expense' },
      { code: '5800', name: 'Depreciation', type: 'Expense' },
      { code: '5900', name: 'Other Expenses', type: 'Expense' },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const account of accountsToAdd) {
      // Check if account already exists
      const [existing] = await conn.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ?',
        [account.code]
      );

      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${account.code} - ${account.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Insert the account
      await conn.execute(
        'INSERT INTO chart_of_accounts (code, name, type, is_active) VALUES (?, ?, ?, TRUE)',
        [account.code, account.name, account.type]
      );

      console.log(`✅ Added ${account.code} - ${account.name} (${account.type})`);
      addedCount++;
    }

    await conn.commit();

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Accounts Added: ${addedCount}`);
    console.log(`⏭️  Accounts Skipped: ${skippedCount}`);
    console.log(`📋 Total Accounts Processed: ${accountsToAdd.length}`);

    if (addedCount > 0) {
      console.log('\n✅ Missing accounts have been successfully added!');
    } else {
      console.log('\n✅ All required accounts already exist!');
    }

  } catch (error) {
    await conn.rollback();
    console.error('❌ Error adding accounts:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the migration
addMissingAccounts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

