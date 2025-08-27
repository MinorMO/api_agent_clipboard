import { Router, Request, Response } from 'express';
import type { Env } from '../../config/env';
import { verifyJwt } from '../../core/jwt';
import { isMember } from '../channels/repo';
import { bus } from '../../core/eventBus';

export function eventsRoutes(env: Env) {
  const r = Router();

  // GET /events?channelId=...  (SSE)
  // Auth: Authorization: Bearer <JWT>  (o ?token=... solo para pruebas)
  r.get('/', (req: Request, res: Response) => {
    // --- auth ---
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7)
      : (typeof req.query.token === 'string' ? req.query.token : '');
    if (!token) return res.status(401).json({ error: { code: 'NO_TOKEN' } });

    let user: { id: string; email: string };
    try {
      const p = verifyJwt<{ sub: string; email: string }>(token, env.JWT_SECRET);
      user = { id: p.sub, email: p.email };
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN' } });
    }

    const channelId = String(req.query.channelId || '');
    if (!channelId) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'channelId requerido' } });
    if (!isMember(channelId, user.id)) return res.status(403).json({ error: { code: 'NOT_A_MEMBER' } });

    // --- headers SSE ---
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('\n');

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // ready inicial
    send('ready', { channelId });

    // listener que filtra por canal
    const listener = (evt: any) => {
      if (evt?.channelId === channelId) send(evt.type, evt);
    };

    bus.on('clip.created', listener);
    bus.on('files.uploaded', listener);

    // keep-alive cada 25s
    const ka = setInterval(() => res.write(': ping\n\n'), 25_000);

    req.on('close', () => {
      clearInterval(ka);
      bus.off('clip.created', listener);
      bus.off('files.uploaded', listener);
      res.end();
    });
  });

  return r;
}
