// lib/asistente/configuracion-esquema.ts
// Esquema CERRADO de la configuración del asistente (S3). Todo campo es de selección: no hay texto
// libre salvo el identificador del modelo, que S2 valida contra el catálogo del proveedor, y la
// clave del proveedor, que vive en otra ruta. Campo desconocido -> error (.strict()).
// Las reglas de seguridad del prompt NO son configurables: no existe ningún campo para ellas.
import { z } from 'zod'
import {
  ALERTA_FRACCION,
  MAX_TOKENS_RESPUESTA,
  PASOS_MAXIMOS_OPCIONES,
  PROVEEDORES_CONFIGURABLES,
  TEMPERATURAS,
  TOPE_DIARIO_GLOBAL_USD,
  TOPE_DIARIO_USUARIO_USD,
} from './opciones-configuracion'

const MENSAJE_OPCION = 'Valor no permitido'

/** Selector numérico cerrado: solo acepta los valores de la lista (no cadenas como "0.2"). */
function opcionNumerica<const T extends number>(valores: readonly T[]) {
  const literales = valores.map((v) => z.literal(v, { error: MENSAJE_OPCION }))
  return z.union(literales as unknown as [z.ZodLiteral<T>, z.ZodLiteral<T>, ...z.ZodLiteral<T>[]], { error: MENSAJE_OPCION })
}

export const esquemaConfiguracion = z
  .strictObject({
    proveedor: z.enum(PROVEEDORES_CONFIGURABLES, { error: MENSAJE_OPCION }),
    modelo: z.string().trim().min(1, 'Elige un modelo de la lista').max(200),
    temperatura: opcionNumerica(TEMPERATURAS),
    maxTokensRespuesta: opcionNumerica(MAX_TOKENS_RESPUESTA),
    pasosMaximos: opcionNumerica(PASOS_MAXIMOS_OPCIONES),
    topeDiarioUsuarioUsd: opcionNumerica(TOPE_DIARIO_USUARIO_USD),
    topeDiarioGlobalUsd: opcionNumerica(TOPE_DIARIO_GLOBAL_USD),
    alertaFraccion: opcionNumerica(ALERTA_FRACCION),
    herramientasHabilitadas: z
      .array(z.string().min(1).max(120), { error: 'Lista de herramientas inválida' })
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Herramienta repetida'),
  }, { error: 'Campo no permitido en la configuración del asistente' })
  .refine((c) => c.topeDiarioGlobalUsd >= c.topeDiarioUsuarioUsd, {
    message: 'El tope global no puede ser menor que el tope por usuario',
    path: ['topeDiarioGlobalUsd'],
  })

export type ConfiguracionAsistenteCuerpo = z.infer<typeof esquemaConfiguracion>
