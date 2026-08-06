const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Load from root or current dir?
const express = require('express'); // Just checking imports

const connectionString = "postgresql://neondb_owner:npg_jNAYuJ9Ws8hK@ep-lively-cake-adgo1qk7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log("Testing connection to Neon...");

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;')
  .then(res => {
    console.log('✅ Migration query ran successfully!');
    process.exit(0);
  })

  .catch(err => {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  });
