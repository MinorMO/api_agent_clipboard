// modules/usage/routes.ts
import { Router } from 'express';
import type { Env } from '../../config/env';
import { authRequired } from '../../middleware/auth';
import { usageController } from './controller';

export function usageRoutes(env: Env) {
  const r = Router();
  const auth = authRequired(env);
  const ctl = usageController(env);

  // GET /usage?scope=user|channel&channelId=...
  r.get('/', auth, ctl.get);
  return r;
}
