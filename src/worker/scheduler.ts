import type { Env } from '../config/env';
import { purgeExpired } from './purgeExpired';

export function startSchedulers(env: Env) {
  // Purga cada 60 minutos
  const HOUR = 60 * 60 * 1000;
  setInterval(() => {
    try {
      purgeExpired(env);
      // eslint-disable-next-line no-console
      console.log('✔ Purga de expirados ejecutada');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('✖ Error en purga:', e);
    }
  }, HOUR);
}
