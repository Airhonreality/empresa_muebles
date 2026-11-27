import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { SesionEmpleado } from '../auth/session'
import { conPermisosRestringidos } from './prueba-permisos'
import {
  cargarDocumentos,
  consultarProcedimiento,
  documentosPermitidos,
  indiceProcedimientos,
  MAX_CARACTERES_PROCEDIMIENTO,
  parsearDocumento,
  type Documento,
} from './conocimiento'

const AHORA = new Date('2026-11-25T15:00:00.000Z')
const RAIZ_REAL = resolve(__dirname, '../../conocimiento/asistente')

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

function encabezado(extra: Record<string, string> = {}): string {
  const campos = { titulo: 'Doc de prueba', dueno: '"area-cotizaciones"', revisado: '2026-11-26', permiso: 'cotizador:leer', ...extra }
  const lineas = Object.entries(campos).map(([k, v]) => `${k}: ${v}`)
  return `---\n${lineas.join('\n')}\n---\n\nCuerpo del documento.\n`
}

function docMemoria(extra: Partial<Documento> = {}): Documento {
  return { ruta: 'cotizaciones/prueba.md', titulo: 'Prueba', dueno: 'area-cotizaciones', revisado: '2026-11-26', permiso: 'cotizador:leer', cuerpo: 'cuerpo', ...extra }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['documento sin encabezado válido no se carga ni aparece en el índice', async () => {
    const raiz = mkdtempSync(join(tmpdir(), 'conocimiento-prueba-'))
    mkdirSync(join(raiz, 'cotizaciones'))
    writeFileSync(join(raiz, 'cotizaciones', 'bueno.md'), encabezado({ titulo: 'Bueno' }))
    writeFileSync(join(raiz, 'cotizaciones', 'sin_encabezado.md'), 'Texto sin encabezado.')
    writeFileSync(join(raiz, 'cotizaciones', 'sin_dueno.md'), encabezado().replace(/dueno: .*\n/, ''))
    writeFileSync(join(raiz, 'cotizaciones', 'permiso_falso.md'), encabezado({ titulo: 'Malo', permiso: 'inventado:x' }))
    writeFileSync(join(raiz, 'cotizaciones', 'fecha_mala.md'), encabezado({ titulo: 'Fecha', revisado: '26/11/2026' }))
    const docs = cargarDocumentos(raiz)
    assert.deepEqual(docs.map((d) => d.ruta), ['cotizaciones/bueno.md'])
    const indice = indiceProcedimientos(docs, sesionCon('admin'), AHORA)
    assert.ok(indice.includes('Bueno'))
    assert.ok(!indice.includes('sin_encabezado') && !indice.includes('Malo') && !indice.includes('Fecha'))
  }],
  ['usuario sin permiso no recibe el documento ni en el índice ni por nombre', async () => {
    const docs = [docMemoria({ ruta: 'finanzas/cierre.md', titulo: 'Cierre', permiso: 'finanzas:escribir' })]
    await conPermisosRestringidos('comercial', ['cotizador:leer'], () => {
      assert.equal(indiceProcedimientos(docs, sesionCon('comercial'), AHORA), '')
      assert.match(consultarProcedimiento('cierre', sesionCon('comercial'), docs), /No hay un procedimiento/)
      assert.equal(documentosPermitidos(docs, sesionCon('comercial')).length, 0)
    })
    assert.equal(documentosPermitidos(docs, sesionCon('admin')).length, 1)
    assert.match(indiceProcedimientos(docs, sesionCon('admin'), AHORA), /finanzas\/cierre\.md: Cierre/)
  }],
  ['consultar por ruta o por título devuelve el documento completo', async () => {
    const docs = [docMemoria({ ruta: 'cotizaciones/iva.md', titulo: 'IVA en una cotización', cuerpo: 'El IVA es 19.' })]
    const porRuta = consultarProcedimiento('cotizaciones/iva', sesionCon('admin'), docs)
    assert.ok(porRuta.includes('El IVA es 19.'))
    const porTitulo = consultarProcedimiento('iva en una', sesionCon('admin'), docs)
    assert.ok(porTitulo.includes('El IVA es 19.'))
  }],
  ['procedimiento muy largo se trunca a 12.000 caracteres con aviso', async () => {
    const docs = [docMemoria({ titulo: 'Largo', cuerpo: 'x'.repeat(40000) })]
    const texto = consultarProcedimiento('largo', sesionCon('admin'), docs)
    assert.ok(texto.length <= MAX_CARACTERES_PROCEDIMIENTO)
    assert.ok(texto.includes('RESULTADO TRUNCADO'))
  }],
  ['documento sin revisar en más de 180 días se marca "por revisar"', async () => {
    const docs = [docMemoria({ titulo: 'Viejo', revisado: '2026-01-01' })]
    assert.match(indiceProcedimientos(docs, sesionCon('admin'), AHORA), /\(por revisar\)/)
  }],
  ['los documentos reales son válidos y el INDICE.md lista exactamente esos archivos', async () => {
    const docs = cargarDocumentos(RAIZ_REAL)
    const rutasReales = docs.map((d) => d.ruta).sort()
    assert.ok(rutasReales.length >= 2)
    const indice = readFileSync(join(RAIZ_REAL, 'INDICE.md'), 'utf8')
    const enlaces = [...indice.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]).sort()
    // HUECO CONOCIDO (t-200 paso 1): descuentos.md declara el permiso "cotizador:descuento", que ya no
    // existe en la matriz única (lib/auth/permisos.ts). Ese documento no carga hasta que el Supervisor
    // defina el permiso o cambie el encabezado. La prueba fija el hueco para que no pase en silencio.
    assert.deepEqual(enlaces.filter((r) => !rutasReales.includes(r)), ['cotizaciones/descuentos.md'])
    assert.deepEqual(enlaces.filter((r) => rutasReales.includes(r)), rutasReales)
  }],
  ['ningún documento de conocimiento contiene patrones de claves de API', async () => {
    // Patrones de claves de proveedor, partidos a propósito para que este archivo no los contenga.
    const patrones = new RegExp([['sk', '-or-'], ['sk', '-ant-'], ['AI', 'za']].map((p) => p.join('')).join('|'))
    const archivos = readdirSync(RAIZ_REAL, { recursive: true }) as string[]
    for (const f of archivos.filter((x) => x.endsWith('.md'))) {
      assert.ok(!patrones.test(readFileSync(join(RAIZ_REAL, f), 'utf8')), `patrón de clave en ${f}`)
    }
  }],
  ['parsearDocumento separa encabezado y cuerpo', async () => {
    const d = parsearDocumento('a.md', encabezado({ titulo: 'Hola' }))
    assert.ok(d)
    assert.equal(d.titulo, 'Hola')
    assert.equal(d.dueno, 'area-cotizaciones')
    assert.equal(d.cuerpo, 'Cuerpo del documento.')
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
