// Pruebas de ayuda.procedimiento (t-200 paso 2): el tema es un enum del índice, filtrado por permiso.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SesionEmpleado } from '../../auth/session'
import { cargarDocumentos } from '../conocimiento'
import { ejecutarHerramienta, Procedencia, type DefinicionAsistente } from '../herramientas'
import { conPermisosRestringidos } from '../__pruebas__/prueba-permisos'
import { operacionAyuda, rutasDeIndice, temasDeIndice } from './ayuda'
import { zodToJsonSchema } from '../esquema-json'

const RAIZ = join(process.cwd(), 'conocimiento', 'asistente')
const DOCS = cargarDocumentos(RAIZ)
const INDICE = readFileSync(join(RAIZ, 'INDICE.md'), 'utf8')

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: `u-${rol}`, personaId: null, nombre: rol, email: `${rol}@prueba.test`, rol }
}

function opAyuda(): DefinicionAsistente {
  const [op] = operacionAyuda(DOCS, INDICE)
  assert.ok(op, 'ayuda.procedimiento debe existir con documentos cargables')
  return op
}

const casos: Array<[string, () => Promise<void>]> = [
  ['rutasDeIndice lee cada enlace .md del índice una sola vez', async () => {
    const rutas = rutasDeIndice(INDICE)
    assert.ok(rutas.includes('cotizaciones/estados.md'))
    assert.equal(new Set(rutas).size, rutas.length)
  }],
  ['el enum de temas sale del índice y solo incluye documentos cargables', async () => {
    const temas = temasDeIndice(INDICE, DOCS)
    assert.deepEqual(temas.sort(), DOCS.map((d) => d.ruta).sort().filter((r) => rutasDeIndice(INDICE).includes(r)))
    // descuentos.md carga: su permiso (cotizador:escribir) existe en la matriz del chat.
    assert.ok(temas.includes('cotizaciones/descuentos.md'))
  }],
  ['tema fuera del enum se rechaza sin ejecutar el procedimiento', async () => {
    await assert.rejects(
      ejecutarHerramienta(opAyuda(), { tema: 'no/existe.md' }, sesionCon('admin'), { procedencia: new Procedencia() }),
      /Entrada inválida/,
    )
  }],
  ['tema en texto libre (título) también se rechaza: solo rutas del índice', async () => {
    await assert.rejects(
      ejecutarHerramienta(opAyuda(), { tema: 'Estados de una cotización' }, sesionCon('admin'), { procedencia: new Procedencia() }),
      /Entrada inválida/,
    )
  }],
  ['admin lee el procedimiento completo', async () => {
    const texto = await ejecutarHerramienta(opAyuda(), { tema: 'cotizaciones/estados.md' }, sesionCon('admin'), { procedencia: new Procedencia() })
    assert.match(texto, /Estados de una cotización/)
  }],
  ['sin cotizador:leer el tema de cotizaciones no aparece en el esquema del usuario ni se lee', async () => {
    await conPermisosRestringidos('taller', ['proyectos:leer'], async () => {
      const op = opAyuda()
      const sesion = sesionCon('taller')
      assert.equal(op.disponible?.(sesion), false)
      await assert.rejects(ejecutarHerramienta(op, { tema: 'cotizaciones/estados.md' }, sesion, { procedencia: new Procedencia() }))
      const json = JSON.stringify(zodToJsonSchema(op.esquemaPara!(sesion)))
      assert.ok(!json.includes('cotizaciones/'))
    })
  }],
  ['el esquema de argumentos se convierte a JSON Schema con enum', async () => {
    const json = zodToJsonSchema(opAyuda().esquema) as { properties: { tema: { enum: string[] } } }
    assert.ok(json.properties.tema.enum.includes('cotizaciones/iva.md'))
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
      console.log(`FALLA - ${nombre}\n${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exit(1)
}

void principal()
