'use server'

import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { PROYECTO_VACIO, type ProyectoSnapshot } from '../queries/proyecto-types'

export async function obtenerSnapshotProyectoAction(proyectoId: string): Promise<ProyectoSnapshot> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [proyecto] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId))
  if (!proyecto) return PROYECTO_VACIO

  const [cliente] = proyecto.clienteId
    ? await db.select().from(s.clientes).where(eq(s.clientes.id, proyecto.clienteId))
    : []

  const [
    espacios,
    modulos,
    cronogramas,
    desfases,
    verificaciones,
    recepciones,
    citaciones,
    reprocesos,
    instalaciones,
    actas,
    obligaciones,
    ordenesCompra,
    notas,
    catalogo,
    cuentas,
  ] = await Promise.all([
    db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyectoId)),
    db.select().from(s.modulos).where(eq(s.modulos.proyectoId, proyectoId)),
    db.select().from(s.cronogramas).where(eq(s.cronogramas.proyectoId, proyectoId)),
    db.select().from(s.desfasesCronograma).where(eq(s.desfasesCronograma.proyectoId, proyectoId)),
    db.select().from(s.verificaciones).where(eq(s.verificaciones.proyectoId, proyectoId)),
    db.select().from(s.recepcionesMaterial).where(eq(s.recepcionesMaterial.proyectoId, proyectoId)),
    db.select().from(s.citacionesCalidad).where(eq(s.citacionesCalidad.proyectoId, proyectoId)),
    db.select().from(s.reprocesos).where(eq(s.reprocesos.proyectoId, proyectoId)),
    db.select().from(s.instalaciones).where(eq(s.instalaciones.proyectoId, proyectoId)),
    db.select().from(s.actasEntrega).where(eq(s.actasEntrega.proyectoId, proyectoId)),
    db.select().from(s.obligacionesPendientes),
    db.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.proyectoId, proyectoId)),
    db.select().from(s.notasReunion).where(eq(s.notasReunion.proyectoId, proyectoId)),
    db.select().from(s.productosCatalogo),
    db.select().from(s.cuentasFinancieras),
  ])

  const espacioIds = espacios.map((e) => e.id)
  const moduloIds = modulos.map((m) => m.id)
  const cronogramaId = cronogramas[0]?.id

  const [items, artefactos, cronogramaEtapas, modulosArtefactos] = await Promise.all([
    espacioIds.length
      ? db.select().from(s.itemsVariante).where(inArray(s.itemsVariante.varianteId, espacioIds))
      : [],
    espacioIds.length
      ? db.select().from(s.espaciosArtefactos).where(inArray(s.espaciosArtefactos.espacioVarianteId, espacioIds))
      : [],
    cronogramaId
      ? db.select().from(s.cronogramaEtapas).where(eq(s.cronogramaEtapas.cronogramaId, cronogramaId))
      : [],
    moduloIds.length
      ? db.select().from(s.modulosArtefactos).where(inArray(s.modulosArtefactos.moduloId, moduloIds))
      : [],
  ])

  return {
    proyecto: proyecto as unknown as ProyectoSnapshot['proyecto'],
    cliente: (cliente as unknown as ProyectoSnapshot['cliente']) ?? null,
    espacios: espacios as unknown as ProyectoSnapshot['espacios'],
    items: items as unknown as ProyectoSnapshot['items'],
    artefactos: artefactos as unknown as ProyectoSnapshot['artefactos'],
    modulos: modulos as unknown as ProyectoSnapshot['modulos'],
    cronograma: (cronogramas[0] as unknown as ProyectoSnapshot['cronograma']) ?? null,
    cronogramaEtapas: cronogramaEtapas as unknown as ProyectoSnapshot['cronogramaEtapas'],
    desfases: desfases as unknown as ProyectoSnapshot['desfases'],
    verificaciones: verificaciones as unknown as ProyectoSnapshot['verificaciones'],
    recepciones: recepciones as unknown as ProyectoSnapshot['recepciones'],
    citaciones: citaciones as unknown as ProyectoSnapshot['citaciones'],
    reprocesos: reprocesos as unknown as ProyectoSnapshot['reprocesos'],
    instalaciones: instalaciones as unknown as ProyectoSnapshot['instalaciones'],
    acta: (actas[0] as unknown as ProyectoSnapshot['acta']) ?? null,
    obligaciones: obligaciones as unknown as ProyectoSnapshot['obligaciones'],
    ordenesCompra: ordenesCompra as unknown as ProyectoSnapshot['ordenesCompra'],
    notas: notas as unknown as ProyectoSnapshot['notas'],
    modulosArtefactos: modulosArtefactos as unknown as ProyectoSnapshot['modulosArtefactos'],
    catalogo: catalogo as unknown as ProyectoSnapshot['catalogo'],
    cuentas: cuentas as unknown as ProyectoSnapshot['cuentas'],
  }
}
