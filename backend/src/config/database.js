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
  connectionLimit: isProd ? 10 : 5,
  maxIdle: isProd ? 5 : 10,
  idleTimeout: 60000,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: isProd ? { rejectUnauthorized: true } : undefined
});

// Pre-warm: abrir conexão no startup
pool.query('SELECT 1')
  .then(() => console.log('DB pool pre-warmed'))
  .catch(err => console.error('DB pre-warm failed:', err.message));

module.exports = pool;
