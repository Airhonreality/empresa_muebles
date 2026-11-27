// lib/asistente/prueba-permisos.ts
// SOLO PRUEBAS. La matriz de permisos es única (lib/auth/permisos.ts) y hoy todos los roles tienen
// todos los permisos. Para probar que un rol NO ve o NO puede ejecutar algo, la prueba restringe su
// entrada en memoria durante `fn` y la restaura después (mismo patrón que lib/auth/accion.test.ts).
import { PERMISOS_POR_ROL, type Permiso } from '../auth/permisos'
import type { RolCanonico } from '../data/contracts'

export async function conPermisosRestringidos<T>(
  rol: RolCanonico,
  permisos: readonly Permiso[],
  fn: () => Promise<T> | T,
): Promise<T> {
  const previo = PERMISOS_POR_ROL[rol]
  PERMISOS_POR_ROL[rol] = permisos
  try {
    return await fn()
  } finally {
    PERMISOS_POR_ROL[rol] = previo
  }
}
