// cPanel Database Sync Configuration
// Update these values with your cPanel details

module.exports = {
    // Option 1: Direct MySQL Connection (if cPanel allows remote connections)
    directConnection: {
        host: 'your-domain.com',
        port: 3306,
        user: 'your_cpanel_db_user',
        password: 'your_cpanel_db_password',
        database: 'your_cpanel_db_name',
        ssl: { rejectUnauthorized: false }
    },
    
    // Option 2: API Endpoint (recommended approach)
    apiEndpoint: 'https://your-domain.com/api/sync',
    apiKey: 'your_secure_api_key',
    
    // Option 3: FTP Configuration for file uploads
    ftpConfig: {
        host: 'your-domain.com',
        user: 'your_ftp_username',
        password: 'your_ftp_password',
        remotePath: '/public_html/data-sync/'
    },
    
    // Sync Settings
    syncInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    batchSize: 100,
    exportPath: './exports'
};
