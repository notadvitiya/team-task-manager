// db/pool.js
// This file creates ONE connection to PostgreSQL that the whole app reuses.
// "pg" is the PostgreSQL driver for Node.js.

const { Pool } = require('pg');

// Pool automatically manages multiple connections.
// It reads DATABASE_URL from your .env file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for Railway PostgreSQL (uses SSL)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection when the server starts
pool.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL');
  }
});

module.exports = pool;
