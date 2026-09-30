// Helpers puros del optimistic merge/rollback del cotizador (DEC-5, plan_cotizador_tanstack_query.md).
// Sin React, sin TanStack, sin DB: funciones planas sobre `CotizadorSnapshot` testables con tsx.
// Cada mutación optimista aplica su transformación acá y el rollback restaura el snapshot previo
// completo (onError -> setQueryData(previous)). Las reglas replican el contrato del mock/server:
// totalLinea siempre se re-deriva de cantidad x precio; eliminar ítem es soft-delete (anulado).
import type { CotizadorSnapshot } from './types'
import type { Cliente, Contrato, HitoPagoInput, ItemVariante, EspacioVariante, EspacioArtefacto, Proyecto } from '../contracts'

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
  /** Comentario libre por ítem (requerimiento Supervisor 2026-09-10), visible en la propuesta pública. */
  comentario?: string | null
  /** t-157 (2026-09-10): grupo/subgrupo de `grupos_item` al que pertenece este ítem. */
  grupoItemId?: string | null
  /** Foto propia del ítem (2026-09-18), R2 `cotizador/items/`. Nullable. */
  fotoUrl?: string | null
  /** Ficha técnica por ítem (2026-09-22): universales. */
  marca?: string | null
  referencia?: string | null
  color?: string | null
  dimensiones?: string | null
  acabado?: string | null
  espesor?: string | null
  /** Claves personalizadas por familia (jsonb [{clave, valor}]). */
  camposPersonalizados?: { clave: string; valor: string }[]
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
    comentario: input.comentario ?? null,
    grupoItemId: input.grupoItemId ?? null,
    fotoUrl: input.fotoUrl ?? null,
    marca: input.marca ?? null,
    referencia: input.referencia ?? null,
    color: input.color ?? null,
    dimensiones: input.dimensiones ?? null,
    acabado: input.acabado ?? null,
    espesor: input.espesor ?? null,
    camposPersonalizados: input.camposPersonalizados ?? [],
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
  patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial' | 'comentario' | 'grupoItemId' | 'fotoUrl' | 'marca' | 'referencia' | 'color' | 'dimensiones' | 'acabado' | 'espesor' | 'camposPersonalizados'>>,
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

/** Deshace el cambio de UN ítem, aplicado sobre el snapshot ACTUAL (no sobre uno viejo) —
 * sincroniza la presencia/valores de `itemId` en `actual` con lo que tenía en `previo`, sin
 * tocar ningún otro ítem. Sirve para revertir crear (no estaba en `previo` -> se quita),
 * actualizar y eliminar (estaba en `previo` -> se restaura tal cual) con la misma función,
 * porque las tres mutaciones tocan un solo id (t-170, fix de la condición de carrera de
 * `factory.ts` cuando hay mutaciones concurrentes sobre el mismo queryKey). */
export function revertirItem(actual: CotizadorSnapshot, itemId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  const anterior = previo.items.find((i) => i.id === itemId)
  const existeEnActual = actual.items.some((i) => i.id === itemId)
  if (!anterior) {
    if (!existeEnActual) return actual
    return { ...actual, items: actual.items.filter((i) => i.id !== itemId) }
  }
  return {
    ...actual,
    items: existeEnActual
      ? actual.items.map((i) => (i.id === itemId ? anterior : i))
      : [...actual.items, anterior],
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

/** Mismo principio que `revertirItem`, para espacios (t-170). */
export function revertirEspacio(actual: CotizadorSnapshot, espacioId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  const anterior = previo.espacios.find((e) => e.id === espacioId)
  const existeEnActual = actual.espacios.some((e) => e.id === espacioId)
  if (!anterior) {
    if (!existeEnActual) return actual
    return { ...actual, espacios: actual.espacios.filter((e) => e.id !== espacioId) }
  }
  return {
    ...actual,
    espacios: existeEnActual
      ? actual.espacios.map((e) => (e.id === espacioId ? anterior : e))
      : [...actual.espacios, anterior],
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

/** El snapshot es escopado a UN proyecto, así que revertir es restaurar el `proyecto` entero
 * de `previo` (t-170) — no hace falta lógica de lista como en items/espacios/artefactos. */
export function revertirProyecto(actual: CotizadorSnapshot, proyectoId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  if (!previo.proyecto || previo.proyecto.id !== proyectoId) return actual
  return { ...actual, proyecto: previo.proyecto }
}

export function upsertProyecto(snapshot: CotizadorSnapshot, proyecto: Proyecto): CotizadorSnapshot {
  if (snapshot.proyecto && snapshot.proyecto.id === proyecto.id) return { ...snapshot, proyecto }
  return snapshot
}

// --- Clientes / contrato (t-166) ---

/** Actualización optimista del maestro de cliente. `clientes` viene como lista completa en el
 *  snapshot, así que el parche se aplica sobre la fila del id y el resto queda intacto. */
export function actualizarCliente(
  snapshot: CotizadorSnapshot,
  clienteId: string,
  patch: Partial<Pick<Cliente, 'nombre' | 'documento' | 'telefono' | 'email' | 'domicilio'>>,
): CotizadorSnapshot {
  const existe = snapshot.clientes.some((c) => c.id === clienteId)
  if (!existe) return snapshot
  return {
    ...snapshot,
    clientes: snapshot.clientes.map((c) =>
      c.id === clienteId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    ),
  }
}

/** Mismo principio que `revertirItem`, para el maestro de cliente (t-170). */
export function revertirCliente(actual: CotizadorSnapshot, clienteId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  const anterior = previo.clientes.find((c) => c.id === clienteId)
  if (!anterior) return actual
  const existeEnActual = actual.clientes.some((c) => c.id === clienteId)
  return {
    ...actual,
    clientes: existeEnActual
      ? actual.clientes.map((c) => (c.id === clienteId ? anterior : c))
      : [...actual.clientes, anterior],
  }
}

export function upsertCliente(snapshot: CotizadorSnapshot, cliente: Cliente): CotizadorSnapshot {
  const idx = snapshot.clientes.findIndex((c) => c.id === cliente.id)
  const clientes = idx === -1
    ? [...snapshot.clientes, cliente]
    : snapshot.clientes.map((c) => (c.id === cliente.id ? cliente : c))
  return { ...snapshot, clientes }
}

/** Reemplaza el contrato del snapshot por uno recién creado o editado. El snapshot es
 *  escopado a UN proyecto, así que siempre es uno solo. */
export function upsertContrato(snapshot: CotizadorSnapshot, contrato: Contrato): CotizadorSnapshot {
  return { ...snapshot, contrato }
}

/** Aplica el parche del encabezado y, si viene, REGENERA los hitos con `orden` en base 1
 *  (mismo criterio que `actualizarContratoAction` y que el mock-store — ver t-166). Los ids
 *  son sintéticos: los reales llegan con el `reconciliar` de la respuesta del servidor. */
export function actualizarContrato(
  snapshot: CotizadorSnapshot,
  contratoId: string,
  patch: Partial<Contrato>,
  hitos?: HitoPagoInput[],
): CotizadorSnapshot {
  if (!snapshot.contrato || snapshot.contrato.id !== contratoId) return snapshot
  const contrato = { ...snapshot.contrato, ...patch, updatedAt: new Date().toISOString() }
  if (hitos === undefined) return { ...snapshot, contrato }
  return {
    ...snapshot,
    contrato,
    hitos: hitos.map((h, i) => ({
      id: `tmp-${contratoId}-${i}`,
      contratoId,
      orden: i + 1,
      tipo: h.tipo,
      montoOPorcentaje: h.monto,
      razon: h.razon,
    })),
  }
}

/** El snapshot tiene un solo contrato activo: revertir restaura `contrato` e `hitos` completos
 * de `previo` (t-170) — `actualizarContrato` regenera ambos juntos, así que se deshacen juntos. */
export function revertirContrato(actual: CotizadorSnapshot, contratoId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  if (!previo.contrato || previo.contrato.id !== contratoId) return actual
  return { ...actual, contrato: previo.contrato, hitos: previo.hitos }
}

// --- Artefactos ---

export interface InputArtefactoOptimista {
  id: string
  espacioVarianteId: string
  categoria: EspacioArtefacto['categoria']
  dimensionesMm?: string | null
  tipoSpecifique?: string | null
  ubicacion?: string | null
  descripcion?: string | null
  fotoUrls?: string[]
  archivosUrls?: string[]
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
    descripcion: input.descripcion ?? null,
    fotoUrls: input.fotoUrls ?? [],
    archivosUrls: input.archivosUrls ?? [],
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
  patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'descripcion' | 'fotoUrls' | 'archivosUrls'>>,
): CotizadorSnapshot {
  if (!snapshot.artefactos.some((a) => a.id === artefactoId)) return snapshot
  return {
    ...snapshot,
    artefactos: snapshot.artefactos.map((a) =>
      a.id === artefactoId ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
    ),
  }
}

/** Mismo principio que `revertirItem`, para artefactos (t-170). */
export function revertirArtefacto(actual: CotizadorSnapshot, artefactoId: string, previo: CotizadorSnapshot): CotizadorSnapshot {
  const anterior = previo.artefactos.find((a) => a.id === artefactoId)
  const existeEnActual = actual.artefactos.some((a) => a.id === artefactoId)
  if (!anterior) {
    if (!existeEnActual) return actual
    return { ...actual, artefactos: actual.artefactos.filter((a) => a.id !== artefactoId) }
  }
  return {
    ...actual,
    artefactos: existeEnActual
      ? actual.artefactos.map((a) => (a.id === artefactoId ? anterior : a))
      : [...actual.artefactos, anterior],
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
