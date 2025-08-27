import fs from 'fs';
import path from 'path';
import type { Env } from '../config/env';
import { deleteExpiredFilesAndReturnPaths } from '../modules/files/repo';

export function purgeExpired(env: Env) {
  const nowIso = new Date().toISOString();
  // 1) borrar filas de files expiradas y recolectar rutas
  const relPaths = deleteExpiredFilesAndReturnPaths(nowIso);

  // 2) borrar físicamente del disco
  for (const rel of relPaths) {
    try {
      const abs = path.resolve(env.FILES_DIR, rel);
      fs.unlinkSync(abs);
    } catch { /* ignore */ }
  }

  // 3) borrar clips expirados (cascade borra files que quedaran)
  //   (si ya borramos files arriba, solo por limpieza de clips)
  const sqlite3 = require('better-sqlite3');
  const db = new sqlite3(env.SQLITE_PATH);
  db.prepare(`DELETE FROM clips WHERE expires_at <= ?`).run(nowIso);
  db.close();
}
