import { getDb } from '../../db/sqlite';

export type Channel = {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
};

export function insertChannel(ch: Channel) {
  const db = getDb();
  db.prepare(`
    INSERT INTO channels (id, owner_user_id, name, created_at)
    VALUES (@id, @owner_user_id, @name, @created_at)
  `).run(ch);
}

export function addMember(channelId: string, userId: string, role: 'owner'|'member', addedAt: string) {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO channel_members (channel_id, user_id, role, added_at)
    VALUES (?, ?, ?, ?)
  `).run(channelId, userId, role, addedAt);
}

export function isMember(channelId: string, userId: string): boolean {
  const db = getDb();
  const row = db.prepare(`
    SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?
  `).get(channelId, userId);
  return !!row;
}

export function isOwner(channelId: string, userId: string): boolean {
  const db = getDb();
  const row = db.prepare(`
    SELECT 1 FROM channels WHERE id = ? AND owner_user_id = ?
  `).get(channelId, userId);
  return !!row;
}

export function listMyChannels(userId: string) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.name, c.owner_user_id, c.created_at, m.role
    FROM channels c
    JOIN channel_members m ON m.channel_id = c.id
    WHERE m.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);
  return rows;
}

export function createInvite(code: string, channelId: string, createdBy: string, createdAt: string, expiresAt: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO channel_invites (code, channel_id, created_by, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(code, channelId, createdBy, createdAt, expiresAt);
}

export function getInvite(code: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM channel_invites WHERE code = ?`).get(code) as
    | { code: string; channel_id: string; created_by: string; created_at: string; expires_at: string }
    | undefined;
}

export function deleteInvite(code: string) {
  const db = getDb();
  db.prepare(`DELETE FROM channel_invites WHERE code = ?`).run(code);
}

export function getChannelById(id: string): Channel | undefined {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM channels WHERE id = ?`).get(id);
  return row as Channel | undefined;
}

export function existsChannelNameForOwner(ownerId: string, name: string): boolean {
  const db = getDb();
  const row = db.prepare(
    'SELECT 1 FROM channels WHERE owner_user_id = ? AND lower(name) = lower(?)'
  ).get(ownerId, name);
  return !!row;
}

