// Helpers puros del optimistic merge/rollback del cotizador (DEC-5, plan_cotizador_tanstack_query.md).
// Sin React, sin TanStack, sin DB: funciones planas sobre `CotizadorSnapshot` testables con tsx.
// Cada mutación optimista aplica su transformación acá y el rollback restaura el snapshot previo
// completo (onError -> setQueryData(previous)). Las reglas replican el contrato del mock/server:
// totalLinea siempre se re-deriva de cantidad x precio; eliminar ítem es soft-delete (anulado).
import type { CotizadorSnapshot } from './types'
import type { ItemVariante, EspacioVariante, EspacioArtefacto, Proyecto } from '../contracts'

export function calcularTotalLinea(cantidad: string, precioUnitario: string): string {
  const n = Number(cantidad) * Number(precioUnitario)
  return String(Number.isFinite(n) ? n : 0)
}

// --- Items ---

export interface InputItemOptimista {
  id: string
  varianteId: string
  catalogoId: string | null
  cantidad: string
  precioUnitario?: string
  nombrePersonalizado?: string | null
  esReferencial?: boolean
  fuenteReferencial?: ItemVariante['fuenteReferencial']
  grupoReferencial?: string | null
}

export function construirItemOptimista(input: InputItemOptimista): ItemVariante {
  const precioUnitario = input.precioUnitario ?? '0'
  const ahora = new Date().toISOString()
  return {
    id: input.id,
    varianteId: input.varianteId,
    catalogoId: input.catalogoId,
    nombrePersonalizado: input.nombrePersonalizado ?? null,
    cantidad: input.cantidad,
    precioUnitario,
    totalLinea: calcularTotalLinea(input.cantidad, precioUnitario),
    anulado: false,
    esReferencial: input.esReferencial ?? false,
    fuenteReferencial: input.fuenteReferencial ?? null,
    grupoReferencial: input.grupoReferencial ?? null,
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export function agregarItem(snapshot: CotizadorSnapshot, item: ItemVariante): CotizadorSnapshot {
  if (snapshot.items.some((i) => i.id === item.id)) return snapshot
  return { ...snapshot, items: [...snapshot.items, item] }
}

export function actualizarItem(
  snapshot: CotizadorSnapshot,
  itemId: string,
  patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>>,
): CotizadorSnapshot {
  if (!snapshot.items.some((i) => i.id === itemId)) return snapshot
  const ahora = new Date().toISOString()
  return {
    ...snapshot,
    items: snapshot.items.map((i) => {
      if (i.id !== itemId) return i
      const cantidad = patch.cantidad ?? i.cantidad
      const precioUnitario = patch.precioUnitario ?? i.precioUnitario
      return {
        ...i,
        ...patch,
        ...(patch.cantidad !== undefined || patch.precioUnitario !== undefined
          ? { totalLinea: calcularTotalLinea(cantidad, precioUnitario) }
          : {}),
        updatedAt: ahora,
      }
    }),
  }
}

export function eliminarItem(snapshot: CotizadorSnapshot, itemId: string): CotizadorSnapshot {
  return {
    ...snapshot,
    items: snapshot.items.map((i) =>
      i.id === itemId ? { ...i, anulado: true, updatedAt: new Date().toISOString() } : i,
    ),
  }
}

export function upsertItem(snapshot: CotizadorSnapshot, item: ItemVariante): CotizadorSnapshot {
  const idx = snapshot.items.findIndex((i) => i.id === item.id)
  const items = idx === -1 ? [...snapshot.items, item] : snapshot.items.map((i) => (i.id === item.id ? item : i))
  return { ...snapshot, items }
}

// --- Espacios / variantes ---

export interface InputEspacioOptimista {
  id: string
  proyectoId: string
  nombreEspacio: string
  nombreVariante?: string
  tipoEspacio?: string | null
  descripcion?: string | null
  orden?: number
  visibleEnPropuestaPublica?: boolean
  jornadasDesarrolloTecnico?: string
  jornadasEnsamblajeTaller?: string
  jornadasInstalacionObra?: string
}

export function construirEspacioOptimista(input: InputEspacioOptimista, orden: number): EspacioVariante {
  return {
    id: input.id,
    proyectoId: input.proyectoId,
    nombreEspacio: input.nombreEspacio,
    nombreVariante: input.nombreVariante ?? 'Inicial',
    tipoEspacio: input.tipoEspacio ?? null,
    descripcion: input.descripcion ?? null,
    activa: true,
    visibleEnPropuestaPublica: input.visibleEnPropuestaPublica ?? true,
    orden,
    jornadasDesarrolloTecnico: input.jornadasDesarrolloTecnico ?? '0',
    jornadasEnsamblajeTaller: input.jornadasEnsamblajeTaller ?? '0',
    jornadasInstalacionObra: input.jornadasInstalacionObra ?? '0',
    colores: [],
    fotosEspacio: [],
    fotosDisenio: [],
    fotosReferencia: [],
  }
}

export function agregarEspacio(snapshot: CotizadorSnapshot, input: InputEspacioOptimista): CotizadorSnapshot {
  if (snapshot.espacios.some((e) => e.id === input.id)) return snapshot
  const orden = input.orden ?? snapshot.espacios.filter((e) => e.proyectoId === input.proyectoId).length
  return { ...snapshot, espacios: [...snapshot.espacios, construirEspacioOptimista(input, orden)] }
}

export function actualizarEspacio(
  snapshot: CotizadorSnapshot,
  espacioId: string,
  patch: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>>,
): CotizadorSnapshot {
  if (!snapshot.espacios.some((e) => e.id === espacioId)) return snapshot
  return {
    ...snapshot,
    espacios: snapshot.espacios.map((e) => (e.id === espacioId ? { ...e, ...patch } : e)),
  }
}

export function actualizarJornadas(
  snapshot: CotizadorSnapshot,
  espacioId: string,
  jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string },
): CotizadorSnapshot {
  if (!snapshot.espacios.some((e) => e.id === espacioId)) return snapshot
  return {
    ...snapshot,
    espacios: snapshot.espacios.map((e) => (e.id === espacioId ? { ...e, ...jornadas } : e)),
  }
}

export function marcarEspacioActiva(snapshot: CotizadorSnapshot, espacioId: string): CotizadorSnapshot {
  return {
    ...snapshot,
    espacios: snapshot.espacios.map((e) => (e.id === espacioId ? { ...e, activa: true } : e)),
  }
}

export function eliminarEspacio(snapshot: CotizadorSnapshot, espacioId: string): CotizadorSnapshot {
  return {
    ...snapshot,
    espacios: snapshot.espacios.filter((e) => e.id !== espacioId),
    items: snapshot.items.filter((i) => i.varianteId !== espacioId),
  }
}

export function upsertEspacio(snapshot: CotizadorSnapshot, espacio: EspacioVariante): CotizadorSnapshot {
  const idx = snapshot.espacios.findIndex((e) => e.id === espacio.id)
  const espacios = idx === -1 ? [...snapshot.espacios, espacio] : snapshot.espacios.map((e) => (e.id === espacio.id ? espacio : e))
  return { ...snapshot, espacios }
}

// --- Proyecto (parámetros financieros / renombres) ---

export function actualizarProyecto(
  snapshot: CotizadorSnapshot,
  proyectoId: string,
  patch: Partial<Pick<Proyecto, 'nombreProyecto' | 'clienteId' | 'direccionObra' | 'descripcionSemantica' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario' | 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios'>>,
): CotizadorSnapshot {
  if (!snapshot.proyecto || snapshot.proyecto.id !== proyectoId) return snapshot
  return { ...snapshot, proyecto: { ...snapshot.proyecto, ...patch, updatedAt: new Date().toISOString() } }
}

export function upsertProyecto(snapshot: CotizadorSnapshot, proyecto: Proyecto): CotizadorSnapshot {
  if (snapshot.proyecto && snapshot.proyecto.id === proyecto.id) return { ...snapshot, proyecto }
  return snapshot
}

// --- Artefactos ---

export interface InputArtefactoOptimista {
  id: string
  espacioVarianteId: string
  categoria: EspacioArtefacto['categoria']
  dimensionesMm?: string | null
  tipoSpecifique?: string | null
  ubicacion?: string | null
  fotoUrl?: string | null
  requiereVerificacion?: boolean
}

export function construirArtefactoOptimista(input: InputArtefactoOptimista): EspacioArtefacto {
  const ahora = new Date().toISOString()
  return {
    id: input.id,
    espacioVarianteId: input.espacioVarianteId,
    categoria: input.categoria,
    dimensionesMm: input.dimensionesMm ?? null,
    tipoSpecifique: input.tipoSpecifique ?? null,
    ubicacion: input.ubicacion ?? null,
    fotoUrl: input.fotoUrl ?? null,
    requiereVerificacion: input.requiereVerificacion ?? true,
    validadoPor: null,
    validadoEn: null,
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export function agregarArtefacto(snapshot: CotizadorSnapshot, artefacto: EspacioArtefacto): CotizadorSnapshot {
  if (snapshot.artefactos.some((a) => a.id === artefacto.id)) return snapshot
  return { ...snapshot, artefactos: [...snapshot.artefactos, artefacto] }
}

export function actualizarArtefacto(
  snapshot: CotizadorSnapshot,
  artefactoId: string,
  patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>>,
): CotizadorSnapshot {
  if (!snapshot.artefactos.some((a) => a.id === artefactoId)) return snapshot
  return {
    ...snapshot,
    artefactos: snapshot.artefactos.map((a) =>
      a.id === artefactoId ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
    ),
  }
}

export function upsertArtefacto(snapshot: CotizadorSnapshot, artefacto: EspacioArtefacto): CotizadorSnapshot {
  const idx = snapshot.artefactos.findIndex((a) => a.id === artefacto.id)
  const artefactos = idx === -1
    ? [...snapshot.artefactos, artefacto]
    : snapshot.artefactos.map((a) => (a.id === artefacto.id ? artefacto : a))
  return { ...snapshot, artefactos }
}

// --- Fase 1.3 (PDEC-C): overlay de filas optimistas en vuelo ---
// Un refetch que aterriza mientras una fila optimista sigue sin confirmar NUNCA debe hacerla
// desaparecer de la UI (evapción, causa de S1). Este registro vive fuera de React (módulo),
// se alimenta en onMutate de useCrearItemMutation y se drena en onSettled.
const pendientesItemsPorProyecto = new Map<string, Map<string, ItemVariante>>()

export function registrarItemPendiente(proyectoId: string, item: ItemVariante): void {
  let mapa = pendientesItemsPorProyecto.get(proyectoId)
  if (!mapa) {
    mapa = new Map()
    pendientesItemsPorProyecto.set(proyectoId, mapa)
  }
  mapa.set(item.id, item)
}

export function liberarItemPendiente(proyectoId: string, itemId: string): void {
  pendientesItemsPorProyecto.get(proyectoId)?.delete(itemId)
}

export function obtenerItemsPendientes(proyectoId: string): ItemVariante[] {
  const mapa = pendientesItemsPorProyecto.get(proyectoId)
  return mapa ? [...mapa.values()] : []
}

/** Función pura: overlay de filas optimistas en vuelo sobre el snapshot del servidor. Si el
 * servidor ya trae la fila (por id), gana el servidor. Si no, se conserva la optimista. */
export function fusionarPendientes(snapshot: CotizadorSnapshot, pendientes: ItemVariante[]): CotizadorSnapshot {
  if (pendientes.length === 0) return snapshot
  const idsServidor = new Set(snapshot.items.map((i) => i.id))
  const faltantes = pendientes.filter((it) => !idsServidor.has(it.id))
  if (faltantes.length === 0) return snapshot
  return { ...snapshot, items: [...snapshot.items, ...faltantes] }
}
