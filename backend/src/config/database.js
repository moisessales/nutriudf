const mysql = require('mysql2/promise');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: isProd ? 5 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  ssl: isProd ? { rejectUnauthorized: true } : undefined
});

module.exports = pool;
