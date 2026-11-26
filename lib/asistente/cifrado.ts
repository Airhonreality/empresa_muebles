// lib/asistente/cifrado.ts
// Cifrado de las claves de proveedor del asistente (AES-256-GCM).
// La clave maestra vive SOLO en la variable de entorno ASISTENTE_CLAVE_CIFRADO (32 bytes en base64).
// Sin valor por defecto: si falta o no mide 32 bytes, cifrar/descifrar lanzan error.
// Formato del texto cifrado: base64( iv[12] | tag[16] | ciphertext ). IV aleatorio por cada cifrado.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITMO = 'aes-256-gcm'
const LONG_IV = 12
const LONG_TAG = 16
const LONG_CLAVE = 32

function claveMaestra(): Buffer {
  const valor = process.env.ASISTENTE_CLAVE_CIFRADO
  if (!valor) {
    throw new Error('ASISTENTE_CLAVE_CIFRADO no definida: el asistente no puede cifrar ni descifrar claves.')
  }
  const bytes = Buffer.from(valor, 'base64')
  if (bytes.length !== LONG_CLAVE) {
    throw new Error('ASISTENTE_CLAVE_CIFRADO debe ser 32 bytes en base64.')
  }
  return bytes
}

export function cifrar(texto: string): string {
  const clave = claveMaestra()
  const iv = randomBytes(LONG_IV)
  const cifrador = createCipheriv(ALGORITMO, clave, iv)
  const contenido = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])
  const tag = cifrador.getAuthTag()
  return Buffer.concat([iv, tag, contenido]).toString('base64')
}

export function descifrar(cifrado: string): string {
  const clave = claveMaestra()
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
    throw new Error('No se pudo descifrar: el texto fue alterado o la clave maestra no corresponde.')
  }
}
