'use server'
// Server Actions del cluster núcleo: proyectos, clientes, espacios, items, artefactos,
// catálogo, parámetros, contratos. Porta 1:1 la lógica de lib/data/mock-store.ts (73/73
// tests) a Drizzle/Postgres real. Ver plan_f10_migracion.md §3.1d.
import { eq, and, ne, inArray, or } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { num } from './mappers'
import type {
  Proyecto, EstadoProyecto, Cliente, EspacioVariante, ItemVariante, EspacioArtefacto,
  ProductoCatalogo, Parametro, Contrato, ProyectosEstadosHistorial,
} from '../contracts'

export async function actualizarEstadoProyectoAction(id: string, estado: string): Promise<Proyecto | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, id))
    if (!actual) return null
    const estadoAnterior = actual.estado

    const [paramTransiciones] = await tx.select().from(s.parametros).where(eq(s.parametros.clave, 'transiciones_proyecto'))
    let transiciones: Record<string, string[]> = {}
    if (paramTransiciones?.valorTexto) {
      try { transiciones = JSON.parse(paramTransiciones.valorTexto) } catch { /* fall through */ }
    }
    const estadosValidos = transiciones[estadoAnterior]
    if (!estadosValidos || !estadosValidos.includes(estado)) return null

    const [actualizado] = await tx.update(s.proyectos)
      .set({ estado: estado as EstadoProyecto, updatedAt: new Date().toISOString() })
      .where(eq(s.proyectos.id, id))
      .returning()
    await tx.insert(s.proyectosEstadosHistorial).values({
      proyectoId: id, estadoAnterior: estadoAnterior as EstadoProyecto, estadoNuevo: estado as EstadoProyecto, cambiadoPor: null, razon: null,
    })
    return actualizado as unknown as Proyecto
  })
}

export async function eliminarProyectoAction(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [proyecto] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, id))
    if (!proyecto) return false
    // Solo se eliminan cotizaciones en estado lead (activa). Nunca las que ya
    // están en contrato ni las que tengan compromisos financieros.
    if (proyecto.estado !== 'activa') return false
    const contratosProyecto = await tx.select().from(s.contratos).where(eq(s.contratos.proyectoId, id))
    if (contratosProyecto.length > 0) return false
    const movimientos = await tx.select().from(s.movimientosFinancieros).where(eq(s.movimientosFinancieros.proyectoId, id))
    if (movimientos.length > 0) return false
    const obligaciones = await tx.select().from(s.obligacionesPendientes).where(eq(s.obligacionesPendientes.proyectoId, id))
    if (obligaciones.length > 0) return false
    const ocs = await tx.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.proyectoId, id))
    if (ocs.length > 0) return false

    // ── Cascada de borrado (orden dependencias primero) ──
    // Contratos e hitos (defensivo: el guard ya bloquea cuando existe contrato).
    const contratoIds = contratosProyecto.map(c => c.id)
    if (contratoIds.length > 0) {
      await tx.delete(s.hitosPago).where(inArray(s.hitosPago.contratoId, contratoIds))
      await tx.delete(s.contratos).where(inArray(s.contratos.id, contratoIds))
    }

    // Garantía (hijos primero).
    await tx.delete(s.citasGarantia).where(eq(s.citasGarantia.proyectoId, id))
    await tx.delete(s.casosGarantia).where(eq(s.casosGarantia.proyectoId, id))

    // Producción.
    const moduloIds = (await tx.select({ id: s.modulos.id }).from(s.modulos).where(eq(s.modulos.proyectoId, id))).map(r => r.id)
    if (moduloIds.length > 0) {
      await tx.delete(s.reprocesos).where(inArray(s.reprocesos.moduloId, moduloIds))
      await tx.delete(s.modulosArtefactos).where(inArray(s.modulosArtefactos.moduloId, moduloIds))
      await tx.delete(s.modulos).where(inArray(s.modulos.id, moduloIds))
    }
    await tx.delete(s.reprocesos).where(eq(s.reprocesos.proyectoId, id))

    const ordenIds = (await tx.select({ id: s.ordenesTrabajo.id }).from(s.ordenesTrabajo).where(eq(s.ordenesTrabajo.proyectoId, id))).map(r => r.id)
    if (ordenIds.length > 0) {
      await tx.delete(s.tareasProduccion).where(inArray(s.tareasProduccion.ordenId, ordenIds))
      await tx.delete(s.ordenesTrabajo).where(inArray(s.ordenesTrabajo.id, ordenIds))
    }
    await tx.delete(s.citacionesCalidad).where(eq(s.citacionesCalidad.proyectoId, id))
    await tx.delete(s.instalaciones).where(eq(s.instalaciones.proyectoId, id))
    await tx.delete(s.actasEntrega).where(eq(s.actasEntrega.proyectoId, id))
    await tx.delete(s.estimaciones).where(eq(s.estimaciones.proyectoId, id))

    // Desarrollo / schema / control (hijos primero).
    const schemaIds = (await tx.select({ id: s.schemasProyecto.id }).from(s.schemasProyecto).where(eq(s.schemasProyecto.proyectoId, id))).map(r => r.id)
    if (schemaIds.length > 0) {
      await tx.delete(s.bomMaterial).where(inArray(s.bomMaterial.schemaId, schemaIds))
      await tx.delete(s.schemasProyecto).where(inArray(s.schemasProyecto.id, schemaIds))
    }
    await tx.delete(s.verificaciones).where(eq(s.verificaciones.proyectoId, id))
    await tx.delete(s.retomas).where(eq(s.retomas.proyectoId, id))
    await tx.delete(s.cambiosContrato).where(eq(s.cambiosContrato.proyectoId, id))

    // Cronograma y control (hijos primero).
    const cronogramaIds = (await tx.select({ id: s.cronogramas.id }).from(s.cronogramas).where(eq(s.cronogramas.proyectoId, id))).map(r => r.id)
    if (cronogramaIds.length > 0) {
      await tx.delete(s.cronogramaEtapas).where(inArray(s.cronogramaEtapas.cronogramaId, cronogramaIds))
      await tx.delete(s.cronogramas).where(inArray(s.cronogramas.id, cronogramaIds))
    }
    await tx.delete(s.desfasesCronograma).where(eq(s.desfasesCronograma.proyectoId, id))
    await tx.delete(s.checksProduccion).where(eq(s.checksProduccion.proyectoId, id))
    await tx.delete(s.novedadesCriticas).where(eq(s.novedadesCriticas.proyectoId, id))
    await tx.delete(s.comunicacionesProgreso).where(eq(s.comunicacionesProgreso.proyectoId, id))

    // Contenido y referencias.
    await tx.delete(s.documentosProyecto).where(eq(s.documentosProyecto.proyectoId, id))
    await tx.delete(s.portafolio).where(eq(s.portafolio.proyectoId, id))
    await tx.delete(s.testimonios).where(eq(s.testimonios.proyectoId, id))
    await tx.update(s.bitacoraArticulos).set({ proyectoRelacionadoId: null }).where(eq(s.bitacoraArticulos.proyectoRelacionadoId, id))
    await tx.update(s.pedidosWeb).set({ proyectoId: null }).where(eq(s.pedidosWeb.proyectoId, id))
    await tx.update(s.productosCatalogo).set({ proyectoOrigenId: null }).where(eq(s.productosCatalogo.proyectoOrigenId, id))

    // Espacios (hijos primero — el portafolio ya se borró arriba).
    const espacioIds = (await tx.select({ id: s.espacioVariantes.id }).from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, id))).map(r => r.id)
    if (espacioIds.length > 0) {
      await tx.delete(s.itemsVariante).where(inArray(s.itemsVariante.varianteId, espacioIds))
      await tx.delete(s.espaciosArtefactos).where(inArray(s.espaciosArtefactos.espacioVarianteId, espacioIds))
      await tx.delete(s.espacioVariantes).where(inArray(s.espacioVariantes.id, espacioIds))
    }

    // Historial, auditoría y lineage.
    await tx.delete(s.proyectosEstadosHistorial).where(eq(s.proyectosEstadosHistorial.proyectoId, id))
    await tx.delete(s.eventos).where(or(
      eq(s.eventos.proyectoId, id),
      and(eq(s.eventos.entidad, 'proyecto'), eq(s.eventos.entidadId, id)),
    ))
    await tx.delete(s.procedencia).where(or(
      and(eq(s.procedencia.hijoEntidad, 'proyecto'), eq(s.procedencia.hijoId, id)),
      and(eq(s.procedencia.padreEntidad, 'proyecto'), eq(s.procedencia.padreId, id)),
    ))

    await tx.delete(s.proyectos).where(eq(s.proyectos.id, id))
    return true
  })
}

export async function actualizarParametrosFinancierosAction(
  id: string,
  partial: Partial<Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios'>>
): Promise<Proyecto | null> {
  const [actualizado] = await db.update(s.proyectos).set({ ...partial, updatedAt: new Date().toISOString() }).where(eq(s.proyectos.id, id)).returning()
  return (actualizado as unknown as Proyecto) ?? null
}

export async function actualizarVerificadorAction(id: string, verificadorId: string): Promise<Proyecto | null> {
  const [actualizado] = await db.update(s.proyectos)
    .set({ verificadorId, comercialVendedorId: verificadorId, updatedAt: new Date().toISOString() })
    .where(eq(s.proyectos.id, id)).returning()
  return (actualizado as unknown as Proyecto) ?? null
}

// t-143: edición flexible de datos maestros de la cotización. Actualiza solo los
// campos pasados (partial) y toca updatedAt. Los campos con orden de negocio
// (estado vía kanban, IVA/garantía vía actualizarParametrosFinancieros) quedan fuera.
export async function actualizarProyectoAction(
  id: string,
  partial: Partial<Pick<Proyecto, 'nombreProyecto' | 'clienteId' | 'tipoProyecto' | 'direccionObra' | 'descripcionSemantica' | 'diasEntregaEstimados' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario'>>
): Promise<Proyecto | null> {
  const [actualizado] = await db.update(s.proyectos)
    .set({ ...partial, tipoProyecto: partial.tipoProyecto as 'personalizado' | 'producto_fijo' | undefined, updatedAt: new Date().toISOString() })
    .where(eq(s.proyectos.id, id)).returning()
  return (actualizado as unknown as Proyecto) ?? null
}

export async function crearProyectoAction(data: Partial<Proyecto> & { nombreProyecto: string }): Promise<Proyecto> {
  // id opcional generado en el cliente (crypto.randomUUID()) para creación optimista (piloto
  // 2026-08-20, plan "optimistic create"): si no viene, Postgres sigue usando defaultRandom()
  // igual que antes. onConflictDoNothing hace que un reintento con el mismo id (retry de red,
  // o un doble-submit que se coló pese a usePendingGuard) sea idempotente en vez de duplicar.
  const [nuevo] = await db.insert(s.proyectos).values({
    id: data.id,
    nombreProyecto: data.nombreProyecto,
    estado: (data.estado as EstadoProyecto) ?? 'activa',
    tipoProyecto: (data.tipoProyecto as 'personalizado' | 'producto_fijo') ?? 'personalizado',
    direccionObra: data.direccionObra ?? null,
    costosOperativos: data.costosOperativos ?? '0',
    imprevistosInstalacion: data.imprevistosInstalacion ?? '0',
    descuentoComercial: data.descuentoComercial ?? '0',
    ajusteArbitrario: data.ajusteArbitrario ?? '0',
    aplicaIva: data.aplicaIva ?? false,
    porcentajeIva: data.porcentajeIva ?? '19',
    garantiaAnios: data.garantiaAnios ?? 2,
    diasEntregaEstimados: data.diasEntregaEstimados ?? null,
    descripcionSemantica: data.descripcionSemantica ?? null,
    clienteId: data.clienteId ?? null,
    comercialId: data.comercialId ?? null,
    verificadorId: data.verificadorId ?? null,
    fechaEntradaDesarrollo: data.fechaEntradaDesarrollo ?? null,
    comercialVendedorId: data.comercialVendedorId ?? null,
  }).onConflictDoNothing({ target: s.proyectos.id }).returning()

  if (!nuevo) {
    if (!data.id) throw new Error('crearProyectoAction: conflicto de id sin id de entrada')
    const [existente] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, data.id))
    if (existente) return existente as unknown as Proyecto
    throw new Error('crearProyectoAction: conflicto de id sin fila existente')
  }
  return nuevo as unknown as Proyecto
}

export async function historialEstadoAction(proyectoId: string): Promise<ProyectosEstadosHistorial[]> {
  const rows = await db.select().from(s.proyectosEstadosHistorial).where(eq(s.proyectosEstadosHistorial.proyectoId, proyectoId))
  return rows as unknown as ProyectosEstadosHistorial[]
}

export async function crearClienteAction(data: Partial<Cliente> & { nombre: string }): Promise<Cliente> {
  const [nuevo] = await db.insert(s.clientes).values({
    nombre: data.nombre,
    documento: data.documento ?? null,
    telefono: data.telefono ?? null,
    email: data.email ?? null,
    domicilio: data.domicilio ?? null,
  }).returning()
  return nuevo as unknown as Cliente
}

// t-143: edición de datos maestros del cliente. Actualiza solo los campos pasados
// (partial); no se puede cambiar el id.
export async function actualizarClienteAction(
  id: string,
  partial: Partial<Omit<Cliente, 'id'>>
): Promise<Cliente | null> {
  const [actualizado] = await db.update(s.clientes)
    .set({ ...partial, updatedAt: new Date().toISOString() })
    .where(eq(s.clientes.id, id)).returning()
  return (actualizado as unknown as Cliente) ?? null
}

export async function crearEspacioAction(data: Partial<EspacioVariante> & { proyectoId: string; nombreEspacio: string }): Promise<EspacioVariante> {
  return db.transaction(async (tx) => {
    let orden = data.orden
    if (orden === undefined) {
      const existentes = await tx.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, data.proyectoId))
      orden = existentes.length
    }
    const [nuevo] = await tx.insert(s.espacioVariantes).values({
      proyectoId: data.proyectoId,
      nombreEspacio: data.nombreEspacio,
      nombreVariante: data.nombreVariante ?? 'Inicial',
      tipoEspacio: data.tipoEspacio ?? null,
      descripcion: data.descripcion ?? null,
      activa: data.activa ?? true,
      visibleEnPropuestaPublica: data.visibleEnPropuestaPublica ?? true,
      orden,
      jornadasDesarrolloTecnico: data.jornadasDesarrolloTecnico ?? '0',
      jornadasEnsamblajeTaller: data.jornadasEnsamblajeTaller ?? '0',
      jornadasInstalacionObra: data.jornadasInstalacionObra ?? '0',
      colores: data.colores ?? [],
      fotosEspacio: data.fotosEspacio ?? [],
      fotosDisenio: data.fotosDisenio ?? [],
      fotosReferencia: data.fotosReferencia ?? [],
    }).returning()
    return nuevo as unknown as EspacioVariante
  })
}

export async function actualizarJornadasAction(
  id: string,
  jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string }
): Promise<EspacioVariante | null> {
  const [actualizado] = await db.update(s.espacioVariantes).set(jornadas).where(eq(s.espacioVariantes.id, id)).returning()
  return (actualizado as unknown as EspacioVariante) ?? null
}

export async function actualizarEspacioAction(
  id: string,
  partial: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>>
): Promise<EspacioVariante | null> {
  const [actualizado] = await db.update(s.espacioVariantes).set(partial).where(eq(s.espacioVariantes.id, id)).returning()
  return (actualizado as unknown as EspacioVariante) ?? null
}

export async function duplicarEspacioAction(id: string, opciones: { vacio: boolean; nuevoNombreEspacio?: string }): Promise<EspacioVariante | null> {
  return db.transaction(async (tx) => {
    const [origen] = await tx.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.id, id))
    if (!origen) return null

    const esGrupoNuevo = Boolean(opciones.nuevoNombreEspacio)
    const nombreEspacio = opciones.nuevoNombreEspacio ?? origen.nombreEspacio
    const nombreVariante = esGrupoNuevo ? origen.nombreVariante : `${origen.nombreVariante} (copia)`
    const hermanos = await tx.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, origen.proyectoId))
    const nuevoOrden = hermanos.length

    const base = opciones.vacio
      ? {
          proyectoId: origen.proyectoId, nombreEspacio, nombreVariante, tipoEspacio: origen.tipoEspacio, descripcion: null,
          activa: esGrupoNuevo, visibleEnPropuestaPublica: true, orden: nuevoOrden,
          jornadasDesarrolloTecnico: '0', jornadasEnsamblajeTaller: '0', jornadasInstalacionObra: '0',
          colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [],
        }
      : {
          ...origen, id: undefined, nombreEspacio, nombreVariante, activa: esGrupoNuevo, orden: nuevoOrden,
        }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _omit, ...values } = base as typeof base & { id?: string }
    const [nuevo] = await tx.insert(s.espacioVariantes).values(values).returning()

    if (!opciones.vacio) {
      const itemsOrigen = await tx.select().from(s.itemsVariante).where(eq(s.itemsVariante.varianteId, id))
      if (itemsOrigen.length > 0) {
        await tx.insert(s.itemsVariante).values(itemsOrigen.map(i => ({ ...i, id: undefined, varianteId: nuevo.id })))
      }
      const artefactosOrigen = await tx.select().from(s.espaciosArtefactos).where(eq(s.espaciosArtefactos.espacioVarianteId, id))
      if (artefactosOrigen.length > 0) {
        await tx.insert(s.espaciosArtefactos).values(artefactosOrigen.map(a => ({ ...a, id: undefined, espacioVarianteId: nuevo.id })))
      }
    }

    return nuevo as unknown as EspacioVariante
  })
}

export async function marcarActivaEspacioAction(id: string): Promise<EspacioVariante | null> {
  return db.transaction(async (tx) => {
    const [objetivo] = await tx.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.id, id))
    if (!objetivo) return null
    const hermanos = await tx.select().from(s.espacioVariantes).where(and(
      eq(s.espacioVariantes.proyectoId, objetivo.proyectoId),
      eq(s.espacioVariantes.nombreEspacio, objetivo.nombreEspacio),
    ))
    for (const h of hermanos) {
      const deberiaEstarActiva = h.id === id
      if (h.activa !== deberiaEstarActiva) {
        await tx.update(s.espacioVariantes).set({ activa: deberiaEstarActiva }).where(eq(s.espacioVariantes.id, h.id))
      }
    }
    const [actualizado] = await tx.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.id, id))
    return (actualizado as unknown as EspacioVariante) ?? null
  })
}

export async function crearItemAction(data: Partial<ItemVariante> & { varianteId: string; catalogoId: string | null; cantidad: string }): Promise<ItemVariante> {
  const precioUnitario = data.precioUnitario ?? '0'
  const [nuevo] = await db.insert(s.itemsVariante).values({
    varianteId: data.varianteId,
    catalogoId: data.catalogoId,
    nombrePersonalizado: data.nombrePersonalizado ?? null,
    cantidad: data.cantidad,
    precioUnitario,
    totalLinea: String(num(data.cantidad) * num(precioUnitario)),
    anulado: data.anulado ?? false,
  }).returning()
  return nuevo as unknown as ItemVariante
}

export async function actualizarItemAction(
  id: string,
  partial: Partial<Pick<ItemVariante, 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>>
): Promise<ItemVariante | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.itemsVariante).where(eq(s.itemsVariante.id, id))
    if (!actual) return null
    const cantidad = partial.cantidad ?? actual.cantidad
    const precioUnitario = partial.precioUnitario ?? actual.precioUnitario
    const [actualizado] = await tx.update(s.itemsVariante).set({
      ...partial,
      totalLinea: String(num(cantidad) * num(precioUnitario)),
      updatedAt: new Date().toISOString(),
    }).where(eq(s.itemsVariante.id, id)).returning()
    return actualizado as unknown as ItemVariante
  })
}

export async function eliminarItemAction(id: string): Promise<boolean> {
  const [actualizado] = await db.update(s.itemsVariante).set({ anulado: true, updatedAt: new Date().toISOString() }).where(eq(s.itemsVariante.id, id)).returning()
  return Boolean(actualizado)
}

/**
 * Error de negocio para eliminaciones de variantes rechazadas por la Guardia de
 * Integridad (ZN-003): no se borran variantes que ya entraron a producción
 * (tienen BOM en `bom_material` o módulos propios en `modulos`).
 */
export class VarianteNoEliminableError extends Error {
  constructor(motivo: string) {
    super(motivo)
    this.name = 'VarianteNoEliminableError'
  }
}

/**
 * ZN-003 · P3: elimina una variante con Clean Delete protegido por Guardia de
 * Integridad. En una sola transacción:
 *  1. Verifica si algún ítem de la variante tiene BOM en `bom_material`
 *     (`itemVarianteId` apuntando a esos ítems) o si la variante tiene módulos
 *     propios en `modulos` (`espacioVarianteId`). Si existe alguna fila, LANZA
 *     `VarianteNoEliminableError` (variante ya entró a producción) y la
 *     transacción no toca nada.
 *  2. Si la guardia pasa (cotizaciones comerciales / variantes de comparación),
 *     hace cascada transaccional: borra `espacios_artefactos`, luego
 *     `items_variante` de esa variante, y por último `espacio_variantes`.
 * @returns true si la fila de `espacio_variantes` existía y fue eliminada.
 */
export async function eliminarEspacioAction(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const items = await tx.select({ id: s.itemsVariante.id }).from(s.itemsVariante).where(eq(s.itemsVariante.varianteId, id))

    if (items.length > 0) {
      const idsItems = items.map((it) => it.id)
      const bomVinculado = await tx.select({ id: s.bomMaterial.id }).from(s.bomMaterial).where(inArray(s.bomMaterial.itemVarianteId, idsItems))
      if (bomVinculado.length > 0) {
        throw new VarianteNoEliminableError(
          'Esta variante ya tiene lista de materiales (BOM) y no puede eliminarse: cuenta en producción.',
        )
      }
    }

    const modulosVinculados = await tx.select({ id: s.modulos.id }).from(s.modulos).where(eq(s.modulos.espacioVarianteId, id))
    if (modulosVinculados.length > 0) {
      throw new VarianteNoEliminableError(
        'Esta variante tiene módulos asociados y no puede eliminarse: cuenta en producción.',
      )
    }

    await tx.delete(s.espaciosArtefactos).where(eq(s.espaciosArtefactos.espacioVarianteId, id))
    await tx.delete(s.itemsVariante).where(eq(s.itemsVariante.varianteId, id))
    const [eliminado] = await tx.delete(s.espacioVariantes).where(eq(s.espacioVariantes.id, id)).returning({ id: s.espacioVariantes.id })
    return Boolean(eliminado)
  })
}

export async function crearArtefactoAction(data: Partial<EspacioArtefacto> & { espacioVarianteId: string; categoria: EspacioArtefacto['categoria'] }): Promise<EspacioArtefacto> {
  const [nuevo] = await db.insert(s.espaciosArtefactos).values({
    espacioVarianteId: data.espacioVarianteId,
    categoria: data.categoria,
    dimensionesMm: data.dimensionesMm ?? null,
    tipoSpecifique: data.tipoSpecifique ?? null,
    ubicacion: data.ubicacion ?? null,
    fotoUrl: data.fotoUrl ?? null,
    requiereVerificacion: data.requiereVerificacion ?? true,
    validadoPor: data.validadoPor ?? null,
    validadoEn: data.validadoEn ?? null,
  }).returning()
  return nuevo as unknown as EspacioArtefacto
}

export async function actualizarArtefactoAction(
  id: string,
  partial: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>>
): Promise<EspacioArtefacto | null> {
  const [actualizado] = await db.update(s.espaciosArtefactos).set({ ...partial, updatedAt: new Date().toISOString() }).where(eq(s.espaciosArtefactos.id, id)).returning()
  return (actualizado as unknown as EspacioArtefacto) ?? null
}

export async function crearProductoCatalogoAction(data: Partial<ProductoCatalogo> & { sku: string; descripcion: string; unidadMedida: string }): Promise<ProductoCatalogo | null> {
  return db.transaction(async (tx) => {
    const existente = await tx.select().from(s.productosCatalogo).where(eq(s.productosCatalogo.sku, data.sku))
    if (existente.length > 0) return null
    const precioDirecto = data.precioDirecto ?? null
    const precioPublico = data.precioPublico ?? null
    if (precioDirecto !== null && num(precioDirecto) < 0) return null
    if (precioPublico !== null && num(precioPublico) < 0) return null
    if (precioDirecto !== null && precioPublico !== null && num(precioDirecto) > num(precioPublico)) return null
    const stockActual = data.stockActual ?? 0
    if (stockActual < 0) return null
    const publicadoWeb = data.publicadoWeb ?? false
    const imagenUrl = data.imagenUrl ?? null
    const galeriaImagenesUrl = data.galeriaImagenesUrl ?? []
    // R5 (t-139): publicar exige precioPublico + (imagenUrl OR galería no vacía).
    if (publicadoWeb && (!precioPublico || !(imagenUrl || galeriaImagenesUrl.length > 0))) return null
    const [nuevo] = await tx.insert(s.productosCatalogo).values({
      sku: data.sku, descripcion: data.descripcion, tipo: data.tipo ?? null, unidadMedida: data.unidadMedida,
      precioDirecto, precioPublico, stockActual, proveedorId: data.proveedorId ?? null, imagenUrl, galeriaImagenesUrl,
      modelo3dUrl: data.modelo3dUrl ?? null, categoriaComercial: data.categoriaComercial ?? null,
      publicadoWeb, proyectoOrigenId: data.proyectoOrigenId ?? null, anulado: false,
    }).returning()
    return nuevo as unknown as ProductoCatalogo
  })
}

export async function actualizarProductoCatalogoAction(id: string, partial: Partial<Omit<ProductoCatalogo, 'id' | 'createdAt'>>): Promise<ProductoCatalogo | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.productosCatalogo).where(eq(s.productosCatalogo.id, id))
    if (!actual) return null
    const actualizado = { ...actual, ...partial }
    if (actualizado.sku) {
      const conflicto = await tx.select().from(s.productosCatalogo).where(and(eq(s.productosCatalogo.sku, actualizado.sku), ne(s.productosCatalogo.id, id)))
      if (conflicto.length > 0) return null
    }
    if (actualizado.precioDirecto !== null && num(actualizado.precioDirecto) < 0) return null
    if (actualizado.precioPublico !== null && num(actualizado.precioPublico) < 0) return null
    if (actualizado.precioDirecto !== null && actualizado.precioPublico !== null && num(actualizado.precioDirecto) > num(actualizado.precioPublico)) return null
    if ((actualizado.stockActual ?? 0) < 0) return null
    const galeriaLen = Array.isArray(actualizado.galeriaImagenesUrl) ? actualizado.galeriaImagenesUrl.length : 0
    if (actualizado.publicadoWeb && (!actualizado.precioPublico || !(actualizado.imagenUrl || galeriaLen > 0))) return null
    const [row] = await tx.update(s.productosCatalogo).set({ ...partial, updatedAt: new Date().toISOString() }).where(eq(s.productosCatalogo.id, id)).returning()
    return row as unknown as ProductoCatalogo
  })
}

export async function eliminarProductoCatalogoAction(id: string): Promise<boolean> {
  const [actualizado] = await db.update(s.productosCatalogo).set({ anulado: true, updatedAt: new Date().toISOString() }).where(eq(s.productosCatalogo.id, id)).returning()
  return Boolean(actualizado)
}

export async function actualizarParametroAction(clave: string, datos: Partial<Parametro>): Promise<void> {
  const [actual] = await db.select().from(s.parametros).where(eq(s.parametros.clave, clave))
  if (actual) {
    await db.update(s.parametros).set({ ...datos, updatedAt: new Date().toISOString() }).where(eq(s.parametros.clave, clave))
  } else {
    await db.insert(s.parametros).values({
      clave, grupo: datos.grupo ?? 'finanzas', tipo: datos.tipo ?? 'texto',
      valorNumeric: datos.valorNumeric ?? null, valorTexto: datos.valorTexto ?? null, valorBooleano: datos.valorBooleano ?? null,
      unidad: datos.unidad ?? null, descripcion: datos.descripcion ?? `Parámetro ${clave} (generado automáticamente)`,
    })
  }
}

export async function crearContratoAction(data: { proyectoId: string; codigoContrato: string; valorTotal: string; hitos: { tipo: 'percentage' | 'fixed'; monto: string; razon: string }[] }): Promise<Contrato> {
  return db.transaction(async (tx) => {
    const [nuevo] = await tx.insert(s.contratos).values({
      proyectoId: data.proyectoId, codigoContrato: data.codigoContrato, valorTotal: data.valorTotal,
    }).returning()
    if (data.hitos.length > 0) {
      await tx.insert(s.hitosPago).values(data.hitos.map((h, i) => ({
        contratoId: nuevo.id, orden: i, tipo: h.tipo, montoOPorcentaje: h.monto, razon: h.razon,
      })))
    }
    return nuevo as unknown as Contrato
  })
}
