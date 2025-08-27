import { Express } from 'express';
import type { Env } from './env';
import { healthRoutes } from '../modules/health/routes';
import { authRoutes } from '../modules/auth/routes';
import { channelsRoutes } from '../modules/channels/routes';
import { clipsRoutes } from '../modules/clips/routes';
import { filesRoutes } from '../modules/files/routes';
import { usageRoutes } from '../modules/usage/routes';
import { eventsRoutes } from '../modules/events/routes'; 
import { usersRoutes } from '../modules/users/routes';

export function registerRoutes(app: Express, env: Env) {
  app.use(healthRoutes());
  app.use('/auth', authRoutes(env));
  app.use('/channels', channelsRoutes(env));  // << aquí
   app.use('/clips', clipsRoutes(env));  
   app.use('/', filesRoutes(env));      // rutas de files cuelgan de /clips/...
  app.use('/usage', usageRoutes(env)); // GET /usage?scope=user|channel&channelId=...
  app.use('/events', eventsRoutes(env));
  app.use('/users', usersRoutes(env));
  // aquí luego: app.use('/auth', authRoutes(...));
  // app.use('/channels', channelsRoutes(...));
  // app.use('/clips', clipsRoutes(...));
  // app.use('/files', filesRoutes(...));
}
