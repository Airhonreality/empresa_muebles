import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../auth/session'
import {
  crearTokenMcp,
  ErrorEtiquetaToken,
  ETIQUETA_TOKEN_MAX,
  generarToken,
  hashToken,
  listarTokensMcp,
  PREFIJO_TOKEN_MCP,
  revocarTokenMcp,
  tieneFormatoToken,
  verificarTokenMcp,
  type FilaTokenMcp,
  type RepositorioTokensMcp,
} from './tokens'

const AHORA = new Date('2026-11-27T10:00:00.000Z')
const USUARIO = '11111111-1111-4111-8111-111111111111'
const OTRO = '22222222-2222-4222-8222-222222222222'

/** Base simulada: guarda filas tal cual las guardaría la tabla (solo hash, nunca el token). */
function repoMemoria() {
  const filas: FilaTokenMcp[] = []
  let n = 0
  const repo: RepositorioTokensMcp = {
    insertar: async (f) => {
      const fila: FilaTokenMcp = { ...f, id: `tok-${++n}`, ultimoUsoEn: null, revocadoEn: null }
      filas.push(fila)
      return { ...fila }
    },
    buscarPorHash: async (hash) => {
      const f = filas.find((x) => x.hash === hash)
      return f ? { ...f } : null
    },
    marcarUso: async (id, cuando) => {
      const f = filas.find((x) => x.id === id)
      if (f) f.ultimoUsoEn = cuando
    },
    revocar: async (id, usuarioId, cuando) => {
      const f = filas.find((x) => x.id === id && x.usuarioId === usuarioId && x.revocadoEn === null)
      if (!f) return false
      f.revocadoEn = cuando
      return true
    },
    listarDeUsuario: async (usuarioId) => filas.filter((f) => f.usuarioId === usuarioId).map((f) => ({ ...f })),
  }
  return { repo, filas }
}

function sesionDe(usuarioId: string): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: 'Prueba', email: 'prueba@prueba.test', rol: 'comercial' }
}

function entorno(usuariosActivos: string[] = [USUARIO, OTRO]) {
  const { repo, filas } = repoMemoria()
  const cargarUsuario = async (id: string) => (usuariosActivos.includes(id) ? sesionDe(id) : null)
  return { repo, filas, deps: { repo, ahora: () => AHORA, cargarUsuario } }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['token: prefijo, 32 bytes en base64url y formato válido', async () => {
    const { token, hash } = generarToken()
    assert.ok(token.startsWith(PREFIJO_TOKEN_MCP))
    assert.equal(token.length, PREFIJO_TOKEN_MCP.length + 43)
    assert.ok(tieneFormatoToken(token))
    assert.equal(hash, hashToken(token))
    assert.match(hash, /^[0-9a-f]{64}$/)
  }],
  ['tokens distintos en cada generación', async () => {
    assert.notEqual(generarToken().token, generarToken().token)
  }],
  ['formato: rechaza prefijo distinto, largo incorrecto y caracteres extraños', async () => {
    assert.equal(tieneFormatoToken('otro_' + 'a'.repeat(43)), false)
    assert.equal(tieneFormatoToken(PREFIJO_TOKEN_MCP + 'a'.repeat(10)), false)
    assert.equal(tieneFormatoToken(PREFIJO_TOKEN_MCP + 'a'.repeat(42) + '!'), false)
  }],
  ['crear: el token en claro NO aparece en la base simulada', async () => {
    const { deps, filas } = entorno()
    const creado = await crearTokenMcp(USUARIO, 'Mi portátil', deps)
    assert.ok(tieneFormatoToken(creado.token))
    assert.equal(filas.length, 1)
    assert.equal(filas[0].hash, hashToken(creado.token))
    assert.equal(JSON.stringify(filas).includes(creado.token), false)
    assert.equal(JSON.stringify(creado.vista).includes(creado.token), false)
  }],
  ['crear: etiqueta vacía o de más de 40 caracteres se rechaza', async () => {
    const { deps, filas } = entorno()
    await assert.rejects(crearTokenMcp(USUARIO, '   ', deps), ErrorEtiquetaToken)
    await assert.rejects(crearTokenMcp(USUARIO, 'x'.repeat(ETIQUETA_TOKEN_MAX + 1), deps), ErrorEtiquetaToken)
    assert.equal(filas.length, 0)
  }],
  ['verificar: token válido resuelve la sesión del usuario y marca el último uso', async () => {
    const { deps, filas } = entorno()
    const { token } = await crearTokenMcp(USUARIO, 'Prueba', deps)
    const sesion = await verificarTokenMcp(token, deps)
    assert.equal(sesion?.usuarioId, USUARIO)
    assert.equal(filas[0].ultimoUsoEn?.toISOString(), AHORA.toISOString())
  }],
  ['verificar: token revocado se rechaza en la siguiente llamada', async () => {
    const { deps } = entorno()
    const { token, vista } = await crearTokenMcp(USUARIO, 'Prueba', deps)
    assert.ok(await verificarTokenMcp(token, deps))
    assert.equal(await revocarTokenMcp(USUARIO, vista.id, deps), true)
    assert.equal(await verificarTokenMcp(token, deps), null)
  }],
  ['verificar: token inventado (bien formado, no creado) se rechaza', async () => {
    const { deps } = entorno()
    await crearTokenMcp(USUARIO, 'Prueba', deps)
    assert.equal(await verificarTokenMcp(generarToken().token, deps), null)
  }],
  ['verificar: formato inválido se rechaza sin consultar la base', async () => {
    let consultas = 0
    const { deps } = entorno()
    const contado = { ...deps, repo: { ...deps.repo, buscarPorHash: async (h: string) => { consultas++; return deps.repo.buscarPorHash(h) } } }
    assert.equal(await verificarTokenMcp('vdo_mcp_corto', contado), null)
    assert.equal(consultas, 0)
  }],
  ['verificar: usuario inactivo o inexistente se rechaza aunque el token sea válido', async () => {
    const { deps } = entorno([OTRO])
    const { token } = await crearTokenMcp(USUARIO, 'Prueba', deps)
    assert.equal(await verificarTokenMcp(token, deps), null)
  }],
  ['revocar: solo sobre tokens propios', async () => {
    const { deps } = entorno()
    const { vista } = await crearTokenMcp(USUARIO, 'Prueba', deps)
    assert.equal(await revocarTokenMcp(OTRO, vista.id, deps), false)
    assert.equal(await revocarTokenMcp(USUARIO, vista.id, deps), true)
    assert.equal(await revocarTokenMcp(USUARIO, vista.id, deps), false)
  }],
  ['listar: solo los tokens del usuario, sin hash ni token', async () => {
    const { deps } = entorno()
    await crearTokenMcp(USUARIO, 'Mío', deps)
    await crearTokenMcp(OTRO, 'Ajeno', deps)
    const lista = await listarTokensMcp(USUARIO, deps)
    assert.equal(lista.length, 1)
    assert.equal(lista[0].etiqueta, 'Mío')
    assert.equal(lista[0].estado, 'activo')
    assert.equal(JSON.stringify(lista).includes('hash'), false)
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
