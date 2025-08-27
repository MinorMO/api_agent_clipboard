import { getDb } from '../../db/sqlite';

export type User = {
  id: string;
  email: string;
  pass_hash: string;
  created_at: string;
  last_login?: string | null;
};

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  return row as User | undefined;
}

export function insertUser(u: User) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (id, email, pass_hash, created_at, last_login)
    VALUES (@id, @email, @pass_hash, @created_at, @last_login)
  `).run(u);
}

export function setLastLogin(userId: string, iso: string) {
  const db = getDb();
  db.prepare(`UPDATE users SET last_login = ? WHERE id = ?`).run(iso, userId);
}
