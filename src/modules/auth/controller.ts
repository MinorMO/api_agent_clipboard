import { Request, Response, NextFunction } from 'express';
import { RegisterDTO, LoginDTO } from './dto';
import { authService } from './service';
import type { Env } from '../../config/env';

export function authController(env: Env) {
  return {
    async register(req: Request, res: Response, next: NextFunction) {
      try {
        const input = RegisterDTO.parse(req.body);
        const out = await authService.register(input, env);
        res.status(201).json(out);
      } catch (e) { next(e); }
    },

    async login(req: Request, res: Response, next: NextFunction) {
      try {
        const input = LoginDTO.parse(req.body);
        const out = await authService.login(input, env);
        res.json(out);
      } catch (e) { next(e); }
    }
  };
}
