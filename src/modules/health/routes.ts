import { Router } from 'express';
import { healthController } from './controller';

export function healthRoutes() {
  const r = Router();
  r.get('/healthz', healthController.liveness);
  r.get('/readyz', healthController.readiness);
  return r;
}
