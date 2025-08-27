import { getDb } from '../../db/sqlite';

export type FileRow = {
  id: string;
  clip_id: string;
  filename: string;
  size_bytes: number;
  mime: string;
  rel_path: string;    // relativo a FILES_DIR
  created_at: string;
  expires_at: string;
};

export function insertFiles(rows: FileRow[]) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO files (id, clip_id, filename, size_bytes, mime, rel_path, created_at, expires_at)
    VALUES (@id, @clip_id, @filename, @size_bytes, @mime, @rel_path, @created_at, @expires_at)
  `);
  const tx = db.transaction((items: FileRow[]) => {
    for (const r of items) stmt.run(r);
  });
  tx(rows);
}

export function getFileById(fileId: string): FileRow | undefined {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM files WHERE id = ?`).get(fileId);
  return row as FileRow | undefined;
}

export function listFilesByClip(clipId: string): FileRow[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM files WHERE clip_id = ? ORDER BY created_at ASC`).all(clipId) as FileRow[];
}

export function deleteExpiredFilesAndReturnPaths(nowIso: string): string[] {
  // Devuelve rutas relativas para que el worker las borre del disco
  const db = getDb();
  const rows = db.prepare(`SELECT rel_path FROM files WHERE expires_at <= ?`).all(nowIso) as { rel_path: string }[];
  db.prepare(`DELETE FROM files WHERE expires_at <= ?`).run(nowIso);
  return rows.map(r => r.rel_path);
}
