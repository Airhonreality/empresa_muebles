// Schemas Zod del borde de escritura de finanzas (t-181, 2026-10-17).
// El formulario manda strings (MoneyInput) y opcionales null; se valida forma y tipo antes de
// tocar la DB. `proveedorId` solo tiene sentido en una salida: una entrada con proveedor se
// rechaza explícitamente en vez de guardar una relación sin significado.
import { z } from 'zod'

const numeroDecimalTexto = z
  .string()
  .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, {
    message: 'debe ser un número no negativo',
  })

const montoPositivoTexto = z
  .string()
  .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
    message: 'debe ser un número mayor que cero',
  })

const idNoVacio = z.string().trim().min(1, 'no puede estar vacío')
const idOpcional = z.uuid().optional()
const textoOpcional = z.string().nullable().optional()

const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato AAAA-MM-DD')

export const movimientoManualSchema = z
  .object({
    id: idOpcional,
    tipo: z.enum(['entrada', 'salida']),
    fecha: fechaISO,
    descripcion: z.string().trim().min(1, 'no puede estar vacía').max(500, 'máximo 500 caracteres'),
    monto: montoPositivoTexto,
    cuentaId: idNoVacio,
    proyectoId: textoOpcional,
    proveedorId: textoOpcional,
    comprobanteUrl: z.string().trim().min(1).nullable().optional(),
  })
  .refine((v) => v.tipo === 'salida' || !v.proveedorId, {
    path: ['proveedorId'],
    message: 'solo se puede asociar un proveedor a una salida',
  })
export type MovimientoManualValidado = z.infer<typeof movimientoManualSchema>

/** Edición de un movimiento ya registrado (t-181). No incluye tipo ni cuenta:
 *  el server los toma del movimiento existente para no reinterpretar la dirección del dinero. */
export const movimientoEdicionSchema = z.object({
  fecha: fechaISO,
  descripcion: z.string().trim().min(1, 'no puede estar vacía').max(500, 'máximo 500 caracteres'),
  monto: montoPositivoTexto,
  proyectoId: textoOpcional,
  proveedorId: textoOpcional,
  comprobanteUrl: z.string().trim().min(1).nullable().optional(),
})
export type MovimientoEdicionValidado = z.infer<typeof movimientoEdicionSchema>

export const cuentaFinancieraCrearSchema = z.object({
  id: idOpcional,
  nombre: z.string().trim().min(1, 'no puede estar vacío').max(120, 'máximo 120 caracteres'),
  tipo: z.enum(['caja', 'caja_menor', 'banco', 'billetera_digital', 'otro']),
  saldoInicial: numeroDecimalTexto.optional(),
  /** Compatibilidad con llamadas previas que usaban saldoActual. */
  saldoActual: numeroDecimalTexto.optional(),
})
export type CuentaFinancieraCrearValidado = z.infer<typeof cuentaFinancieraCrearSchema>
