// lib/asistente/operaciones/finanzas-produccion.ts
// Adaptador Drizzle de finanzas para el asistente. Lectura de cuentas (paso 3). La escritura de
// movimientos (paso 4) se agrega aquí, dentro de una transacción que replica crearMovimientoManualAction.
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { FilaCuenta, PuertoFinanzas } from '../ops/finanzas'

export const finanzasDb: PuertoFinanzas = {
  async cuentas(): Promise<FilaCuenta[]> {
    return db
      .select({ id: s.cuentasFinancieras.id, nombre: s.cuentasFinancieras.nombre, tipo: s.cuentasFinancieras.tipo, saldoActual: s.cuentasFinancieras.saldoActual })
      .from(s.cuentasFinancieras)
  },
  async cuentaPorId(id: string): Promise<FilaCuenta | null> {
    const [f] = await db
      .select({ id: s.cuentasFinancieras.id, nombre: s.cuentasFinancieras.nombre, tipo: s.cuentasFinancieras.tipo, saldoActual: s.cuentasFinancieras.saldoActual })
      .from(s.cuentasFinancieras)
      .where(eq(s.cuentasFinancieras.id, id))
    return f ?? null
  },
}
