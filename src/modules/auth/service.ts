import { nanoid } from 'nanoid';
import { RegisterInput, LoginInput } from './dto';
import { findUserByEmail, insertUser, setLastLogin } from '../users/repo';
import { hashPassword, verifyPassword } from '../../core/hashing';
import { signJwt } from '../../core/jwt';

type EnvLike = {
  JWT_SECRET: string;
  JWT_EXPIRES: string;
  REGISTRATION_MODE: 'open' | 'invite';
};

export const authService = {
  async register(input: RegisterInput, env: EnvLike) {
    if (env.REGISTRATION_MODE !== 'open') {
      const err: any = new Error('Registro deshabilitado');
      err.status = 403; err.code = 'REGISTRATION_CLOSED';
      throw err;
    }
    const exist = findUserByEmail(input.email.toLowerCase());
    if (exist) {
      const err: any = new Error('El correo ya está registrado');
      err.status = 409; err.code = 'EMAIL_IN_USE';
      throw err;
    }
    const userId = nanoid();
    const pass_hash = await hashPassword(input.password);
    const now = new Date().toISOString();
    insertUser({
      id: userId,
      email: input.email.toLowerCase(),
      pass_hash,
      created_at: now,
      last_login: null
    });

    const token = signJwt({ sub: userId, email: input.email.toLowerCase() }, env.JWT_SECRET, env.JWT_EXPIRES);
    return { token, user: { id: userId, email: input.email.toLowerCase() } };
  },

  async login(input: LoginInput, env: EnvLike) {
    const user = findUserByEmail(input.email.toLowerCase());
    if (!user) {
      const err: any = new Error('Credenciales inválidas');
      err.status = 401; err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const ok = await verifyPassword(user.pass_hash, input.password);
    if (!ok) {
      const err: any = new Error('Credenciales inválidas');
      err.status = 401; err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const token = signJwt({ sub: user.id, email: user.email }, env.JWT_SECRET, env.JWT_EXPIRES);
    setLastLogin(user.id, new Date().toISOString());
    return { token, user: { id: user.id, email: user.email } };
  }
};
