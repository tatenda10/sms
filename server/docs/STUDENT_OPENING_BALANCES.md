# Student Opening Balance Entry System

## Overview
This document explains the **Student Opening Balance Entry** feature, which is designed to record historical student debts that existed BEFORE the system went live.

## Purpose
When implementing a new accounting system, schools often have students who already owe fees from previous terms/years. This feature allows you to properly record these historical debts in the accounting system.

---

## ⚠️ IMPORTANT: When to Use This Feature

### ✅ USE FOR:
- **Opening balances only** - Historical debts from before the system was implemented
- **Initial system setup** - When onboarding existing students with outstanding balances
- **Students transferring from old system** - To record their previous unpaid fees

### ❌ DO NOT USE FOR:
- **Mid-term adjustments** - Use the appropriate module instead:
  - **Waivers Module** - To forgive/reduce fees
  - **Payments Module** - To record payments
  - **Accounting Team** - For any other corrections or adjustments

---

## How It Works

### Accounting Treatment
When you record a student opening balance, the system creates proper double-entry journal entries:

**For DEBIT (Student Owes Money) - Most Common:**
```
DEBIT:  Accounts Receivable (1100)      $500
CREDIT: Retained Earnings (3998)               $500

Description: "Opening Balance - Historical Debt from 2023 Term 1"
```

**For CREDIT (Student Has Overpaid) - Rare:**
```
DEBIT:  Retained Earnings (3998)        $200
CREDIT: Accounts Receivable (1100)             $200

Description: "Opening Balance - Student Credit from 2023"
```

### Why Retained Earnings?
- **Retained Earnings (3998)** is used because these are historical balances from BEFORE the current accounting period
- This ensures your current period's Income Statement is accurate (doesn't include old fees as current revenue)
- Your Balance Sheet will correctly show the historical receivable

---

## Step-by-Step Guide

### 1. Search for Student
1. Enter the student's registration number
2. Click "Search"
3. Select the correct student from results

### 2. Enter Opening Balance
1. **Balance Type**: 
   - Select "Student Owes Money (Debit)" for most cases
   - Select "Student Has Credit" only if they overpaid in the old system
   
2. **Amount**: Enter the exact amount they owed before system implementation

3. **Description**: Be specific about what this debt is for:
   - ✅ Good: "Opening Balance - Unpaid Tuition from 2023 Term 1 and Term 2"
   - ✅ Good: "Opening Balance - Historical Boarding Fees 2022-2023"
   - ❌ Bad: "Opening balance"
   - ❌ Bad: "Old fees"

4. **Reference**: Either:
   - Enter a reference from your old system (e.g., "OLD-INV-2023-0045")
   - Click "Generate" to auto-create a unique reference
   - Leave blank for auto-generation

### 3. Review and Submit
- Double-check the amount and description
- Click "Record Opening Balance"
- The system will create the journal entry and update the student's balance

---

## Impact on Financial Statements

### Balance Sheet
- **Assets**: Increases Accounts Receivable by the debt amount
- **Equity**: Decreases Retained Earnings by the debt amount
- **Result**: Balance Sheet remains balanced

### Income Statement
- **No Impact** - Opening balances do NOT appear as revenue/expenses
- Only CURRENT period transactions affect the Income Statement

### Student Account
- Student's balance is updated to reflect the historical debt
- They will see this amount when they view their account
- Payments can be applied against this balance normally

---

## Best Practices

### 1. Do This During Initial Setup
- Record ALL student opening balances BEFORE going live with normal operations
- This prevents confusion between old debts and new fees

### 2. Be Descriptive
- Always explain what period/year the debt is from
- Include term, year, and type of fees if possible
- Future accountants will thank you!

### 3. Verify Balances
- Cross-check with your old system
- Ensure amounts match exactly
- Get approval from finance team before entering large amounts

### 4. Document Everything
- Keep a spreadsheet of all opening balances entered
- Include: Student name, Reg number, Amount, Date entered, Reason
- This creates an audit trail

---

## Technical Details

### Database Changes
The feature uses the existing `student_balances` and `journal_entries` tables:

**Transaction Record:**
```sql
INSERT INTO student_transactions (
    student_id, transaction_type, amount, 
    description, reference, journal_entry_id
)
```

**Student Balance Update:**
```sql
UPDATE student_balances 
SET current_balance = current_balance + amount
WHERE student_id = ?
```

**Journal Entry:**
```sql
-- Journal Entry Header
INSERT INTO journal_entries (description, reference)

-- Journal Entry Lines
INSERT INTO journal_entry_lines (account_id, debit, credit)
-- Line 1: DEBIT Accounts Receivable
-- Line 2: CREDIT Retained Earnings

-- Account Balance Update
UPDATE account_balances SET balance = balance + amount
```

### API Endpoint
```
POST /api/students/manual-balance-adjustment
```

**Request Body:**
```json
{
    "student_id": "2024/001",
    "adjustment_type": "debit",
    "amount": 500.00,
    "description": "Opening Balance - Unpaid fees from 2023 Term 1",
    "reference": "OB-2024-001"
}
```

**Response:**
```json
{
    "message": "Opening balance recorded successfully",
    "data": {
        "student_id": "2024/001",
        "student_name": "John Doe",
        "adjustment_type": "debit",
        "amount": 500.00,
        "reference": "OB-2024-001",
        "journal_entry_id": 1234,
        "note": "This is an opening balance entry for historical debt"
    }
}
```

---

## Common Questions

### Q: Can I use this to correct a mistake in current fees?
**A:** No. Use the Waivers module or contact accounting. This is ONLY for historical balances.

### Q: What if I entered the wrong amount?
**A:** Contact your accounting team. They may need to create a correcting journal entry.

### Q: Can I delete an opening balance after entering it?
**A:** No. Once entered, it creates permanent accounting records. Contact accounting for corrections.

### Q: Should I use this for students who paid in full before the system?
**A:** No. Only enter opening balances for students who still owe money (or have credit).

### Q: What's the difference between DEBIT and CREDIT?
**A:**
- **DEBIT** = Student owes you money (most common)
- **CREDIT** = Student overpaid and has credit on account (rare)

---

## Related Documentation
- [Waivers System](./WAIVERS_SYSTEM.md) - For fee forgiveness
- [Student Payments](./PAYMENT_SYSTEM.md) - For recording payments
- [Chart of Accounts](./CHART_OF_ACCOUNTS.md) - Understanding account codes

---

## Support
For questions or issues with opening balances, contact the accounting team or system administrator.

**Last Updated:** October 28, 2024

