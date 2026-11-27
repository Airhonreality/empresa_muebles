// lib/asistente/ops/finanzas.ts
// Operaciones de finanzas del asistente (t-200 paso 3: cuentas). El registro de movimientos llega en el paso 4.
import { z } from 'zod'
import type { DefinicionAsistente } from '../herramientas'

export interface FilaCuenta {
  id: string
  nombre: string
  tipo: string | null
  saldoActual: string
}

/** Puerto de finanzas. Implementación Drizzle: operaciones/finanzas-produccion.ts. */
export interface PuertoFinanzas {
  cuentas(): Promise<FilaCuenta[]>
  cuentaPorId(id: string): Promise<FilaCuenta | null>
}

export function operacionesFinanzas(puerto: PuertoFinanzas): DefinicionAsistente[] {
  return [
    {
      nombre: 'finanzas.cuentas',
      dominio: 'finanzas',
      operacion: 'cuentas',
      descripcion: 'Lista las cuentas financieras (caja, banco, etc.) con su id, nombre, tipo y saldo actual. Usa el id como cuentaId.',
      permiso: 'finanzas:leer',
      canales: ['chat'],
      esEscritura: false,
      esquema: z.strictObject({}),
      ejecutar: async (_entrada, _usuario, ctx) => {
        const cuentas = await puerto.cuentas()
        ctx.procedencia.registrar('cuenta', cuentas.map((c) => c.id))
        return {
          cuentas: cuentas.map((c) => ({ id: c.id, etiqueta: c.nombre, tipo: c.tipo, saldo: c.saldoActual })),
          total: Math.round(cuentas.reduce((suma, c) => suma + Number(c.saldoActual), 0) * 100) / 100,
        }
      },
    },
  ]
}
