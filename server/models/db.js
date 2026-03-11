/**
 * db.js — Database adapter
 * No DATABASE_URL → SQLite (server/data.db), zero config
 * DATABASE_URL set → PostgreSQL (Railway/production)
 */

const path = require('path');

let adapter = null;
let db      = null; // better-sqlite3 instance
let pool    = null; // pg Pool instance

// ── SQLite query adapter ──────────────────────────────────────────────────────
// Translates Postgres-style queries ($1, RETURNING) to SQLite-compatible ones.
function sqliteQuery(text, params = []) {
  // $1,$2... → ?
  const sql = text.replace(/\$\d+/g, '?');
  const upper = sql.trim().toUpperCase();

  // SELECT / WITH
  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
    const rows = db.prepare(sql).all(...params);
    return Promise.resolve({ rows, rowCount: rows.length });
  }

  // INSERT ... RETURNING id  (SQLite 3.35+ supports RETURNING but better-sqlite3 may not expose it cleanly)
  // Safest approach: strip RETURNING, run insert, fetch by lastInsertRowid
  if (upper.startsWith('INSERT') && upper.includes('RETURNING')) {
    const cleanSql = sql.replace(/\s+RETURNING\s+.*/i, '').trim();
    const table    = (cleanSql.match(/INTO\s+(\w+)/i) || [])[1];
    try {
      const info = db.prepare(cleanSql).run(...params);
      const row  = table
        ? db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid)
        : null;
      return Promise.resolve({ rows: row ? [row] : [{ id: info.lastInsertRowid }], rowCount: 1 });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // Everything else: UPDATE, DELETE, INSERT without RETURNING, CREATE, etc.
  try {
    const info = db.prepare(sql).run(...params);
    return Promise.resolve({ rows: [], rowCount: info.changes ?? 0 });
  } catch (e) {
    if (e.message.includes('already exists')) return Promise.resolve({ rows: [], rowCount: 0 });
    return Promise.reject(e);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL.includes('railway') || process.env.DATABASE_SSL)
        ? { rejectUnauthorized: false } : false,
    });
    await pool.query('SELECT 1');
    adapter = 'pg';
    console.log('✅ PostgreSQL connected');
  } else {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, '../data.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    adapter = 'sqlite';
    console.log(`✅ SQLite ready → ${dbPath}`);
  }
  await createTables();
  await fixMapJson();
}

// Fix any maps that were stored as double-encoded JSON strings
async function fixMapJson() {
  try {
    const result = await query('SELECT id, map_json FROM maps');
    for (const row of result.rows) {
      if (typeof row.map_json !== 'string') continue;
      let val = row.map_json;
      // Unwrap double-encoding: if parsing gives another string, parse again
      try {
        const once = JSON.parse(val);
        if (typeof once === 'string') {
          const twice = JSON.parse(once);
          if (twice && twice.tiles) {
            await query('UPDATE maps SET map_json = $1 WHERE id = $2', [JSON.stringify(twice), row.id]);
          }
        }
      } catch(_) {}
    }
  } catch(_) {} // non-fatal
}

async function createTables() {
  if (adapter === 'pg') {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username VARCHAR(32) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS maps (
      id SERIAL PRIMARY KEY, title VARCHAR(100) NOT NULL,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      map_json TEXT NOT NULL, upvotes INTEGER DEFAULT 0, downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY, map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
      ip_hash VARCHAR(64) NOT NULL, vote VARCHAR(4) NOT NULL CHECK (vote IN ('up','down')),
      created_at TIMESTAMP DEFAULT NOW(), UNIQUE(map_id, ip_hash))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_maps_votes ON maps(upvotes DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_maps_created ON maps(created_at DESC)`);
  } else {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        map_json TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
        ip_hash TEXT NOT NULL,
        vote TEXT NOT NULL CHECK (vote IN ('up','down')),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(map_id, ip_hash)
      );
      CREATE INDEX IF NOT EXISTS idx_maps_votes ON maps(upvotes DESC);
      CREATE INDEX IF NOT EXISTS idx_maps_created ON maps(created_at DESC);
    `);
  }
}

function query(text, params) {
  if (!adapter) throw new Error('Database not initialized');
  return adapter === 'sqlite' ? sqliteQuery(text, params) : pool.query(text, params);
}

module.exports = { init, query, getPool: () => pool, getDb: () => db };
