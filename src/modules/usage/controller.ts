import { Request, Response, NextFunction } from 'express';
import { usageService } from './service';

export const usageController = {
  get(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = String(req.query.scope || 'user');
      if (scope === 'user') {
        const me = (req as any).user as { id: string };
        const bytes = usageService.userBytesNow(me.id);
        return res.json({ scope: 'user', id: me.id, bytes });
      }
      if (scope === 'channel') {
        const ch = String(req.query.channelId || '');
        if (!ch) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'channelId requerido' } });
        const bytes = usageService.channelBytesNow(ch);
        return res.json({ scope: 'channel', id: ch, bytes });
      }
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'scope inválido' } });
    } catch (e) { next(e); }
  }
};
