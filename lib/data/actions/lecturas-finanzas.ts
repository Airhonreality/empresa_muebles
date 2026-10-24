'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { FinanzasSnapshot } from '../queries/finanzas-types'

export async function obtenerSnapshotFinanzasAction(): Promise<FinanzasSnapshot> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [
    cuentas,
    movimientos,
    obligaciones,
    cuentasCobro,
    ordenesCompra,
    proveedores,
    proyectos,
    registrosGate,
  ] = await Promise.all([
    db.select().from(s.cuentasFinancieras),
    db.select().from(s.movimientosFinancieros),
    db.select().from(s.obligacionesPendientes),
    db.select().from(s.cuentasCobroProveedor),
    db.select().from(s.ordenesCompra),
    db.select({ id: s.proveedores.id, nombre: s.proveedores.nombre }).from(s.proveedores),
    db.select({
      id: s.proyectos.id,
      codigo: s.proyectos.codigo,
      nombreProyecto: s.proyectos.nombreProyecto,
    }).from(s.proyectos),
    db.select().from(s.registrosGateCaja),
  ])

  return {
    cuentas: cuentas as unknown as FinanzasSnapshot['cuentas'],
    movimientos: movimientos as unknown as FinanzasSnapshot['movimientos'],
    obligaciones: obligaciones as unknown as FinanzasSnapshot['obligaciones'],
    cuentasCobro: cuentasCobro as unknown as FinanzasSnapshot['cuentasCobro'],
    ordenesCompra: ordenesCompra as unknown as FinanzasSnapshot['ordenesCompra'],
    proveedores,
    proyectos,
    registrosGate: registrosGate as unknown as FinanzasSnapshot['registrosGate'],
  }
}
