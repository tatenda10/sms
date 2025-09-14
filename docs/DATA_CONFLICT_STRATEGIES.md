# Data Conflict Resolution Strategies

When you have different data in your local and online versions, you need a systematic approach to resolve conflicts. Here are the strategies and tools available:

## 🎯 **Conflict Resolution Strategies**

### **1. Timestamp-Based Resolution (Recommended)**
- **How it works**: Newer data wins
- **Best for**: Most scenarios where you have `updated_at` or `modified_at` columns
- **Pros**: Automatic, fair, preserves most recent changes
- **Cons**: Requires timestamp columns

```javascript
// Configuration
conflictResolution: 'timestamp'
```

### **2. Local Data Priority**
- **How it works**: Local data always wins
- **Best for**: When local is the "source of truth"
- **Pros**: Simple, predictable
- **Cons**: May overwrite important remote changes

```javascript
// Configuration
conflictResolution: 'local'
```

### **3. Remote Data Priority**
- **How it works**: Remote data always wins
- **Best for**: When online is the "source of truth"
- **Pros**: Simple, predictable
- **Cons**: May overwrite important local changes

```javascript
// Configuration
conflictResolution: 'remote'
```

### **4. Manual Resolution**
- **How it works**: Flag conflicts for human review
- **Best for**: Critical data where automated decisions are risky
- **Pros**: Human oversight, no data loss
- **Cons**: Time-consuming, requires manual intervention

```javascript
// Configuration
conflictResolution: 'manual'
```

---

## 🔍 **Types of Data Conflicts**

### **1. Data Conflicts**
- **What**: Same record exists in both databases with different values
- **Example**: Student's phone number updated locally but not online
- **Resolution**: Apply chosen strategy (timestamp/local/remote)

### **2. Local-Only Records**
- **What**: Record exists locally but not online
- **Example**: New student added locally
- **Resolution**: Create record online

### **3. Remote-Only Records**
- **What**: Record exists online but not locally
- **Example**: Student added directly in online system
- **Resolution**: Create record locally

---

## 🚀 **Usage Examples**

### **Basic Reconciliation**
```bash
# Analyze conflicts without resolving
node scripts/data-reconciliation.js report

# Resolve conflicts automatically
node scripts/data-reconciliation.js reconcile
```

### **Configuration Options**
```javascript
// server/config/data-reconciliation.config.js
module.exports = {
    conflictResolution: 'timestamp', // Strategy to use
    backupBeforeReconcile: true,     // Backup before changes
    exportPath: './reconciliation-exports',
    
    // Tables to exclude from reconciliation
    excludedTables: [
        'temp_table',
        'cache_table',
        'session_table'
    ],
    
    // Tables that require manual resolution
    manualResolutionTables: [
        'financial_transactions',
        'student_grades'
    ]
};
```

---

## 📊 **Reconciliation Process**

### **Step 1: Analysis**
```bash
# Generate conflict analysis report
node scripts/data-reconciliation.js report
```

**Output**: JSON report showing:
- Tables with conflicts
- Number of conflicts per table
- Types of conflicts (data/local-only/remote-only)

### **Step 2: Resolution**
```bash
# Resolve conflicts based on strategy
node scripts/data-reconciliation.js reconcile
```

**Process**:
1. Compare local and remote data
2. Identify conflicts
3. Apply resolution strategy
4. Update both databases
5. Generate reconciliation report

---

## 🛡️ **Safety Measures**

### **1. Backup Before Reconciliation**
```javascript
// Automatic backup before reconciliation
backupBeforeReconcile: true
```

### **2. Dry Run Mode**
```bash
# Analyze without making changes
node scripts/data-reconciliation.js report
```

### **3. Manual Review for Critical Data**
```javascript
// Flag critical tables for manual review
manualResolutionTables: [
    'student_balances',
    'financial_transactions',
    'uniform_payments'
]
```

---

## 🔧 **Advanced Scenarios**

### **Scenario 1: Student Data Conflicts**
```javascript
// Example: Student phone number conflict
{
    "type": "conflict",
    "table": "students",
    "key": "STU001",
    "local": {
        "RegNumber": "STU001",
        "Name": "John Doe",
        "Phone": "123-456-7890",  // Updated locally
        "updated_at": "2024-01-15 10:30:00"
    },
    "remote": {
        "RegNumber": "STU001",
        "Name": "John Doe",
        "Phone": "123-456-7891",  // Different online
        "updated_at": "2024-01-14 15:20:00"
    },
    "differences": [
        {
            "column": "Phone",
            "local_value": "123-456-7890",
            "remote_value": "123-456-7891"
        }
    ]
}
```

**Resolution**: Local wins (newer timestamp)

### **Scenario 2: New Student Added Locally**
```javascript
// Example: New student not yet synced
{
    "type": "local_only",
    "table": "students",
    "key": "STU002",
    "local": {
        "RegNumber": "STU002",
        "Name": "Jane Smith",
        "Phone": "987-654-3210"
    },
    "remote": null
}
```

**Resolution**: Create student record online

### **Scenario 3: Payment Made Online**
```javascript
// Example: Payment recorded online but not locally
{
    "type": "remote_only",
    "table": "student_transactions",
    "key": "TXN001",
    "local": null,
    "remote": {
        "id": "TXN001",
        "student_reg_number": "STU001",
        "amount": 100.00,
        "transaction_type": "CREDIT",
        "description": "Tuition payment"
    }
}
```

**Resolution**: Create transaction record locally

---

## 📋 **Best Practices**

### **1. Choose the Right Strategy**
- **Timestamp**: Best for most scenarios
- **Local**: When local is source of truth
- **Remote**: When online is source of truth
- **Manual**: For critical financial data

### **2. Regular Reconciliation**
```bash
# Schedule regular reconciliation
# Add to crontab: 0 2 * * * (daily at 2 AM)
node scripts/data-reconciliation.js reconcile
```

### **3. Monitor Reconciliation Reports**
- Review reports after each reconciliation
- Check for unexpected conflicts
- Investigate patterns in conflicts

### **4. Handle Critical Data Separately**
```javascript
// Critical tables that need manual review
criticalTables: [
    'student_balances',
    'financial_transactions',
    'uniform_payments',
    'journal_entries'
]
```

---

## 🚨 **Emergency Procedures**

### **If Reconciliation Goes Wrong**
1. **Stop the process**: `Ctrl+C`
2. **Restore from backup**: Use the backup created before reconciliation
3. **Analyze the issue**: Check reconciliation logs
4. **Fix manually**: Resolve conflicts manually
5. **Re-run reconciliation**: With corrected strategy

### **Recovery Commands**
```bash
# Restore from backup
mysql -u username -p database_name < backup_file.sql

# Check reconciliation logs
cat reconciliation-exports/reconciliation_report_*.json

# Manual conflict resolution
node scripts/manual-conflict-resolver.js
```

---

## 📊 **Monitoring and Alerts**

### **Set Up Alerts**
```javascript
// Email alerts for reconciliation issues
alerts: {
    enabled: true,
    email: 'admin@yourdomain.com',
    conditions: [
        'conflicts_found > 100',
        'reconciliation_failed',
        'data_integrity_issues'
    ]
}
```

### **Dashboard Integration**
```javascript
// Add to your admin dashboard
const reconciliationStatus = await getReconciliationStatus();
console.log(`Last reconciliation: ${reconciliationStatus.last_run}`);
console.log(`Conflicts found: ${reconciliationStatus.conflicts}`);
console.log(`Status: ${reconciliationStatus.status}`);
```

---

## 🎯 **Summary**

**For most SMS systems, use timestamp-based resolution:**
1. **Automatic**: No manual intervention needed
2. **Fair**: Newer data wins
3. **Safe**: Preserves most recent changes
4. **Efficient**: Handles most conflicts automatically

**For critical financial data, use manual resolution:**
1. **Safe**: Human oversight prevents errors
2. **Accurate**: Manual verification of changes
3. **Auditable**: Clear record of decisions made

**Always backup before reconciliation and monitor the results!**
