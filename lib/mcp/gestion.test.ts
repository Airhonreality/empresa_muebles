import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SesionEmpleado } from '../auth/session'
import { crearTokenHttp, listarTokensHttp, revocarTokenHttp } from './gestion'
import type { FilaTokenMcp, RepositorioTokensMcp } from './tokens'
import { ETIQUETA_TOKEN_MAX, tieneFormatoToken } from './tokens'

const AHORA = new Date('2026-11-27T10:00:00.000Z')
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

function sesionDe(usuarioId: string): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: 'Prueba', email: `${usuarioId}@prueba.test`, rol: 'comercial' }
}

function entorno() {
  const filas: FilaTokenMcp[] = []
  const repo: RepositorioTokensMcp = {
    insertar: async (f) => {
      const fila: FilaTokenMcp = { ...f, id: randomUUID(), ultimoUsoEn: null, revocadoEn: null }
      filas.push(fila)
      return { ...fila }
    },
    buscarPorHash: async (h) => filas.find((x) => x.hash === h) ?? null,
    marcarUso: async () => {},
    revocar: async (id, usuarioId, cuando) => {
      const f = filas.find((x) => x.id === id && x.usuarioId === usuarioId && x.revocadoEn === null)
      if (!f) return false
      f.revocadoEn = cuando
      return true
    },
    listarDeUsuario: async (u) => filas.filter((x) => x.usuarioId === u),
  }
  return { filas, deps: { repo, ahora: () => AHORA } }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['sin sesión → 401 en todas las rutas de gestión', async () => {
    const { deps } = entorno()
    assert.equal((await listarTokensHttp(null, deps)).status, 401)
    assert.equal((await crearTokenHttp(null, { etiqueta: 'x' }, deps)).status, 401)
    assert.equal((await revocarTokenHttp(null, randomUUID(), deps)).status, 401)
  }],
  ['crear: devuelve el token en claro una sola vez; la lista no lo muestra', async () => {
    const { deps } = entorno()
    const creado = await crearTokenHttp(sesionDe(A), { etiqueta: 'Portátil' }, deps)
    assert.equal(creado.status, 201)
    const token = creado.body.token as string
    assert.ok(tieneFormatoToken(token))
    const lista = await listarTokensHttp(sesionDe(A), deps)
    assert.equal(lista.status, 200)
    assert.equal(JSON.stringify(lista.body).includes(token), false)
    assert.equal(JSON.stringify(lista.body).includes('hash'), false)
  }],
  ['crear: etiqueta demasiado larga o vacía → 400', async () => {
    const { deps, filas } = entorno()
    assert.equal((await crearTokenHttp(sesionDe(A), { etiqueta: 'x'.repeat(ETIQUETA_TOKEN_MAX + 1) }, deps)).status, 400)
    assert.equal((await crearTokenHttp(sesionDe(A), { etiqueta: '  ' }, deps)).status, 400)
    assert.equal((await crearTokenHttp(sesionDe(A), null, deps)).status, 400)
    assert.equal(filas.length, 0)
  }],
  ['revocar: solo los tokens propios; un id ajeno responde 404', async () => {
    const { deps, filas } = entorno()
    await crearTokenHttp(sesionDe(B), { etiqueta: 'Ajeno' }, deps)
    const idAjeno = filas[0].id
    assert.equal((await revocarTokenHttp(sesionDe(A), idAjeno, deps)).status, 404)
    assert.equal(filas[0].revocadoEn, null)
    assert.equal((await revocarTokenHttp(sesionDe(B), idAjeno, deps)).status, 200)
  }],
  ['revocar: id con formato inválido → 400', async () => {
    const { deps } = entorno()
    assert.equal((await revocarTokenHttp(sesionDe(A), 'no-es-uuid', deps)).status, 400)
    assert.equal((await revocarTokenHttp(sesionDe(A), null, deps)).status, 400)
  }],
]

async function principal(): Promise<void> {
  let fallos = 0
  for (const [nombre, fn] of casos) {
    try {
      await fn()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FALLA - ${nombre}\n${(err as Error).stack ?? err}`)
    }
  }
  if (fallos > 0) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exitCode = 1
  }
}

void principal()
