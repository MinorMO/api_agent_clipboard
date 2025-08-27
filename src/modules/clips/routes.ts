import { Router } from 'express';
import type { Env } from '../../config/env';
import { authRequired } from '../../middleware/auth';
import { clipsController } from './controller';

export function clipsRoutes(env: Env) {
  const r = Router();
  const ctl = clipsController(env);
  const auth = authRequired(env);

  // Crear (texto)
  r.post('/', auth, ctl.createText);

  // Último clip del canal
  r.get('/latest', auth, ctl.latest);

  // Historial por rango (1–7 días)
  r.get('/', auth, ctl.list);

  // Detalle por id
  r.get('/:clipId', auth, ctl.getById);

  return r;
}
