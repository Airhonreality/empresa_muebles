// useCotizadorStore.ts
// Store Zustand 5 del cotizador — Fase 0 (solo lectura).
// Expone estado y acciones de lectura/hidratación. Las mutaciones optimistas
// (crearItemOptimistic, revert, etc.) pertenecen a la Fase 2 del roadmap ZU_03.
//
// Import NAMED de Zustand v5: `import { create }` — en v5.0.x ya no hay
// default export de `zustand` (el `import create from 'zustand'` de la
// versión anterior era el error raíz que rompía todo el archivo).

import { create } from 'zustand'
import { CotizadorState, cotizadorInitialState } from './types'

// El State del store ES CotizadorState de types.ts (fuente única de verdad).
// No se redefine aquí un tipo reducido divergente: así los selectors y el
// store siempre leen los mismos campos.
export type CotizadorStore = CotizadorState & {
  /** Reemplaza el estado completo (hidratación desde DataStoreProvider o mock-store). */
  hidratar: (estado: Partial<CotizadorState>) => void
  /** Incrementa `version` para invalidar suscripciones por versión. */
  avisarCambio: () => void
  /** Restaura el estado inicial. */
  resetear: () => void
}

export const useCotizadorStore = create<CotizadorStore>((set) => {
  const initial = cotizadorInitialState()

  return {
    ...initial,

    hidratar: (estado) =>
      set((current) => {
        const items = estado.items ?? current.items
        const version = (estado.version ?? current.version) + 1
        return {
          ...current,
          ...estado,
          items,
          version,
        }
      }),

    avisarCambio: () =>
      set((state) => ({ version: state.version + 1 })),

    resetear: () => set(() => ({ ...cotizadorInitialState() })),
  }
})
