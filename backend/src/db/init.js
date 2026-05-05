// db/init.js
// This script reads schema.sql and runs it against your database.
// Called once when the server starts so tables are always created.

const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

async function initDB() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
  }
}

module.exports = initDB;
