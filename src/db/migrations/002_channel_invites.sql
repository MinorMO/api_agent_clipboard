CREATE TABLE IF NOT EXISTS channel_invites (
  code TEXT PRIMARY KEY,          -- p. ej. ABC12DEF34
  channel_id TEXT NOT NULL,
  created_by TEXT NOT NULL,       -- userId del dueño
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,       -- p. ej. ahora + 7 días
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invites_channel ON channel_invites(channel_id);
