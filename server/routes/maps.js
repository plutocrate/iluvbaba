const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('./auth');

function db()    { return require('../models/db'); }
function redis() { try { return require('../index').getRedis(); } catch(e) { return null; } }

// GET /api/maps/mine  — MUST be before /:id
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const r = await db().query(
      'SELECT id, title, upvotes, downvotes, created_at FROM maps WHERE author_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ maps: r.rows });
  } catch(e) { res.status(500).json({ error: 'Failed to get your maps' }); }
});

// GET /api/maps
router.get('/', async (req, res) => {
  const { sort = 'top', page = 1, search } = req.query;
  const limit  = 20;
  const offset = (Math.max(1, parseInt(page)) - 1) * limit;
  try {
    let orderBy = 'm.upvotes DESC';
    if (sort === 'new')      orderBy = 'm.created_at DESC';
    if (sort === 'trending') orderBy = '(m.upvotes - m.downvotes) DESC, m.created_at DESC';

    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND m.title LIKE $${params.length}`;
    }
    params.push(limit, offset);

    const r = await db().query(`
      SELECT m.id, m.title, u.username AS author, m.upvotes, m.downvotes, m.created_at
      FROM maps m LEFT JOIN users u ON m.author_id = u.id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ maps: r.rows });
  } catch(e) { console.error('Get maps error:', e); res.status(500).json({ error: 'Failed to get maps' }); }
});

// GET /api/maps/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await db().query(`
      SELECT m.id, m.title, m.map_json, m.upvotes, m.downvotes, m.created_at, u.username AS author
      FROM maps m LEFT JOIN users u ON m.author_id = u.id
      WHERE m.id = $1
    `, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Map not found' });
    const row = r.rows[0];
    // Parse map_json if it's still a string
    if (typeof row.map_json === 'string') {
      try { row.map_json = JSON.parse(row.map_json); } catch(_) {}
    }
    res.json(row);
  } catch(e) { console.error('Get map error:', e); res.status(500).json({ error: 'Failed to get map' }); }
});

// POST /api/maps
router.post('/', authMiddleware, async (req, res) => {
  const { title, map_json } = req.body;
  if (!title || !map_json) return res.status(400).json({ error: 'Title and map_json required' });
  if (title.length > 100)  return res.status(400).json({ error: 'Title too long' });
  try {
    const mapObj = typeof map_json === 'string' ? JSON.parse(map_json) : map_json;
    if (!mapObj || !mapObj.width || !mapObj.height || !Array.isArray(mapObj.tiles))
      return res.status(400).json({ error: 'Invalid map format' });
    if (mapObj.tiles.length > 5000)
      return res.status(400).json({ error: 'Map too large' });
    const mapStr = JSON.stringify(mapObj);
    const r = await db().query(
      'INSERT INTO maps (title, author_id, map_json) VALUES ($1, $2, $3) RETURNING id',
      [title, req.user.id, mapStr]
    );
    const rc = redis();
    if (rc) { rc.del('feed:top').catch(()=>{}); rc.del('feed:new').catch(()=>{}); }
    res.status(201).json({ id: r.rows[0].id, title });
  } catch(e) {
    if (e instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON' });
    console.error('Create map error:', e);
    res.status(500).json({ error: 'Failed to create map' });
  }
});

// DELETE /api/maps/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await db().query('SELECT author_id FROM maps WHERE id = $1', [req.params.id]);
    if (!existing.rows.length)                    return res.status(404).json({ error: 'Map not found' });
    if (existing.rows[0].author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db().query('DELETE FROM maps WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Failed to delete map' }); }
});

module.exports = router;
