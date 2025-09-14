const { pool } = require('../config/database');

class AccountBalanceService {
    /**
     * Update account balances based on journal entry lines
     * @param {object} conn - Database connection
     * @param {number} journalEntryId - Journal entry ID
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async updateAccountBalancesFromJournalEntry(conn, journalEntryId, currencyId = 1) {
        try {
            console.log(`🔄 Updating account balances for journal entry ${journalEntryId}...`);

            // Get all journal entry lines for this journal entry
            const [journalLines] = await conn.execute(`
                SELECT account_id, debit, credit, currency_id
                FROM journal_entry_lines 
                WHERE journal_entry_id = ?
            `, [journalEntryId]);

            if (journalLines.length === 0) {
                console.log('⚠️ No journal entry lines found for journal entry:', journalEntryId);
                return;
            }

            console.log(`📊 Found ${journalLines.length} journal entry lines to process`);

            // Process each journal entry line
            for (const line of journalLines) {
                const lineCurrencyId = line.currency_id || currencyId;
                const balanceChange = parseFloat(line.debit || 0) - parseFloat(line.credit || 0);
                
                if (Math.abs(balanceChange) < 0.01) {
                    console.log(`⏭️ Skipping account ${line.account_id} - no significant balance change`);
                    continue;
                }

                console.log(`💰 Processing account ${line.account_id}: ${balanceChange > 0 ? '+' : ''}${balanceChange}`);

                // Get current balance for this account and currency
                const [currentBalance] = await conn.execute(`
                    SELECT id, balance 
                    FROM account_balances 
                    WHERE account_id = ? AND currency_id = ? 
                    ORDER BY as_of_date DESC 
                    LIMIT 1
                `, [line.account_id, lineCurrencyId]);

                let newBalance;
                if (currentBalance.length > 0) {
                    // Update existing balance
                    newBalance = parseFloat(currentBalance[0].balance) + balanceChange;
                    await conn.execute(`
                        UPDATE account_balances 
                        SET balance = ?, as_of_date = CURRENT_DATE 
                        WHERE id = ?
                    `, [newBalance, currentBalance[0].id]);
                    
                    console.log(`✅ Updated existing balance for account ${line.account_id}: ${currentBalance[0].balance} → ${newBalance}`);
                } else {
                    // Create new balance record
                    newBalance = balanceChange;
                    await conn.execute(`
                        INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) 
                        VALUES (?, ?, ?, CURRENT_DATE)
                    `, [line.account_id, lineCurrencyId, newBalance]);
                    
                    console.log(`✅ Created new balance for account ${line.account_id}: ${newBalance}`);
                }
            }

            console.log(`✅ Successfully updated account balances for journal entry ${journalEntryId}`);
        } catch (error) {
            console.error('❌ Error updating account balances:', error);
            throw error;
        }
    }

    /**
     * Update account balances for multiple journal entries
     * @param {object} conn - Database connection
     * @param {Array} journalEntryIds - Array of journal entry IDs
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async updateAccountBalancesFromMultipleJournalEntries(conn, journalEntryIds, currencyId = 1) {
        try {
            console.log(`🔄 Updating account balances for ${journalEntryIds.length} journal entries...`);

            for (const journalEntryId of journalEntryIds) {
                await this.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currencyId);
            }

            console.log(`✅ Successfully updated account balances for all journal entries`);
        } catch (error) {
            console.error('❌ Error updating account balances for multiple journal entries:', error);
            throw error;
        }
    }

    /**
     * Recalculate all account balances from journal entries
     * This is useful for fixing existing data or after data migration
     * @param {object} conn - Database connection (optional)
     */
    static async recalculateAllAccountBalances(conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            console.log('🔄 Starting full account balance recalculation...');

            // Clear all existing balances
            await conn.execute('DELETE FROM account_balances');
            console.log('🗑️ Cleared all existing account balances');

            // Get all journal entry lines grouped by account and currency
            const [allLines] = await conn.execute(`
                SELECT 
                    account_id,
                    COALESCE(currency_id, 1) as currency_id,
                    SUM(COALESCE(debit, 0)) as total_debit,
                    SUM(COALESCE(credit, 0)) as total_credit
                FROM journal_entry_lines 
                GROUP BY account_id, COALESCE(currency_id, 1)
                HAVING (SUM(COALESCE(debit, 0)) - SUM(COALESCE(credit, 0))) != 0
            `);

            console.log(`📊 Found ${allLines.length} accounts with balances to recalculate`);

            // Create new balance records
            for (const line of allLines) {
                const balance = parseFloat(line.total_debit) - parseFloat(line.total_credit);
                
                await conn.execute(`
                    INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) 
                    VALUES (?, ?, ?, CURRENT_DATE)
                `, [line.account_id, line.currency_id, balance]);

                console.log(`✅ Recalculated balance for account ${line.account_id}: ${balance}`);
            }

            console.log('✅ Successfully recalculated all account balances');
        } catch (error) {
            console.error('❌ Error recalculating account balances:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Get current balance for a specific account and currency
     * @param {object} conn - Database connection
     * @param {number} accountId - Account ID
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async getAccountBalance(conn, accountId, currencyId = 1) {
        try {
            const [result] = await conn.execute(`
                SELECT balance 
                FROM account_balances 
                WHERE account_id = ? AND currency_id = ? 
                ORDER BY as_of_date DESC 
                LIMIT 1
            `, [accountId, currencyId]);

            return result.length > 0 ? parseFloat(result[0].balance) : 0;
        } catch (error) {
            console.error('❌ Error getting account balance:', error);
            throw error;
        }
    }
}

module.exports = AccountBalanceService;
