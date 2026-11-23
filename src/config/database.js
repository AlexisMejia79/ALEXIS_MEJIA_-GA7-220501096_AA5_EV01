require('dotenv').config();

const mysql = require('mysql2/promise');

// Estos valores coinciden con la configuracion habitual de MySQL en XAMPP.
const database = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_app_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = database;
