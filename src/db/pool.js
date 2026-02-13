// Auto-detect database type from environment
const dbType = process.env.DB_TYPE || 'sqlite';

let pool;

if (dbType === 'sqlite') {
  // Use SQLite (no setup required)
  pool = require('./sqlite-pool');
  console.log('Using SQLite database');
} else {
  // Use PostgreSQL
  const { Pool } = require('pg');
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('Using PostgreSQL database');
}

module.exports = pool;
