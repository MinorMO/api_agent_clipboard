import { Router } from 'express';
import type { Env } from '../../config/env';
import { authRequired } from '../../middleware/auth';

export function usersRoutes(env: Env) {
  const r = Router();
  const auth = authRequired(env);

  // Perfil básico del usuario autenticado
  r.get('/me', auth, (req, res) => {
    const u = (req as any).user as { id: string; email: string };
    res.json({ id: u.id, email: u.email });
  });

  return r;
}
