// lib/asistente/operaciones/finanzas-produccion.ts
// Adaptador Drizzle de finanzas para el asistente: lectura de cuentas y el registro de un movimiento.
// El movimiento sigue la misma regla que crearMovimientoManualAction (lib/data/actions/f6.ts): entrada =
// crédito a la cuenta, salida = débito; saldo ajustado con aritmética SQL dentro de la transacción.
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { DatosMovimiento, FilaCuenta, PuertoFinanzas } from '../ops/finanzas'

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
  async registrarMovimiento(datos: DatosMovimiento): Promise<string> {
    const esEntrada = datos.tipo === 'entrada'
    return db.transaction(async (tx) => {
      const [cuenta] = await tx.select().from(s.cuentasFinancieras).where(eq(s.cuentasFinancieras.id, datos.cuentaId))
      if (!cuenta) throw new Error('La cuenta indicada ya no existe.')
      const [movimiento] = await tx
        .insert(s.movimientosFinancieros)
        .values({
          fecha: datos.fecha,
          descripcion: datos.descripcion,
          tipo: esEntrada ? 'credito' : 'debito',
          monto: datos.monto,
          estado: 'asentado',
          cuentaOrigenId: esEntrada ? null : cuenta.id,
          cuentaDestinoId: esEntrada ? cuenta.id : null,
          medioPago: null,
        })
        .returning({ id: s.movimientosFinancieros.id })
      await tx
        .update(s.cuentasFinancieras)
        .set({
          saldoActual: esEntrada
            ? sql`${s.cuentasFinancieras.saldoActual} + ${datos.monto}::numeric`
            : sql`${s.cuentasFinancieras.saldoActual} - ${datos.monto}::numeric`,
        })
        .where(eq(s.cuentasFinancieras.id, cuenta.id))
      return movimiento.id
    })
  },
}
