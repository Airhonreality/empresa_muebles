import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { cifrar, descifrar } from './cifrado'

const CLAVE_VALIDA = randomBytes(32).toString('base64')
const CLAVE_ORIGINAL = process.env.ASISTENTE_CLAVE_CIFRADO
process.env.ASISTENTE_CLAVE_CIFRADO = CLAVE_VALIDA

function conClave(valor: string | undefined, fn: () => void): void {
  if (valor === undefined) delete process.env.ASISTENTE_CLAVE_CIFRADO
  else process.env.ASISTENTE_CLAVE_CIFRADO = valor
  try {
    fn()
  } finally {
    process.env.ASISTENTE_CLAVE_CIFRADO = CLAVE_VALIDA
  }
}

const casos: Array<[string, () => void]> = [
  ['round-trip recupera el texto original', () => {
    const texto = 'texto-de-prueba-no-es-clave-1234'
    assert.equal(descifrar(cifrar(texto)), texto)
  }],
  ['dos cifrados del mismo texto son distintos (IV aleatorio)', () => {
    assert.notEqual(cifrar('mismo texto'), cifrar('mismo texto'))
  }],
  ['el texto cifrado no contiene el texto en claro', () => {
    const texto = 'clave-secreta-visible'
    assert.ok(!Buffer.from(cifrar(texto), 'base64').toString('utf8').includes(texto))
  }],
  ['manipular un byte del cifrado hace fallar el descifrado', () => {
    const datos = Buffer.from(cifrar('dato'), 'base64')
    datos[datos.length - 1] ^= 0x01
    assert.throws(() => descifrar(datos.toString('base64')), /No se pudo descifrar/)
  }],
  ['sin ASISTENTE_CLAVE_CIFRADO cifrar lanza error', () => {
    conClave(undefined, () => {
      assert.throws(() => cifrar('x'), /ASISTENTE_CLAVE_CIFRADO no definida/)
    })
  }],
  ['sin ASISTENTE_CLAVE_CIFRADO descifrar lanza error', () => {
    const cifrado = cifrar('x')
    conClave(undefined, () => {
      assert.throws(() => descifrar(cifrado), /ASISTENTE_CLAVE_CIFRADO no definida/)
    })
  }],
  ['clave maestra de longitud incorrecta lanza error', () => {
    conClave(randomBytes(16).toString('base64'), () => {
      assert.throws(() => cifrar('x'), /32 bytes/)
    })
  }],
]

let fallos = 0
for (const [nombre, fn] of casos) {
  try {
    fn()
    console.log(`ok - ${nombre}`)
  } catch (err) {
    fallos++
    console.error(`FALLA - ${nombre}\n${(err as Error).message}`)
  }
}

if (CLAVE_ORIGINAL === undefined) delete process.env.ASISTENTE_CLAVE_CIFRADO
else process.env.ASISTENTE_CLAVE_CIFRADO = CLAVE_ORIGINAL

if (fallos > 0) {
  console.error(`${fallos} caso(s) fallaron`)
  process.exitCode = 1
}
