import { Request, Response } from 'express';

export const healthController = {
  async liveness(_req: Request, res: Response) {
    res.json({ ok: true });
  },
  async readiness(_req: Request, res: Response) {
    // Más adelante puedes comprobar DB/FS
    res.json({ ok: true, deps: { db: 'unknown', fs: 'unknown' } });
  }
};
