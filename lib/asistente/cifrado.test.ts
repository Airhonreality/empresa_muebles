import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { cifrar, descifrar } from './cifrado'

const SECRETO_VALIDO = randomBytes(32).toString('hex')
const SECRETO_ORIGINAL = process.env.SESSION_SECRET
process.env.SESSION_SECRET = SECRETO_VALIDO

function conSecreto(valor: string | undefined, fn: () => void): void {
  if (valor === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = valor
  try {
    fn()
  } finally {
    process.env.SESSION_SECRET = SECRETO_VALIDO
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
  ['cambiar SESSION_SECRET impide descifrar lo guardado', () => {
    const cifrado = cifrar('dato')
    conSecreto(randomBytes(32).toString('hex'), () => {
      assert.throws(() => descifrar(cifrado), /No se pudo descifrar/)
    })
  }],
  ['sin SESSION_SECRET cifrar lanza error', () => {
    conSecreto(undefined, () => {
      assert.throws(() => cifrar('x'), /SESSION_SECRET no definida/)
    })
  }],
  ['SESSION_SECRET demasiado corta lanza error', () => {
    conSecreto('corta', () => {
      assert.throws(() => cifrar('x'), /demasiado corta/)
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
    console.error(`FALLO - ${nombre}:`, err)
  }
}
if (SECRETO_ORIGINAL === undefined) delete process.env.SESSION_SECRET
else process.env.SESSION_SECRET = SECRETO_ORIGINAL
if (fallos > 0) process.exit(1)
console.log(`${casos.length} casos ok`)
