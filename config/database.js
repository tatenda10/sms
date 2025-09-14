const mysql = require('mysql2/promise');
require('dotenv').config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';

const dbConfig = {
  host: process.env.DB_HOST || (isProduction ? 'oxfordstudycenter-do-user-16839730-0.l.db.ondigitalocean.com' : 'localhost'),
  user: process.env.DB_USER || (isProduction ? 'doadmin' : 'root'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || (isProduction ? 'sms' : 'sms'),
  port: process.env.DB_PORT || (isProduction ? 25060 : 3306),
  ssl: process.env.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Ensures all DATE, DATETIME, and TIMESTAMP columns are returned as strings
};

const pool = mysql.createPool(dbConfig);

module.exports = { pool };
