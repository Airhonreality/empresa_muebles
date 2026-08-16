// Hash de contraseñas para el login interno del ERP (D-08b, F10 2026-08-15).
// crypto.scrypt nativo de Node — sin dependencia nueva (no hay bcrypt/bcryptjs
// en package.json). Formato de almacenamiento: "<salt-hex>:<hash-hex>".
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':')
  if (!salt || !hashHex) return false
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  const stored = Buffer.from(hashHex, 'hex')
  if (stored.length !== derived.length) return false
  return timingSafeEqual(stored, derived)
}
