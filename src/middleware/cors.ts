import { CorsOptions } from 'cors';
import type { Env } from '../config/env';

export function corsOptions(env: Env): CorsOptions {
  // Si solo lo usa el agente de escritorio, puedes cerrar CORS por completo,
  // o permitir tu dominio/API pública. Aquí permitimos todo por simplicidad inicial:
  return {
    origin: true,
    credentials: false
  };
}
