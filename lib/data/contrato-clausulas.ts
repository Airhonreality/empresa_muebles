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

/** Las cláusulas del contrato, en el orden en que se imprimen. `PENALIDAD` es la condicional. */
export const CLAUSULAS = [
  'OBJETO',
  'ALCANCE',
  'PLAZOS',
  'ENTREGA',
  'ADICIONALES',
  'PENALIDAD',
  'GARANTIA',
  'DESMONTE',
  'PAGOS',
  'CORRESPONSABILIDAD',
  'MERITO',
] as const

export type ClaveClausula = (typeof CLAUSULAS)[number]

/** La palabra de cada posición. El índice es la posición, no la clave. */
const ORDINALES = [
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'CUARTA',
  'QUINTA',
  'SEXTA',
  'SÉPTIMA',
  'OCTAVO',
  'NOVENA',
  'DÉCIMA',
  'UNDÉCIMA',
] as const

/**
 * Ordinal que lleva cada cláusula en el documento que se va a imprimir.
 *
 * La clave de la cláusula que no se imprime devuelve `null` — no una palabra: una referencia
 * cruzada a una cláusula ausente tiene que desaparecer del texto, no quedar apuntando a nada.
 * Quien use esto tiene que decidir explícitamente qué hacer con ese `null`.
 */
export function ordinalesClausulas(incluyePenalidad: boolean): Record<ClaveClausula, string | null> {
  const salida = {} as Record<ClaveClausula, string | null>
  let posicion = 0
  for (const clave of CLAUSULAS) {
    if (clave === 'PENALIDAD' && !incluyePenalidad) {
      salida[clave] = null
      continue
    }
    salida[clave] = ORDINALES[posicion] ?? null
    posicion++
  }
  return salida
}
