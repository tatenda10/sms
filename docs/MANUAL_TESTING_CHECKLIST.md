# School Management System - Manual Testing Checklist

## Overview
This document provides a comprehensive manual testing checklist for the School Management System. Use this checklist to verify all functionality works correctly before deployment.

## How to Use This Checklist
- [ ] Check each item as you complete the test
- [ ] Note any issues or observations in the "Notes" column
- [ ] Mark tests as PASS/FAIL with any relevant comments
- [ ] Complete all tests before marking the system as ready for production

---

## Pre-Testing Setup

### 0.1 System Configuration Setup (MUST BE DONE FIRST)
- [ ] **Server is running on port 5000**
- [ ] **Database is accessible and contains test data**
- [ ] **Browser cache is cleared**

### 0.2 User Management Setup
- [ ] **Create Admin User**
  - [ ] Navigate to Admin → Users → Add User
  - [ ] Create admin user with username: `sysadmin`
  - [ ] Set password and assign all roles
  - [ ] Verify user can login
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Test Users with Different Roles**
  - [ ] Create user with `STUDENT_REGISTRATIONS` role
  - [ ] Create user with `ACCOUNTING_MANAGEMENT` role
  - [ ] Create user with `EXPENSES_MANAGEMENT` role
  - [ ] Create user with `BOARDING_MANAGEMENT` role
  - [ ] Create user with `TRANSPORT_MANAGEMENT` role
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.3 System Configuration Setup
- [ ] **Create Departments**
  - [ ] Navigate to Admin → Configurations → Departments
  - [ ] Create departments: "Academic", "Administration", "Finance", "Boarding", "Transport"
  - [ ] Save all departments
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Job Titles**
  - [ ] Navigate to Admin → Configurations → Job Titles
  - [ ] Create job titles: "Principal", "Teacher", "Accountant", "Driver", "Matron", "Clerk"
  - [ ] Save all job titles
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Subjects**
  - [ ] Navigate to Admin → Configurations → Subjects
  - [ ] Create ZIMSEC subjects:
    - [ ] **Core Subjects**: English Language, Mathematics, Shona, Ndebele
    - [ ] **Sciences**: Physics, Chemistry, Biology, Combined Science, Integrated Science, Agriculture, Geography
    - [ ] **Humanities**: History, Religious Studies, Family and Religious Studies (FRS), Social Studies
    - [ ] **Languages**: English Literature, Shona Literature, Ndebele Literature, French, Portuguese
    - [ ] **Commercial**: Accounting, Business Studies, Economics, Commerce, Office Practice
    - [ ] **Technical**: Technical Drawing, Woodwork, Metalwork, Building Studies, Food and Nutrition, Fashion and Fabrics, Art and Design
    - [ ] **Technology**: Computer Studies, Information and Communication Technology (ICT)
    - [ ] **Physical Education**: Physical Education, Sports Science
    - [ ] **Additional**: Music, Drama, Dance, Environmental Science, Development Studies
  - [ ] Save all subjects
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Streams**
  - [ ] Navigate to Admin → Configurations → Streams
  - [ ] Create streams: "A", "B", "C", "D"
  - [ ] Save all streams
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.4 Class Structure Setup
- [ ] **Create Grade Levels**
  - [ ] Navigate to Classes → Grade Levels
  - [ ] Create grade levels for ZIMSEC structure:
    - [ ] ECD A, ECD B (Early Childhood Development)
    - [ ] Grade 1, Grade 2, Grade 3, Grade 4, Grade 5, Grade 6, Grade 7 (Primary)
    - [ ] Form 1, Form 2, Form 3, Form 4, Form 5, Form 6 (Secondary)
  - [ ] Save all grade levels
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Classes**
  - [ ] Navigate to Classes → Manage Classes
  - [ ] Create classes for each grade level and stream:
    - [ ] **ECD Level**: ECD A, ECD B
    - [ ] **Primary Level**: 
      - [ ] Grade 1A, Grade 1B, Grade 1C, Grade 1D
      - [ ] Grade 2A, Grade 2B, Grade 2C, Grade 2D
      - [ ] Grade 3A, Grade 3B, Grade 3C, Grade 3D
      - [ ] Grade 4A, Grade 4B, Grade 4C, Grade 4D
      - [ ] Grade 5A, Grade 5B, Grade 5C, Grade 5D
      - [ ] Grade 6A, Grade 6B, Grade 6C, Grade 6D
      - [ ] Grade 7A, Grade 7B, Grade 7C, Grade 7D
    - [ ] **Secondary Level**:
      - [ ] Form 1A, Form 1B, Form 1C, Form 1D
      - [ ] Form 2A, Form 2B, Form 2C, Form 2D
      - [ ] Form 3A, Form 3B, Form 3C, Form 3D
      - [ ] Form 4A, Form 4B, Form 4C, Form 4D
      - [ ] Form 5A, Form 5B, Form 5C, Form 5D
      - [ ] Form 6A, Form 6B, Form 6C, Form 6D
  - [ ] Save all classes
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Assign Subjects to Classes**
  - [ ] Navigate to Classes → Subject Assignments
  - [ ] Assign all subjects to each class
  - [ ] Save all assignments
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.5 Boarding Setup
- [ ] **Create Hostels**
  - [ ] Navigate to Boarding → Hostels
  - [ ] Create hostels: "Boys Hostel A", "Boys Hostel B", "Girls Hostel A", "Girls Hostel B"
  - [ ] Set capacity for each hostel
  - [ ] Save all hostels
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Rooms**
  - [ ] Navigate to Boarding → Rooms
  - [ ] Create rooms for each hostel (e.g., Room 1, Room 2, etc.)
  - [ ] Set room capacity and type
  - [ ] Save all rooms
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.6 Transport Setup
- [ ] **Create Transport Routes**
  - [ ] Navigate to Transport → Manage Routes
  - [ ] Create routes: "Route 1 - Town", "Route 2 - Suburbs", "Route 3 - Rural"
  - [ ] Set pickup points and fees for each route
  - [ ] Activate all routes
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.7 Inventory Setup
- [ ] **Create Inventory Categories**
  - [ ] Navigate to Inventory → Configurations
  - [ ] Create categories: "Uniforms", "Books", "Stationery", "Sports Equipment"
  - [ ] Save all categories
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Inventory Items**
  - [ ] Navigate to Inventory → Add Item
  - [ ] Create uniform items: "School Shirt", "School Pants", "School Dress", "Blazer"
  - [ ] Create book items: "Mathematics Textbook", "English Textbook", "Science Textbook"
  - [ ] Set prices and stock levels
  - [ ] Save all items
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.8 Accounting Setup
- [ ] **Verify Chart of Accounts**
  - [ ] Navigate to Accounting → Chart of Accounts
  - [ ] Verify all required accounts exist:
    - [ ] Cash on Hand (1000)
    - [ ] Bank Account (1010)
    - [ ] Tuition Revenue accounts (4000 series)
    - [ ] Expense accounts (5000 series)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Create Invoice Structures**
  - [ ] Navigate to Billing → Invoice Structures
  - [ ] Create tuition fee structures for each class
  - [ ] Set fee amounts and terms
  - [ ] Save all structures
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.9 Employee Setup
- [ ] **Create Employees**
  - [ ] Navigate to Admin → Employees → Add Employee
  - [ ] Create employees: "Principal", "Teachers", "Accountant", "Driver", "Matron"
  - [ ] Set salaries and positions
  - [ ] Save all employees
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.10 Results Setup
- [ ] **Create Grading Criteria**
  - [ ] Navigate to Results → Grading Criteria
  - [ ] Set up grading scales (A+, A, B+, B, C+, C, D, F)
  - [ ] Set pass/fail criteria
  - [ ] Save criteria
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 0.11 Final Setup Verification
- [ ] **Verify All Configurations**
  - [ ] Check that all departments, job titles, subjects, streams are created
  - [ ] Verify all classes are created and subjects assigned
  - [ ] Confirm hostels and rooms are set up
  - [ ] Verify transport routes are active
  - [ ] Check inventory items are available
  - [ ] Confirm chart of accounts is complete
  - [ ] Verify employees are created
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

**IMPORTANT**: All configuration setup must be completed before proceeding with student registration and other tests. The system requires these configurations to function properly.

---

## 1. STUDENT MANAGEMENT MODULE

### 1.1 Student Registration
- [ ] **Add New Student**
  - [ ] Navigate to Students → Add Student
  - [ ] Fill in all required fields (name, registration number, class, etc.)
  - [ ] Submit form successfully
  - [ ] Verify student appears in student list
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Student List Display**
  - [ ] Navigate to Students page
  - [ ] Verify all students are displayed
  - [ ] Check pagination works correctly
  - [ ] Test search functionality
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Student Details**
  - [ ] Click on a student to view details
  - [ ] Verify all student information is displayed correctly
  - [ ] Check that edit functionality works
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 1.2 Class Enrollment
- [ ] **Enroll Student in Class**
  - [ ] Navigate to class enrollment page
  - [ ] Select a student and class
  - [ ] Submit enrollment
  - [ ] Verify enrollment is recorded
  - [ ] Check that student transaction is created (DEBIT)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Class Enrollment List**
  - [ ] View enrolled students in a class
  - [ ] Verify enrollment details are correct
  - [ ] Test filtering and search
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Enrollment Transactions**
  - [ ] Check student financial record after enrollment
  - [ ] Verify DEBIT transaction is created
  - [ ] Check accounting entries are created
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 2. STUDENT BILLING MODULE

### 2.1 Fee Payment Recording
- [ ] **Record Tuition Payment**
  - [ ] Navigate to Record Payment page
  - [ ] Select student and payment details
  - [ ] Record payment amount
  - [ ] Submit payment
  - [ ] Verify student transaction is created (CREDIT)
  - [ ] Check student balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Boarding Fee Payments**
  - [ ] Navigate to Boarding Fee Payments
  - [ ] Record boarding payment
  - [ ] Verify payment is recorded correctly
  - [ ] Check student balance update
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 2.2 Outstanding Balances
- [ ] **View Outstanding Balances**
  - [ ] Navigate to Outstanding Balances
  - [ ] Verify all students with debt are listed
  - [ ] Check total outstanding amount is correct
  - [ ] Test search and filtering
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Student Financial Record**
  - [ ] Navigate to Student Financial Record
  - [ ] Select a student with transactions
  - [ ] Verify all transaction types are displayed (DEBIT and CREDIT)
  - [ ] Check that transport payments appear
  - [ ] Verify balance calculation is correct
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 2.3 Invoice Structures
- [ ] **Create Invoice Structure**
  - [ ] Navigate to Invoice Structures
  - [ ] Create new invoice structure
  - [ ] Set fees and terms
  - [ ] Save structure
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Apply Invoice Structure**
  - [ ] Apply invoice structure to students
  - [ ] Verify fees are generated correctly
  - [ ] Check student transactions are created
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 2.4 Additional Fees Management (NEW)
- [ ] **Create Additional Fee Structure**
  - [ ] Navigate to Billing → Additional Fees
  - [ ] Click "Create Fee Structure"
  - [ ] Fill in fee details (name, amount, currency, academic year)
  - [ ] Save fee structure
  - [ ] Verify fee appears in list
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Bulk Fee Generation**
  - [ ] Select fee structure
  - [ ] Click "Bulk Operations" button
  - [ ] Choose "Generate for All Students"
  - [ ] Select academic year
  - [ ] Confirm bulk generation
  - [ ] Verify fees are assigned to all students
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Additional Fee Payments**
  - [ ] Navigate to Fees → Other Payments
  - [ ] Search for student by registration number
  - [ ] Select available fees to pay
  - [ ] Enter payment details (amount, method, reference)
  - [ ] Submit payment
  - [ ] Verify student transaction is created (CREDIT)
  - [ ] Check account balances are updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Additional Fees Responsive Design**
  - [ ] Test Additional Fees page on mobile/tablet
  - [ ] Verify fee structures table displays correctly
  - [ ] Check bulk operations modal works on mobile
  - [ ] Test Other Payments page responsiveness
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 3. TRANSPORT MANAGEMENT MODULE

### 3.1 Route Management
- [ ] **Create Transport Route**
  - [ ] Navigate to Transport → Manage Routes
  - [ ] Create new route with pickup/dropoff points
  - [ ] Set weekly fee amount
  - [ ] Activate the route
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Edit Transport Route**
  - [ ] Modify existing route details
  - [ ] Update fee amount
  - [ ] Save changes
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 3.2 Student Registration to Transport
- [ ] **Register Student to Route**
  - [ ] Navigate to Transport → Student Registration
  - [ ] Search for student by registration number
  - [ ] Select a route
  - [ ] Submit registration
  - [ ] Verify student transaction is created (DEBIT)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Student Registrations**
  - [ ] Navigate to Student Registrations page
  - [ ] Verify all registrations are displayed
  - [ ] Check registration details
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Delete Transport Registration**
  - [ ] Delete a student registration
  - [ ] Verify registration is removed
  - [ ] Check that student transaction is reversed (CREDIT)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 3.3 Transport Payments
- [ ] **Record Transport Payment**
  - [ ] Navigate to Transport Payments
  - [ ] Select route and search for student
  - [ ] Record payment amount
  - [ ] Submit payment
  - [ ] Verify student transaction is created (CREDIT)
  - [ ] Check accounting entries are created
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Transport Payments**
  - [ ] Check payments are displayed in table
  - [ ] Verify payment details are correct
  - [ ] Test pagination and search
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 4. INVENTORY MANAGEMENT MODULE

### 4.1 Category Management
- [ ] **Create Inventory Category**
  - [ ] Navigate to Inventory → Configurations
  - [ ] Add new inventory category
  - [ ] Save category
  - [ ] Verify category appears in dropdown
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Edit Inventory Category**
  - [ ] Modify existing category
  - [ ] Update category details
  - [ ] Save changes
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 4.2 Item Management
- [ ] **Add Inventory Item**
  - [ ] Navigate to Inventory → Add Item
  - [ ] Fill in item details (name, category, stock, price)
  - [ ] Submit item
  - [ ] Verify item appears in inventory list
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Inventory Items (Responsive)**
  - [ ] Navigate to Inventory page
  - [ ] Verify all items are displayed
  - [ ] Check item details are correct
  - [ ] Test search and filtering
  - [ ] Test responsive design on mobile/tablet
  - [ ] Verify statistics cards adapt to screen size
  - [ ] Check quick actions layout on mobile
  - [ ] Test inventory table horizontal scrolling
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Inventory Item Details Modal (Responsive)**
  - [ ] Click on an inventory item
  - [ ] Verify details modal opens
  - [ ] Check modal displays correctly on mobile
  - [ ] Test modal buttons layout
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**:

### 4.3 Uniform Issuing
- [ ] **Issue Uniform to Student**
  - [ ] Navigate to Inventory → Issue Uniform
  - [ ] Search for student by registration number
  - [ ] Search for uniform item
  - [ ] Issue uniform to student
  - [ ] Verify stock is reduced
  - [ ] Check student transaction is created (DEBIT)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Record Uniform Payment**
  - [ ] Record payment for issued uniform
  - [ ] Verify student transaction is created (CREDIT)
  - [ ] Check student balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 5. ACCOUNTING SYSTEM MODULE

### 5.1 Chart of Accounts
- [ ] **View Chart of Accounts**
  - [ ] Navigate to Accounting → Chart of Accounts
  - [ ] Verify all accounts are displayed
  - [ ] Check account types (Revenue, Expense, Asset, Liability, Equity)
  - [ ] Test responsive design on mobile/tablet
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Add New Account**
  - [ ] Create new account in chart of accounts
  - [ ] Set account type and details
  - [ ] Save account
  - [ ] Verify account appears in list
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View COA Details (Responsive)**
  - [ ] Click on an account to view details
  - [ ] Verify balances table displays correctly
  - [ ] Check ledger entries table shows transactions
  - [ ] Test horizontal scrolling on mobile
  - [ ] Verify Reference column is visible on mobile
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 5.2 Journal Entries
- [ ] **Automatic Journal Entry Creation**
  - [ ] Record a transport payment
  - [ ] Verify journal entry is created automatically
  - [ ] Check journal entry lines (Debit Cash, Credit Transport Revenue)
  - [ ] Verify double-entry bookkeeping
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Manual Journal Entry**
  - [ ] Create manual journal entry
  - [ ] Add debit and credit lines
  - [ ] Ensure entries are balanced
  - [ ] Save journal entry
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 5.3 Account Balance Updates (NEW)
- [ ] **Account Balance Service Integration**
  - [ ] Record any payment (tuition, transport, additional fees)
  - [ ] Verify account_balances table is updated automatically
  - [ ] Check that journal entry lines trigger balance updates
  - [ ] Verify balances are calculated correctly (debit - credit)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Multiple Currency Balance Updates**
  - [ ] Record payment in different currency
  - [ ] Verify account balance is updated for correct currency
  - [ ] Check exchange rate handling
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Balance Recalculation**
  - [ ] Run account balance fix script
  - [ ] Verify all historical balances are recalculated
  - [ ] Check that balances match journal entry totals
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 5.4 Cash & Bank Management (NEW)
- [ ] **View Cash & Bank Balances**
  - [ ] Navigate to Accounting → Cash & Bank
  - [ ] Verify Cash and Bank account balances are displayed
  - [ ] Check balances match COA account balances
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash Injection**
  - [ ] Click "Cash Injection" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Debit Cash)
  - [ ] Check account balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Bank Deposit**
  - [ ] Click "Bank Deposit" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Debit Bank)
  - [ ] Check account balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash to Bank Transfer**
  - [ ] Click "Cash to Bank" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Debit Bank, Credit Cash)
  - [ ] Check both account balances are updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Bank to Cash Transfer**
  - [ ] Click "Bank to Cash" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Debit Cash, Credit Bank)
  - [ ] Check both account balances are updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash Withdrawal**
  - [ ] Click "Cash Withdrawal" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Credit Cash)
  - [ ] Check account balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Bank Withdrawal**
  - [ ] Click "Bank Withdrawal" button
  - [ ] Enter amount and description
  - [ ] Submit transaction
  - [ ] Verify journal entry is created (Credit Bank)
  - [ ] Check account balance is updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Transaction History**
  - [ ] Click "View Transactions" on Cash account
  - [ ] Verify transaction history displays correctly
  - [ ] Check search functionality works
  - [ ] Test pagination if many transactions exist
  - [ ] Verify running balance calculations are correct
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Bank Transaction History**
  - [ ] Click "View Transactions" on Bank account
  - [ ] Verify all bank-related transactions are shown
  - [ ] Check that transfers between cash and bank are visible
  - [ ] Verify responsive design on mobile
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash & Bank Responsive Design**
  - [ ] Test on mobile device or narrow browser window
  - [ ] Verify account balance cards stack properly
  - [ ] Check quick action buttons are accessible
  - [ ] Test transaction table horizontal scrolling
  - [ ] Verify modal forms are mobile-friendly
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 5.5 Financial Reports (Responsive Design)
- [ ] **Income Statement (Responsive)**
  - [ ] Navigate to Financial Reports → Income Statement
  - [ ] Select September 2025
  - [ ] Verify all revenue accounts are displayed (including zero values)
  - [ ] Verify all expense accounts are displayed (including zero values)
  - [ ] Check totals are calculated correctly
  - [ ] Test responsive design on mobile/tablet
  - [ ] Verify account names truncate properly on small screens
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Balance Sheet (Responsive)**
  - [ ] Navigate to Financial Reports → Balance Sheet
  - [ ] Generate balance sheet for current period
  - [ ] Verify Assets and Liabilities & Equity sections display
  - [ ] Check totals are balanced (Assets = Liabilities + Equity)
  - [ ] Test responsive design on mobile/tablet
  - [ ] Verify two-column layout adapts to single column on mobile
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash Flow Statement (Responsive)**
  - [ ] Navigate to Financial Reports → Cash Flow Statement
  - [ ] Generate cash flow for current period
  - [ ] Verify Operating, Investing, and Financing activities display
  - [ ] Check net cash flow calculation
  - [ ] Test responsive design on mobile/tablet
  - [ ] Verify summary cards adapt to different screen sizes
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Income Statement Totals**
  - [ ] Verify total revenue calculation
  - [ ] Verify total expenses calculation
  - [ ] Check net income calculation
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 6. BOARDING MANAGEMENT MODULE

### 6.1 Boarding Enrollment
- [ ] **Enroll Student in Boarding**
  - [ ] Navigate to Boarding page
  - [ ] Enroll student in boarding facility
  - [ ] Set boarding fees
  - [ ] Submit enrollment
  - [ ] Verify student transaction is created (DEBIT)
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Boarding Enrollments**
  - [ ] Check enrolled students list
  - [ ] Verify enrollment details
  - [ ] Test search and filtering
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 6.2 Boarding Payments
- [ ] **Record Boarding Payment**
  - [ ] Record payment for boarding fees
  - [ ] Verify student transaction is created (CREDIT)
  - [ ] Check student balance update
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Boarding Financial Integration**
  - [ ] Check that boarding payments create accounting entries
  - [ ] Verify journal entries are balanced
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 7. PAYROLL MANAGEMENT MODULE

### 7.1 Employee Management
- [ ] **Add Employee**
  - [ ] Navigate to Admin → Employees → Add Employee
  - [ ] Fill in employee details
  - [ ] Set salary and position
  - [ ] Save employee
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Employees**
  - [ ] Navigate to Admin → Employees
  - [ ] Verify all employees are displayed
  - [ ] Check employee details
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 7.2 Payroll Generation
- [ ] **Create Payslip**
  - [ ] Navigate to Payroll → Create Payslip
  - [ ] Select employee and period
  - [ ] Generate payslip
  - [ ] Verify payslip details
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Payslips**
  - [ ] Navigate to Payroll → View Payslips
  - [ ] Check all payslips are displayed
  - [ ] Verify payslip calculations
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 7.3 Payroll Accounting Integration
- [ ] **Payroll Journal Entries**
  - [ ] Generate payslip
  - [ ] Verify journal entries are created
  - [ ] Check debit to salary expense
  - [ ] Check credit to cash/bank
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 8. RESULTS MANAGEMENT MODULE

### 8.1 Grading System
- [ ] **Set Grading Criteria**
  - [ ] Navigate to Results → Grading Criteria
  - [ ] Configure grading scales
  - [ ] Set pass/fail criteria
  - [ ] Save criteria
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Grading Criteria**
  - [ ] Check grading criteria are displayed
  - [ ] Verify criteria are correct
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 8.2 Results Entry
- [ ] **Enter Student Results**
  - [ ] Navigate to Results page
  - [ ] Select student and subject
  - [ ] Enter marks/grades
  - [ ] Save results
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **View Results**
  - [ ] Check results are displayed correctly
  - [ ] Verify grade calculations
  - [ ] Test filtering by class/student
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 9. INTEGRATION TESTS

### 9.1 Cross-Module Data Flow
- [ ] **Student Transaction Integration**
  - [ ] Create various student transactions (tuition, transport, uniforms, boarding, additional fees)
  - [ ] Navigate to Student Financial Record
  - [ ] Verify all transaction types are visible
  - [ ] Check that transport payments appear in the list
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Accounting Integration with Balance Updates**
  - [ ] Record transport payment
  - [ ] Record uniform payment
  - [ ] Record additional fee payment
  - [ ] Record payroll
  - [ ] Check that all create proper journal entries
  - [ ] Verify account_balances table is updated for each transaction
  - [ ] Verify accounting equation balance
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Account Balance Service Integration**
  - [ ] Record any payment transaction
  - [ ] Verify journal entry is created
  - [ ] Check that AccountBalanceService.updateAccountBalancesFromJournalEntry() is called
  - [ ] Verify account_balances table reflects the transaction
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 9.2 Data Consistency
- [ ] **Student Balance Accuracy**
  - [ ] Create student with multiple transactions
  - [ ] Calculate expected balance manually
  - [ ] Compare with system-calculated balance
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Accounting Balance Verification**
  - [ ] Check that all journal entries are balanced
  - [ ] Verify total debits = total credits
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Account Balance Accuracy (NEW)**
  - [ ] Record multiple transactions affecting the same account
  - [ ] Calculate expected account balance manually
  - [ ] Compare with account_balances table
  - [ ] Verify balance matches sum of journal entry lines
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 9.3 Financial Report Integration
- [ ] **Income Statement with Updated Balances**
  - [ ] Record various revenue and expense transactions
  - [ ] Generate income statement
  - [ ] Verify all accounts show correct balances
  - [ ] Check that zero-balance accounts still appear
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Balance Sheet with Updated Balances**
  - [ ] Record asset, liability, and equity transactions
  - [ ] Generate balance sheet
  - [ ] Verify Assets = Liabilities + Equity
  - [ ] Check all accounts show correct balances
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash Flow Statement with Updated Balances**
  - [ ] Record operating, investing, and financing activities
  - [ ] Generate cash flow statement
  - [ ] Verify all activities show correct amounts
  - [ ] Check net cash flow calculation
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**:

---

## 10. RESPONSIVE DESIGN TESTS

### 10.1 Mobile Testing (320px - 768px)
- [ ] **Dashboard Responsive Design**
  - [ ] Test dashboard on mobile devices
  - [ ] Verify statistics cards stack vertically
  - [ ] Check navigation menu collapses properly
  - [ ] Test quick actions layout
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Student Management Mobile**
  - [ ] Test student list on mobile
  - [ ] Verify search functionality works
  - [ ] Check student details modal displays correctly
  - [ ] Test form inputs are accessible
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Financial Reports Mobile**
  - [ ] Test Income Statement on mobile
  - [ ] Test Balance Sheet on mobile
  - [ ] Test Cash Flow Statement on mobile
  - [ ] Verify tables scroll horizontally
  - [ ] Check summary cards adapt to screen size
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Inventory Management Mobile**
  - [ ] Test inventory page on mobile
  - [ ] Verify statistics cards layout
  - [ ] Check quick actions stack properly
  - [ ] Test item details modal
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Additional Fees Mobile**
  - [ ] Test Additional Fees page on mobile
  - [ ] Verify fee structures table displays
  - [ ] Check bulk operations modal works
  - [ ] Test Other Payments page
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 10.2 Tablet Testing (768px - 1024px)
- [ ] **Dashboard Tablet Layout**
  - [ ] Test dashboard on tablet
  - [ ] Verify statistics cards use 2-column layout
  - [ ] Check navigation is accessible
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Financial Reports Tablet**
  - [ ] Test all financial reports on tablet
  - [ ] Verify tables display properly
  - [ ] Check filters and controls are accessible
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Inventory Tablet Layout**
  - [ ] Test inventory page on tablet
  - [ ] Verify statistics cards use appropriate layout
  - [ ] Check quick actions are accessible
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 10.3 Desktop Testing (1024px+)
- [ ] **Full Desktop Layout**
  - [ ] Test all pages on desktop
  - [ ] Verify full functionality is available
  - [ ] Check tables display all columns
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

## 11. USER INTERFACE TESTS

### 11.1 Navigation
- [ ] **Sidebar Navigation**
  - [ ] Test all sidebar links work correctly
  - [ ] Verify active section highlighting
  - [ ] Check that Outstanding Balances stays in billing section
  - [ ] Test mobile sidebar behavior
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Page Navigation**
  - [ ] Test navigation between pages
  - [ ] Verify breadcrumbs work correctly
  - [ ] Check back buttons function properly
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 10.2 Form Functionality
- [ ] **Form Validation**
  - [ ] Test required field validation
  - [ ] Check data format validation
  - [ ] Verify error messages are clear
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Form Submission**
  - [ ] Test form submission with valid data
  - [ ] Check success messages
  - [ ] Verify data is saved correctly
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 10.3 Search and Filtering
- [ ] **Student Search**
  - [ ] Test student search by registration number
  - [ ] Test student search by name
  - [ ] Verify search results are accurate
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Data Filtering**
  - [ ] Test filtering in various tables
  - [ ] Check date range filters
  - [ ] Verify filter combinations work
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 11. PERFORMANCE TESTS

### 11.1 Page Load Times
- [ ] **Dashboard Load Time**
  - [ ] Measure dashboard load time
  - [ ] Should load within 3 seconds
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Large Data Sets**
  - [ ] Test with large number of students
  - [ ] Test with large number of transactions
  - [ ] Verify pagination works smoothly
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 11.2 Concurrent Users
- [ ] **Multiple User Simulation**
  - [ ] Open multiple browser tabs
  - [ ] Perform operations simultaneously
  - [ ] Verify no data conflicts
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 12. SECURITY TESTS

### 12.1 Authentication
- [ ] **Login Security**
  - [ ] Test with invalid credentials
  - [ ] Verify proper error messages
  - [ ] Check session timeout
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Authorization**
  - [ ] Test access to restricted pages
  - [ ] Verify role-based permissions
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 12.2 Data Protection
- [ ] **Input Validation**
  - [ ] Test SQL injection attempts
  - [ ] Test XSS attempts
  - [ ] Verify data sanitization
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## 13. ACCOUNT BALANCE FIX VERIFICATION

### 13.1 Account Balance Service Testing
- [ ] **Test Account Balance Service**
  - [ ] Run test script: `node server/scripts/test-account-balance-service.js`
  - [ ] Verify service connects to database
  - [ ] Check journal entries are found
  - [ ] Verify account balances are retrieved
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Fix Existing Account Balances**
  - [ ] Run fix script: `node server/scripts/fix-account-balances.js`
  - [ ] Confirm all account balances are recalculated
  - [ ] Verify balances match journal entry totals
  - [ ] Check no data is lost during recalculation
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Verify Balance Updates in Real-Time**
  - [ ] Record a new payment transaction
  - [ ] Check that account_balances table is updated immediately
  - [ ] Verify balance calculation is correct
  - [ ] Test with different account types
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 13.2 Financial Reports with Updated Balances
- [ ] **Income Statement Accuracy**
  - [ ] Generate income statement after balance fix
  - [ ] Verify all revenue accounts show correct balances
  - [ ] Verify all expense accounts show correct balances
  - [ ] Check totals match account_balances table
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Balance Sheet Accuracy**
  - [ ] Generate balance sheet after balance fix
  - [ ] Verify Assets = Liabilities + Equity
  - [ ] Check all account balances are correct
  - [ ] Verify no zero-balance accounts are missing
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

- [ ] **Cash Flow Statement Accuracy**
  - [ ] Generate cash flow statement after balance fix
  - [ ] Verify all activities show correct amounts
  - [ ] Check net cash flow calculation
  - [ ] Verify beginning and ending cash balances
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

## 14. FINAL VERIFICATION

### 14.1 Complete Workflow Test
- [ ] **End-to-End Student Journey**
  - [ ] Register new student
  - [ ] Enroll in class
  - [ ] Register for transport
  - [ ] Issue uniforms
  - [ ] Create additional fee structure
  - [ ] Record various payments (tuition, transport, uniforms, additional fees)
  - [ ] Generate student financial report
  - [ ] Verify all data is accurate
  - [ ] Check account balances are updated
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 14.2 Monthly Financial Reporting
- [ ] **End-of-Month Process**
  - [ ] Generate income statement for current month
  - [ ] Verify all revenue and expense accounts are visible
  - [ ] Check totals are correct
  - [ ] Generate balance sheet
  - [ ] Verify accounting equation (Assets = Liabilities + Equity)
  - [ ] Generate cash flow statement
  - [ ] Verify all reports show accurate data
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

### 14.3 Responsive Design Verification
- [ ] **Cross-Device Testing**
  - [ ] Test all major pages on mobile (320px-768px)
  - [ ] Test all major pages on tablet (768px-1024px)
  - [ ] Test all major pages on desktop (1024px+)
  - [ ] Verify all functionality works on all devices
  - [ ] **Result**: PASS / FAIL
  - [ ] **Notes**: 

---

## TEST SUMMARY

### Overall Results
- **Total Tests**: ___ / 200+
- **Passed**: ___ / ___
- **Failed**: ___ / ___
- **Success Rate**: ___%

### Test Categories
- **Core System Tests**: ___ / 15
- **Student Management**: ___ / 20
- **Student Billing**: ___ / 25
- **Transport Management**: ___ / 15
- **Inventory Management**: ___ / 20
- **Accounting System**: ___ / 30
- **Boarding Management**: ___ / 10
- **Payroll Management**: ___ / 15
- **Results Management**: ___ / 10
- **Integration Tests**: ___ / 20
- **Responsive Design**: ___ / 25
- **UI/UX Tests**: ___ / 15
- **Account Balance Fix**: ___ / 15
- **Final Verification**: ___ / 10

### Critical Issues Found
1. 
2. 
3. 

### Minor Issues Found
1. 
2. 
3. 

### New Features Tested
- [ ] **Account Balance Service** - Automatic balance updates
- [ ] **Additional Fees Management** - New fee structure system
- [ ] **Responsive Design** - Mobile/tablet optimization
- [ ] **Financial Reports** - Updated with correct balances
- [ ] **View COA** - Responsive chart of accounts details

### Recommendations
1. 
2. 
3. 

### System Status
- [ ] **READY FOR PRODUCTION** - All critical tests passed
- [ ] **NEEDS FIXES** - Critical issues must be resolved
- [ ] **REQUIRES REVIEW** - Minor issues should be addressed

### Tester Information
- **Tester Name**: ________________
- **Test Date**: ________________
- **Test Environment**: ________________
- **Browser Used**: ________________
- **Additional Notes**: 

---

## SIGN-OFF

- [ ] **Development Team Review**: ________________
- [ ] **QA Team Approval**: ________________
- [ ] **Product Owner Sign-off**: ________________
- [ ] **Ready for Deployment**: ________________

**Date**: ________________
**Signature**: ________________
