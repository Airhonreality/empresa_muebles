// lib/asistente/ops/finanzas.ts
// Operaciones de finanzas del asistente (t-200): cuentas (paso 3) y registro de movimientos (paso 4).
// El movimiento replica la regla de crearMovimientoManualAction (lib/data/actions/f6.ts): entrada =
// crédito a la cuenta, salida = débito, saldo ajustado en la misma transacción. Aquí no se importa la
// acción (es una server action con sesión); la escritura va por el puerto `registrarMovimiento`.
import { z } from 'zod'
import type { DefinicionAsistente } from '../herramientas'
import { movimientoManualSchema } from '../../validacion/finanzas'
import { formatoPesos } from '../operaciones/cotizacion-completa'

export interface FilaCuenta {
  id: string
  nombre: string
  tipo: string | null
  saldoActual: string
}

export interface DatosMovimiento {
  cuentaId: string
  tipo: 'entrada' | 'salida'
  monto: string
  fecha: string
  descripcion: string
}

/** Puerto de finanzas. Implementación Drizzle: operaciones/finanzas-produccion.ts. */
export interface PuertoFinanzas {
  cuentas(): Promise<FilaCuenta[]>
  cuentaPorId(id: string): Promise<FilaCuenta | null>
  /** Registra el movimiento y ajusta el saldo en una sola transacción. Devuelve el id. */
  registrarMovimiento(datos: DatosMovimiento): Promise<string>
}

/** Tope por movimiento si no hay variable de entorno. Pesos enteros. */
export const TOPE_MOVIMIENTO_POR_DEFECTO = 1_000_000
export const VARIABLE_TOPE_MOVIMIENTO = 'ASISTENTE_TOPE_MOVIMIENTO_PESOS'

/**
 * Tope por movimiento que puede registrar el asistente (pesos enteros). Se lee al usar, no al cargar.
 * Un valor inválido en la variable falla CERRADO: lanza en vez de usar un tope adivinado.
 */
export function topeMovimientoPesos(entorno: Record<string, string | undefined> = process.env): number {
  const crudo = entorno[VARIABLE_TOPE_MOVIMIENTO]
  if (crudo === undefined || crudo.trim() === '') return TOPE_MOVIMIENTO_POR_DEFECTO
  const n = Number(crudo)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${VARIABLE_TOPE_MOVIMIENTO} debe ser un entero positivo (pesos). No se registran movimientos hasta corregirla.`)
  }
  return n
}

/** Entrada del movimiento. Tipo y formato de monto igual que el alta manual (movimientoManualSchema). */
export const esquemaMovimiento = z.object({
  cuentaId: z.uuid('cuentaId debe ser un identificador válido'),
  tipo: z.enum(movimientoManualSchema.shape.tipo.options),
  monto: z
    .string()
    .regex(/^\d{1,12}(\.0{1,2})?$/, 'monto en pesos enteros, como texto y sin decimales (ej. "150000")')
    .refine((v) => Number(v) > 0, 'el monto debe ser mayor que cero'),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha AAAA-MM-DD')
    .refine((f) => new Date(`${f}T00:00:00Z`).toISOString().slice(0, 10) === f, 'fecha inexistente'),
  descripcion: z.string().trim().min(1, 'la descripción no puede estar vacía').max(200),
})

export function operacionesFinanzas(puerto: PuertoFinanzas): DefinicionAsistente[] {
  const verificarTope = (monto: string) => {
    const tope = topeMovimientoPesos()
    if (Number(monto) > tope) throw new Error(`El monto supera el tope de ${formatoPesos(tope)} por movimiento.`)
  }

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
    {
      nombre: 'finanzas.movimiento_registrar',
      dominio: 'finanzas',
      operacion: 'movimiento_registrar',
      descripcion:
        'Registra una entrada o salida de dinero en una cuenta (cuentaId de finanzas.cuentas). Monto en pesos enteros como texto. ' +
        'Requiere confirmación del empleado.',
      permiso: 'finanzas:escribir',
      canales: ['chat'],
      esEscritura: true,
      esquema: esquemaMovimiento,
      preparar: async (entrada, _usuario, ctx) => {
        ctx.procedencia.exigir('cuenta', entrada.cuentaId, 'cuenta financiera')
        verificarTope(entrada.monto)
        const cuenta = await puerto.cuentaPorId(entrada.cuentaId)
        if (!cuenta) throw new Error('La cuenta indicada no existe.')
        const sentido = entrada.tipo === 'entrada' ? 'Entrada' : 'Salida'
        return {
          resumen: `${sentido} de ${formatoPesos(Number(entrada.monto))} en "${cuenta.nombre}" el ${entrada.fecha}: ${entrada.descripcion}. Saldo actual: ${formatoPesos(Number(cuenta.saldoActual))}.`,
          datos: { entrada },
        }
      },
      confirmar: async (datos) => {
        const entrada = esquemaMovimiento.parse((datos as { entrada: unknown }).entrada)
        verificarTope(entrada.monto)
        if (!(await puerto.cuentaPorId(entrada.cuentaId))) throw new Error('La cuenta indicada ya no existe.')
        const movimientoId = await puerto.registrarMovimiento(entrada)
        return { movimientoId }
      },
    },
  ]
}
