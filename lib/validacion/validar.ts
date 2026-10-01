// Wrapper único de validación runtime en el borde de escritura (Server Actions). Base de la
// Fase 3 del diagnóstico de UI del cotizador (2026-09-30): las acciones de escritura confiaban
// solo en tipos TypeScript, que desaparecen en runtime — un payload malformado entraba crudo al
// `update`/`insert` sin que nada lo rechazara antes de tocar la DB (ver el incidente real de
// "numeric field overflow" documentado en lib/data/actions/core.ts, 2026-09-11).
//
// Retoma el plan archivado `arnes/lineas/ola7/tecnico/plan_zod_validacion_runtime.md` (rama
// `arnes-historico-fase0`, nunca ejecutado): un schema por dominio, tipo derivado con `z.infer`
// (cero re-declaración manual), prioridad por riesgo (dinero/contratos primero).
import { z } from 'zod'

/** Valida `dato` contra `schema`; devuelve el dato tipado o lanza un Error con el primer
 *  problema encontrado, en español, con la ruta exacta del campo que falló. */
export function validarEntrada<T>(schema: z.ZodType<T>, dato: unknown): T {
  const resultado = schema.safeParse(dato)
  if (!resultado.success) {
    const primero = resultado.error.issues[0]
    const camino = primero.path.length > 0 ? primero.path.join('.') : '(raíz)'
    throw new Error(`Entrada inválida: ${camino} — ${primero.message}`)
  }
  return resultado.data
}
