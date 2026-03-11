/**
 * server/index.js — Express API server
 *
 * Local dev:   reads server/.env  (copy from ../.env.example)
 * Production:  reads environment variables set by Railway
 */

// Load .env FIRST — must be before any process.env reads
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const fs      = require('fs');
const { createClient } = require('redis');

const authRoutes = require('./routes/auth');
const mapsRoutes = require('./routes/maps');
const voteRoutes = require('./routes/votes');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Redis (optional) ──────────────────────────────────────────────────────────
let redisClient = null;

async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('ℹ️  REDIS_URL not set — skipping cache');
    return;
  }
  try {
    redisClient = createClient({ url, socket: { reconnectStrategy: false } });
    redisClient.on('error', () => {});
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (e) {
    console.warn('⚠️  Redis unavailable — skipping cache');
    try { redisClient?.destroy(); } catch (_) {}
    redisClient = null;
  }
}

module.exports.getRedis = () => redisClient;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple rate limiter
const rateMap = new Map();
app.use('/api', (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.start > 60000) { rateMap.set(key, { count: 1, start: now }); return next(); }
  if (++entry.count > 120) return res.status(429).json({ error: 'Too many requests' });
  next();
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/vote', voteRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', redis: !!redisClient, ts: new Date().toISOString() }));

// ── Serve built frontend (production) ─────────────────────────────────────────
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  const pages = {
    '/': 'index.html', '/play': 'index.html',
    '/editor': 'editor/index.html', '/community': 'community/index.html',
    '/login': 'login/index.html', '/register': 'register/index.html', '/profile': 'profile/index.html',
    '/profile':  'profile/index.html', '/profile': 'profile/index.html',
    '/profile': 'profile/index.html',
  };
  for (const [route, file] of Object.entries(pages)) {
    app.get(route, (_req, res) => res.sendFile(path.join(distDir, file)));
  }
  app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// ── Start ──────────────────────────────────────────────────────────────────────
async function start() {
  await initRedis();
  try {
    const db = require('./models/db');
    await db.init();
    console.log('✅ Database connected');
  } catch (e) {
    console.warn('⚠️  Database unavailable:', e.message);
    console.warn('   Set DATABASE_URL in server/.env to enable auth/community');
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 API running → http://localhost:${PORT}`);
    console.log(`   Health     → http://localhost:${PORT}/api/health\n`);
  });
}

start();
