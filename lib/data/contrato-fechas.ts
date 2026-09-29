/**
 * Aritmética de calendario del contrato: días hábiles y ventana de entrega.
 *
 * Modulo puro, sin dependencias ni estado — mismo criterio que `contrato-items.ts`. Existe
 * porque la Fecha Máxima de Entrega es una fecha CONTRACTUAL (de ella depende la retención
 * de mora del 0,5% por semana con tope del 5%), y una fecha contractual no puede depender de
 * un `new Date()` suelto en un componente de React.
 *
 * Reglas que aplica, y que son la razón de existir del módulo:
 *
 * - Hábil = día de lunes a viernes que NO es festivo colombiano.
 * - El plazo del contrato se cuenta en semanas hábiles DESDE la fecha de firma, y la holgura
 *   se suma en días hábiles DESPUÉS del plazo. Son dos tramos distintos y no se mezclan.
 * - La holgura es INCONDICIONAL (no depende de que el contratista justifique una causa): es
 *   un margen que siempre se concede porque siempre hay remates y calibraciones que hacer.
 *   Lo que se condiciona a "causa imputable" es la PENAL, no la holgura.
 * - El plazo se expresa solo en semanas hábiles, NUNCA en meses: la convención "1 mes = 4
 *   semanas" sirve para hablar, pero en un contrato abre la puerta a que el cliente sostenga
 *   que 8 semanas son 2 meses calendario (que son 8,7). Ver `redondearAMesesNoAplica`.
 */

import { feriadosDe } from './feriados-colombia'

const MS_POR_DIA = 86_400_000

function fechaUTC(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia))
}

/** Parseo de 'AAAA-MM-DD' a Date en UTC. Devuelve `null` si no es una fecha válida. */
export function parsearISO(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = fechaUTC(Number(m[1]), Number(m[2]), Number(m[3]))
  // Rechaza desbordes tipo 2026-02-31 -> que Date UTC normaliza a 2026-03-03.
  if (d.getUTCMonth() + 1 !== Number(m[2]) || d.getUTCDate() !== Number(m[3])) return null
  return d
}

export function aISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** ¿Es festivo (incluye la familia de Semana Santa) en el año natural de la fecha? */
export function esFeriado(d: Date, feriados: Set<string>): boolean {
  return feriados.has(aISO(d))
}

/** ¿Lunes a viernes y no festivo? */
export function esHabil(d: Date, feriados: Set<string>): boolean {
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 6) return false
  return !esFeriado(d, feriados)
}

/**
 * Avanza `n` días hábiles desde `desde` (sin contar el propio `desde`).
 *
 * Devuelve `null` si `desde` no es una fecha válida o `n` no es un entero >= 0. Es un
 * `null` explícito y no una excepción: quien llama es la página imprimible del contrato, y
 * un contrato sin fecha máxima es un contrato que se puede imprimir; uno con fecha máxima
 * equivocada, no.
 */
export function sumarHabiles(desde: Date, n: number, feriados: Set<string>): Date | null {
  if (!Number.isInteger(n) || n < 0) return null
  if (Number.isNaN(desde.getTime())) return null

  let cursor = new Date(desde.getTime())
  let restantes = n
  // Tope defensivo: 5 años de días hábiles. Si se supera, la fecha de entrada es absurda.
  let limite = 5 * 365
  while (restantes > 0) {
    cursor = new Date(cursor.getTime() + MS_POR_DIA)
    limite--
    if (limite < 0) return null
    if (esHabil(cursor, feriados)) restantes--
  }
  return cursor
}

type ResultadoCaminata =
  | { ok: true; fecha: Date }
  | { ok: false; anioSinVerificar: number }
  | { ok: false; invalido: true }

/**
 * t-167: avanza `n` días hábiles cargando el calendario de cada año EN EL MOMENTO en que el
 * cursor entra a él.
 *
 * Existe porque la ventana puede cruzar el año —firmado el 1 de diciembre, la fecha máxima cae
 * en enero— y contar con el calendario del año de firma saltaría los festivos del año nuevo.
 *
 * Se carga bajo demanda en vez de pedir "el año de firma y el siguiente" a propósito: un
 * contrato de enero no necesita para nada el calendario de diciembre, y exigirlo dejaría sin
 * fecha máxima a la mitad de los contratos del año. Y si el año en el que se está caminando no
 * está verificado, se aborta: es preferible no imprimir fecha a imprimir una calculada con un
 * calendario inventado.
 */
function avanzarHabilesCruzandoAnios(desde: Date, n: number): ResultadoCaminata {
  if (!Number.isInteger(n) || n < 0) return { ok: false, invalido: true }
  if (Number.isNaN(desde.getTime())) return { ok: false, invalido: true }

  const porAnio = new Map<number, Set<string> | null>()
  let cursor = new Date(desde.getTime())
  let restantes = n
  // Tope defensivo: 5 años de días hábiles. Si se supera, la fecha de entrada es absurda.
  let limite = 5 * 365

  while (restantes > 0) {
    cursor = new Date(cursor.getTime() + MS_POR_DIA)
    limite--
    if (limite < 0) return { ok: false, invalido: true }

    const anio = cursor.getUTCFullYear()
    let feriados = porAnio.get(anio)
    if (feriados === undefined) {
      const f = feriadosDe(anio)
      feriados = f.verificado ? new Set(f.fechas) : null
      porAnio.set(anio, feriados)
    }
    if (feriados === null) return { ok: false, anioSinVerificar: anio }

    if (esHabil(cursor, feriados)) restantes--
  }
  return { ok: true, fecha: cursor }
}

export interface VentanaEntrega {
  /** Primer día en el que la entrega puede ocurrir. */
  minima: string
  /** Fecha Máxima de Entrega. */
  maxima: string
  /** Días hábiles que realmente recorre el recorrido, por si el calendario inyectado los suma distinto. */
  diasHabilesRecorridos: number
}

export type ResultadoVentana =
  | { ok: true; ventana: VentanaEntrega }
  | { ok: false; motivo: MotivoVentanaNoCalculable }

export type MotivoVentanaNoCalculable =
  /** Falta la fecha de firma, o no es una fecha válida. */
  | 'sin_fecha_firma'
  /** `plazoSemanas` no es un entero > 0. Sin él no hay ventana que calcular. */
  | 'sin_plazo'
  /** El año de la fecha de firma no tiene el calendario de festivos verificado. */
  | 'feriados_sin_verificar'

/**
 * Calcula la ventana de entrega del contrato.
 *
 * - `minima` = fecha de firma + `plazoSemanas` semanas hábiles.
 * - `maxima` = `minima` + `holguraDias` días hábiles (la holgura es incondicional).
 *
 * Falla a propósito cuando el año no tiene el calendario verificado: es preferible imprimir
 * el plazo en semanas y no imprimir fecha, antes que imprimir una fecha máxima equivocada.
 */
export function calcularVentanaEntrega(params: {
  fechaFirma: string | null | undefined
  plazoSemanas: number | null | undefined
  holguraDias: number | null | undefined
}): ResultadoVentana {
  const { fechaFirma, plazoSemanas } = params
  const holguraDias = params.holguraDias ?? 0

  const inicio = parsearISO(fechaFirma)
  if (!inicio) return { ok: false, motivo: 'sin_fecha_firma' }
  if (!Number.isInteger(plazoSemanas) || (plazoSemanas as number) <= 0) {
    return { ok: false, motivo: 'sin_plazo' }
  }
  if (!Number.isInteger(holguraDias) || holguraDias < 0) {
    return { ok: false, motivo: 'sin_plazo' }
  }

  const diasPlazo = (plazoSemanas as number) * 5
  const totalDiasHabiles = diasPlazo + holguraDias

  // Un solo recorrido para los dos tramos: `minima` y `maxima` tienen que caer en la misma línea
  // de tiempo, y hacerlos por separado con dos calendarios distintos es la forma más fácil de
  // que la holgura mida otra cosa.
  const recorrido = avanzarHabilesCruzandoAnios(inicio, totalDiasHabiles)
  if (!recorrido.ok) {
    return 'anioSinVerificar' in recorrido
      ? { ok: false, motivo: 'feriados_sin_verificar' }
      : { ok: false, motivo: 'sin_plazo' }
  }

  const maxima = recorrido.fecha
  // La mínima se recalcula como el punto en el que quedaban `holguraDias` hábiles por andar.
  // Es el mismo `inicio` y el mismo calendario, así que es consistente por construcción.
  const hastaMinima = avanzarHabilesCruzandoAnios(inicio, diasPlazo)
  if (!hastaMinima.ok) {
    return 'anioSinVerificar' in hastaMinima
      ? { ok: false, motivo: 'feriados_sin_verificar' }
      : { ok: false, motivo: 'sin_plazo' }
  }
  const minima = hastaMinima.fecha

  return {
    ok: true,
    ventana: {
      minima: aISO(minima),
      maxima: aISO(maxima),
      diasHabilesRecorridos: totalDiasHabiles,
    },
  }
}

/** Texto de semanas hábiles para imprimir. `plazoSemanas` es la única fuente. */
export function textoPlazoSemanas(plazoSemanas: number | null | undefined): string | null {
  if (typeof plazoSemanas !== 'number' || !Number.isInteger(plazoSemanas) || plazoSemanas <= 0) {
    return null
  }
  return plazoSemanas === 1
    ? '1 semana hábil'
    : `${plazoSemanas} semanas hábiles`
}

/**
 * Recuenda — a propósito — por qué NO hay un helper de "meses" acá. Se deja el comentario
 * para que nadie lo escriba después.
 */
export function redondearAMesesNoAplica(): never {
  throw new Error(
    'El plazo del contrato se expresa en semanas hábiles, no en meses. ' +
      'La convencion "1 mes = 4 semanas" no sirve en un contrato: 8 semanas NO son 2 meses ' +
      'calendario. Si necesitas meses para hablar con el cliente, usa la promesa comercial ' +
      'de 7 semanas del arnes, nunca la fecha contractual.',
  )
}
