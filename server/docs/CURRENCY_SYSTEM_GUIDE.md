# Currency System Implementation Guide

## 🌍 Current State

### Currencies in System:
- **USD (US DOLLAR)** - Base Currency (ID: 1)
- **ZWL (ZIG)** - Secondary Currency (ID: 2)

### Issues Found:
1. ❌ **40% of journal entry lines have NULL currency_id**
2. ⚠️ **8 controllers** are either not passing currency_id or hardcoding it to 1
3. ⚠️ Some controllers should use transaction currency, not base currency

---

## 🔧 Required Fixes

### 1. Fix Missing Currency IDs in Journal Entry Lines

**Script to Update Existing Records:**
```sql
-- Update all NULL currency_id to base currency (USD = 1)
UPDATE journal_entry_lines 
SET currency_id = 1 
WHERE currency_id IS NULL;

-- Make currency_id NOT NULL for future entries
ALTER TABLE journal_entry_lines 
MODIFY COLUMN currency_id INT NOT NULL DEFAULT 1;
```

### 2. Fix Controllers to Pass Correct Currency

#### A. **Fee Payment Controller** (Uses Multi-Currency)
```javascript
// BEFORE (WRONG):
await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, 1);

// AFTER (CORRECT):
await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, payment_currency);
```

#### B. **Boarding Fees Payment Controller**
```javascript
// Get base currency
const [[baseCurrency]] = await conn.execute(
    'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
);
const currency_id = baseCurrency ? baseCurrency.id : 1;

await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
```

#### C. **Student Transaction Controller**
```javascript
// Get currency from transaction or use base
const [[baseCurrency]] = await conn.execute(
    'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
);
const currency_id = baseCurrency ? baseCurrency.id : 1;

await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
```

#### D. **Enrollment Controllers** (Both boarding and class)
```javascript
// Get base currency
const [[baseCurrency]] = await conn.execute(
    'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
);
const currency_id = baseCurrency ? baseCurrency.id : 1;

await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
```

---

## 📋 Best Practices

### When Creating Journal Entries:

```javascript
// 1. Always get currency from transaction/payment data
const currency_id = req.body.currency_id || req.body.payment_currency;

// 2. If not provided, get base currency
if (!currency_id) {
    const [[baseCurrency]] = await conn.execute(
        'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
    );
    currency_id = baseCurrency ? baseCurrency.id : 1;
}

// 3. Add currency_id to journal_entry_lines
await conn.execute(`
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, debit, credit, currency_id, description
    ) VALUES (?, ?, ?, ?, ?, ?)
`, [journalEntryId, accountId, debit, credit, currency_id, description]);

// 4. Pass currency_id to balance update
await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
```

### Multi-Currency Transactions:

For transactions involving currency exchange:
1. Store amounts in BOTH currencies
2. Record exchange rate
3. Create journal entries in base currency
4. Track foreign currency amounts separately

Example:
```javascript
const {
    amount,                    // Foreign currency amount
    currency_id,              // Foreign currency ID
    exchange_rate,            // Exchange rate
    base_currency_amount      // Calculated: amount * exchange_rate
} = req.body;

// Journal entries use base currency
await conn.execute(`
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, debit, credit, currency_id
    ) VALUES (?, ?, ?, 0, 1)  -- Always use base currency (1) for journal entries
`, [journalEntryId, accountId, base_currency_amount]);

// But store foreign currency info in payment record
await conn.execute(`
    INSERT INTO fee_payments (
        payment_amount, payment_currency, exchange_rate, base_currency_amount
    ) VALUES (?, ?, ?, ?)
`, [amount, currency_id, exchange_rate, base_currency_amount]);
```

---

## ✅ Controller Status

| Controller | Current Status | Fix Required |
|------------|----------------|--------------|
| **expenseController.js** | ✅ Correct | None - Already gets currency_id |
| **expenseAccountPayablesController.js** | ✅ Correct | None - Already gets currency_id |
| **fixedAssetsController.js** | ✅ Correct | None - Already gets currency_id |
| **studentBalancesController.js** | ✅ Correct | None - Already gets currency_id |
| **cashBankController.js** | ✅ Correct | None - Already handles currency |
| **additionalFeeController.js** | ✅ Correct | None - Already gets currency_id |
| **feePaymentController.js** | ⚠️ Hardcoded | Use `payment_currency` instead of `1` |
| **boardingFeesPaymentsController.js** | ❌ Missing | Add currency_id parameter |
| **enrollmentController.js** | ❌ Missing | Add currency_id parameter |
| **gradelevelEnrollmentController.js** | ❌ Missing | Add currency_id parameter |
| **studentTransactionController.js** | ❌ Missing | Add currency_id parameter |
| **uniformIssueController.js** | ⚠️ Hardcoded | Get base currency dynamically |
| **transportPaymentController.js** | ⚠️ Hardcoded | Get base currency dynamically |
| **weeklyFeeController.js** | ⚠️ Hardcoded | Get base currency dynamically |

---

## 🚀 Implementation Priority

### High Priority (Data Integrity):
1. ✅ Update existing NULL currency_ids in journal_entry_lines
2. ✅ Fix feePaymentController to use payment_currency
3. ✅ Add currency_id to missing controllers

### Medium Priority (Future-Proofing):
4. ✅ Make currency_id NOT NULL in journal_entry_lines
5. ✅ Add validation to ensure currency_id is always provided

### Low Priority (Enhancement):
6. Create multi-currency reporting
7. Add currency conversion utilities
8. Implement currency-specific rounding rules

---

## 📊 Testing Currency Handling

```sql
-- Check journal entry lines without currency
SELECT COUNT(*) FROM journal_entry_lines WHERE currency_id IS NULL;

-- Check account balances by currency
SELECT 
    c.code as currency,
    COUNT(DISTINCT ab.account_id) as accounts,
    SUM(ab.balance) as total_balance
FROM account_balances ab
JOIN currencies c ON ab.currency_id = c.id
GROUP BY c.code;

-- Check for mismatched currencies in same journal entry
SELECT 
    je.id,
    GROUP_CONCAT(DISTINCT jel.currency_id) as currencies
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
GROUP BY je.id
HAVING COUNT(DISTINCT jel.currency_id) > 1;
```

---

## 🎯 Success Criteria

- [ ] Zero journal entry lines with NULL currency_id
- [ ] All controllers passing currency_id to balance updates
- [ ] Multi-currency transactions properly recorded
- [ ] Account balances correctly tracked per currency
- [ ] Financial reports support multi-currency display


