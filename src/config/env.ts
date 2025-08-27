import { z } from 'zod';

const EnvSchema = z.object({
  APP_BASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES: z.string().default('7d'),
  REGISTRATION_MODE: z.enum(['open', 'invite']).default('open'),
  RETENTION_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  MAX_FILE_MB: z.coerce.number().int().min(1).default(100),
  MAX_UPLOAD_PER_CLIP_MB: z.coerce.number().int().min(1).default(1024),
  ALLOWED_MIME: z.string().default('image/png,image/jpeg,application/pdf,text/plain'),

  SQLITE_PATH: z.string().default('./data/sqlite.db'),
  SQLITE_WAL: z.coerce.number().int().default(1),
  FILES_DIR: z.string().default('./data/files'),
  // dentro del esquema Zod
QUOTA_USER_GB: z.coerce.number().int().min(0).default(25),     // 0 = sin límite
QUOTA_CHANNEL_GB: z.coerce.number().int().min(0).default(25),  // 0 = sin límite

  DOMAIN: z.string().min(1)
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
