import assert from 'node:assert/strict'
import { PERMISOS_POR_ROL, type Permiso } from './permisos'
import type { RolCanonico } from '@/lib/data/contracts'

// Parámetros financieros (actualizarParametrosFinancierosAction) exigen finanzas:escribir.
// Solo admin y finanzas lo tienen; desarrollador, que antes entraba por proyectos:escribir, ya no.
const PERMISO_FINANZAS: Permiso = 'finanzas:escribir'


async function run(): Promise<void> {
  const casos: [string, () => void][] = [
    ['TEMPORAL (2026-11-27): todos los roles conservan todos los permisos hasta decidir la matriz', () => {
      // Al decidir la matriz real, esta prueba se reemplaza por los casos de restricción por rol.
      for (const rol of Object.keys(PERMISOS_POR_ROL) as RolCanonico[]) {
        assert.equal(PERMISOS_POR_ROL[rol].includes(PERMISO_FINANZAS), true, `${rol} conserva ${PERMISO_FINANZAS}`)
      }
    }],
    ['admin conserva todos los permisos (incluye finanzas:escribir)', () => {
      assert.equal(PERMISOS_POR_ROL.admin.includes(PERMISO_FINANZAS), true)
    }],
  ]

  let fallos = 0
  for (const [nombre, prueba] of casos) {
    try {
      prueba()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FAIL - ${nombre}: ${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exitCode = 1
  else console.log(`permisos.test.ts: ${casos.length} casos ok`)
}

void run()
