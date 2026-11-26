import assert from 'node:assert/strict'
import {
  ENFRIAMIENTO_POR_DEFECTO_MS,
  ErrorSinClavesDisponibles,
  clasificarError,
  ejecutarConRotacion,
  type ClaveRegistro,
  type DepsRotacion,
  type EventoRotacion,
  type RepositorioClaves,
} from './claves'

const AHORA = new Date('2026-11-25T15:00:00.000Z')

function apiError(statusCode: number, responseHeaders?: Record<string, string>): Error {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode, responseHeaders })
}

function clave(id: string, orden: number, extra: Partial<ClaveRegistro> = {}): ClaveRegistro {
  return {
    id,
    proveedor: 'openrouter',
    etiqueta: id,
    claveCifrada: `cifrado-${id}`,
    orden,
    estado: 'activa',
    enfriadaHasta: null,
    ...extra,
  }
}

function repoFalso(claves: ClaveRegistro[]) {
  const llamadas = { enfriar: [] as Array<[string, Date]>, invalidar: [] as string[], rotaciones: [] as EventoRotacion[] }
  const repo: RepositorioClaves = {
    listarClaves: async () => claves,
    enfriar: async (id, hasta) => { llamadas.enfriar.push([id, hasta]) },
    invalidar: async (id) => { llamadas.invalidar.push(id) },
    registrarRotacion: async (ev) => { llamadas.rotaciones.push(ev) },
  }
  return { repo, llamadas }
}

function deps(repo: RepositorioClaves): DepsRotacion {
  return {
    repo,
    descifrar: (c) => `CLAVE-EN-CLARO-${c}`,
    ahora: () => AHORA,
    esperar: async () => {},
  }
}

/** Operación que responde según la clave usada: mapa claveId -> error o éxito. */
function operacionSegunClave(comportamiento: Record<string, Error | 'ok'>, usadas: string[]) {
  return async (clave: string, claveId: string): Promise<string> => {
    usadas.push(claveId)
    assert.ok(clave.startsWith('CLAVE-EN-CLARO-'))
    const r = comportamiento[claveId]
    if (r instanceof Error) throw r
    return `respuesta con ${claveId}`
  }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['429 pasa a la siguiente clave y la primera queda enfriada 60 min', async () => {
    const { repo, llamadas } = repoFalso([clave('a', 1), clave('b', 2)])
    const usadas: string[] = []
    const r = await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' },
      operacionSegunClave({ a: apiError(429), b: 'ok' }, usadas), deps(repo))
    assert.deepEqual(usadas, ['a', 'b'])
    assert.equal(r.claveId, 'b')
    assert.equal(llamadas.enfriar[0][0], 'a')
    assert.equal(llamadas.enfriar[0][1].getTime(), AHORA.getTime() + ENFRIAMIENTO_POR_DEFECTO_MS)
    assert.equal(llamadas.rotaciones.length, 1)
    assert.ok(!llamadas.rotaciones[0].detalle.includes('CLAVE-EN-CLARO'))
  }],
  ['402 también se trata como cuota', async () => {
    assert.equal(clasificarError(apiError(402)).tipo, 'cuota')
  }],
  ['Retry-After del proveedor reemplaza los 60 min por defecto', async () => {
    const { repo, llamadas } = repoFalso([clave('a', 1), clave('b', 2)])
    await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' },
      operacionSegunClave({ a: apiError(429, { 'retry-after': '120' }), b: 'ok' }, []), deps(repo))
    assert.equal(llamadas.enfriar[0][1].getTime(), AHORA.getTime() + 120_000)
  }],
  ['401 marca la clave como inválida y pasa a la siguiente', async () => {
    const { repo, llamadas } = repoFalso([clave('a', 1), clave('b', 2)])
    const r = await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' },
      operacionSegunClave({ a: apiError(401), b: 'ok' }, []), deps(repo))
    assert.equal(r.claveId, 'b')
    assert.deepEqual(llamadas.invalidar, ['a'])
    assert.equal(llamadas.enfriar.length, 0)
  }],
  ['claves inválidas o desactivadas no se intentan', async () => {
    const { repo } = repoFalso([clave('a', 1, { estado: 'invalida' }), clave('b', 2, { estado: 'desactivada' }), clave('c', 3)])
    const usadas: string[] = []
    await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' }, operacionSegunClave({ c: 'ok' }, usadas), deps(repo))
    assert.deepEqual(usadas, ['c'])
  }],
  ['enfriada cuyo tiempo ya pasó vuelve a estar disponible', async () => {
    const { repo } = repoFalso([clave('a', 1, { estado: 'enfriada', enfriadaHasta: new Date(AHORA.getTime() - 1000) })])
    const r = await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' }, operacionSegunClave({ a: 'ok' }, []), deps(repo))
    assert.equal(r.claveId, 'a')
  }],
  ['5xx reintenta dos veces la misma clave y luego pasa a la siguiente sin cambiar su estado', async () => {
    const { repo, llamadas } = repoFalso([clave('a', 1), clave('b', 2)])
    const usadas: string[] = []
    await ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' },
      operacionSegunClave({ a: apiError(503), b: 'ok' }, usadas), deps(repo))
    assert.deepEqual(usadas, ['a', 'a', 'a', 'b'])
    assert.equal(llamadas.enfriar.length, 0)
    assert.equal(llamadas.invalidar.length, 0)
  }],
  ['error de red reintenta como transitorio', async () => {
    assert.equal(clasificarError(new Error('fetch failed')).tipo, 'transitorio')
  }],
  ['error que no es de proveedor se propaga sin rotar', async () => {
    const { repo, llamadas } = repoFalso([clave('a', 1), clave('b', 2)])
    const usadas: string[] = []
    await assert.rejects(
      ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' }, operacionSegunClave({ a: apiError(400), b: 'ok' }, usadas), deps(repo)),
      /HTTP 400/,
    )
    assert.deepEqual(usadas, ['a'])
    assert.equal(llamadas.enfriar.length, 0)
  }],
  ['todas las claves fallan por cuota -> error con hora de reactivación', async () => {
    const { repo } = repoFalso([clave('a', 1), clave('b', 2)])
    await assert.rejects(
      ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' },
        operacionSegunClave({ a: apiError(429), b: apiError(429) }, []), deps(repo)),
      (err: unknown) => {
        assert.ok(err instanceof ErrorSinClavesDisponibles)
        assert.ok(err.reactivacionEn instanceof Date)
        assert.match(err.message, /aprox\. a las/)
        return true
      },
    )
  }],
  ['sin claves del proveedor configurado -> error sin hora', async () => {
    const { repo } = repoFalso([clave('a', 1, { proveedor: 'anthropic' })])
    await assert.rejects(
      ejecutarConRotacion({ proveedor: 'openrouter', usuarioId: 'u' }, operacionSegunClave({}, []), deps(repo)),
      (err: unknown) => err instanceof ErrorSinClavesDisponibles && err.reactivacionEn === null,
    )
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
