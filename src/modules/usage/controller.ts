import { Request, Response, NextFunction } from 'express';
import { usageService } from './service';
import type { Env } from '../../config/env';

const bytesFromGB = (gb: number) => gb > 0 ? gb * 1024 * 1024 * 1024 : 0;

export function usageController(env: Env) {
  return {
    // GET /usage?scope=user|channel&channelId=...
    get(req: Request, res: Response, next: NextFunction) {
      try {
        const scope = String(req.query.scope || 'user');

        if (scope === 'user') {
          const me = (req as any).user as { id: string };
          const bytes = usageService.userBytesNow(me.id);
          const limitBytes = bytesFromGB(env.QUOTA_USER_GB); // 0 = ilimitado
          return res.json({ scope: 'user', id: me.id, bytes, limitBytes });
        }

        if (scope === 'channel') {
          const channelId = String(req.query.channelId || '');
          if (!channelId) {
            return res.status(400).json({
              error: { code: 'BAD_REQUEST', message: 'channelId requerido' },
            });
          }
          const bytes = usageService.channelBytesNow(channelId);
          const limitBytes = bytesFromGB(env.QUOTA_CHANNEL_GB); // 0 = ilimitado
          return res.json({ scope: 'channel', id: channelId, bytes, limitBytes });
        }

        return res
          .status(400)
          .json({ error: { code: 'BAD_REQUEST', message: 'scope inválido' } });
      } catch (e) {
        next(e);
      }
    },
  };
}
