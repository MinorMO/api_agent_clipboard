import { getDb } from '../../db/sqlite';

export type ClipRow = {
  id: string;
  channel_id: string;
  user_id: string;
  type: 'text' | 'image' | 'files';
  text_content?: string | null;
  created_at: string;
  expires_at: string;
};

export function insertClip(row: ClipRow) {
  const db = getDb();
  db.prepare(`
    INSERT INTO clips (id, channel_id, user_id, type, text_content, created_at, expires_at)
    VALUES (@id, @channel_id, @user_id, @type, @text_content, @created_at, @expires_at)
  `).run(row);
}

export function getLatestNonExpired(channelId: string, nowIso: string): ClipRow | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM clips
    WHERE channel_id = ? AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(channelId, nowIso);
  return row as ClipRow | undefined;
}

export function listRange(channelId: string, fromIso: string, toIso: string, limit: number): ClipRow[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM clips
    WHERE channel_id = ?
      AND created_at >= ?
      AND created_at <= ?
      AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(channelId, fromIso, toIso, new Date().toISOString(), limit);
  return rows as ClipRow[];
}

export function getClipById(clipId: string): ClipRow | undefined {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM clips WHERE id = ?`).get(clipId);
  return row as ClipRow | undefined;
}
