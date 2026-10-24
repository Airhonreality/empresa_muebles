'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { CotizadorListaSnapshot } from '../queries/cotizador-lista-types'

export async function obtenerSnapshotCotizadorListaAction(): Promise<CotizadorListaSnapshot> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [proyectos, clientes] = await Promise.all([
    db.select().from(s.proyectos),
    db.select().from(s.clientes),
  ])

  return {
    proyectos: proyectos as unknown as CotizadorListaSnapshot['proyectos'],
    clientes: clientes as unknown as CotizadorListaSnapshot['clientes'],
  }
}
