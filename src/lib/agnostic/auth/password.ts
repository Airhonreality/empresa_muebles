import crypto from 'crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keyLength: 64,
  maxmem: 64 * 1024 * 1024,
} as const;

export const PASSWORD_ALGO = 'scrypt' as const;

function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function scryptAsync(password: string, salt: Buffer, keyLength: number, options: crypto.ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<{ password_hash: string; password_algo: typeof PASSWORD_ALGO }> {
  if (password.length < 8) {
    throw new Error('La contrasena debe tener al menos 8 caracteres');
  }

  const salt = crypto.randomBytes(16);
  const derived = await scryptAsync(password, salt, SCRYPT_PARAMS.keyLength, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: SCRYPT_PARAMS.maxmem,
  });

  return {
    password_hash: [
      PASSWORD_ALGO,
      SCRYPT_PARAMS.N,
      SCRYPT_PARAMS.r,
      SCRYPT_PARAMS.p,
      toBase64Url(salt),
      toBase64Url(derived),
    ].join('$'),
    password_algo: PASSWORD_ALGO,
  };
}

export async function verifyPassword(password: string, passwordHash: unknown): Promise<boolean> {
  if (typeof passwordHash !== 'string' || !passwordHash.startsWith(`${PASSWORD_ALGO}$`)) {
    return false;
  }

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = passwordHash.split('$');
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!N || !r || !p || !saltRaw || !hashRaw) return false;

  const expected = fromBase64Url(hashRaw);
  const derived = await scryptAsync(password, fromBase64Url(saltRaw), expected.length, {
    N,
    r,
    p,
    maxmem: SCRYPT_PARAMS.maxmem,
  });

  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export function isLegacyPasswordMatch(password: string, storedPassword: unknown): boolean {
  return typeof storedPassword === 'string' && storedPassword === password;
}

export async function normalizeUserPasswordData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof data.password !== 'string' || !data.password) return data;
  const { password_hash, password_algo } = await hashPassword(data.password);
  const { password: _password, ...rest } = data;
  return {
    ...rest,
    password_hash,
    password_algo,
    password_updated_at: new Date().toISOString(),
  };
}
