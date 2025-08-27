import { Request, Response, NextFunction } from 'express';
import type { Env } from '../../config/env';
import { filesService } from './service';

export function filesController(env: Env) {
  return {
    // POST /clips/:clipId/files  (multipart)
    upload(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const clipId = req.params.clipId;
        const files = (req.files as Express.Multer.File[]) || [];

        // Si no se subió ningún archivo permitido, cambiar placeholder SOLO si el clip es de tipo 'files' y placeholder 'Archivo'
        if (files.length === 0) {
          const { getClipById, updateClipTextContent } = require('../clips/repo');
          const clip = getClipById(clipId);
          if (clip && clip.type === 'files' && clip.text_content === 'Archivo') {
            updateClipTextContent(clipId, 'Archivo No Permitido'); // <- texto exacto solicitado
          }
          const e: any = new Error('No se adjuntó ningún archivo permitido');
          e.status = 415; e.code = 'UNSUPPORTED_TYPE';
          throw e;
        }

        // Validaciones por lote (duplicados, extensiones, etc.) si las tienes en service
        filesService.validateBatch(env, files);

        // Registrar metadatos / mover / emitir eventos
        const meta = filesService.registerUploaded(env, clipId, files, user.id);
        res.status(201).json({ files: meta });
      } catch (e) { next(e); }
    },

    // GET /clips/:clipId/files/:fileId  (descarga)
    async download(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const clipId = req.params.clipId;
        const fileId = req.params.fileId;
        const info = filesService.getDownloadInfo(env, user.id, clipId, fileId);

        res.setHeader('Content-Type', info.file.mime);
        res.setHeader('Content-Disposition', `attachment; filename="${info.file.filename}"`);
        return res.sendFile(info.absPath);
      } catch (e) { next(e as any); }
    },

    // GET /clips/:clipId/files  (lista)
    list(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const clipId = req.params.clipId;
        const items = filesService.listOfClip(user.id, clipId);
        res.json({ items });
      } catch (e) { next(e); }
    },
  };
}
