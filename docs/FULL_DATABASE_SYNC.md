# Full Database Sync to cPanel

This script syncs your entire SMS database to a cPanel-hosted database.

## 🚀 Quick Start

### Step 1: Deploy PHP Endpoint to cPanel

1. **Upload the PHP file**:
   ```bash
   # Upload: server/cpanel-api/sync-full-db.php
   # To: public_html/api/sync-full-db.php
   ```

2. **Update database credentials** in the PHP file:
   ```php
   $db_host = 'localhost';
   $db_name = 'your_cpanel_db_name';
   $db_user = 'your_cpanel_db_user';
   $db_pass = 'your_cpanel_db_password';
   $api_key = 'your_secure_api_key';
   ```

3. **Create sync_logs table** in your cPanel database:
   ```sql
   CREATE TABLE sync_logs (
       id INT AUTO_INCREMENT PRIMARY KEY,
       sync_timestamp DATETIME,
       records_synced INT,
       source VARCHAR(100),
       status ENUM('success', 'error'),
       error_message TEXT,
       sync_type VARCHAR(50),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Step 2: Configure Local Sync

1. **Update configuration**:
   ```javascript
   // server/config/full-db-sync.config.js
   module.exports = {
       apiEndpoint: 'https://your-domain.com/api/sync-full-db.php',
       apiKey: 'your_secure_api_key',
       // ... other settings
   };
   ```

2. **Test the sync**:
   ```bash
   cd server
   node scripts/sync-full-database.js sync
   ```

## 📊 Usage Commands

### Full Database Sync
```bash
# Sync entire database to cPanel
node scripts/sync-full-database.js sync
```

### Export to SQL Dump
```bash
# Create SQL dump file
node scripts/sync-full-database.js sql
```

### Database Statistics
```bash
# Show database statistics
node scripts/sync-full-database.js stats
```

## ⚙️ Configuration Options

### Environment Variables
Create a `.env` file with:
```env
CPANEL_API_URL=https://your-domain.com/api/sync-full-db.php
CPANEL_API_KEY=your_secure_api_key
```

### Configuration File
```javascript
// server/config/full-db-sync.config.js
module.exports = {
    apiEndpoint: 'https://your-domain.com/api/sync-full-db.php',
    apiKey: 'your_secure_api_key',
    exportPath: './database-exports',
    batchSize: 1000,
    truncateTables: true, // Clear existing data
    includedTables: [], // Empty = all tables
    excludedTables: [] // Tables to skip
};
```

## 🔒 Security

1. **Use HTTPS** for API endpoints
2. **Generate strong API keys**
3. **Limit database user permissions**
4. **Monitor sync logs**

## 📁 What Gets Synced

- **All Tables**: Complete database structure and data
- **Table Structure**: Column definitions and constraints
- **All Records**: Every row from every table
- **Metadata**: Export timestamp and statistics

## 🐛 Troubleshooting

### Common Issues

1. **Timeout errors**:
   - Increase timeout in PHP (max_execution_time)
   - Reduce batch size in config
   - Check cPanel memory limits

2. **Memory errors**:
   - Increase PHP memory_limit
   - Process tables individually
   - Use SQL dump method instead

3. **Connection errors**:
   - Verify API endpoint URL
   - Check API key authentication
   - Ensure HTTPS is used

### Debug Mode
```bash
# Enable debug logging
DEBUG=sync:* node scripts/sync-full-database.js sync
```

## 📊 Monitoring

### Check Sync Logs
```sql
-- Query sync_logs table in cPanel database
SELECT * FROM sync_logs 
WHERE sync_type = 'full_database' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Database Statistics
```bash
# Get current database stats
node scripts/sync-full-database.js stats
```

## 🎯 Best Practices

1. **Backup first**: Always backup cPanel database before sync
2. **Test with small dataset**: Start with a few tables
3. **Schedule during low traffic**: Run during off-peak hours
4. **Monitor logs**: Check sync logs regularly
5. **Use SQL dump for large databases**: More reliable for huge datasets

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify configuration
3. Test API endpoint manually
4. Check cPanel error logs
5. Contact your hosting provider if needed

---

**Note**: This script will completely replace the cPanel database with your local database. Use with caution!
