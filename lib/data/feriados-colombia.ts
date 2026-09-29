/**
 * Feriados de Colombia, para el cálculo de "días hábiles" contractual.
 *
 * ⚠️ POR QUÉ ESTE ARCHIVO ES DATO Y NO REGLA
 *
 * Una fecha máxima de entrega es una fecha CONTRACTUAL: de ella depende una retención de mora
 * (0,5% del valor por semana, tope 5%). Si el calendario de hábiles está mal, la fecha
 * impresa está mal y es disputa.
 *
 * Los festivos colombianos se dividen en dos familias con naturalezas opuestas:
 *
 * - Los FIJOS (1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic) no se mueven nunca.
 *   Se calculan, no hay nada que decidir.
 * - Los TRASLADADOS por la Ley Emiliani (Ley 51 de 1983) se mueven "al siguiente lunes", y
 *   esa regla choca entre sí: si el lunes siguiente ya es feriado, el otro se va al lunes
 *   siguiente a ese; y el "lunes de octubre" tiene una regla propia (art. 2) que además
 *   depende de si el 12 de octubre ya está ocupado. El resultado final NO se puede calcular
 *   con una fórmula confiable: hay que resolverlo año por año contra el calendario que
 *   publica el gobierno.
 *
 * Por eso los traslados viven en `TRASLADOS_LEY_EMILIANI`, una tabla POR AÑO, y por eso la
 * tabla se entrega VACÍA y con `verificado: false`.
 *
 * QUÉ HAY QUE HACER CADA AÑO (~10 minutos, una vez al año):
 *   1. Consultar el calendario oficial de festivos publicado por el gobierno.
 *   2. Copiar las 8 fechas de traslado de ese año al array de abajo, en formato 'AAAA-MM-DD'.
 *   3. Poner `verificado: true` y `fuente` con el nombre del documento oficial.
 *
 * Mientras un año no esté en la tabla, `feriadosDe()` devuelve `verificado: false` y el
 * contrato NO imprime fecha máxima de entrega: se imprime el plazo en semanas, que siempre
 * es válido, y se omite la fecha. Es un fallo a propósito — es preferible no imprimir la
 * fecha antes que imprimir una fecha equivocada.
 *
 * Lo que sí se calcula aquí, y es exacto: la familia de Semana Santa, vía *computus*
 * gregoriano (el algoritmo anónimo de Butcher/Gauss, 15 líneas). Esa parte no se таблиa
 * porque no tiene nada ambiguo.
 */

/**
 * Festivos de fecha INMOVIL: los 6 que la Ley Emiliani no toca. Son los únicos que se pueden
 * calcular sin mirar el calendario oficial.
 *
 * ⚠️ ACÁ NO VA NINGÚN FESTIVO TRASLADABLE, NI SIQUIERA "POR SI ACASO".
 *
 * El error fácil —y el que se cometió en la primera versión de este archivo— es poner aquí
 * los 13 („son los 13 de siempre"). El efecto es que un festivo trasladado sigue siendo
 * festivo en su fecha original: se cuenta como festivo el jueves de Corpus Christi Y el lunes
 * al que se traslada, o el 6 de enero y el lunes siguiente. Eso produce dos días hábiles de
 * más, y por lo tanto una fecha máxima de entrega más lejos de la real. Como esa fecha sostiene
 * una retención de mora, no es un detalle: es un error que se descubre en una disputa.
 *
 * Lo correcto es: los inmóviles se calculan, los trasladables salen SOLO de la tabla anual.
 */
const FESTIVOS_FIJOS: ReadonlyArray<{ mes: number; dia: number; nombre: string }> = [
  { mes: 1, dia: 1, nombre: 'Año Nuevo' },
  { mes: 5, dia: 1, nombre: 'Día del Trabajo' },
  { mes: 7, dia: 20, nombre: 'Día de la Independencia' },
  { mes: 8, dia: 7, nombre: 'Batalla de Boyacá' },
  { mes: 12, dia: 8, nombre: 'Inmaculada Concepción' },
  { mes: 12, dia: 25, nombre: 'Navidad' },
]

/**
 * Los 7 que la Ley Emiliani (Ley 51 de 1983) traslada, más el "lunes de octubre", que es un
 * festivo propio con regla propia (art. 2). Se listan para poder decirle al usuario exactamente
 * qué le falta cuando un año no está verificado — su fecha FINAL va en la tabla de abajo, nunca
 * aquí.
 *
 * `desdePascua` marca los que no se leen en un calendario mensual sino que hay que derivarlos de
 * la Pascua (hoy solo Corpus Christi); en esos `mes`/`dia` van en `null`.
 */
export const FESTIVOS_TRASLADADOS: ReadonlyArray<{
  nombre: string
  mes: number | null
  dia: number | null
  desdePascua: number | null
}> = [
  { nombre: 'Día de los Reyes Magos', mes: 1, dia: 6, desdePascua: null },
  { nombre: 'San José', mes: 3, dia: 19, desdePascua: null },
  { nombre: 'Corpus Christi', mes: null, dia: null, desdePascua: 60 },
  { nombre: 'San Pedro y San Pablo', mes: 6, dia: 29, desdePascua: null },
  { nombre: 'Lunes de octubre (Día de la Raza de Galicia)', mes: 10, dia: 14, desdePascua: null },
  { nombre: 'Día de la Raza', mes: 10, dia: 12, desdePascua: null },
  { nombre: 'Día de Todos los Santos', mes: 11, dia: 1, desdePascua: null },
  { nombre: 'Independencia de Cartagena', mes: 11, dia: 11, desdePascua: null },
]

/**
 * Feriados que se mueven con la Luna y que NO se trasladan: los tres de Semana Santa. Son los
 * únicos que se calculan por *computus* y se aplican directo.
 *
 * ⚠️ Ascensión (+39) NO es un festivo en Colombia: no va acá. ⚠️ Corpus Christi (+60) SÍ es
 * festivo, pero la Ley Emiliani lo traslada al lunes siguiente, así que tampoco va acá — se
 * calcula solo como pista para la tabla (ver `pistaCorpusChristi`).
 *
 * Carnaval lunes/martes/miércoles: solo el LUNES es festivo. Martes y miércoles no lo son.
 */
const DESPLAZAMIENTO_SANTA_PASCUA: ReadonlyArray<{ dias: number; nombre: string }> = [
  { dias: -48, nombre: 'Lunes de Carnaval' },
  { dias: -3, nombre: 'Jueves Santo' },
  { dias: -2, nombre: 'Viernes Santo' },
]

/**
 * Fecha litúrgica de Corpus Christi del año, como PISTA para llenar la tabla de traslados: el
 * festivo legal no cae ese día sino en el lunes que le asigna la Ley Emiliani, y esa asignación
 * depende de si el lunes siguiente ya está ocupado — que es exactamente lo que no se puede
 * calcular y por eso la tabla es manual.
 */
export function pistaCorpusChristi(anio: number): Date {
  return sumarDias(domingosDePascua(anio), 60)
}

/** Un año verificado contra el calendario oficial. Agregar uno por año (ver cabecera). */
export interface TrasladosAnio {
  anio: number
  /** `true` solo cuando alguien confirmó estas fechas contra el calendario oficial. */
  verificado: boolean
  /** Nombre/fecha del documento oficial usado como fuente. */
  fuente: string | null
  /**
   * Las fechas FINALES a las que quedaron trasladadas las fechas festivas, en
   * 'AAAA-MM-DD' y en cualquier orden (el módulo las normaliza). Incluye el lunes de octubre.
   */
  fechas: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ VACÍA A PROPÓSITO. Ver la cabecera del archivo antes de agregarle un año.
// ─────────────────────────────────────────────────────────────────────────────
export const TRASLADOS_LEY_EMILIANI: readonly TrasladosAnio[] = []

// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoFeriados {
  anio: number
  /** Todas las fechas festivas del año, 'AAAA-MM-DD', ordenadas ascendente. */
  fechas: string[]
  /** Si el año tiene sus traslados confirmados contra el calendario oficial. */
  verificado: boolean
  /** Nombres de los traslados que faltan confirmar mientras `verificado === false`. */
  pendientes: string[]
  fuente: string | null
}

/** `Date` en UTC para que el día no se corra por zona horaria. */
function fechaUTC(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia))
}

function aISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function sumarDias(d: Date, dias: number): Date {
  return new Date(d.getTime() + dias * 86_400_000)
}

/**
 * Domingo de Resurrección, *computus* gregoriano (algoritmo anónimo, el mismo que usa la
 * liturgia y `date -e`). Verificado en `feriados-colombia.test.ts` contra 2024–2028.
 */
export function domingosDePascua(anio: number): Date {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return fechaUTC(anio, mes, dia)
}

/** Feriados calculables sin ambigüedad: fijos + familia de Semana Santa. */
function baseCalculable(anio: number): Set<string> {
  const base = new Set<string>()
  for (const f of FESTIVOS_FIJOS) base.add(aISO(fechaUTC(anio, f.mes, f.dia)))
  const pascua = domingosDePascua(anio)
  for (const d of DESPLAZAMIENTO_SANTA_PASCUA) base.add(aISO(sumarDias(pascua, d.dias)))
  return base
}

/**
 * Feriados de un año.
 *
 * `TRASLADOS_LEY_EMILIANI[].fechas` son fechas FINALES, tal como salen del calendario oficial.
 * Se aplican tal cual: NO se las "corrige" moviéndolas.
 *
 * ⚠️ Por qué no hay una cascada de "+7 días hasta que el lunes esté libre": la primera versión
 * de este archivo la tenía, y estaba mal por partida doble. (1) Una fecha que la tabla ya
 * entrega como final se desplazaba sola, así que corregir un error de tipeo en la tabla
 * introducía un error distinto y silencioso. (2) La regla real no es "el siguiente lunes
 * libre": la Ley Emiliani se aplica año por año y hay años en que un festivo cae en su propia
 * fecha sin moverse, y el lunes de octubre tiene su propia regla. Reproducir eso con un bucle es
 * inventar una fuente de verdad paralela a la del gobierno. La tabla es la fuente; el código
 * solo la aplica.
 */
export function feriadosDe(anio: number): ResultadoFeriados {
  const base = baseCalculable(anio)
  const registro = TRASLADOS_LEY_EMILIANI.find((t) => t.anio === anio)

  if (registro) {
    for (const f of registro.fechas) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) continue
      base.add(f)
    }
  }

  return {
    anio,
    fechas: [...base].sort(),
    verificado: registro?.verificado === true,
    pendientes: registro?.verificado === true ? [] : FESTIVOS_TRASLADADOS.map((f) => f.nombre),
    fuente: registro?.fuente ?? null,
  }
}

/** Versión sin metadatos, para los cálculos de días hábiles. */
export function conjuntoFeriados(anio: number): Set<string> {
  return new Set(feriadosDe(anio).fechas)
}
