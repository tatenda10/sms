# cPanel Database Sync Setup Guide

This guide explains how to sync your local SMS database to a cPanel-hosted database.

## 🎯 Available Sync Methods

### Method 1: API-Based Sync (Recommended)
- **Pros**: Secure, reliable, works with any cPanel setup
- **Cons**: Requires creating a PHP endpoint on cPanel
- **Best for**: Production environments

### Method 2: File-Based Sync
- **Pros**: Simple, no direct database access needed
- **Cons**: Requires FTP access, manual processing
- **Best for**: Backup and manual sync scenarios

### Method 3: Direct Database Connection
- **Pros**: Real-time sync, most efficient
- **Cons**: Requires cPanel to allow remote MySQL connections
- **Best for**: When cPanel allows remote connections

## 🚀 Quick Setup (API Method - Recommended)

### Step 1: Deploy API Endpoint to cPanel

1. **Upload the PHP file**:
   ```bash
   # Upload this file to your cPanel:
   # server/cpanel-api/sync-endpoint.php
   # To: public_html/api/sync.php
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
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Step 2: Configure Local Sync

1. **Update configuration**:
   ```javascript
   // server/config/cpanel-sync.config.js
   module.exports = {
       apiEndpoint: 'https://your-domain.com/api/sync.php',
       apiKey: 'your_secure_api_key',
       // ... other settings
   };
   ```

2. **Test the sync**:
   ```bash
   cd server
   node scripts/sync-to-cpanel.js api
   ```

### Step 3: Set Up Scheduled Sync

1. **Install dependencies**:
   ```bash
   npm install node-cron nodemailer basic-ftp
   ```

2. **Start scheduled sync**:
   ```bash
   node scripts/scheduled-sync.js start
   ```

## 📁 File-Based Sync Setup

### Step 1: Configure FTP

1. **Update FTP settings**:
   ```javascript
   // server/config/cpanel-sync.config.js
   ftpConfig: {
       host: 'your-domain.com',
       user: 'your_ftp_username',
       password: 'your_ftp_password',
       remotePath: '/public_html/data-sync/'
   }
   ```

2. **Create remote directory** on cPanel:
   ```bash
   # Create directory: public_html/data-sync/
   ```

### Step 2: Run File Sync

```bash
cd server
node scripts/sync-to-cpanel.js files
```

### Step 3: Process Files on cPanel

Create a PHP script on cPanel to process the uploaded JSON files:

```php
<?php
// public_html/data-sync/process-files.php
$files = glob('*.json');
foreach ($files as $file) {
    $data = json_decode(file_get_contents($file), true);
    // Process the data and insert into database
    // Move processed file to archive folder
}
?>
```

## 🔗 Direct Database Connection Setup

### Step 1: Enable Remote MySQL in cPanel

1. **Go to cPanel** → **Remote MySQL**
2. **Add your server's IP address**
3. **Note the connection details**

### Step 2: Configure Direct Connection

```javascript
// server/config/cpanel-sync.config.js
directConnection: {
    host: 'your-domain.com',
    port: 3306,
    user: 'your_cpanel_db_user',
    password: 'your_cpanel_db_password',
    database: 'your_cpanel_db_name',
    ssl: { rejectUnauthorized: false }
}
```

### Step 3: Test Direct Connection

```bash
cd server
node scripts/sync-to-cpanel.js direct
```

## ⚙️ Configuration Options

### Environment Variables

Create a `.env` file with:

```env
# cPanel Database
CPANEL_DB_HOST=your-domain.com
CPANEL_DB_USER=your_cpanel_db_user
CPANEL_DB_PASSWORD=your_cpanel_db_password
CPANEL_DB_NAME=your_cpanel_db_name

# API Configuration
CPANEL_API_URL=https://your-domain.com/api/sync.php
CPANEL_API_KEY=your_secure_api_key

# FTP Configuration
FTP_HOST=your-domain.com
FTP_USER=your_ftp_username
FTP_PASSWORD=your_ftp_password

# Notification Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@yourdomain.com
```

### Sync Settings

```javascript
// server/config/cpanel-sync.config.js
module.exports = {
    syncInterval: 24 * 60 * 60 * 1000, // 24 hours
    batchSize: 100, // Records per batch
    exportPath: './exports' // Local export directory
};
```

## 🚀 Usage Examples

### Manual Sync

```bash
# Full sync
node scripts/sync-to-cpanel.js

# API sync only
node scripts/sync-to-cpanel.js api

# File sync only
node scripts/sync-to-cpanel.js files

# Direct connection sync
node scripts/sync-to-cpanel.js direct
```

### Scheduled Sync

```bash
# Start scheduled service
node scripts/scheduled-sync.js start

# Manual trigger
node scripts/scheduled-sync.js sync full
node scripts/scheduled-sync.js sync critical

# Check status
node scripts/scheduled-sync.js status
```

### Programmatic Usage

```javascript
const CpanelDataSync = require('./scripts/sync-to-cpanel');

const sync = new CpanelDataSync();

// Sync via API
await sync.syncViaAPI();

// Sync via files
await sync.syncViaFiles();

// Auto-sync (tries all methods)
await sync.sync();
```

## 🔒 Security Considerations

1. **Use HTTPS** for API endpoints
2. **Generate strong API keys**
3. **Limit database user permissions**
4. **Use SSL for database connections**
5. **Regularly rotate credentials**
6. **Monitor sync logs**

## 🐛 Troubleshooting

### Common Issues

1. **Connection refused**:
   - Check cPanel remote MySQL settings
   - Verify IP address whitelist
   - Test with MySQL client

2. **API authentication failed**:
   - Verify API key in both files
   - Check Authorization header format
   - Ensure HTTPS is used

3. **FTP upload failed**:
   - Verify FTP credentials
   - Check directory permissions
   - Test with FTP client

4. **Sync timeout**:
   - Increase timeout values
   - Reduce batch size
   - Check network connectivity

### Debug Mode

Enable debug logging:

```javascript
// Add to sync script
process.env.DEBUG = 'sync:*';
```

### Logs

Check sync logs:

```bash
# View local logs
tail -f logs/sync.log

# Check cPanel sync logs
# Query sync_logs table in cPanel database
```

## 📊 Monitoring

### Sync Status Dashboard

Create a simple dashboard to monitor sync status:

```php
<?php
// public_html/admin/sync-status.php
$pdo = new PDO("mysql:host=localhost;dbname=your_db", $user, $pass);
$stmt = $pdo->query("SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10");
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($logs as $log) {
    echo "<div class='log-entry'>";
    echo "<strong>{$log['sync_timestamp']}</strong> - ";
    echo "{$log['records_synced']} records - ";
    echo "<span class='status-{$log['status']}'>{$log['status']}</span>";
    echo "</div>";
}
?>
```

## 🎯 Best Practices

1. **Start with API method** for reliability
2. **Test thoroughly** before production
3. **Monitor sync logs** regularly
4. **Set up notifications** for failures
5. **Backup before first sync**
6. **Use incremental sync** for large datasets
7. **Schedule during low-traffic hours**

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify configuration
3. Test each method individually
4. Check cPanel error logs
5. Contact your hosting provider if needed

---

**Note**: This sync solution is designed to work with cPanel limitations. Choose the method that best fits your hosting setup and security requirements.
