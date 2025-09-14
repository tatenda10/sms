// Data Reconciliation Configuration
// Configure how to handle conflicts between local and remote data

module.exports = {
    // Conflict Resolution Strategy
    conflictResolution: 'timestamp', // 'timestamp', 'local', 'remote', 'manual'
    
    // API Configuration
    apiEndpoint: 'https://your-domain.com/api/reconcile-data.php',
    apiKey: 'your_secure_api_key',
    
    // Export and Backup Settings
    exportPath: './reconciliation-exports',
    backupBeforeReconcile: true,
    backupPath: './reconciliation-backups',
    
    // Tables Configuration
    excludedTables: [
        // Tables to skip during reconciliation
        'temp_table',
        'cache_table',
        'session_table',
        'sync_logs'
    ],
    
    // Tables that require manual resolution (critical data)
    manualResolutionTables: [
        'student_balances',
        'student_transactions',
        'uniform_payments',
        'journal_entries',
        'journal_entry_lines'
    ],
    
    // Tables that should use local priority (local is source of truth)
    localPriorityTables: [
        'students',
        'inventory_items',
        'inventory_categories'
    ],
    
    // Tables that should use remote priority (online is source of truth)
    remotePriorityTables: [
        'user_sessions',
        'system_logs'
    ],
    
    // Key columns for each table (for conflict detection)
    tableKeys: {
        'students': ['RegNumber'],
        'student_balances': ['student_reg_number'],
        'student_transactions': ['id'],
        'uniform_issues': ['id'],
        'uniform_payments': ['id'],
        'inventory_items': ['id'],
        'inventory_categories': ['id']
    },
    
    // Timestamp columns for each table
    timestampColumns: {
        'students': 'updated_at',
        'student_balances': 'last_updated',
        'student_transactions': 'transaction_date',
        'uniform_issues': 'issue_date',
        'uniform_payments': 'payment_date',
        'inventory_items': 'updated_at',
        'inventory_categories': 'updated_at'
    },
    
    // Reconciliation Schedule
    schedule: {
        enabled: false,
        cron: '0 2 * * *', // Daily at 2 AM
        timezone: 'UTC'
    },
    
    // Alert Settings
    alerts: {
        enabled: true,
        email: 'admin@yourdomain.com',
        conditions: [
            'conflicts_found > 50',
            'reconciliation_failed',
            'data_integrity_issues'
        ]
    },
    
    // Performance Settings
    batchSize: 1000,
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 5000 // 5 seconds
};
