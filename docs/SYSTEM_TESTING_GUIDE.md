# School Management System - Comprehensive Testing Guide

## Overview
This document provides a complete testing guide for the School Management System, covering all modules, integrations, and data flows.

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Core System Tests](#core-system-tests)
4. [Module-Specific Tests](#module-specific-tests)
5. [Integration Tests](#integration-tests)
6. [Data Integrity Tests](#data-integrity-tests)
7. [Performance Tests](#performance-tests)
8. [User Acceptance Tests](#user-acceptance-tests)
9. [Test Execution Guide](#test-execution-guide)

## System Architecture Overview

### Core Modules
- **Student Management**: Student records, enrollments, academic tracking
- **Financial Management**: Tuition fees, payments, student balances
- **Transport Management**: Routes, registrations, payments
- **Inventory Management**: Uniforms, supplies, stock tracking
- **Accounting System**: Double-entry bookkeeping, financial reports
- **Reporting System**: Income statements, balance sheets, student reports

### Database Tables
- **Students**: `students`, `student_transactions`, `student_balances`
- **Transport**: `transport_routes`, `transport_payments`, `student_transport_registrations`
- **Inventory**: `inventory_categories`, `inventory_items`, `uniform_issues`, `uniform_payments`
- **Accounting**: `chart_of_accounts`, `journal_entries`, `journal_entry_lines`, `accounting_periods`

## Testing Environment Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the server
npm start
```

### Test Data Requirements
- At least 5 students with different registration numbers
- 3-5 active transport routes
- 10+ revenue accounts in chart of accounts
- 10+ expense accounts in chart of accounts
- Sample journal entries with transactions
- At least 1 accounting period

## Core System Tests

### 1. Database Connection Test
**Purpose**: Verify database connectivity and basic operations
```javascript
// Test database connection
const connection = await pool.getConnection();
const [rows] = await connection.execute('SELECT 1 as test');
connection.release();
```

**Expected Result**: Connection successful, query returns `{test: 1}`

### 2. Database Schema Test
**Purpose**: Verify all required tables and columns exist
```sql
-- Required tables
SHOW TABLES LIKE 'students';
SHOW TABLES LIKE 'transport_payments';
SHOW TABLES LIKE 'journal_entries';

-- Required columns
SHOW COLUMNS FROM transport_payments LIKE 'route_id';
SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transport_payments' AND COLUMN_NAME = 'transport_fee_id';
```

**Expected Result**: All tables and columns exist, `transport_fee_id` is nullable

### 3. Data Integrity Test
**Purpose**: Verify referential integrity and data consistency
```sql
-- Check for orphaned student transactions
SELECT COUNT(*) FROM student_transactions st 
LEFT JOIN students s ON st.student_reg_number = s.RegNumber 
WHERE s.RegNumber IS NULL;

-- Check for invalid journal entry lines
SELECT COUNT(*) FROM journal_entry_lines jel 
LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id 
WHERE coa.id IS NULL;
```

**Expected Result**: No orphaned records found

## Module-Specific Tests

### Student Management Module

#### Test 1: Student Registration
**Steps**:
1. Navigate to Student Registration page
2. Fill in student details (name, registration number, class, etc.)
3. Submit the form
4. Verify student appears in student list

**Expected Result**: Student successfully created and visible in system

#### Test 2: Student Financial Records
**Steps**:
1. Navigate to Student Financial Record page
2. Select a student with transactions
3. Verify both DEBIT and CREDIT transactions are displayed
4. Check that transport payments appear in the list

**Expected Result**: All transaction types visible, including transport payments

#### Test 3: Student Balance Calculation
**Steps**:
1. Create a student with tuition fees (DEBIT)
2. Record payments (CREDIT)
3. Check student balance calculation
4. Verify balance updates correctly

**Expected Result**: Balance = Total DEBIT - Total CREDIT

### Transport Management Module

#### Test 1: Route Management
**Steps**:
1. Navigate to Transport Routes page
2. Create a new route with pickup/dropoff points
3. Set weekly fee amount
4. Activate the route

**Expected Result**: Route created and available for student registration

#### Test 2: Student Registration to Transport
**Steps**:
1. Navigate to Add Student Registration page
2. Search for student by registration number
3. Select a route
4. Submit registration
5. Verify student transaction is created (DEBIT)

**Expected Result**: Registration successful, student owes weekly fee

#### Test 3: Transport Payment Recording
**Steps**:
1. Navigate to Transport Payments page
2. Select route and search for student
3. Record payment amount
4. Submit payment
5. Verify student transaction is created (CREDIT)

**Expected Result**: Payment recorded, student balance reduced

#### Test 4: Transport Registration Deletion
**Steps**:
1. Navigate to Student Registrations page
2. Delete a registration
3. Verify student transaction is reversed (CREDIT)

**Expected Result**: Registration deleted, student balance adjusted

### Inventory Management Module

#### Test 1: Category Management
**Steps**:
1. Navigate to Configurations page
2. Add new inventory category
3. Verify category appears in dropdown

**Expected Result**: Category created and available for items

#### Test 2: Item Management
**Steps**:
1. Navigate to Add Item page
2. Fill in item details (name, category, stock, price)
3. Submit item
4. Verify item appears in inventory list

**Expected Result**: Item created and visible in inventory

#### Test 3: Uniform Issuing
**Steps**:
1. Navigate to Issue Uniform page
2. Search for student by registration number
3. Search for uniform item
4. Issue uniform to student
5. Verify stock is reduced and student transaction created

**Expected Result**: Uniform issued, stock updated, student owes money

#### Test 4: Uniform Payment
**Steps**:
1. Record payment for issued uniform
2. Verify student transaction is created (CREDIT)
3. Check student balance is updated

**Expected Result**: Payment recorded, student balance reduced

### Accounting System Module

#### Test 1: Chart of Accounts
**Steps**:
1. Verify revenue accounts exist (4000-4999 range)
2. Verify expense accounts exist (5000-5999 range)
3. Check all accounts are active

**Expected Result**: Complete chart of accounts with proper numbering

#### Test 2: Journal Entry Creation
**Steps**:
1. Record a transport payment
2. Verify journal entry is created
3. Check journal entry lines (Debit Cash, Credit Transport Revenue)
4. Verify double-entry bookkeeping

**Expected Result**: Balanced journal entry with proper accounts

#### Test 3: Income Statement Generation
**Steps**:
1. Navigate to Income Statement page
2. Select September 2025
3. Verify all revenue accounts are displayed (including zero values)
4. Verify all expense accounts are displayed (including zero values)
5. Check totals are calculated correctly

**Expected Result**: Complete income statement with all accounts visible

#### Test 4: Student Transaction Integration
**Steps**:
1. Record various student transactions (tuition, transport, uniforms)
2. Verify each creates corresponding journal entries
3. Check student balance updates
4. Verify accounting entries are balanced

**Expected Result**: All student transactions properly integrated with accounting

## Integration Tests

### Test 1: Transport Payment Full Flow
**Steps**:
1. Register student to transport route
2. Record transport payment
3. Verify:
   - Student transaction created (CREDIT)
   - Journal entry created (Debit Cash, Credit Transport Revenue)
   - Student balance updated
   - Transport payment recorded

**Expected Result**: Complete integration working correctly

### Test 2: Uniform Issue and Payment Flow
**Steps**:
1. Issue uniform to student
2. Record uniform payment
3. Verify:
   - Student transaction created (DEBIT for issue, CREDIT for payment)
   - Journal entries created
   - Stock levels updated
   - Student balance updated

**Expected Result**: Complete uniform flow working correctly

### Test 3: Student Financial Record Integration
**Steps**:
1. Create various student transactions (tuition, transport, uniforms)
2. Navigate to Student Financial Record
3. Verify all transaction types are visible
4. Check that transport payments appear in the list

**Expected Result**: All transaction types visible in student records

## Data Integrity Tests

### Test 1: Referential Integrity
**Purpose**: Ensure all foreign key relationships are maintained
```sql
-- Check student transactions reference valid students
SELECT COUNT(*) FROM student_transactions st 
LEFT JOIN students s ON st.student_reg_number = s.RegNumber 
WHERE s.RegNumber IS NULL;

-- Check journal entries reference valid accounts
SELECT COUNT(*) FROM journal_entry_lines jel 
LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id 
WHERE coa.id IS NULL;
```

### Test 2: Data Consistency
**Purpose**: Verify data consistency across related tables
```sql
-- Check student balance matches transaction sum
SELECT s.RegNumber, s.Balance, 
       COALESCE(SUM(CASE WHEN st.transaction_type = 'DEBIT' THEN st.amount ELSE 0 END), 0) as total_debit,
       COALESCE(SUM(CASE WHEN st.transaction_type = 'CREDIT' THEN st.amount ELSE 0 END), 0) as total_credit,
       (COALESCE(SUM(CASE WHEN st.transaction_type = 'DEBIT' THEN st.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN st.transaction_type = 'CREDIT' THEN st.amount ELSE 0 END), 0)) as calculated_balance
FROM students s
LEFT JOIN student_transactions st ON s.RegNumber = st.student_reg_number
GROUP BY s.RegNumber, s.Balance
HAVING s.Balance != calculated_balance;
```

### Test 3: Accounting Balance Verification
**Purpose**: Ensure accounting entries are balanced
```sql
-- Check journal entries are balanced
SELECT je.id, je.description,
       SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END) as total_debits,
       SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END) as total_credits,
       (SUM(CASE WHEN jel.debit > 0 THEN jel.debit ELSE 0 END) - 
        SUM(CASE WHEN jel.credit > 0 THEN jel.credit ELSE 0 END)) as difference
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
GROUP BY je.id, je.description
HAVING difference != 0;
```

## Performance Tests

### Test 1: Database Query Performance
**Purpose**: Ensure queries perform well with realistic data volumes
```javascript
// Test income statement query performance
const startTime = Date.now();
const [revenue] = await connection.execute(revenueQuery);
const endTime = Date.now();
const queryTime = endTime - startTime;

if (queryTime > 5000) { // 5 seconds
  throw new Error(`Income statement query too slow: ${queryTime}ms`);
}
```

### Test 2: Concurrent User Simulation
**Purpose**: Test system behavior under concurrent load
```javascript
// Simulate multiple users recording payments simultaneously
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(recordTransportPayment());
}
await Promise.all(promises);
```

## User Acceptance Tests

### Test 1: Complete Student Journey
**Scenario**: New student enrollment to graduation
1. Register new student
2. Enroll in class
3. Register for transport
4. Issue uniforms
5. Record various payments
6. Generate student financial report
7. Verify all data is accurate

### Test 2: Monthly Financial Reporting
**Scenario**: End-of-month financial reporting
1. Generate income statement for current month
2. Verify all revenue and expense accounts are visible
3. Check totals are correct
4. Generate balance sheet
5. Verify accounting equation (Assets = Liabilities + Equity)

### Test 3: Transport Management Workflow
**Scenario**: Complete transport management cycle
1. Create transport routes
2. Register students to routes
3. Record weekly payments
4. Handle route changes
5. Generate transport reports
6. Verify financial integration

## Test Execution Guide

### Automated Testing
```bash
# Run comprehensive system test
node scripts/comprehensive-system-test.js

# Run specific module tests
node scripts/test-income-statement-all-accounts.js
node scripts/test-transport-payments.js
node scripts/test-student-financial-record-fix.js
```

### Manual Testing Checklist

#### Pre-Test Setup
- [ ] Server is running on port 5000
- [ ] Database is accessible
- [ ] Test data is loaded
- [ ] Browser is cleared of cache

#### Core Functionality
- [ ] Student registration works
- [ ] Transport registration works
- [ ] Payment recording works
- [ ] Inventory management works
- [ ] Financial reports generate correctly

#### Integration Points
- [ ] Student transactions create accounting entries
- [ ] Transport payments update student balances
- [ ] Uniform issues create proper transactions
- [ ] Income statement shows all accounts

#### Data Integrity
- [ ] No orphaned records
- [ ] Accounting entries are balanced
- [ ] Student balances are accurate
- [ ] Stock levels are correct

### Test Results Documentation

#### Test Report Template
```
Test Date: [DATE]
Tester: [NAME]
Environment: [DEVELOPMENT/PRODUCTION]
Browser: [BROWSER VERSION]

Test Results:
✅ Passed: [NUMBER]
❌ Failed: [NUMBER]
📈 Success Rate: [PERCENTAGE]

Failed Tests:
- [TEST NAME]: [ERROR DESCRIPTION]

Recommendations:
- [ACTION ITEMS]
```

### Troubleshooting Common Issues

#### Issue: Income Statement shows "No expense accounts configured"
**Solution**: 
1. Restart the server
2. Verify controller changes are applied
3. Check database has expense accounts

#### Issue: Transport payments not appearing in student transactions
**Solution**:
1. Check `createTransactionHelper` is static
2. Verify transport payment creates CREDIT transaction
3. Check student financial record query includes CREDIT transactions

#### Issue: Database connection errors
**Solution**:
1. Check database server is running
2. Verify connection string in .env
3. Check database credentials

#### Issue: Frontend not updating after backend changes
**Solution**:
1. Hard refresh browser (Ctrl+F5)
2. Clear browser cache
3. Restart development server

## Conclusion

This comprehensive testing guide ensures the School Management System functions correctly across all modules and integrations. Regular execution of these tests will help maintain system reliability and data integrity.

For questions or issues, refer to the troubleshooting section or contact the development team.
