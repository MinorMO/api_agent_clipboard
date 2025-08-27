import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Env } from '../../config/env';
import { authRequired } from '../../middleware/auth';
import { filesController } from './controller';
import { filesService } from './service';
import { getLimits } from '../../config/limits';
import { usageService } from '../usage/service';

export function filesRoutes(env: Env) {
  const r = Router();
  const ctl = filesController(env);
  const auth = authRequired(env);
  const limits = getLimits(env);

  // Middleware previo: valida clip/membresía y prepara destino
  function prepUpload(req: any, _res: any, next: any) {
    try {
      const user = req.user as { id: string };
      const { clip, destDir } = filesService.prepareUpload(env, user.id, req.params.clipId);
      req._clip = clip;
      req._destDir = destDir;
      next();
    } catch (e) { next(e); }
  }

  // Multer con destino dinámico y nombre saneado
  const storage = multer.diskStorage({
    destination: (req: any, _file, cb) => {
      cb(null, req._destDir);
    },
    filename: (_req: any, file, cb) => {
      const safe = filesService.sanitizeName(file.originalname);
      cb(null, safe);
    }
  });

  // Filtro MIME: si no está permitido, lanzamos error 415 con code 'UNSUPPORTED_TYPE'
  const upload = multer({
    storage,
    limits: { fileSize: limits.maxFileBytes },
    fileFilter: (_req, file, cb) => {
      if (!limits.allowedMime.has(file.mimetype)) {
        const err: any = new Error(`MIME no permitido: ${file.mimetype}`);
        err.status = 415; err.code = 'UNSUPPORTED_TYPE';
        return cb(err);
      }
      cb(null, true);
    }
  });

  // SUBIR (envolvemos upload.array para capturar y manejar errores de Multer)
  r.post('/clips/:clipId/files', auth, prepUpload, (req: any, res, next) => {
    upload.array('files', 20)(req, res, async (err: any) => {
      // Si Multer rechazó (p.ej. MIME no permitido), actualizamos placeholder y propagamos error
      if (err && (err.code === 'UNSUPPORTED_TYPE' || err.status === 415)) {
        try {
          const clip = req._clip as { id: string; type: 'files' | 'text'; text_content?: string };
          if (clip && clip.type === 'files' && clip.text_content === 'Archivo') {
            const { updateClipTextContent } = require('../clips/repo');
            updateClipTextContent(clip.id, 'Archivo No Permitido');
          }
        } catch { /* no romper en manejo de error */ }
        return next(err);
      }
      if (err) return next(err);

      try {
        const files = (req.files as Express.Multer.File[]) || [];
        if (!files.length) {
          const e: any = new Error('No se adjuntó ningún archivo');
          e.status = 400; e.code = 'NO_FILES';
          throw e;
        }

        const total = files.reduce((acc, f) => acc + f.size, 0);

        // 1) límite por lote (suma de archivos)
        if (total > limits.maxUploadPerClipBytes) {
          for (const f of files) { try { fs.unlinkSync(f.path); } catch {} } // cleanup
          const e: any = new Error('Límite total por envío excedido');
          e.status = 413; e.code = 'UPLOAD_TOO_LARGE';
          throw e;
        }

        // 2) cuotas duras (usuario / canal)
        const user = (req as any).user as { id: string };
        const clip = (req as any)._clip as { channel_id: string };

        // si aún no agregaste QUOTA_* en Env, estas líneas siguen funcionando
        const userLimitGB = (env as any).QUOTA_USER_GB ?? 0;
        const chLimitGB   = (env as any).QUOTA_CHANNEL_GB ?? 0;
        const userLimitBytes = userLimitGB > 0 ? userLimitGB * 1024 * 1024 * 1024 : Infinity;
        const chLimitBytes   = chLimitGB > 0 ? chLimitGB   * 1024 * 1024 * 1024 : Infinity;

        if (Number.isFinite(userLimitBytes) || Number.isFinite(chLimitBytes)) {
          const userNow = usageService.userBytesNow(user.id);
          const chNow   = usageService.channelBytesNow(clip.channel_id);

          if (userNow + total > userLimitBytes) {
            for (const f of files) { try { fs.unlinkSync(f.path); } catch {} } // cleanup
            const e: any = new Error('Cuota de usuario superada');
            e.status = 403; e.code = 'QUOTA_EXCEEDED';
            (e as any).meta = { scope: 'user', current: userNow, incoming: total, limit: userLimitBytes };
            throw e;
          }
          if (chNow + total > chLimitBytes) {
            for (const f of files) { try { fs.unlinkSync(f.path); } catch {} } // cleanup
            const e: any = new Error('Cuota de canal superada');
            e.status = 403; e.code = 'QUOTA_EXCEEDED';
            (e as any).meta = { scope: 'channel', current: chNow, incoming: total, limit: chLimitBytes };
            throw e;
          }
        }

        // 3) continuar al controlador (registrará metadatos y emitirá evento)
        return ctl.upload(req, res, next);
      } catch (e) { next(e); }
    });
  });

  // LISTAR archivos de un clip
  r.get('/clips/:clipId/files', auth, ctl.list);

  // DESCARGAR archivo
  r.get('/clips/:clipId/files/:fileId', auth, ctl.download);

  return r;
}
