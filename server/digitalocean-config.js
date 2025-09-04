// DigitalOcean MySQL Database Configuration
// Copy these settings to your .env file

module.exports = {
  // Database Configuration
  DB_HOST: 'oxfordstudycenter-do-user-16839730-0.l.db.ondigitalocean.com',
  DB_USER: 'doadmin',
  DB_PASSWORD: 'YOUR_DIGITALOCEAN_PASSWORD_HERE', // Replace with your actual password
  DB_NAME: 'sms',
  DB_PORT: '25060',
  SSL_MODE: 'REQUIRED',
  
  // Server Configuration
  PORT: '5000',
  NODE_ENV: 'production'
};

// Instructions:
// 1. Create a .env file in the server directory
// 2. Copy the above configuration to your .env file
// 3. Replace 'YOUR_DIGITALOCEAN_PASSWORD_HERE' with your actual DigitalOcean password
// 4. Save the .env file
// 5. Restart your server
