/**
 * t-173: texto del plazo de ejecución, derivado del número.
 *
 * ⚠️ Este archivo antes tenía el cálculo de la fecha de entrega: contaba días hábiles saltando
 * sábados, domingos y festivos, con un calendario oficial por año (`feriados-colombia.ts`). Se
 * BORRÓ entero. Dos razones, y la segunda es la que importa:
 *
 * 1. Para que el cálculo no fallara había que mantener el calendario de festivos de Colombia de
 *    cada año, verificado contra el documento oficial. Es una dependencia externa que el sistema
 *    no controla, y el cliente se preguntaba legítimamente de dónde salían tantos bloqueos por
 *    causa de los festivos.
 * 2. El día que faltara un año, el contrato salía SIN fecha de entrega, y esa fecha es la que
 *    sostiene la retención del 5 %: sin ella, la cláusula de mora no tenía contra qué aplicarse.
 *    Es decir, la dependencia no solo era una molestia: era un agujero en el contrato.
 *
 * La fecha de entrega es ahora un campo de texto (`contratos.fecha_entrega_maxima`) que se escribe
 * en el modal y se imprime tal cual. Un dato que alguien responsiblemente confirma es más
 * confiable que uno que depende de una tabla que hay que actualizar cada año.
 */

/** 'AAAA-MM-DD' no entra acá: esto es solo el plazo en semanas, que sí se deriva del número. */

/**
 * El plazo pactado, en texto, desde el número. `null` si no hay número entero positivo, para que
 * quien lo use decida el fallback en vez de inventar "4 semanas".
 */
export function textoPlazoSemanas(plazoSemanas: number | null | undefined): string | null {
  if (typeof plazoSemanas !== 'number' || !Number.isInteger(plazoSemanas) || plazoSemanas <= 0) {
    return null
  }
  return plazoSemanas === 1
    ? '1 semana hábil'
    : `${plazoSemanas} semanas hábiles`
}

// ── Fecha de entrega sugerida ───────────────────────────────────────────────────────
//
// Se cuenta en días hábiles de LUN A VIENNES y nada más. Sin festivos, sin Semana Santa, sin
// calendario oficial por año — y por lo tanto sin ninguna dependencia externa que pueda faltar y
// dejar el contrato sin fecha. Es lo que el cliente pidió: la fecha tiene que salir siempre.
//
// ⚠️ Lo que se pierde: los festivos colombianos (Ley Emiliani, los de Semana Santa, el lunes de
// octubre) NO se descuentan. Un plazo de 8 semanas termina, en el papel, 1 o 2 días antes de
// terminar en la realidad, porque cada festivo es un día que no avanza el contador pero sí ocupa
// calendario. Quien lea esto debe saber que la fecha es una SUGERENCIA y no un compromiso
// automático irrevocable: por eso el modal la deja editable.
//
// ⚠️ La base es la fecha de FIRMA del contrato, no la fecha de hoy. Si la base fuera "hoy", la
// fecha de entrega se movería cada día que se abre el modal, y un contrato que se reimprime la
// semana que viene tendría otra fecha de entrega. Eso no puede pasar.

const MS_POR_DIA = 86_400_000

/** 'AAAA-MM-DD' → Date en UTC, o null si no es una fecha completa y válida. */
function parsearISO(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const anio = Number(m[1]); const mes = Number(m[2]); const dia = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const d = new Date(Date.UTC(anio, mes - 1, dia))
  // Rechaza 2026-02-31 y similares: al construir la fecha, el día se desborda al mes siguiente.
  if (d.getUTCFullYear() !== anio || d.getUTCMonth() + 1 !== mes || d.getUTCDate() !== dia) return null
  return d
}

function esSabadoODomingo(d: Date): boolean {
  const dow = d.getUTCDay()
  return dow === 0 || dow === 6
}

/**
 * Fecha de entrega SUGERIDA: `fechaFirma` + `plazoSemanas` semanas hábiles de lunes a viernes.
 *
 * Devuelve 'AAAA-MM-DD', o `null` si falta la fecha de firma o el plazo no es un entero positivo.
 * `null` en vez de una fecha inventada: el modal trata el null como "no hay sugerencia" y deja el
 * campo vacío para que lo escriba la persona.
 */
export function sugerirFechaEntrega(
  fechaFirma: string | null | undefined,
  plazoSemanas: number | null | undefined,
): string | null {
  const inicio = parsearISO(fechaFirma)
  if (!inicio) return null
  if (typeof plazoSemanas !== 'number' || !Number.isInteger(plazoSemanas) || plazoSemanas <= 0) {
    return null
  }

  const diasHabiles = plazoSemanas * 5
  const cursor = new Date(inicio.getTime())
  let restantes = diasHabiles
  // Tope defensivo: 10 años de días hábiles. Si un plazo fuera absurdo, esto corta en vez de
  // dejar el cursor girando.
  const limite = 10 * 366
  let pasos = 0

  while (restantes > 0) {
    cursor.setTime(cursor.getTime() + MS_POR_DIA)
    pasos++
    if (pasos > limite) return null
    if (esSabadoODomingo(cursor)) continue
    restantes--
  }
  return cursor.toISOString().slice(0, 10)
}
