// lib/asistente/cifrado.ts
// Cifrado de las claves de proveedor del asistente (AES-256-GCM).
// La clave de cifrado se DERIVA de SESSION_SECRET (ya existe en el entorno del ERP) con HKDF-SHA256
// y una etiqueta fija de contexto. No se necesita ninguna variable nueva.
// Consecuencia documentada: si SESSION_SECRET cambia, las claves guardadas dejan de descifrarse
// y deben volver a ingresarse desde Configuración del asistente.
// Formato del texto cifrado: base64( iv[12] | tag[16] | ciphertext ). IV aleatorio por cada cifrado.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

const ALGORITMO = 'aes-256-gcm'
const LONG_IV = 12
const LONG_TAG = 16
const LONG_CLAVE = 32
const MIN_LONG_SECRETO = 32
const ETIQUETA_CONTEXTO = 'veta-erp/asistente/claves-proveedor/v1'

function claveDeCifrado(): Buffer {
  const secreto = process.env.SESSION_SECRET
  if (!secreto || secreto.length < MIN_LONG_SECRETO) {
    throw new Error('SESSION_SECRET no definida o demasiado corta: el asistente no puede cifrar ni descifrar claves.')
  }
  const derivada = hkdfSync('sha256', Buffer.from(secreto, 'utf8'), Buffer.alloc(0), ETIQUETA_CONTEXTO, LONG_CLAVE)
  return Buffer.from(derivada)
}

export function cifrar(texto: string): string {
  const clave = claveDeCifrado()
  const iv = randomBytes(LONG_IV)
  const cifrador = createCipheriv(ALGORITMO, clave, iv)
  const contenido = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])
  const tag = cifrador.getAuthTag()
  return Buffer.concat([iv, tag, contenido]).toString('base64')
}

export function descifrar(cifrado: string): string {
  const clave = claveDeCifrado()
  const datos = Buffer.from(cifrado, 'base64')
  if (datos.length <= LONG_IV + LONG_TAG) {
    throw new Error('Texto cifrado inválido.')
  }
  const iv = datos.subarray(0, LONG_IV)
  const tag = datos.subarray(LONG_IV, LONG_IV + LONG_TAG)
  const contenido = datos.subarray(LONG_IV + LONG_TAG)
  const descifrador = createDecipheriv(ALGORITMO, clave, iv)
  descifrador.setAuthTag(tag)
  try {
    return Buffer.concat([descifrador.update(contenido), descifrador.final()]).toString('utf8')
  } catch {
    // Mensaje genérico: no revelar si falló la clave o el contenido.
    throw new Error('No se pudo descifrar: el texto fue alterado o SESSION_SECRET cambió desde que se guardó.')
  }
}
