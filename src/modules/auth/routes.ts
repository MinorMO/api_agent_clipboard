import { Router } from 'express';
import type { Env } from '../../config/env';
import { authController } from './controller';

export function authRoutes(env: Env) {
  const r = Router();
  const ctl = authController(env);

  r.post('/register', ctl.register);
  r.post('/login', ctl.login);

  return r;
}
