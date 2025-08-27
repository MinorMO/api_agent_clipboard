-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                  -- uuid
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_login TEXT
);

-- CHANNELS
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,                  -- uuid
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CHANNEL MEMBERS
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','member')),
  added_at TEXT NOT NULL,
  PRIMARY KEY (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CLIPS (mensajes)
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,                  -- uuid
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','image','files')),
  text_content TEXT,                    -- si type=text
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clips_channel_created ON clips(channel_id, created_at);

-- FILES (metadatos)
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,                  -- uuid
  clip_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime TEXT NOT NULL,
  rel_path TEXT NOT NULL,               -- relativo a FILES_DIR
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
);
