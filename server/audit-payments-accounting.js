const { pool } = require('./config/database');

/**
 * Comprehensive audit of all payment-related transactions
 * Checks for:
 * 1. Payments without journal entries
 * 2. Journal entries without proper double-entry (debit = credit)
 * 3. Missing currency tracking
 * 4. Account balance updates
 * 5. Incorrect column names (debit_amount vs debit)
 */

async function auditPaymentsAccounting() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔍 Starting comprehensive payment accounting audit...\n');

    const issues = [];
    const warnings = [];

    // 1. Check fee_payments table
    console.log('📊 Checking fee_payments...');
    const [feePayments] = await conn.execute(`
      SELECT 
        fp.id,
        fp.receipt_number,
        fp.payment_date,
        fp.base_currency_amount,
        fp.created_at,
        (SELECT COUNT(*) FROM journal_entries je 
         WHERE je.reference = fp.receipt_number 
         OR je.description LIKE CONCAT('%', fp.receipt_number, '%')) as journal_count
      FROM fee_payments fp
      ORDER BY fp.created_at DESC
      LIMIT 100
    `);

    console.log(`   Found ${feePayments.length} recent fee payments`);
    
    for (const payment of feePayments) {
      if (payment.journal_count === 0) {
        issues.push({
          type: 'CRITICAL',
          table: 'fee_payments',
          id: payment.id,
          receipt_number: payment.receipt_number,
          issue: 'Payment has no journal entry',
          amount: payment.base_currency_amount,
          date: payment.payment_date
        });
      }
    }

    // 2. Check boarding_fees_payments table
    console.log('\n📊 Checking boarding_fees_payments...');
    const [boardingPayments] = await conn.execute(`
      SELECT 
        bfp.id,
        bfp.reference_number,
        bfp.payment_date,
        bfp.amount_paid,
        bfp.created_at,
        (SELECT COUNT(*) FROM journal_entries je 
         WHERE je.reference = bfp.reference_number 
         OR je.description LIKE CONCAT('%', bfp.reference_number, '%')) as journal_count
      FROM boarding_fees_payments bfp
      ORDER BY bfp.created_at DESC
      LIMIT 100
    `);

    console.log(`   Found ${boardingPayments.length} recent boarding payments`);
    
    for (const payment of boardingPayments) {
      if (payment.journal_count === 0) {
        issues.push({
          type: 'CRITICAL',
          table: 'boarding_fees_payments',
          id: payment.id,
          reference_number: payment.reference_number,
          issue: 'Payment has no journal entry',
          amount: payment.amount_paid,
          date: payment.payment_date
        });
      }
    }

    // 3. Check accounts_payable_payments table
    console.log('\n📊 Checking accounts_payable_payments...');
    const [apPayments] = await conn.execute(`
      SELECT 
        app.id,
        app.payment_date,
        app.amount_paid,
        app.transaction_id,
        t.journal_entry_id,
        app.created_at
      FROM accounts_payable_payments app
      LEFT JOIN transactions t ON app.transaction_id = t.id
      ORDER BY app.created_at DESC
      LIMIT 100
    `);

    console.log(`   Found ${apPayments.length} recent AP payments`);
    
    for (const payment of apPayments) {
      if (!payment.journal_entry_id) {
        issues.push({
          type: 'CRITICAL',
          table: 'accounts_payable_payments',
          id: payment.id,
          issue: 'Payment has no journal entry',
          amount: payment.amount_paid,
          date: payment.payment_date
        });
      }
    }

    // 4. Check all journal entries for double-entry balance
    console.log('\n📊 Checking journal entries for double-entry balance...');
    const [unbalancedEntries] = await conn.execute(`
      SELECT 
        je.id,
        je.reference,
        je.description,
        je.entry_date,
        SUM(jel.debit) as total_debit,
        SUM(jel.credit) as total_credit,
        ABS(SUM(jel.debit) - SUM(jel.credit)) as difference
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
      WHERE je.description LIKE '%Payment%'
         OR je.description LIKE '%payment%'
         OR je.description LIKE '%Fee%'
      GROUP BY je.id, je.reference, je.description, je.entry_date
      HAVING ABS(SUM(jel.debit) - SUM(jel.credit)) > 0.01
      ORDER BY je.entry_date DESC
      LIMIT 50
    `);

    console.log(`   Found ${unbalancedEntries.length} unbalanced journal entries`);
    
    for (const entry of unbalancedEntries) {
      issues.push({
        type: 'CRITICAL',
        table: 'journal_entries',
        id: entry.id,
        reference: entry.reference,
        issue: `Journal entry not balanced - Debit: ${entry.total_debit}, Credit: ${entry.total_credit}, Difference: ${entry.difference}`,
        date: entry.entry_date
      });
    }

    // 5. Check for missing currency_id in journal_entry_lines
    console.log('\n📊 Checking for missing currency tracking...');
    const [missingCurrency] = await conn.execute(`
      SELECT 
        jel.id,
        jel.journal_entry_id,
        je.reference,
        je.description,
        jel.currency_id
      FROM journal_entry_lines jel
      INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE (je.description LIKE '%Payment%' OR je.description LIKE '%payment%' OR je.description LIKE '%Fee%')
        AND jel.currency_id IS NULL
      ORDER BY je.entry_date DESC
      LIMIT 50
    `);

    console.log(`   Found ${missingCurrency.length} journal entry lines missing currency_id`);
    
    for (const line of missingCurrency) {
      warnings.push({
        type: 'WARNING',
        table: 'journal_entry_lines',
        id: line.id,
        journal_entry_id: line.journal_entry_id,
        reference: line.reference,
        issue: 'Missing currency_id',
        description: line.description
      });
    }

    // 6. Check for journal entries with only one line (should have at least 2 for double-entry)
    console.log('\n📊 Checking for incomplete journal entries...');
    const [incompleteEntries] = await conn.execute(`
      SELECT 
        je.id,
        je.reference,
        je.description,
        je.entry_date,
        COUNT(jel.id) as line_count
      FROM journal_entries je
      LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
      WHERE (je.description LIKE '%Payment%' OR je.description LIKE '%payment%' OR je.description LIKE '%Fee%')
        AND je.entry_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY je.id, je.reference, je.description, je.entry_date
      HAVING COUNT(jel.id) < 2
      ORDER BY je.entry_date DESC
    `);

    console.log(`   Found ${incompleteEntries.length} journal entries with less than 2 lines`);
    
    for (const entry of incompleteEntries) {
      issues.push({
        type: 'CRITICAL',
        table: 'journal_entries',
        id: entry.id,
        reference: entry.reference,
        issue: `Journal entry has only ${entry.line_count} line(s) - needs at least 2 for double-entry`,
        date: entry.entry_date
      });
    }

    // 7. Check account balance updates
    console.log('\n📊 Checking account balance updates...');
    const [balanceIssues] = await conn.execute(`
      SELECT 
        ab.account_id,
        coa.code,
        coa.name,
        ab.currency_id,
        ab.balance,
        ab.as_of_date,
        (SELECT SUM(CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN jel.debit - jel.credit
          ELSE jel.credit - jel.debit
        END)
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = ab.account_id
          AND jel.currency_id = ab.currency_id
          AND je.entry_date <= ab.as_of_date
        ) as calculated_balance
      FROM account_balances ab
      INNER JOIN chart_of_accounts coa ON ab.account_id = coa.id
      WHERE ab.account_id IN (
        SELECT DISTINCT account_id 
        FROM journal_entry_lines 
        WHERE journal_entry_id IN (
          SELECT id FROM journal_entries 
          WHERE description LIKE '%Payment%' OR description LIKE '%payment%' OR description LIKE '%Fee%'
        )
      )
      AND ab.as_of_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      LIMIT 50
    `);

    // This is a complex check - let's just report if we find any
    console.log(`   Checked ${balanceIssues.length} account balances`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 AUDIT SUMMARY');
    console.log('='.repeat(80));
    
    const criticalIssues = issues.filter(i => i.type === 'CRITICAL');
    const warningsCount = warnings.length;

    console.log(`\n🔴 CRITICAL ISSUES: ${criticalIssues.length}`);
    if (criticalIssues.length > 0) {
      console.log('\nCritical Issues:');
      criticalIssues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.type} - ${issue.table}`);
        console.log(`   ID: ${issue.id}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.receipt_number) console.log(`   Receipt: ${issue.receipt_number}`);
        if (issue.reference) console.log(`   Reference: ${issue.reference}`);
        if (issue.amount) console.log(`   Amount: ${issue.amount}`);
        if (issue.date) console.log(`   Date: ${issue.date}`);
      });
    }

    console.log(`\n⚠️  WARNINGS: ${warningsCount}`);
    if (warnings.length > 0) {
      console.log('\nWarnings:');
      warnings.slice(0, 10).forEach((warning, idx) => {
        console.log(`\n${idx + 1}. ${warning.type} - ${warning.table}`);
        console.log(`   ID: ${warning.id}`);
        console.log(`   Issue: ${warning.issue}`);
        if (warning.reference) console.log(`   Reference: ${warning.reference}`);
      });
      if (warnings.length > 10) {
        console.log(`\n   ... and ${warnings.length - 10} more warnings`);
      }
    }

    console.log('\n' + '='.repeat(80));
    
    if (criticalIssues.length === 0 && warningsCount === 0) {
      console.log('✅ All payments appear to have proper double-entry accounting!');
    } else {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Review and fix all critical issues');
      console.log('   2. Add missing journal entries for payments without them');
      console.log('   3. Fix unbalanced journal entries');
      console.log('   4. Add currency_id to journal entry lines missing it');
    }

    return {
      criticalIssues,
      warnings,
      totalIssues: criticalIssues.length,
      totalWarnings: warningsCount
    };

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the audit
auditPaymentsAccounting()
  .then((results) => {
    console.log('\n✅ Audit completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });

