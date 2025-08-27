// src/modules/files/storage.ts
import fs from 'fs';
import path from 'path';

export function sanitizeFilename(name: string) {
  const base = path.basename(name); // quita directorios
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function buildClipDir(filesDir: string, userId: string, channelId: string, clipId: string) {
  // Estructura: user/<userId>/channel/<channelId>/clip/<clipId>/
  return path.resolve(filesDir, 'user', userId, 'channel', channelId, 'clip', clipId);
}

export function safeJoin(baseDir: string, rel: string) {
  const p = path.resolve(baseDir, rel);
  const base = path.resolve(baseDir);
  if (!p.startsWith(base + path.sep)) {
    throw new Error('Path traversal detected');
  }
  return p;
}
