// lib/asistente/__pruebas__/prueba-permisos.ts
// SOLO PRUEBAS. Restringe el permiso de un rol en memoria durante `fn` (matriz base y matriz del chat)
// y lo restaura después. Así se prueba que un rol NO ve o NO puede ejecutar algo.
import { PERMISOS_POR_ROL, type Permiso } from '../../auth/permisos'
import type { RolCanonico } from '../../data/contracts'
import { MATRIZ_CHAT } from '../matriz-chat'

export async function conPermisosRestringidos<T>(
  rol: RolCanonico,
  permisos: readonly Permiso[],
  fn: () => Promise<T> | T,
): Promise<T> {
  const previoBase = PERMISOS_POR_ROL[rol]
  const previoChat = MATRIZ_CHAT[rol]
  PERMISOS_POR_ROL[rol] = permisos
  MATRIZ_CHAT[rol] = permisos
  try {
    return await fn()
  } finally {
    PERMISOS_POR_ROL[rol] = previoBase
    MATRIZ_CHAT[rol] = previoChat
  }
}
