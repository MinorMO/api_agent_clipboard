import jwt from 'jsonwebtoken';

export type MyJwtPayload = { sub: string; email: string };

// Nota: 'expiresIn' en jsonwebtoken se tipa como number | ms.StringValue.
// Nuestro .env nos da un string genérico (p. ej. "7d"), así que asertamos el tipo.
export function signJwt(
  payload: MyJwtPayload,
  secret: string,
  expiresIn: string | number
) {
  return jwt.sign(payload as object, secret, {
    expiresIn: expiresIn as unknown as jwt.SignOptions['expiresIn'],
  });
}

export function verifyJwt<T = jwt.JwtPayload>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}
