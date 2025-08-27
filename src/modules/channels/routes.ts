import { Router } from 'express';
import type { Env } from '../../config/env';
import { channelsController } from './controller';
import { authRequired } from '../../middleware/auth';

export function channelsRoutes(env: Env) {
  const r = Router();
  const ctl = channelsController(env);
  const auth = authRequired(env);

  r.post('/', auth, ctl.create);                 // crear canal
  r.get('/', auth, ctl.mine);                    // mis canales
  r.post('/:channelId/invite', auth, ctl.invite);// generar código
  r.post('/join', auth, ctl.join);               // unirse con código

  return r;
}
