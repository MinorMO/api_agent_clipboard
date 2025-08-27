// src/config/limits.ts
import type { Env } from './env';  // <-- NO ../env

export function bytesPerMB(mb: number) {
  return mb * 1024 * 1024;
}

export function getLimits(env: Env) {
  const allowed = new Set(
    env.ALLOWED_MIME.split(',').map(s => s.trim()).filter(Boolean)
  );
  return {
    maxFileBytes: bytesPerMB(env.MAX_FILE_MB),
    maxUploadPerClipBytes: bytesPerMB(env.MAX_UPLOAD_PER_CLIP_MB),
    allowedMime: allowed
  };
}
