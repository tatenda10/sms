const { pool } = require('../../config/database');
const AccountBalanceService = require('../../services/accountBalanceService');

class CashBankController {
    // Get Cash and Bank account balances from COA
    static async getAccountBalances(req, res) {
        try {
            const [accounts] = await pool.execute(`
                SELECT 
                    coa.id,
                    coa.name as account_name,
                    coa.type as account_type,
                    coa.code,
                    'USD' as currency_code,
                    'US Dollar' as currency_name,
                    COALESCE(ab.balance, 0) as current_balance
                FROM chart_of_accounts coa
                LEFT JOIN account_balances ab ON coa.id = ab.account_id AND ab.currency_id = 1
                WHERE (coa.name = 'Cash on Hand' OR coa.name = 'Bank Account')
                AND coa.type = 'Asset'
                ORDER BY coa.code
            `);

            res.json({
                success: true,
                data: accounts
            });
        } catch (error) {
            console.error('Error fetching cash/bank balances:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching account balances',
                error: error.message
            });
        }
    }

    // Record cash injection (add cash to business)
    static async recordCashInjection(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash account from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const finalReferenceNumber = reference || `CASH-INJ-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Debit Cash)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, cashAccountId, parseFloat(amount), 0, currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash injection recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash injection:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording cash injection',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank deposit (add money to bank)
    static async recordBankDeposit(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Bank account from COA
            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank account not found in Chart of Accounts'
                });
            }

            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-DEP-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Debit Bank)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, bankAccountId, parseFloat(amount), 0, currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank deposit recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank deposit:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording bank deposit',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record cash to bank transfer
    static async recordCashToBankTransfer(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash and Bank accounts from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0 || bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash or Bank account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `CASH-BANK-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;
            const amountFloat = parseFloat(amount);

            // Create journal entry lines
            // Debit Bank, Credit Cash
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
            `, [
                journalEntryId, bankAccountId, amountFloat, 0, currency_id || 1,
                journalEntryId, cashAccountId, 0, amountFloat, currency_id || 1
            ]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash to Bank transfer recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash to bank transfer:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording transfer',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank to cash transfer
    static async recordBankToCashTransfer(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash and Bank accounts from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0 || bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash or Bank account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-CASH-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;
            const amountFloat = parseFloat(amount);

            // Create journal entry lines
            // Debit Cash, Credit Bank
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
            `, [
                journalEntryId, cashAccountId, amountFloat, 0, currency_id || 1,
                journalEntryId, bankAccountId, 0, amountFloat, currency_id || 1
            ]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank to Cash transfer recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank to cash transfer:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording transfer',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record cash withdrawal (take cash out of business)
    static async recordCashWithdrawal(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash account from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const finalReferenceNumber = reference || `CASH-WD-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Credit Cash)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, cashAccountId, 0, parseFloat(amount), currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash withdrawal recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording cash withdrawal',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank withdrawal (take money from bank)
    static async recordBankWithdrawal(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Bank account from COA
            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank account not found in Chart of Accounts'
                });
            }

            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-WD-${Date.now()}`;

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (description, reference, transaction_date, created_by)
                VALUES (?, ?, CURDATE(), ?)
            `, [description, finalReferenceNumber, req.user.id]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Credit Bank)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, bankAccountId, 0, parseFloat(amount), currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank withdrawal recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording bank withdrawal',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }
}

module.exports = CashBankController;

