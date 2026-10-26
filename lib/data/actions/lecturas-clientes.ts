'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { ClientesSnapshot } from '../queries/clientes-types'

export async function obtenerSnapshotClientesAction(): Promise<ClientesSnapshot> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [clientes, proyectos, pedidos, obligaciones, contratos, leads, eventosConversion] =
    await Promise.all([
      db.select().from(s.clientes),
      db.select().from(s.proyectos),
      db.select().from(s.pedidosWeb),
      db.select().from(s.obligacionesPendientes),
      db.select().from(s.contratos),
      db.select().from(s.leads),
      db.select().from(s.eventosConversionOffline),
    ])

  return {
    clientes: clientes as unknown as ClientesSnapshot['clientes'],
    proyectos: proyectos as unknown as ClientesSnapshot['proyectos'],
    pedidos: pedidos as unknown as ClientesSnapshot['pedidos'],
    obligaciones: obligaciones as unknown as ClientesSnapshot['obligaciones'],
    contratos: contratos as unknown as ClientesSnapshot['contratos'],
    leads: leads as unknown as ClientesSnapshot['leads'],
    eventosConversion: eventosConversion as unknown as ClientesSnapshot['eventosConversion'],
  }
}
