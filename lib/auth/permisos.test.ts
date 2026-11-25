import assert from 'node:assert/strict'
import { PERMISOS_POR_ROL, type Permiso } from './permisos'
import type { RolCanonico } from '@/lib/data/contracts'

// Parámetros financieros (actualizarParametrosFinancierosAction) exigen finanzas:escribir.
// Solo admin y finanzas lo tienen; desarrollador, que antes entraba por proyectos:escribir, ya no.
const PERMISO_FINANZAS: Permiso = 'finanzas:escribir'

const ROLES = Object.keys(PERMISOS_POR_ROL) as RolCanonico[]

function roles_con(permiso: Permiso): RolCanonico[] {
  return ROLES.filter((rol) => PERMISOS_POR_ROL[rol].includes(permiso))
}

async function run(): Promise<void> {
  const casos: [string, () => void][] = [
    ['finanzas:escribir lo tienen exactamente admin y finanzas', () => {
      assert.deepEqual(roles_con(PERMISO_FINANZAS).sort(), ['admin', 'finanzas'])
    }],
    ['desarrollador NO tiene finanzas:escribir (antes entraba por proyectos:escribir)', () => {
      assert.equal(PERMISOS_POR_ROL.desarrollador.includes(PERMISO_FINANZAS), false)
      assert.equal(PERMISOS_POR_ROL.desarrollador.includes('proyectos:escribir'), true)
    }],
    ['comercial, compras, taller y supervisora_qa no tienen finanzas:escribir', () => {
      for (const rol of ['comercial', 'compras', 'taller', 'supervisora_qa'] as RolCanonico[]) {
        assert.equal(PERMISOS_POR_ROL[rol].includes(PERMISO_FINANZAS), false, `${rol} no debería tener ${PERMISO_FINANZAS}`)
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
