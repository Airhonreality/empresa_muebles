/**
 * t-170: ordinales de las cláusulas del contrato, calculados sobre las cláusulas que QUEDAN.
 *
 * Por qué módulo aparte y no una lista de strings en la página: el numeral de un contrato no
 * es fijo. El numeral SEXTA (penalidad del 5 %) se puede apagar desde el modal, y si los
 * ordinales estuvieran escritos a mano, apagarlo dejaba un hueco — QUINTA y luego SÉPTIMA— que
 * en un documento firmado se lee como página perdida. Con la lista en el código, apagar la
 * cláusula renumera sola todo lo que va después.
 *
 * Las CLAUSULAS se identifican por clave semántica y no por su ordinal ("GARANTIA", no
 * "SEPTIMA") justamente para eso: con la penalidad apagada, GARANTIA pasa a ser el numeral
 * SEXTA y la clave sigue siendo la misma. Si la clave fuera el ordinal, el código del
 * contrato tendría que renombrar variables cada vez que se apaga una cláusula.
 *
 * Los textos de las cláusulas conservan la forma que ya traían en el original del cliente
 * (SÉPTIMA, DÉCIMA, UNDÉCIMA), así que acá van las mismas palabras y lo único que se recalcula
 * es la posición.
 */

/** Las cláusulas del contrato, en el orden en que se imprimen. */
export const CLAUSULAS = [
  'OBJETO',
  'ALCANCE',
  'PLAZOS',
  'ENTREGA',
  'ADICIONALES',
  'PENALIDAD',
  'PENALIDAD_DEFINITIVA',
  'GARANTIA',
  'SITIO_Y_FUERZA_MAYOR',
  'PAGOS',
  'CORRESPONSABILIDAD',
  'MERITO',
] as const

export type ClaveClausula = (typeof CLAUSULAS)[number]

/**
 * t-176: "OCTAVA", no "OCTAVO". Todas las cláusulas de este contrato son femeninas ("cláusula
 * GARANTÍA"), así que todos los ordinales son femeninos. Estaba escrito "OCTAVO" y no se notaba,
 * porque el numeral octavo lo ocupaba la cláusula de DESMONTE, que es masculina; cuando esa se
 * quitó, la de garantía pasó a ese lugar y el contrato imprimió "OCTAVO. GARANTÍA DEL SERVICIO".
 * Un ordinal mal escrito en un documento firmado es de esas cosas que se ven.
 */
/** La palabra de cada posición. El índice es la posición, no la clave. */
const ORDINALES = [
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'CUARTA',
  'QUINTA',
  'SEXTA',
  'SÉPTIMA',
  'OCTAVA',
  'NOVENA',
  'DÉCIMA',
  'UNDÉCIMA',
  'DUODÉCIMA',
] as const

/**
 * t-176: qué cláusulas se imprimen. Las dos FLAGS son obligatorias a propósito.
 *
 * Antes era un solo booleano posicional. Con dos cláusulas condicionales, dos `boolean` seguidos
 * en la firma son indistinguibles al leer la llamada (`ordinalesClausulas(true, false)` no dice
 * cuál es cuál) y un argumento olvidado no da error de tipos: TypeScript compila, y el numeral
 * sale mal. Un objeto con los dos nombres hace que el compilador exija los dos.
 */
export type ClausulasQueSeImprimen = {
  /** Retención del 5 % por mora e incumplimiento de la Propuesta. */
  penalidad: boolean
  /**
   * t-176: penalidad del 10 % por incumplimiento definitivo, abandono de obra o falta de pago
   * del anticipo. Va en un switch APARTE a propósito, y no por gusto del diseño: la penalidad
   * del 5 % protege al Contratante de nosotros, y la del 10 % es bilateral — también es lo que
   * nos permite cobrarle al Contratante que no paga el anticipo. Si compartieran el switch,
   * apagar el 5 % (que existe para quitarle al cliente nuestra exposición) borraría también la
   * cláusula que nos protege a nosotros. Además el propio texto del 5 % dice que "no se acumula
   * con penalidades de otra naturaleza": un 10 % en el mismo numeral sería contradictorio.
   */
  penalidadDefinitiva: boolean
}

/**
 * Ordinal que lleva cada cláusula en el documento que se va a imprimir.
 *
 * La clave de la cláusula que no se imprime devuelve `null` — no una palabra: una referencia
 * cruzada a una cláusula ausente tiene que desaparecer del texto, no quedar apuntando a nada.
 * Quien use esto tiene que decidir explícitamente qué hacer con ese `null`.
 */
export function ordinalesClausulas(
  imprime: ClausulasQueSeImprimen,
): Record<ClaveClausula, string | null> {
  const condicional: Record<string, boolean> = {
    PENALIDAD: imprime.penalidad,
    PENALIDAD_DEFINITIVA: imprime.penalidadDefinitiva,
  }
  const salida = {} as Record<ClaveClausula, string | null>
  let posicion = 0
  for (const clave of CLAUSULAS) {
    if (clave in condicional && !condicional[clave]) {
      salida[clave] = null
      continue
    }
    salida[clave] = ORDINALES[posicion] ?? null
    posicion++
  }
  return salida
}
