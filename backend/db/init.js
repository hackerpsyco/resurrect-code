const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  }
});

const createTablesSQL = `
-- Enable UUID extension if not enabled (gen_random_uuid is robust in PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  github_id TEXT UNIQUE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Monitored Repositories table
CREATE TABLE IF NOT EXISTS monitored_repos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repo_full_name TEXT,
  repo_id BIGINT,
  github_token TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Build Incidents table
CREATE TABLE IF NOT EXISTS build_incidents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  repo_full_name TEXT,
  run_id TEXT,
  branch TEXT,
  error_logs TEXT,
  root_cause TEXT,
  error_type TEXT,
  fix_suggestion TEXT,
  file_to_change TEXT,
  code_change TEXT,
  pr_url TEXT,
  status TEXT DEFAULT 'detected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Code Reviews table
CREATE TABLE IF NOT EXISTS code_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  repo_full_name TEXT,
  commit_sha TEXT,
  branch TEXT,
  author TEXT,
  summary TEXT,
  issues JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function initDB() {
  console.log('🚀 Connecting to Neon Database to initialize tables...');
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon successfully');
    
    await client.query(createTablesSQL);
    console.log('🎉 All tables initialized successfully: users, monitored_repos, build_incidents');
    
    client.release();
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err.message);
  } finally {
    await pool.end();
  }
}

initDB();
