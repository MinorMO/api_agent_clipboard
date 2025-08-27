import { z } from 'zod';

export const RegisterDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterDTO>;
export type LoginInput = z.infer<typeof LoginDTO>;
