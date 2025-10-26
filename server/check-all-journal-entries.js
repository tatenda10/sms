const { pool } = require('./config/database');

async function checkAllJournalEntries() {
  try {
    console.log('🔍 Checking ALL Journal Entries...\n');
    
    // Get all journal entries with their lines
    const [entries] = await pool.execute(`
      SELECT 
        je.id as entry_id,
        je.entry_date,
        je.description,
        je.reference,
        jel.id as line_id,
        coa.code,
        coa.name,
        coa.type,
        jel.debit,
        jel.credit
      FROM journal_entries je
      JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
      JOIN chart_of_accounts coa ON jel.account_id = coa.id
      ORDER BY je.id, jel.id
    `);
    
    console.log('All Journal Entries and Lines:');
    console.table(entries);
    
    // Group by entry and show summary
    const entriesMap = {};
    entries.forEach(row => {
      if (!entriesMap[row.entry_id]) {
        entriesMap[row.entry_id] = {
          id: row.entry_id,
          date: row.entry_date,
          description: row.description,
          reference: row.reference,
          lines: []
        };
      }
      entriesMap[row.entry_id].lines.push({
        code: row.code,
        name: row.name,
        type: row.type,
        debit: parseFloat(row.debit || 0),
        credit: parseFloat(row.credit || 0)
      });
    });
    
    console.log('\n\n📋 Detailed Breakdown:\n');
    Object.values(entriesMap).forEach(entry => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Entry #${entry.id} | ${entry.date} | ${entry.description}`);
      console.log(`Reference: ${entry.reference || 'N/A'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      let totalDebit = 0;
      let totalCredit = 0;
      
      entry.lines.forEach(line => {
        if (line.debit > 0) {
          console.log(`  DEBIT:  ${line.code} - ${line.name} (${line.type}) = $${line.debit.toFixed(2)}`);
          totalDebit += line.debit;
        } else {
          console.log(`  CREDIT: ${line.code} - ${line.name} (${line.type}) = $${line.credit.toFixed(2)}`);
          totalCredit += line.credit;
        }
      });
      
      console.log(`  ─────────────────────────────────────────────`);
      console.log(`  Total Debit: $${totalDebit.toFixed(2)} | Total Credit: $${totalCredit.toFixed(2)}`);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.log(`  ⚠️  UNBALANCED! Difference: $${(totalDebit - totalCredit).toFixed(2)}`);
      } else {
        console.log(`  ✅ Balanced`);
      }
    });
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllJournalEntries();

