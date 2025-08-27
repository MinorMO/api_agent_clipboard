import { Request, Response, NextFunction } from 'express';
import { CreateChannelDTO, JoinByCodeDTO } from './dto';
import { channelsService } from './service';
import type { Env } from '../../config/env';

export function channelsController(env: Env) {
  return {
    create(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const input = CreateChannelDTO.parse(req.body);
        const out = channelsService.create(input, user.id);
        res.status(201).json(out);
      } catch (e) { next(e); }
    },

    mine(_req: Request, res: Response, next: NextFunction) {
      try {
        const user = (_req as any).user as { id: string };
        const out = channelsService.myChannels(user.id);
        res.json({ items: out });
      } catch (e) { next(e); }
    },

    invite(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const channelId = req.params.channelId;
        const out = channelsService.invite(channelId, user.id, { RETENTION_DAYS: env.RETENTION_DAYS });
        res.status(201).json(out);
      } catch (e) { next(e); }
    },

    join(req: Request, res: Response, next: NextFunction) {
      try {
        const user = (req as any).user as { id: string };
        const input = JoinByCodeDTO.parse(req.body);
        const out = channelsService.joinByCode(input, user.id);
        res.json(out);
      } catch (e) { next(e); }
    },
  };
}
