import { Request, Response, NextFunction } from 'express';
import { CreateTextClipDTO, LatestQueryDTO, RangeQueryDTO } from './dto';
import { clipsService } from './service';
import type { Env } from '../../config/env';

export function clipsController(env: Env) {
  debugger;
  return {
    createText(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const input = CreateTextClipDTO.parse(req.body);
        const out = clipsService.createText(input, user.id, { RETENTION_DAYS: env.RETENTION_DAYS });
        res.status(201).json(out);
      } catch (e) { next(e); }
    },

    latest(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const q = LatestQueryDTO.parse(req.query);
        const out = clipsService.latest(q, user.id);
        res.json(out);
      } catch (e) { next(e); }
    },

    list(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const q = RangeQueryDTO.parse(req.query);
        const out = clipsService.list(q, user.id);
        res.json({ items: out });
      } catch (e) { next(e); }
    },

    getById(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const out = clipsService.getById(req.params.clipId, user.id);
        res.json(out);
      } catch (e) { next(e); }
    },
  };
}
