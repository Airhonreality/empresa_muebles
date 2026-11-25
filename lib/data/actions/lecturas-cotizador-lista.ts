'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { CotizadorListaSnapshot } from '../queries/cotizador-lista-types'
import { protegerAccion } from '@/lib/auth/accion'

export const obtenerSnapshotCotizadorListaAction = protegerAccion({ permiso: "cotizador:leer" }, async function obtenerSnapshotCotizadorListaAction(): Promise<CotizadorListaSnapshot> {
  const [proyectos, clientes] = await Promise.all([
    db.select().from(s.proyectos),
    db.select().from(s.clientes),
  ])

  return {
    proyectos: proyectos as unknown as CotizadorListaSnapshot['proyectos'],
    clientes: clientes as unknown as CotizadorListaSnapshot['clientes'],
  }
});
