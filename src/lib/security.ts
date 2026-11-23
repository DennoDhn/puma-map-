import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
// Bound KDF memory/concurrency per Node worker; reject rather than queue unbounded work.
let activeKdfs = 0;
const scrypt = async (
  password: string,
  salt: string,
  length: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => {
  if (activeKdfs >= 2)
    throw new HttpError(503, 'Anmeldung ausgelastet. Bitte kurz warten und erneut versuchen.');
  activeKdfs++;
  try {
    return await new Promise<Buffer>((resolve, reject) =>
      scryptCallback(password, salt, length, options, (error, key) =>
        error ? reject(error) : resolve(key),
      ),
    );
  } finally {
    activeKdfs--;
  }
};
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64, {
    N: 65536,
    r: 8,
    p: 2,
    maxmem: 128 * 1024 * 1024,
  })) as Buffer;
  return `scrypt-v1$${salt}$${key.toString('hex')}`;
}
export async function checkPassword(password: string, hash: string) {
  const [scheme, salt, key] = hash.split('$');
  if (scheme !== 'scrypt-v1' || !salt || !key) return false;
  const actual = (await scrypt(password, salt, 64, {
    N: 65536,
    r: 8,
    p: 2,
    maxmem: 128 * 1024 * 1024,
  })) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new HttpError(503, 'Serverkonfiguration unvollständig.');
  if (request.headers.get('origin') !== new URL(origin).origin)
    throw new HttpError(403, 'Anfrageherkunft nicht erlaubt.');
}
export function canModerate(role: string) {
  return role === 'ADMIN' || role === 'MODERATOR';
}
