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
        filesService.validateBatch(env, files);
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
