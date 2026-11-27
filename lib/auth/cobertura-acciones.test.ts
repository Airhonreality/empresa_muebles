// Cobertura del protocolo: ninguna función exportada de lib/data/actions/*.ts puede quedar sin
// protegerAccion, y ninguna puede existir sin estar clasificada en lib/auth/inventario-acciones.json.
// Así una acción nueva no entra al sistema sin decisión explícita de permiso o de acceso público.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { esAccionProtegida } from './accion'
import inventarioJson from './inventario-acciones.json'

type Entrada = { archivo: string; nombre: string; clasificacion: 'protegida' | 'publica' | 'pendiente_decision' }
const inventario = inventarioJson as Entrada[]

const DIR_ACCIONES = path.join(__dirname, '../data/actions')
// mappers.ts exporta helpers síncronos (num, numOrNull, sanitizarCamposPersonalizados): no son acciones.
const EXCLUIDOS = new Set(['mappers.ts'])

async function run(): Promise<void> {
  const archivos = fs
    .readdirSync(DIR_ACCIONES)
    .filter((f) => f.endsWith('.ts') && !EXCLUIDOS.has(f))
    .sort()

  const fallos: string[] = []
  const vistas = new Set<string>()
  let protegidas = 0

  for (const archivo of archivos) {
    const modulo = (await import(path.join(DIR_ACCIONES, archivo))) as Record<string, unknown>
    for (const [nombre, valor] of Object.entries(modulo)) {
      if (typeof valor !== 'function') continue
      const clave = `lib/data/actions/${archivo}#${nombre}`
      vistas.add(clave)
      const entrada = inventario.find((e) => e.archivo === `lib/data/actions/${archivo}` && e.nombre === nombre)

      if (!entrada) {
        fallos.push(`${clave}: exportada sin clasificar (agregar al inventario y pasar por protegerAccion)`)
        continue
      }
      if (entrada.clasificacion === 'pendiente_decision') {
        // Conocida y documentada en el inventario; no se exige marca hasta que el Supervisor decida.
        continue
      }
      if (!esAccionProtegida(valor)) {
        fallos.push(`${clave}: sin protegerAccion (clasificación "${entrada.clasificacion}")`)
      } else {
        protegidas++
      }
    }
  }

  for (const e of inventario) {
    const clave = `${e.archivo}#${e.nombre}`
    if (!vistas.has(clave)) {
      fallos.push(`${clave}: está en el inventario pero no se exporta (inventario desactualizado)`)
    }
  }

  if (fallos.length > 0) {
    console.error(`cobertura-acciones.test.ts: ${fallos.length} problema(s)`)
    for (const f of fallos) console.error(`  - ${f}`)
    process.exitCode = 1
    return
  }
  const pendientes = inventario.filter((e) => e.clasificacion === 'pendiente_decision').length
  assert.ok(protegidas > 0, 'no se encontró ninguna acción protegida: la prueba no verifica nada')
  console.log(`cobertura-acciones.test.ts: ok. ${protegidas} acciones marcadas, ${pendientes} pendientes de decisión (documentadas).`)
}

void run()
