import { getDb } from '../../db/sqlite';

export const usageService = {
  userBytesNow(userId: string) {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const row = db.prepare(`
      SELECT COALESCE(SUM(f.size_bytes), 0) AS bytes
      FROM files f
      JOIN clips c ON c.id = f.clip_id
      WHERE c.user_id = ? AND f.expires_at > ?
    `).get(userId, nowIso) as { bytes: number };
    return row.bytes || 0;
  },
  channelBytesNow(channelId: string) {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const row = db.prepare(`
      SELECT COALESCE(SUM(f.size_bytes), 0) AS bytes
      FROM files f
      JOIN clips c ON c.id = f.clip_id
      WHERE c.channel_id = ? AND f.expires_at > ?
    `).get(channelId, nowIso) as { bytes: number };
    return row.bytes || 0;
  }
};
