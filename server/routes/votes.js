/**
 * Votes route
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

function tryDb() {
  try { return require('../models/db'); } catch (e) { return null; }
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip + 'salt-baba-is-you').digest('hex').slice(0, 16);
}

// POST /api/vote
router.post('/', async (req, res) => {
  const db = tryDb();
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { map_id, vote } = req.body;
  if (!map_id || !vote) return res.status(400).json({ error: 'map_id and vote required' });
  if (!['up', 'down', 'remove'].includes(vote)) return res.status(400).json({ error: 'Invalid vote' });

  const ipHash = hashIp(req.ip);

  try {
    if (vote === 'remove') {
      // Remove existing vote
      const existing = await db.query('SELECT vote FROM votes WHERE map_id = $1 AND ip_hash = $2', [map_id, ipHash]);
      if (existing.rows.length > 0) {
        const oldVote = existing.rows[0].vote;
        await db.query('DELETE FROM votes WHERE map_id = $1 AND ip_hash = $2', [map_id, ipHash]);
        if (oldVote === 'up') {
          await db.query('UPDATE maps SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1', [map_id]);
        } else {
          await db.query('UPDATE maps SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = $1', [map_id]);
        }
      }
    } else {
      // Check existing vote
      const existing = await db.query('SELECT vote FROM votes WHERE map_id = $1 AND ip_hash = $2', [map_id, ipHash]);

      if (existing.rows.length > 0) {
        const oldVote = existing.rows[0].vote;
        if (oldVote === vote) {
          // Same vote - remove it
          await db.query('DELETE FROM votes WHERE map_id = $1 AND ip_hash = $2', [map_id, ipHash]);
          if (vote === 'up') {
            await db.query('UPDATE maps SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1', [map_id]);
          } else {
            await db.query('UPDATE maps SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = $1', [map_id]);
          }
        } else {
          // Changed vote
          await db.query('UPDATE votes SET vote = $1 WHERE map_id = $2 AND ip_hash = $3', [vote, map_id, ipHash]);
          if (vote === 'up') {
            await db.query('UPDATE maps SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0) WHERE id = $1', [map_id]);
          } else {
            await db.query('UPDATE maps SET downvotes = downvotes + 1, upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1', [map_id]);
          }
        }
      } else {
        // New vote
        await db.query('INSERT INTO votes (map_id, ip_hash, vote) VALUES ($1, $2, $3)', [map_id, ipHash, vote]);
        if (vote === 'up') {
          await db.query('UPDATE maps SET upvotes = upvotes + 1 WHERE id = $1', [map_id]);
        } else {
          await db.query('UPDATE maps SET downvotes = downvotes + 1 WHERE id = $1', [map_id]);
        }
      }
    }

    // Return updated counts
    const result = await db.query('SELECT upvotes, downvotes FROM maps WHERE id = $1', [map_id]);
    const counts = result.rows[0] || { upvotes: 0, downvotes: 0 };
    res.json({ success: true, ...counts });
  } catch (e) {
    console.error('Vote error:', e);
    res.status(500).json({ error: 'Vote failed' });
  }
});

module.exports = router;
