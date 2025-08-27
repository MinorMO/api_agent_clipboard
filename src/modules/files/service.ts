import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import type { Env } from '../../config/env';
import { getLimits } from '../../config/limits';
import { getClipById } from '../clips/repo';
import { isMember } from '../channels/repo';
import { insertFiles, getFileById, type FileRow, listFilesByClip } from './repo';
import { buildClipDir, sanitizeFilename, ensureDir, safeJoin } from './storage';
import { bus } from '../../core/eventBus';

export const filesService = {
  // Validaciones previas para upload (permisos + destino)
  prepareUpload(env: Env, userId: string, clipId: string) {
    const clip = getClipById(clipId);
    if (!clip) {
      const e: any = new Error('Clip no existe');
      e.status = 404; e.code = 'CLIP_NOT_FOUND'; throw e;
    }
    if (!isMember(clip.channel_id, userId)) {
      const e: any = new Error('No eres miembro del canal');
      e.status = 403; e.code = 'NOT_A_MEMBER'; throw e;
    }
    const dir = buildClipDir(env.FILES_DIR, clip.user_id, clip.channel_id, clip.id);
    ensureDir(dir);
    return { clip, destDir: dir };
  },

  // Registrar metadatos después de guardar los archivos en disco
   registerUploaded(env: Env, clipId: string, files: Express.Multer.File[], uploadedBy?: string) {
    const clip = getClipById(clipId)!;
    const nowIso = new Date().toISOString();
    const rows: FileRow[] = files.map((f) => ({
      id: nanoid(),
      clip_id: clipId,
      filename: f.originalname,
      size_bytes: f.size,
      mime: f.mimetype,
      rel_path: path.relative(env.FILES_DIR, f.path),
      created_at: nowIso,
      expires_at: clip.expires_at
    }));
    insertFiles(rows);

    // Emitir evento
    bus.emit('files.uploaded', {
      type: 'files.uploaded',
      channelId: clip.channel_id,
      clipId: clip.id,
      by: uploadedBy ?? clip.user_id,
      files: rows.map(r => ({ id: r.id, filename: r.filename, mime: r.mime, size: r.size_bytes })),
      at: nowIso
    });

    return rows.map(r => ({
      id: r.id,
      filename: r.filename,
      size_bytes: r.size_bytes,
      mime: r.mime,
      created_at: r.created_at,
      expires_at: r.expires_at
    }));
  },

  // Descarga (verifica permisos y existencia)
  getDownloadInfo(env: Env, userId: string, clipId: string, fileId: string) {
    const clip = getClipById(clipId);
    if (!clip) {
      const e: any = new Error('Clip no existe');
      e.status = 404; e.code = 'CLIP_NOT_FOUND'; throw e;
    }
    if (!isMember(clip.channel_id, userId)) {
      const e: any = new Error('No eres miembro del canal');
      e.status = 403; e.code = 'NOT_A_MEMBER'; throw e;
    }
    const file = getFileById(fileId);
    if (!file || file.clip_id !== clipId) {
      const e: any = new Error('Archivo no encontrado');
      e.status = 404; e.code = 'FILE_NOT_FOUND'; throw e;
    }
    const absPath = safeJoin(env.FILES_DIR, file.rel_path);
    if (!fs.existsSync(absPath)) {
      const e: any = new Error('Archivo no disponible');
      e.status = 410; e.code = 'FILE_GONE'; throw e;
    }
    return { file, absPath };
  },

  listOfClip(userId: string, clipId: string) {
    const clip = getClipById(clipId);
    if (!clip) {
      const e: any = new Error('Clip no existe'); e.status = 404; e.code = 'CLIP_NOT_FOUND'; throw e;
    }
    if (!isMember(clip.channel_id, userId)) {
      const e: any = new Error('No eres miembro del canal'); e.status = 403; e.code = 'NOT_A_MEMBER'; throw e;
    }
    return listFilesByClip(clipId).map(f => ({
      id: f.id, filename: f.filename, size_bytes: f.size_bytes, mime: f.mime,
      created_at: f.created_at, expires_at: f.expires_at
    }));
  },

  // Validación de límites/MIME por lote
  validateBatch(env: Env, files: Express.Multer.File[]) {
    const { maxUploadPerClipBytes, allowedMime } = getLimits(env);
    const total = files.reduce((acc, f) => acc + f.size, 0);
    if (total > maxUploadPerClipBytes) {
      const e: any = new Error(`Límite total por envío excedido (${total} bytes)`);
      e.status = 413; e.code = 'UPLOAD_TOO_LARGE'; throw e;
    }
    for (const f of files) {
      if (!allowedMime.has(f.mimetype)) {
        const e: any = new Error(`MIME no permitido: ${f.mimetype}`);
        e.status = 415; e.code = 'UNSUPPORTED_TYPE'; throw e;
      }
    }
  },

  sanitizeName(orig: string) {
    return sanitizeFilename(orig);
  }
};
