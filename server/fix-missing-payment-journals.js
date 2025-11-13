const { pool } = require('./config/database');

/**
 * Fix missing journal entries for boarding payments
 * This script will:
 * 1. Find boarding payments without journal entries
 * 2. Create proper journal entries for them
 * 3. Update account balances
 */

async function fixMissingPaymentJournals() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Fixing missing journal entries for boarding payments...\n');

    await conn.beginTransaction();

    // Find boarding payments without journal entries
    const [missingPayments] = await conn.execute(`
      SELECT 
        bfp.id,
        bfp.student_reg_number,
        bfp.amount_paid,
        bfp.currency_id,
        bfp.payment_date,
        bfp.payment_method,
        bfp.reference_number,
        bfp.created_at,
        s.Name,
        s.Surname
      FROM boarding_fees_payments bfp
      INNER JOIN students s ON bfp.student_reg_number = s.RegNumber
      WHERE NOT EXISTS (
        SELECT 1 FROM journal_entries je 
        WHERE je.reference = bfp.reference_number 
        OR je.description LIKE CONCAT('%', bfp.reference_number, '%')
      )
      ORDER BY bfp.id
    `);

    console.log(`Found ${missingPayments.length} boarding payments without journal entries\n`);

    if (missingPayments.length === 0) {
      console.log('✅ No payments need fixing!');
      await conn.rollback();
      return;
    }

    // Get account IDs
    const [cashAccount] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE LIMIT 1',
      ['1000'] // Cash on Hand
    );

    const [bankAccount] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE LIMIT 1',
      ['1010'] // Bank Account
    );

    const [boardingFeesReceivable] = await conn.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND is_active = TRUE LIMIT 1',
      ['1100'] // Accounts Receivable - Tuition
    );

    if (!cashAccount.length || !bankAccount.length || !boardingFeesReceivable.length) {
      throw new Error('Required chart of accounts not found');
    }

    const cashAccountId = cashAccount[0].id;
    const bankAccountId = bankAccount[0].id;
    const receivableAccountId = boardingFeesReceivable[0].id;

    // Get or create journal
    let journalId = 1; // Default journal ID
    const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
    if (journalCheck.length === 0) {
      const [journalResult] = await conn.execute(
        'INSERT INTO journals (name, description) VALUES (?, ?)',
        ['Boarding Fees Journal', 'Journal for boarding fees transactions']
      );
      journalId = journalResult.insertId;
    }

    let fixedCount = 0;

    for (const payment of missingPayments) {
      try {
        const student_name = `${payment.Name} ${payment.Surname}`;
        const amount_paid = parseFloat(payment.amount_paid);
        const currency_id = payment.currency_id || 1; // Default to 1 if null

        // Determine debit account based on payment method
        let debitAccountId;
        const paymentMethod = (payment.payment_method || '').toLowerCase();
        if (paymentMethod === 'cash' || paymentMethod === 'mobile money') {
          debitAccountId = cashAccountId;
        } else {
          debitAccountId = bankAccountId;
        }

        // Create journal entry
        const [journalResult] = await conn.execute(
          `INSERT INTO journal_entries 
           (journal_id, entry_date, reference, description, created_by) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            journalId, 
            payment.payment_date || payment.created_at, 
            payment.reference_number || `BOARDING-${payment.id}`, 
            `Boarding Fees Payment - ${student_name} (${payment.student_reg_number})`,
            1 // Default created_by
          ]
        );

        const journalEntryId = journalResult.insertId;

        // Create journal entry lines (double-entry)
        // Debit: Cash/Bank
        await conn.execute(
          `INSERT INTO journal_entry_lines 
           (journal_entry_id, account_id, debit, credit, currency_id, description) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            journalEntryId, 
            debitAccountId, 
            amount_paid, 
            0, 
            currency_id,
            `Payment received for boarding fees - ${student_name} (${payment.student_reg_number})`
          ]
        );

        // Credit: Accounts Receivable (reduce receivable)
        await conn.execute(
          `INSERT INTO journal_entry_lines 
           (journal_entry_id, account_id, debit, credit, currency_id, description) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            journalEntryId, 
            receivableAccountId, 
            0, 
            amount_paid, 
            currency_id,
            `Reduce receivable for payment - ${student_name} (${payment.student_reg_number})`
          ]
        );

        // Update account balances
        const AccountBalanceService = require('./services/accountBalanceService');
        await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);

        console.log(`✅ Fixed payment ID ${payment.id} - ${payment.student_reg_number} - Amount: ${amount_paid}`);
        fixedCount++;

      } catch (error) {
        console.error(`❌ Error fixing payment ID ${payment.id}:`, error.message);
        throw error;
      }
    }

    await conn.commit();

    console.log(`\n✅ Successfully fixed ${fixedCount} out of ${missingPayments.length} payments!`);

    // Fix missing currency_id in journal entry lines
    console.log('\n🔧 Fixing missing currency_id in journal entry lines...\n');

    await conn.beginTransaction();

    const [missingCurrency] = await conn.execute(`
      SELECT 
        jel.id,
        jel.journal_entry_id,
        jel.account_id,
        je.entry_date,
        je.description
      FROM journal_entry_lines jel
      INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE (je.description LIKE '%Payment%' OR je.description LIKE '%payment%' OR je.description LIKE '%Fee%')
        AND jel.currency_id IS NULL
      ORDER BY je.entry_date DESC
    `);

    console.log(`Found ${missingCurrency.length} journal entry lines missing currency_id\n`);

    if (missingCurrency.length > 0) {
      // Default to currency_id = 1 (USD) for missing entries
      const [updateResult] = await conn.execute(`
        UPDATE journal_entry_lines jel
        INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
        SET jel.currency_id = 1
        WHERE (je.description LIKE '%Payment%' OR je.description LIKE '%payment%' OR je.description LIKE '%Fee%')
          AND jel.currency_id IS NULL
      `);

      console.log(`✅ Updated ${updateResult.affectedRows} journal entry lines with currency_id = 1`);
    }

    await conn.commit();

    console.log('\n✅ All fixes completed!');

  } catch (error) {
    await conn.rollback();
    console.error('❌ Error fixing payments:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Run the fix
fixMissingPaymentJournals()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

