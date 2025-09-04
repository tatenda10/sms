// Full Database Sync Configuration
// Update these values with your cPanel details

module.exports = {
    // cPanel API Configuration
    apiEndpoint: 'https://your-domain.com/api/sync-full-db.php',
    apiKey: 'your_secure_api_key',
    
    // Export Settings
    exportPath: './database-exports',
    batchSize: 1000, // Records per batch
    compressionEnabled: true,
    
    // Sync Options
    truncateTables: true, // Clear existing data before sync
    includeMetadata: true, // Include table structure info
    
    // Tables to exclude (optional)
    excludedTables: [
        // 'temp_table',
        // 'cache_table',
        // 'session_table'
    ],
    
    // Tables to include only (optional - if empty, all tables are included)
    includedTables: [
        // 'students',
        // 'student_balances',
        // 'student_transactions',
        // 'uniform_issues',
        // 'inventory_items',
        // 'inventory_categories'
    ],
    
    // Sync Schedule (optional)
    schedule: {
        enabled: false,
        cron: '0 2 * * *', // Daily at 2 AM
        timezone: 'UTC'
    }
};
