import { Request, Response, NextFunction } from 'express';
import type { Env } from '../config/env';
import { verifyJwt } from '../core/jwt';

export function authRequired(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) {
      return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Missing Authorization header' } });
    }
    try {
      const payload = verifyJwt<{ sub: string; email: string }>(token, env.JWT_SECRET);
      (req as any).user = { id: payload.sub, email: payload.email };
      next();
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
    }
  };
}
