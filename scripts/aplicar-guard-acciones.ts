// Aplica el protocolo protegerAccion a las Server Actions de lib/data/actions/*.ts usando el
// inventario lib/auth/inventario-acciones.json. Reescribe cada
//   export async function NOMBRE(...) { ... }
// como
//   export const NOMBRE = protegerAccion({ permiso: "..." }, async function NOMBRE(...) { ... });
// (o con { publica: true, motivo: "..." }). Nunca toca tipos, constantes, clases ni helpers.
//
// Uso:
//   npx tsx scripts/aplicar-guard-acciones.ts --dry-run   # muestra el diff, no escribe
//   npx tsx scripts/aplicar-guard-acciones.ts             # aplica
//
// Idempotente: una función ya envuelta (export const) no es un FunctionDeclaration y se omite.
import ts from 'typescript'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const RAIZ = path.resolve(__dirname, '..')
const INVENTARIO = path.join(RAIZ, 'lib/auth/inventario-acciones.json')
const IMPORT_PROTEGER = "import { protegerAccion } from '@/lib/auth/accion'"

type Entrada = {
  archivo: string
  nombre: string
  clasificacion: 'protegida' | 'publica' | 'pendiente_decision'
  permiso?: string
  motivo?: string
}

const dryRun = process.argv.includes('--dry-run')
const inventario: Entrada[] = JSON.parse(fs.readFileSync(INVENTARIO, 'utf8'))

function reglaLiteral(e: Entrada): string {
  if (e.clasificacion === 'protegida') {
    if (!e.permiso) throw new Error(`${e.nombre}: protegida sin permiso`)
    return `{ permiso: ${JSON.stringify(e.permiso)} }`
  }
  if (e.clasificacion === 'publica') {
    if (!e.motivo || !e.motivo.trim()) throw new Error(`${e.nombre}: pública sin motivo`)
    return `{ publica: true, motivo: ${JSON.stringify(e.motivo)} }`
  }
  throw new Error(`${e.nombre}: clasificación ${e.clasificacion} no se envuelve`)
}

function transformar(archivoRel: string, src: string): { nuevo: string; envueltas: string[] } {
  const archivo = path.basename(archivoRel)
  const mapa = new Map(
    inventario
      .filter((e) => e.archivo === `lib/data/actions/${archivo}` && e.clasificacion !== 'pendiente_decision')
      .map((e) => [e.nombre, e]),
  )
  const sf = ts.createSourceFile(archivo, src, ts.ScriptTarget.Latest, true)

  // Exports async del archivo que el inventario NO conoce: se rechazan (una acción nueva debe
  // pasar por el inventario antes de existir).
  const exportadasAsync = sf.statements.filter(
    (st): st is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(st) && !!st.name &&
      !!(ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export) &&
      !!(ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Async),
  )
  for (const st of exportadasAsync) {
    const nombre = st.name!.text
    const enInventario = inventario.find((e) => e.archivo === `lib/data/actions/${archivo}` && e.nombre === nombre)
    if (!enInventario) throw new Error(`${archivo}: export async "${nombre}" no está en el inventario`)
  }

  const reemplazos: { desde: number; hasta: number; texto: string }[] = []
  const envueltas: string[] = []
  for (const st of exportadasAsync) {
    const nombre = st.name!.text
    const entrada = mapa.get(nombre)
    if (!entrada) continue // pendiente_decision: queda como export async sin envolver

    const inicio = st.getStart(sf)
    const original = src.slice(inicio, st.end)
    const prefijo = `export async function ${nombre}`
    if (!original.startsWith(prefijo)) {
      throw new Error(`${archivo}: no empieza con "${prefijo}" (formato inesperado)`)
    }
    const resto = original.slice(prefijo.length)
    reemplazos.push({
      desde: inicio,
      hasta: st.end,
      texto: `export const ${nombre} = protegerAccion(${reglaLiteral(entrada)}, async function ${nombre}${resto});`,
    })
    envueltas.push(nombre)
  }

  if (reemplazos.length === 0) return { nuevo: src, envueltas }

  let nuevo = src
  for (const r of [...reemplazos].sort((a, b) => b.desde - a.desde)) {
    nuevo = nuevo.slice(0, r.desde) + r.texto + nuevo.slice(r.hasta)
  }

  if (!nuevo.includes(IMPORT_PROTEGER)) {
    const imports = sf.statements.filter(ts.isImportDeclaration)
    if (imports.length > 0) {
      const ultimo = imports[imports.length - 1]
      const pos = ultimo.getEnd()
      nuevo = nuevo.slice(0, pos) + `\n${IMPORT_PROTEGER}` + nuevo.slice(pos)
    } else {
      const m = nuevo.match(/^(['"]use server['"];?\s*\n)/)
      const pos = m ? m[0].length : 0
      nuevo = nuevo.slice(0, pos) + `${IMPORT_PROTEGER}\n` + nuevo.slice(pos)
    }
  }
  return { nuevo, envueltas }
}

function diffUnificado(antes: string, despues: string, etiqueta: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-diff-'))
  const a = path.join(tmp, 'antes.ts')
  const b = path.join(tmp, 'despues.ts')
  fs.writeFileSync(a, antes)
  fs.writeFileSync(b, despues)
  const r = spawnSync('diff', ['-u', '--label', `a/${etiqueta}`, '--label', `b/${etiqueta}`, a, b], { encoding: 'utf8' })
  fs.rmSync(tmp, { recursive: true, force: true })
  return r.stdout
}

function main(): void {
  const archivos = [...new Set(inventario.map((e) => e.archivo))].sort()
  let totalEnvueltas = 0
  const cambios: { archivo: string; antes: string; despues: string }[] = []

  for (const archivoRel of archivos) {
    const abs = path.join(RAIZ, archivoRel)
    const src = fs.readFileSync(abs, 'utf8')
    const { nuevo, envueltas } = transformar(archivoRel, src)
    totalEnvueltas += envueltas.length
    if (nuevo !== src) cambios.push({ archivo: archivoRel, antes: src, despues: nuevo })
    console.log(`${archivoRel}: ${envueltas.length} envueltas`)
  }

  if (dryRun) {
    for (const c of cambios) process.stdout.write(diffUnificado(c.antes, c.despues, c.archivo))
    console.log(`\n[dry-run] ${totalEnvueltas} acciones se envolverían en ${cambios.length} archivos. No se escribió nada.`)
    return
  }
  for (const c of cambios) fs.writeFileSync(path.join(RAIZ, c.archivo), c.despues)
  console.log(`\nAplicado: ${totalEnvueltas} acciones envueltas en ${cambios.length} archivos.`)
}

main()
