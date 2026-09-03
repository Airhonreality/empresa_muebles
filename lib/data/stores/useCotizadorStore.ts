// useCotizadorStore.ts
// Store Zustand 5 del cotizador.
//
// Fase 0: estado y acciones de lectura/hidratación.
// Fase 2 (ZN-003): mutaciones optimistas con snapshot + revert automático
// (crearItemOptimistic, actualizarItemOptimistic, eliminarVariante,
// renombrarVariante). Cada acción aplica el cambio local de inmediato,
// delega la persistencia a `persistir` (Server Action del DataStore) y, ante
// fallo, restaura el snapshot previo e incrementa `version` para re-render.
//
// Import NAMED de Zustand v5: `import { create }` — en v5.0.x ya no hay
// default export de `zustand` (el `import create from 'zustand'` de la
// versión anterior era el error raíz que rompía todo el archivo).

import { create } from 'zustand'
import { CotizadorState, CotizadorActions, cotizadorInitialState } from './types'

// El State del store ES CotizadorState de types.ts (fuente única de verdad).
// No se redefine aquí un tipo reducido divergente: así los selectors y el
// store siempre leen los mismos campos.
export type CotizadorStore = CotizadorState & CotizadorActions

/** `totalLinea` provisional para un ítem optimista (cantidad × precio unitario). */
function calcularTotalLinea(itemData: {
  cantidad: string
  precioUnitario: string
}): string {
  const cantidad = Number.parseFloat(itemData.cantidad) || 0
  const precio = Number.parseFloat(itemData.precioUnitario) || 0
  return (cantidad * precio).toFixed(2)
}

export const useCotizadorStore = create<CotizadorStore>((set, get) => {
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

    crearItemOptimistic: async (itemData, persistir) => {
      // Snapshot del estado previo antes de la mutación optimista.
      const itemsPrevios = get().items
      const temporalesPrevios = get().isPending

      const idTemporal = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const nombrePersonalizado = itemData.nombrePersonalizado ?? null
      const totalLinea = calcularTotalLinea(itemData)
      const itemTemporal: CotizadorState['items'][number] = {
        id: idTemporal,
        varianteId: itemData.varianteId,
        catalogoId: itemData.catalogoId,
        nombrePersonalizado,
        cantidad: itemData.cantidad,
        precioUnitario: itemData.precioUnitario,
        totalLinea,
        anulado: itemData.anulado ?? false,
        esReferencial: itemData.esReferencial ?? false,
        fuenteReferencial: itemData.fuenteReferencial ?? null,
        grupoReferencial: itemData.grupoReferencial ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set((state) => ({
        items: [...state.items, itemTemporal],
        isPending: { ...state.isPending, crearItem: true },
        version: state.version + 1,
      }))

      try {
        const confirmado = await persistir()
        set((state) => ({
          items: state.items.map((it) => (it.id === idTemporal ? confirmado : it)),
          isPending: { ...state.isPending, crearItem: false },
          version: state.version + 1,
        }))
        return confirmado
      } catch (error) {
        set((state) => ({
          items: itemsPrevios,
          isPending: temporalesPrevios,
          version: state.version + 1,
        }))
        throw error
      }
    },

    actualizarItemOptimistic: async (id, cambios, persistir) => {
      const itemsPrevios = get().items

      set((state) => ({
        items: state.items.map((it) => (it.id === id ? { ...it, ...cambios } : it)),
        version: state.version + 1,
      }))

      try {
        const confirmado = await persistir()
        if (confirmado) {
          set((state) => ({
            items: state.items.map((it) => (it.id === id ? confirmado : it)),
            version: state.version + 1,
          }))
        }
        return true
      } catch (error) {
        set((state) => ({
          items: itemsPrevios,
          version: state.version + 1,
        }))
        throw error
      }
    },

    eliminarVariante: async (id, persistir) => {
      const espaciosPrevios = get().espacios
      const itemsPrevios = get().items

      set((state) => ({
        espacios: state.espacios.filter((esp) => esp.id !== id),
        items: state.items.filter((it) => it.varianteId !== id),
        version: state.version + 1,
      }))

      try {
        const ok = await persistir()
        if (!ok) {
          // El servidor no eliminó nada: revertir para no divergir de la verdad.
          set((state) => ({
            espacios: espaciosPrevios,
            items: itemsPrevios,
            version: state.version + 1,
          }))
        }
        return ok
      } catch (error) {
        set((state) => ({
          espacios: espaciosPrevios,
          items: itemsPrevios,
          version: state.version + 1,
        }))
        throw error
      }
    },

    renombrarVariante: async (id, nuevoNombre, persistir) => {
      const espaciosPrevios = get().espacios

      set((state) => ({
        espacios: state.espacios.map((esp) =>
          esp.id === id ? { ...esp, nombreVariante: nuevoNombre } : esp,
        ),
        version: state.version + 1,
      }))

      try {
        await persistir()
        return true
      } catch (error) {
        set((state) => ({
          espacios: espaciosPrevios,
          version: state.version + 1,
        }))
        throw error
      }
    },
  }
})
