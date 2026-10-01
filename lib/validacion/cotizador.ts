// Schemas Zod del borde de escritura del cotizador — Lote 1 (crítico: dinero/contratos) del plan
// archivado `plan_zod_validacion_runtime.md`. Cubre ítems, espacios/jornadas, parámetros
// financieros y cliente: las acciones que más directamente tocan plata y las primeras en
// perderse si se cae en silencio (ver diagnóstico de UI del cotizador, 2026-09-30).
//
// Deliberadamente conservador en el formato de ids: NO se exige `z.uuid()` en ids/llaves
// foráneas porque datos de prueba/semilla existentes (ver lib/data/queries/optimistic.test.ts)
// usan ids no-UUID (`'esp-1'`, `'it-1'`); exigir UUID rechazaría payloads legítimos que la propia
// base de datos no considera inválidos. Se valida forma y tipo, no una convención de id.
import { z } from 'zod'

/** Campo numérico guardado como texto (columnas `numeric` de Postgres) — no negativo y finito.
 *  Rechazar acá un `"abc"` o un negativo da un error claro en vez de dejar que Postgres lo
 *  rechace más tarde con un mensaje críptico, o peor, que `Number(...)` lo convierta en NaN/0
 *  en silencio más adelante en el camino. */
const numeroDecimalTexto = z
  .string()
  .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, {
    message: 'debe ser un número no negativo',
  })

const idNoVacio = z.string().trim().min(1, 'no puede estar vacío')
const textoOpcional = z.string().nullable().optional()

const fuenteReferencialEnum = z.enum(['electrodomestico', 'obra_civil', 'servicio_tercero', 'otro'])

const camposPersonalizadosSchema = z.array(z.object({ clave: z.string(), valor: z.string() }))

// --- Ítems ---

export const itemCrearSchema = z.object({
  id: idNoVacio.optional(),
  varianteId: idNoVacio,
  catalogoId: idNoVacio.nullable(),
  cantidad: numeroDecimalTexto,
  precioUnitario: numeroDecimalTexto.optional(),
  nombrePersonalizado: textoOpcional,
  anulado: z.boolean().optional(),
  esReferencial: z.boolean().optional(),
  fuenteReferencial: fuenteReferencialEnum.nullable().optional(),
  grupoReferencial: textoOpcional,
  comentario: textoOpcional,
  grupoItemId: textoOpcional,
  fotoUrl: textoOpcional,
  marca: textoOpcional,
  referencia: textoOpcional,
  color: textoOpcional,
  dimensiones: textoOpcional,
  acabado: textoOpcional,
  espesor: textoOpcional,
  camposPersonalizados: camposPersonalizadosSchema.optional(),
})
export type ItemCrearInput = z.infer<typeof itemCrearSchema>

export const itemActualizarSchema = z.object({
  catalogoId: idNoVacio.nullable().optional(),
  cantidad: numeroDecimalTexto.optional(),
  precioUnitario: numeroDecimalTexto.optional(),
  nombrePersonalizado: textoOpcional,
  anulado: z.boolean().optional(),
  esReferencial: z.boolean().optional(),
  fuenteReferencial: fuenteReferencialEnum.nullable().optional(),
  grupoReferencial: textoOpcional,
  comentario: textoOpcional,
  grupoItemId: textoOpcional,
  fotoUrl: textoOpcional,
  marca: textoOpcional,
  referencia: textoOpcional,
  color: textoOpcional,
  dimensiones: textoOpcional,
  acabado: textoOpcional,
  espesor: textoOpcional,
  camposPersonalizados: camposPersonalizadosSchema.optional(),
})
export type ItemActualizarInput = z.infer<typeof itemActualizarSchema>

// --- Espacios / jornadas ---

export const espacioCrearSchema = z.object({
  id: idNoVacio.optional(),
  proyectoId: idNoVacio,
  nombreEspacio: z.string().trim().min(1, 'no puede estar vacío'),
  nombreVariante: z.string().trim().min(1).optional(),
  tipoEspacio: textoOpcional,
  descripcion: textoOpcional,
  activa: z.boolean().optional(),
  visibleEnPropuestaPublica: z.boolean().optional(),
  orden: z.number().int().nonnegative().optional(),
  jornadasDesarrolloTecnico: numeroDecimalTexto.optional(),
  jornadasEnsamblajeTaller: numeroDecimalTexto.optional(),
  jornadasInstalacionObra: numeroDecimalTexto.optional(),
  colores: z.array(z.unknown()).optional(),
  fotosEspacio: z.array(z.string()).optional(),
  fotosDisenio: z.array(z.string()).optional(),
  fotosReferencia: z.array(z.string()).optional(),
})
export type EspacioCrearInput = z.infer<typeof espacioCrearSchema>

export const espacioActualizarSchema = z.object({
  nombreEspacio: z.string().trim().min(1, 'no puede estar vacío').optional(),
  nombreVariante: z.string().trim().min(1).optional(),
  tipoEspacio: textoOpcional,
  descripcion: textoOpcional,
  activa: z.boolean().optional(),
  visibleEnPropuestaPublica: z.boolean().optional(),
  colores: z.array(z.unknown()).optional(),
  fotosEspacio: z.array(z.string()).optional(),
  fotosDisenio: z.array(z.string()).optional(),
  fotosReferencia: z.array(z.string()).optional(),
})
export type EspacioActualizarInput = z.infer<typeof espacioActualizarSchema>

export const jornadasSchema = z.object({
  jornadasDesarrolloTecnico: numeroDecimalTexto,
  jornadasEnsamblajeTaller: numeroDecimalTexto,
  jornadasInstalacionObra: numeroDecimalTexto,
})
export type JornadasInput = z.infer<typeof jornadasSchema>

// --- Parámetros financieros ---

export const parametrosFinancierosSchema = z.object({
  aplicaIva: z.boolean().optional(),
  porcentajeIva: numeroDecimalTexto.optional(),
  garantiaAnios: z.number().int().nonnegative().optional(),
  costosOperativos: numeroDecimalTexto.optional(),
  imprevistosInstalacion: numeroDecimalTexto.optional(),
  descuentoComercial: numeroDecimalTexto.optional(),
  ajusteArbitrario: numeroDecimalTexto.optional(),
})
export type ParametrosFinancierosInput = z.infer<typeof parametrosFinancierosSchema>

// --- Cliente ---

export const clienteCrearSchema = z.object({
  id: idNoVacio.optional(),
  nombre: z.string().trim().min(1, 'no puede estar vacío'),
  documento: textoOpcional,
  telefono: textoOpcional,
  email: textoOpcional,
  domicilio: textoOpcional,
})
export type ClienteCrearInput = z.infer<typeof clienteCrearSchema>

export const clienteActualizarSchema = z.object({
  nombre: z.string().trim().min(1, 'no puede estar vacío').optional(),
  documento: textoOpcional,
  telefono: textoOpcional,
  email: textoOpcional,
  domicilio: textoOpcional,
})
export type ClienteActualizarInput = z.infer<typeof clienteActualizarSchema>
