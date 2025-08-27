import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let DB_PATH = './data/sqlite.db';
let db: Database.Database | null = null;

export async function initDbAndMigrate(sqlitePath: string, enableWal: boolean) {
  DB_PATH = sqlitePath;
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const local = new Database(sqlitePath);

  // PRAGMAs recomendados
  local.pragma('foreign_keys = ON');
  if (enableWal) {
    local.pragma('journal_mode = WAL');
  } else {
    local.pragma('journal_mode = DELETE');
  }
  local.pragma('synchronous = NORMAL');

  // tabla de control de migraciones
  local.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const migDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migDir)) fs.mkdirSync(migDir, { recursive: true });

  const already = new Set<string>(
    local.prepare('SELECT name FROM _migrations ORDER BY id').all().map((r: any) => r.name)
  );

  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (already.has(file)) continue;
    const sql = fs.readFileSync(path.join(migDir, file), 'utf8');
    const trx = local.transaction(() => {
      local.exec(sql);
      local.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    trx();
    // eslint-disable-next-line no-console
    console.log(`▶ Migración aplicada: ${file}`);
  }

  // deja una conexión global reutilizable
  db = local;
}

// Obtiene la conexión (asegúrate de llamar initDbAndMigrate() en el arranque)
export function getDb(): Database.Database {
  if (!db) {
    // fallback: abrir (por si se llama antes de init)
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
  }
  return db;
}
