// src/app/server.ts
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';

import { loadEnv } from '../config/env';
import { registerRoutes } from '../config/routes';
import { errorHandler } from '../middleware/errorHandler';
import { corsOptions } from '../middleware/cors';
import { initDbAndMigrate } from '../db/sqlite';
import { startSchedulers } from '../worker/scheduler';

async function main() {
  // 1) Cargar y validar .env
  const env = loadEnv();

  // 2) Preparar DB y aplicar migraciones
  await initDbAndMigrate(env.SQLITE_PATH, env.SQLITE_WAL === 1);

  // 3) Crear app
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // útil si luego hay proxy (Caddy)

  // 4) Middlewares globales
  app.use(helmet());
  app.use(cors(corsOptions(env)));
  app.use(express.json({ limit: '2mb' })); // JSON pequeño; archivos van por multipart
  app.use(pinoHttp());

  // 5) Rutas
  registerRoutes(app, env);

  // 6) Manejo de errores centralizado
  app.use(errorHandler);

  // 7) Schedulers (purga de expirados cada hora)
  startSchedulers(env);

  // 8) Levantar servidor
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

// Arranque
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fallo al iniciar', err);
  process.exit(1);
});
