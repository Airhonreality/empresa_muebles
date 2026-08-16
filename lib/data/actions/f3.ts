'use server'
// Server Actions del cluster F3: cronograma/gates, desarrollo/schema, equipo, producción mínima.
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq, and, desc } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { P18, P33, derivarDesenlace, derivarReduccionComision } from '@/lib/modules/f3/gates'
import { puedeEmitirVeredictoCalidad, transicionModuloValida } from '@/lib/modules/f4f5f6/gates'
import type {
  Cronograma, CronogramaEtapa, LineaCronograma, EtapaCronograma, DesfaseCronograma, CausaDesfase,
  CheckProduccion, DesenlaceCheck, NovedadCritica, EstadoNovedadCritica, ComunicacionProgreso,
  SchemaProyecto, EstadoSchema, BomMaterial, OrigenBom, Verificacion, TipoGate, VeredictoGate,
  Retoma, CambioContrato, Persona, PersonaRol, RolCanonico, Modulo, EstadoProyecto,
} from '../contracts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = PgTransaction<any, any, any>

function addDays(iso: string, dias: number): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + dias)
  return date.toISOString().slice(0, 10)
}

async function parametroNumero(tx: Tx, clave: string, fallback: number): Promise<number> {
  const [p] = await tx.select().from(s.parametros).where(eq(s.parametros.clave, clave))
  if (!p) return fallback
  const n = Number(p.valorNumeric ?? p.valorTexto ?? fallback)
  return Number.isFinite(n) ? n : fallback
}

export async function crearCronogramaAction(data: { proyectoId: string }): Promise<Cronograma> {
  return db.transaction(async (tx) => {
    const baseSemanas = await parametroNumero(tx, 'base_semanas_cronograma', 4)
    const holgura = await parametroNumero(tx, 'holgura_maxima_dias', 12)
    const promesa = await parametroNumero(tx, 'promesa_semanas', 7)
    const [nuevo] = await tx.insert(s.cronogramas).values({
      proyectoId: data.proyectoId, baseSemanas, holguraMaximaDias: holgura, promesaSemanas: promesa,
      fechaFijacion: new Date().toISOString().slice(0, 10),
    }).returning()
    return nuevo as unknown as Cronograma
  })
}

export async function crearCronogramaEtapaAction(data: { cronogramaId: string; linea: LineaCronograma; etapa: EtapaCronograma; fechaIdeal: string; fechaReal: string; estado: string }): Promise<CronogramaEtapa> {
  const [nuevo] = await db.insert(s.cronogramaEtapas).values(data).returning()
  return nuevo as unknown as CronogramaEtapa
}

export async function aplicarDesfaseAction(proyectoId: string, data: { causa: CausaDesfase; composicionCausal: { origen: string; aporteDias: number }[]; motivo: string; diasDesfase: number }): Promise<DesfaseCronograma | null> {
  if (!P33({ causa: data.causa, motivo: data.motivo, composicionCausal: data.composicionCausal })) return null
  return db.transaction(async (tx) => {
    const [nuevo] = await tx.insert(s.desfasesCronograma).values({
      proyectoId, diasDesfase: data.diasDesfase, causa: data.causa, composicionCausal: data.composicionCausal,
      motivo: data.motivo, aplicado: true,
      resultadoRecalculo: 'Línea interna desplazada; contractual inmutable (I-034)',
    }).returning()
    const [cronograma] = await tx.select().from(s.cronogramas).where(eq(s.cronogramas.proyectoId, proyectoId))
    if (cronograma) {
      const etapasInternas = await tx.select().from(s.cronogramaEtapas).where(and(
        eq(s.cronogramaEtapas.cronogramaId, cronograma.id), eq(s.cronogramaEtapas.linea, 'interna'),
      ))
      for (const e of etapasInternas) {
        await tx.update(s.cronogramaEtapas).set({ fechaReal: addDays(e.fechaIdeal, data.diasDesfase) }).where(eq(s.cronogramaEtapas.id, e.id))
      }
    }
    return nuevo as unknown as DesfaseCronograma
  })
}

export async function decisionManualDesfaseAction(desfaseId: string, data: { decisionManual: string; autorizadoPor: string }): Promise<DesfaseCronograma | null> {
  if (data.decisionManual.trim().length === 0) return null
  const [actualizado] = await db.update(s.desfasesCronograma).set({
    decisionManual: data.decisionManual, autorizadoPor: data.autorizadoPor,
  }).where(eq(s.desfasesCronograma.id, desfaseId)).returning()
  return (actualizado as unknown as DesfaseCronograma) ?? null
}

export async function crearCheckAction(proyectoId: string, data: { ratioInsumos: number; ratioPagos: number; ratioProduccion: number }): Promise<CheckProduccion> {
  return db.transaction(async (tx) => {
    const umbralTodoBien = await parametroNumero(tx, 'umbral_todo_bien_pct', 0.95)
    const umbralExtremo = await parametroNumero(tx, 'umbral_extremo_pct', 0.70)
    const sugerido = derivarDesenlace(data, { umbralTodoBienPct: umbralTodoBien, umbralExtremoPct: umbralExtremo })
    const [proyecto] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId))
    const [nuevo] = await tx.insert(s.checksProduccion).values({
      proyectoId, fechaCheck: new Date().toISOString().slice(0, 10),
      ratioInsumos: String(data.ratioInsumos), ratioPagos: String(data.ratioPagos), ratioProduccion: String(data.ratioProduccion),
      desenlaceSugerido: sugerido, verificadorId: proyecto?.verificadorId ?? null,
    }).returning()
    return { ...nuevo, ratioInsumos: data.ratioInsumos, ratioPagos: data.ratioPagos, ratioProduccion: data.ratioProduccion, comisionesReducidasPct: null } as unknown as CheckProduccion
  })
}

export async function confirmarCheckAction(checkId: string, data: { desenlaceFinal: DesenlaceCheck; overrideJustificacion?: string }): Promise<CheckProduccion | null> {
  return db.transaction(async (tx) => {
    const [check] = await tx.select().from(s.checksProduccion).where(eq(s.checksProduccion.id, checkId))
    if (!check) return null
    if (data.desenlaceFinal !== check.desenlaceSugerido && !(data.overrideJustificacion && data.overrideJustificacion.trim().length > 0)) return null
    const reduccionNovedad = await parametroNumero(tx, 'reduccion_comision_novedad_pct', 0.50)
    const reduccionExtremo = await parametroNumero(tx, 'reduccion_comision_extremo_pct', 1.00)
    const comisiones = derivarReduccionComision(data.desenlaceFinal, { reduccionNovedadPct: reduccionNovedad, reduccionExtremoPct: reduccionExtremo })
    const [actualizado] = await tx.update(s.checksProduccion).set({
      desenlaceFinal: data.desenlaceFinal, overrideJustificacion: data.overrideJustificacion ?? null,
      comisionesReducidasPct: String(comisiones),
    }).where(eq(s.checksProduccion.id, checkId)).returning()
    return {
      ...actualizado,
      ratioInsumos: Number(actualizado.ratioInsumos), ratioPagos: Number(actualizado.ratioPagos), ratioProduccion: Number(actualizado.ratioProduccion),
      comisionesReducidasPct: comisiones,
    } as unknown as CheckProduccion
  })
}

export async function crearNovedadAction(proyectoId: string, data: { descripcion: string; fase: string; ventanaSlaHoras: number }): Promise<NovedadCritica> {
  const [nuevo] = await db.insert(s.novedadesCriticas).values({
    proyectoId, descripcion: data.descripcion, fase: data.fase, ventanaSlaHoras: data.ventanaSlaHoras, estado: 'abierta',
  }).returning()
  return nuevo as unknown as NovedadCritica
}

export async function actualizarEstadoNovedadAction(id: string, estado: EstadoNovedadCritica, escaladoA?: string): Promise<NovedadCritica | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.novedadesCriticas).where(eq(s.novedadesCriticas.id, id))
    if (!actual) return null
    const [actualizado] = await tx.update(s.novedadesCriticas).set({
      estado, escaladoA: escaladoA ?? actual.escaladoA, updatedAt: new Date().toISOString(),
    }).where(eq(s.novedadesCriticas.id, id)).returning()
    return actualizado as unknown as NovedadCritica
  })
}

export async function crearComunicacionAction(proyectoId: string, data: { contenido: string; visibleAlCliente?: boolean }): Promise<ComunicacionProgreso | null> {
  return db.transaction(async (tx) => {
    const [checkBueno] = await tx.select().from(s.checksProduccion).where(and(
      eq(s.checksProduccion.proyectoId, proyectoId), eq(s.checksProduccion.desenlaceFinal, 'todo_bien'),
    ))
    if (!checkBueno) return null
    const [nuevo] = await tx.insert(s.comunicacionesProgreso).values({
      proyectoId, tipo: 'adelanto', contenido: data.contenido, visibleAlCliente: data.visibleAlCliente ?? true,
    }).returning()
    return nuevo as unknown as ComunicacionProgreso
  })
}

export async function crearSchemaAction(proyectoId: string): Promise<SchemaProyecto> {
  return db.transaction(async (tx) => {
    const existentes = await tx.select().from(s.schemasProyecto).where(eq(s.schemasProyecto.proyectoId, proyectoId))
    const version = existentes.length > 0 ? Math.max(...existentes.map(e => e.version)) + 1 : 1
    const [nuevo] = await tx.insert(s.schemasProyecto).values({ proyectoId, version, estado: 'borrador' }).returning()
    return nuevo as unknown as SchemaProyecto
  })
}

export async function actualizarEstadoSchemaAction(id: string, estado: EstadoSchema): Promise<SchemaProyecto | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.schemasProyecto).where(eq(s.schemasProyecto.id, id))
    if (!actual) return null
    const [actualizado] = await tx.update(s.schemasProyecto).set({
      estado, aprobadoEn: estado === 'aprobado_compras' ? new Date().toISOString() : actual.aprobadoEn,
    }).where(eq(s.schemasProyecto.id, id)).returning()
    return actualizado as unknown as SchemaProyecto
  })
}

export async function crearBomAction(data: { schemaId: string; productoId: string | null; cantidad: string; unidad: string; origen: OrigenBom; homologable: boolean; itemVarianteId?: string | null }): Promise<BomMaterial> {
  const [nuevo] = await db.insert(s.bomMaterial).values({ ...data, itemVarianteId: data.itemVarianteId ?? null }).returning()
  return nuevo as unknown as BomMaterial
}

export async function emitirVeredictoAction(data: { proyectoId: string; tipoGate: TipoGate; veredicto: VeredictoGate; verificadorId: string }): Promise<Verificacion | null> {
  return db.transaction(async (tx) => {
    const [proyecto] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, data.proyectoId))
    if (!proyecto) return null

    if (data.tipoGate === 'calidad') {
      const citaciones = await tx.select().from(s.citacionesCalidad).where(eq(s.citacionesCalidad.proyectoId, data.proyectoId))
      if (!puedeEmitirVeredictoCalidad(proyecto, citaciones, data.verificadorId)) return null
    }

    const [nuevo] = await tx.insert(s.verificaciones).values({
      proyectoId: data.proyectoId, tipoGate: data.tipoGate, veredicto: data.veredicto, verificadorId: data.verificadorId,
    }).returning()

    if (data.tipoGate === 'calidad' && data.veredicto === 'rechazado') {
      await tx.insert(s.reprocesos).values({
        proyectoId: data.proyectoId, origen: 'calidad', descripcion: 'Rechazo de calidad (E-24)', estado: 'abierto',
      })
    }

    if (data.tipoGate === 'schema') {
      if (data.veredicto === 'aprobado') {
        const verificacionesProyecto = await tx.select().from(s.verificaciones).where(eq(s.verificaciones.proyectoId, data.proyectoId))
        if (!P18(proyecto, verificacionesProyecto)) return null
        await tx.update(s.proyectos).set({ estado: 'aprobado_compras' as EstadoProyecto, updatedAt: new Date().toISOString() }).where(eq(s.proyectos.id, data.proyectoId))
        await tx.insert(s.proyectosEstadosHistorial).values({
          proyectoId: data.proyectoId, estadoAnterior: proyecto.estado, estadoNuevo: 'aprobado_compras' as EstadoProyecto, cambiadoPor: null, razon: null,
        })
        const [ultimoSchema] = await tx.select().from(s.schemasProyecto).where(eq(s.schemasProyecto.proyectoId, data.proyectoId)).orderBy(desc(s.schemasProyecto.version)).limit(1)
        if (ultimoSchema) await tx.update(s.schemasProyecto).set({ estado: 'aprobado_compras' }).where(eq(s.schemasProyecto.id, ultimoSchema.id))
      } else {
        const [ultimoSchema] = await tx.select().from(s.schemasProyecto).where(eq(s.schemasProyecto.proyectoId, data.proyectoId)).orderBy(desc(s.schemasProyecto.version)).limit(1)
        if (ultimoSchema) await tx.update(s.schemasProyecto).set({ estado: 'en_reproceso' }).where(eq(s.schemasProyecto.id, ultimoSchema.id))
      }
    }

    return nuevo as unknown as Verificacion
  })
}

export async function guardarRetomaAction(proyectoId: string, data: { medidas?: Record<string, unknown>; fotos?: string[]; anomaliaDetectada?: boolean }): Promise<Retoma> {
  return db.transaction(async (tx) => {
    const [existente] = await tx.select().from(s.retomas).where(eq(s.retomas.proyectoId, proyectoId))
    const anomalia = data.anomaliaDetectada ?? existente?.anomaliaDetectada ?? false
    let retoma: typeof s.retomas.$inferSelect
    if (existente) {
      const [actualizada] = await tx.update(s.retomas).set({
        medidas: data.medidas ?? existente.medidas, fotos: data.fotos ?? existente.fotos, anomaliaDetectada: anomalia, updatedAt: new Date().toISOString(),
      }).where(eq(s.retomas.id, existente.id)).returning()
      retoma = actualizada
    } else {
      const [nueva] = await tx.insert(s.retomas).values({
        proyectoId, medidas: data.medidas ?? null, fotos: data.fotos ?? [], anomaliaDetectada: anomalia,
      }).returning()
      retoma = nueva
    }
    if (anomalia) {
      const cambiosExistentes = await tx.select().from(s.cambiosContrato).where(eq(s.cambiosContrato.proyectoId, proyectoId))
      const yaExiste = cambiosExistentes.some(c => c.descripcion.includes('Retoma'))
      if (!yaExiste) {
        await tx.insert(s.cambiosContrato).values({
          proyectoId, tipoCambio: 'cambio', descripcion: 'Anomalía detectada en retoma de medidas', disparaDesfase: true,
        })
      }
    }
    return retoma as unknown as Retoma
  })
}

export async function crearCambioContratoAction(data: { proyectoId: string; tipoCambio: CambioContrato['tipoCambio']; descripcion: string; disparaDesfase: boolean }): Promise<CambioContrato> {
  const [nuevo] = await db.insert(s.cambiosContrato).values(data).returning()
  return nuevo as unknown as CambioContrato
}

export async function crearPersonaAction(data: Partial<Pick<Persona, 'documento' | 'telefono' | 'fotoUrl' | 'email' | 'direccion' | 'referencia1Nombre' | 'referencia1Relacion' | 'referencia1Telefono' | 'referencia2Nombre' | 'referencia2Relacion' | 'referencia2Telefono'>> & { nombre: string }): Promise<Persona> {
  const [nuevo] = await db.insert(s.personas).values({
    nombre: data.nombre, documento: data.documento ?? null, telefono: data.telefono ?? null,
    fotoUrl: data.fotoUrl ?? null, email: data.email ?? null,
    direccion: data.direccion ?? null,
    referencia1Nombre: data.referencia1Nombre ?? null,
    referencia1Relacion: data.referencia1Relacion ?? null,
    referencia1Telefono: data.referencia1Telefono ?? null,
    referencia2Nombre: data.referencia2Nombre ?? null,
    referencia2Relacion: data.referencia2Relacion ?? null,
    referencia2Telefono: data.referencia2Telefono ?? null,
  }).returning()
  return nuevo as unknown as Persona
}

export async function actualizarPersonaAction(id: string, data: Partial<Pick<Persona, 'nombre' | 'documento' | 'telefono' | 'fotoUrl' | 'email' | 'direccion' | 'referencia1Nombre' | 'referencia1Relacion' | 'referencia1Telefono' | 'referencia2Nombre' | 'referencia2Relacion' | 'referencia2Telefono'>>): Promise<Persona | null> {
  const [actualizado] = await db.update(s.personas).set(data).where(eq(s.personas.id, id)).returning()
  return (actualizado as unknown as Persona) ?? null
}

export async function asignarRolAction(personaId: string, rolId: RolCanonico): Promise<PersonaRol> {
  return db.transaction(async (tx) => {
    const [yaExiste] = await tx.select().from(s.personasRoles).where(and(eq(s.personasRoles.personaId, personaId), eq(s.personasRoles.rolId, rolId)))
    if (yaExiste) {
      if (!yaExiste.activo) {
        const [actualizado] = await tx.update(s.personasRoles).set({ activo: true }).where(eq(s.personasRoles.id, yaExiste.id)).returning()
        return actualizado as unknown as PersonaRol
      }
      return yaExiste as unknown as PersonaRol
    }
    const [nuevo] = await tx.insert(s.personasRoles).values({ personaId, rolId, activo: true }).returning()
    return nuevo as unknown as PersonaRol
  })
}

export async function actualizarEstadoModuloAction(id: string, estado: string): Promise<Modulo | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.modulos).where(eq(s.modulos.id, id))
    if (!actual) return null
    if (!transicionModuloValida(actual.estado, estado)) return null
    const [actualizado] = await tx.update(s.modulos).set({ estado }).where(eq(s.modulos.id, id)).returning()
    return actualizado as unknown as Modulo
  })
}
