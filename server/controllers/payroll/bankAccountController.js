const { pool } = require('../../config/database');

class BankAccountController {
    // Get all organization bank accounts
  async getOrganizationBankAccounts(req, res) {
    try {
      // Get available currencies for bank accounts
      const [currencies] = await pool.execute(
        'SELECT id, code, name, symbol FROM currencies WHERE is_active = TRUE ORDER BY code'
      );

      // First, find the main Bank account (parent account)
      const [bankParent] = await pool.execute(
        'SELECT id, code, name FROM chart_of_accounts WHERE name LIKE "%Bank%" AND parent_id IS NULL AND is_active = TRUE LIMIT 1'
      );

      if (bankParent.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No bank parent account found in chart of accounts'
        });
      }

      // Get all bank sub-accounts (accounts with Bank as parent)
      const [bankAccounts] = await pool.execute(
        `SELECT 
          id,
          code,
          name,
          type,
          parent_id,
          is_active,
          created_at,
          updated_at
        FROM chart_of_accounts 
        WHERE parent_id = ? AND is_active = TRUE
        ORDER BY code ASC`,
        [bankParent[0].id]
      );

      // Get current balances for each bank account
      const bankAccountsWithBalances = await Promise.all(
        bankAccounts.map(async (account) => {
          // Get current balance from account_balances table
          const [balanceResult] = await pool.execute(
            `SELECT 
              ab.balance,
              ab.as_of_date,
              c.code as currency_code,
              c.name as currency_name,
              c.symbol as currency_symbol
            FROM account_balances ab
            JOIN currencies c ON ab.currency_id = c.id
            WHERE ab.account_id = ? 
            ORDER BY ab.as_of_date DESC 
            LIMIT 1`,
            [account.id]
          );

          const balance = balanceResult.length > 0 ? balanceResult[0].balance : 0;
          const currencyCode = balanceResult.length > 0 ? balanceResult[0].currency_code : 'USD';
          const currencyId = currencies.find(c => c.code === currencyCode)?.id || currencies.find(c => c.code === 'USD')?.id || 1;

          return {
            id: account.id,
            name: account.name,
            code: account.code,
            account_number: account.code, // Using code as account number for now
            bank_name: account.name,
            balance: balance,
            currency: currencyCode,
            currency_id: currencyId,
            is_active: account.is_active,
            as_of_date: balanceResult.length > 0 ? balanceResult[0].as_of_date : null,
            parent_account: {
              id: bankParent[0].id,
              code: bankParent[0].code,
              name: bankParent[0].name
            }
          };
        })
      );

      res.json({
        success: true,
        data: bankAccountsWithBalances
      });
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bank accounts',
        error: error.message
      });
    }
  }

    // Get bank account by ID
  async getBankAccountById(req, res) {
    try {
      const { id } = req.params;
      
      // Get the bank account from chart of accounts
      const [bankAccount] = await pool.execute(
        `SELECT 
          id,
          code,
          name,
          type,
          parent_id,
          is_active,
          created_at,
          updated_at
        FROM chart_of_accounts 
        WHERE id = ? AND is_active = TRUE`,
        [id]
      );

      if (bankAccount.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bank account not found'
        });
      }

      const account = bankAccount[0];

      // Get current balance from account_balances table
      const [balanceResult] = await pool.execute(
        `SELECT 
          ab.balance,
          ab.as_of_date,
          c.code as currency_code,
          c.name as currency_name,
          c.symbol as currency_symbol
        FROM account_balances ab
        JOIN currencies c ON ab.currency_id = c.id
        WHERE ab.account_id = ? 
        ORDER BY ab.as_of_date DESC 
        LIMIT 1`,
        [account.id]
      );

      const balance = balanceResult.length > 0 ? balanceResult[0].balance : 0;
      const currencyCode = balanceResult.length > 0 ? balanceResult[0].currency_code : 'USD';

      // Get parent account info
      let parentAccount = null;
      if (account.parent_id) {
        const [parentResult] = await pool.execute(
          'SELECT id, code, name FROM chart_of_accounts WHERE id = ?',
          [account.parent_id]
        );
        if (parentResult.length > 0) {
          parentAccount = parentResult[0];
        }
      }

      const bankAccountData = {
        id: account.id,
        name: account.name,
        code: account.code,
        account_number: account.code,
        bank_name: account.name,
        balance: balance,
        currency: currencyCode,
        currency_id: currencies.find(c => c.code === currencyCode)?.id || currencies.find(c => c.code === 'USD')?.id || 1,
        is_active: account.is_active,
        as_of_date: balanceResult.length > 0 ? balanceResult[0].as_of_date : null,
        parent_account: parentAccount
      };

      res.json({
        success: true,
        data: bankAccountData
      });
    } catch (error) {
      console.error('Error fetching bank account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bank account',
        error: error.message
      });
    }
  }
}

module.exports = new BankAccountController();
