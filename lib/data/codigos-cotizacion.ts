// t-150: código amigable de cotización `COT-AAAA-MM-DD-NN`.
// El id de proyecto (uuid) es invisible para el negocio y muchos proyectos son homónimos
// ("Cocina integral"), así que se agrega un código legible derivado de la fecha de creación
// y un secuencial diario. Funciones puras (sin DB) para que sean testeables; la secuencia
// real la calcula el server action (crearProyectoAction) contando las cotizaciones del día.

const PREFIJO = 'COT'

export function formatearFechaDiaria(fecha: Date): string {
  const aa = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${aa}-${mm}-${dd}`
}

/** Prefijo de búsqueda: `COT-2026-09-10` (sin secuencia). */
export function prefijoCodigoFecha(fecha: Date): string {
  return `${PREFIJO}-${formatearFechaDiaria(fecha)}`
}

/**
 * Código completo: `COT-2026-09-10-001`. `secuencia` empieza en 1 y se padée a mínimo 3 dígitos.
 * Nota (2026-09-10): un día real ya superó 99 cotizaciones (112 en 2026-08-15), así que el
 * relleno es de 3 dígitos. OJO en SQL: `lpad(x, 2, '0')` TRUNCA valores de 3 dígitos
 * (100→'10'), lo que duplicó códigos en el backfill; acá padStart solo amplía y nunca trunca.
 */
export function generarCodigoCotizacion(fecha: Date, secuencia: number): string {
  const seq = String(Math.max(1, secuencia)).padStart(3, '0')
  return `${prefijoCodigoFecha(fecha)}-${seq}`
}

/** Extrae el número de secuencia de un código `COT-AAAA-MM-DD-NN`. Null si no parsea. */
export function secuenciaDesdeCodigo(codigo: string): number | null {
  const match = /^COT-\d{4}-\d{2}-\d{2}-(\d+)$/.exec(codigo)
  return match ? Number(match[1]) : null
}

/** Verifica que un código siga el formato exacto `COT-AAAA-MM-DD-NN` con fechas reales. */
export function esCodigoCotizacionValido(codigo: string): boolean {
  const match = /^COT-(\d{4})-(\d{2})-(\d{2})-(\d{2,})$/.exec(codigo)
  if (!match) return false
  const mes = Number(match[2])
  const dia = Number(match[3])
  if (mes < 1 || mes > 12) return false
  if (dia < 1 || dia > 31) return false
  return true
}