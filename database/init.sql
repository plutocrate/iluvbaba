-- Database initialization for RULE IS FUN
-- This runs automatically when the PostgreSQL container starts

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maps (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  map_json TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64) NOT NULL,
  vote VARCHAR(4) NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(map_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_maps_upvotes ON maps(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_maps_created ON maps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_map ON votes(map_id);

-- Insert a demo user (password: "demo1234")
INSERT INTO users (username, password_hash) 
VALUES ('demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (username) DO NOTHING;

-- Insert demo community map
INSERT INTO maps (title, author_id, map_json, upvotes)
VALUES (
  'Demo: Rule Loop',
  1,
  '{"width":10,"height":8,"tiles":[{"type":"TEXT_BABA","x":1,"y":1,"isText":true,"textType":"noun","textValue":"BABA"},{"type":"TEXT_IS","x":2,"y":1,"isText":true,"textType":"verb","textValue":"IS"},{"type":"TEXT_YOU","x":3,"y":1,"isText":true,"textType":"property","textValue":"YOU"},{"type":"TEXT_FLAG","x":6,"y":6,"isText":true,"textType":"noun","textValue":"FLAG"},{"type":"TEXT_IS","x":7,"y":6,"isText":true,"textType":"verb","textValue":"IS"},{"type":"TEXT_WIN","x":8,"y":6,"isText":true,"textType":"property","textValue":"WIN"},{"type":"BABA","x":2,"y":4,"isText":false},{"type":"FLAG","x":8,"y":4,"isText":false}]}',
  5
)
ON CONFLICT DO NOTHING;
