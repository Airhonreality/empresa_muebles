// Guardarraíl del sistema de barra inferior móvil (components/veta/mobile-dock.tsx).
// Ejecutar desde la raíz del repo: npx tsx components/veta/mobile-dock.test.ts
//
// Regla: las páginas de /erp NO escriben `fixed bottom-*`. La pila inferior (dock + nav)
// la dibuja solo el shell (components/veta/erp-shell.tsx). Si una página vuelve a poner
// una barra fija en la parte inferior, este test falla y la barra se superpone con la nav.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()

function archivosTsx(dir: string): string[] {
  const salida: string[] = []
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) salida.push(...archivosTsx(ruta))
    else if (/\.(tsx|ts)$/.test(nombre) && !/\.test\.ts$/.test(nombre)) salida.push(ruta)
  }
  return salida
}

// Detecta una clase `fixed` y una clase `bottom-*` en la misma cadena de className
// (o en la misma línea, que es como se escriben estas barras en el proyecto).
const PATRON_FIJO_INFERIOR = /\bfixed\b[^\n]*\bbottom-/

function violaciones(archivos: string[]): string[] {
  const hallazgos: string[] = []
  for (const archivo of archivos) {
    const lineas = readFileSync(archivo, 'utf-8').split('\n')
    lineas.forEach((linea, i) => {
      if (PATRON_FIJO_INFERIOR.test(linea)) {
        hallazgos.push(`${relative(RAIZ, archivo)}:${i + 1}: ${linea.trim()}`)
      }
    })
  }
  return hallazgos
}

// 1) Ninguna página de /erp dibuja una barra fija inferior propia.
const erpArchivos = archivosTsx(join(RAIZ, 'app', 'erp'))
assert.ok(erpArchivos.length > 0, 'no se encontraron archivos en app/erp')
const fuera = violaciones(erpArchivos)
assert.deepEqual(
  fuera,
  [],
  `Barra fija inferior fuera del shell (usar <MobileDock> de components/veta/mobile-dock.tsx):\n${fuera.join('\n')}`,
)

// 2) El shell tiene exactamente una pila fija inferior (dock + nav).
const shell = readFileSync(join(RAIZ, 'components', 'veta', 'erp-shell.tsx'), 'utf-8')
const enShell = violaciones([join(RAIZ, 'components', 'veta', 'erp-shell.tsx')])
assert.equal(enShell.length, 1, `el shell debe tener exactamente una pila fija inferior, hay ${enShell.length}`)
assert.match(shell, /--erp-stack-h/, 'el shell debe publicar --erp-stack-h')

// 3) El patrón detecta lo que debe detectar (y no lo que no debe).
assert.ok(PATRON_FIJO_INFERIOR.test('<div className="fixed bottom-0 left-0 z-10">'))
assert.ok(PATRON_FIJO_INFERIOR.test('className="fixed bottom-[calc(3.5rem)] right-0"'))
assert.ok(!PATRON_FIJO_INFERIOR.test('<div className="absolute bottom-0 left-0">'))
assert.ok(!PATRON_FIJO_INFERIOR.test('<div className="fixed top-0 inset-x-0">'))

console.log('mobile-dock.test.ts: OK')
