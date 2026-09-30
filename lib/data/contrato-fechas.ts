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
