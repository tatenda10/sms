# Opening Balance Payables Feature

## Overview
This feature allows you to record historical debts or payables that existed before the system was implemented, without requiring an associated expense record.

## Use Cases
- Recording old debts (e.g., City Council debt from previous years)
- Migrating existing payables from another system
- Adding opening balances when starting to use the accounting system

## How It Works

### Database Changes
- Made `original_expense_id` nullable in `accounts_payable_balances` table
- This allows payables to exist without being linked to a specific expense

### Backend API
**Endpoint:** `POST /api/expenses/accounts-payable/opening-balance`

**Request Body:**
```json
{
  "supplier_id": 5,              // Optional - can be null for non-supplier payables
  "amount": 50000.00,            // Required - the debt amount
  "description": "City Council - Historical Debt from 2020",  // Required
  "reference_number": "CC-2020-DEBT",  // Optional
  "due_date": "2025-12-31",      // Optional
  "opening_balance_date": "2020-01-01",  // Required - when the debt originated
  "currency_id": 1,              // Required - defaults to 1 (USD)
  "expense_account_code": "5000" // Optional - defaults to 5000 (General Expenses)
}
```

### Accounting Treatment
When you create an opening balance payable, the system automatically:

1. **Creates a journal entry:**
   - DEBIT: Expense Account (e.g., 5000 - General Expenses)
   - CREDIT: Accounts Payable (2000)

2. **Creates an accounts payable balance record:**
   - Records the debt in the `accounts_payable_balances` table
   - Sets `original_expense_id` to NULL (indicating it's an opening balance)
   - Status is set to 'outstanding'

3. **Updates account balances:**
   - Increases the Accounts Payable balance
   - Increases the Expense account balance

### Frontend Usage

1. **Navigate to:** Dashboard → Expenses → Accounts Payable

2. **Click:** "Add Opening Balance" button (top right)

3. **Fill in the form:**
   - **Supplier** (Optional): Select if the payable is to a specific supplier
   - **Amount** (Required): Enter the debt amount
   - **Description** (Required): Describe the debt (e.g., "City Council - Historical Debt")
   - **Reference Number** (Optional): Enter manually or click "Auto Generate" for a unique reference (e.g., OB-2025-123-4567)
   - **Opening Balance Date** (Required): When the debt originated
   - **Due Date** (Optional): When payment is due
   - **Expense Account** (Required): Select from dropdown list of all expense accounts in your Chart of Accounts

4. **Submit:** The payable will appear in the main list

5. **Make Payments:** Once created, you can make payments against this payable just like any other debt

## Example Scenarios

### Scenario 1: City Council Debt
```
Supplier: (Leave blank or create "City Council" supplier)
Amount: 50,000.00
Description: City Council - Outstanding debt from 2020
Reference: CC-2020
Opening Balance Date: 2020-01-01
Due Date: (Leave blank if no specific due date)
Expense Account: Select "5000 - General Expenses" from dropdown
```

### Scenario 2: Supplier Debt from Previous System
```
Supplier: ABC Supplies Ltd
Amount: 15,000.00
Description: Opening balance - migrated from old system
Reference: MIGRATE-2024-001
Opening Balance Date: 2024-01-01
Due Date: 2025-06-30
Expense Account: Select appropriate expense account (e.g., "5100 - Supplies Expense")
```

## Running the Migration

To enable this feature on your database:

```bash
# Windows
npm run add-opening-balance-support

# Or manually
node run-opening-balance-migration.js
```

## Important Notes

1. **Historical Entries:** Opening balances are meant for historical debts. For new expenses, use the regular "Add Expense" flow.

2. **Expense Account:** The system debits an expense account when creating the opening balance. This is for accounting completeness. Choose the most appropriate expense account code.

3. **Payments:** Once created, opening balance payables work exactly like regular payables - you can:
   - View transaction history
   - Make payments
   - Track outstanding balances

4. **Reporting:** Opening balance payables appear in:
   - Accounts Payable list
   - Balance Sheet (as part of Accounts Payable)
   - General Ledger
   - Trial Balance

5. **Identification:** You can identify opening balance payables by checking if `original_expense_id` is NULL in the database.

## Technical Details

### Files Modified
- `server/migrations/add_opening_balance_payables.sql` - Database migration
- `server/controllers/expenses/expenseAccountPayablesController.js` - Backend logic
- `server/routes/expenses/accountsPayable.js` - API route
- `client/src/pages/expenses/AccountsPayable.jsx` - Frontend UI

### Database Schema Change
```sql
ALTER TABLE accounts_payable_balances 
MODIFY COLUMN original_expense_id INT NULL;
```

### Journal Entry Format
```
Reference: OPENING-BAL-{timestamp}
Description: Opening Balance: {user_description}
Journal ID: 6 (General Journal)
```

## Troubleshooting

**Issue:** "Required accounts not found"
- **Solution:** Ensure Chart of Accounts has:
  - Account 2000 (Accounts Payable)
  - The expense account you're using (default: 5000)

**Issue:** "Failed to create opening balance"
- **Solution:** Check server logs for detailed error messages
- Verify all required fields are filled
- Ensure the opening balance date is valid

**Issue:** Payable not appearing in list
- **Solution:** Refresh the page or check filters (status, search terms)

