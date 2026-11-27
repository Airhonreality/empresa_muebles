// lib/asistente/opciones-configuracion.ts
// Listas cerradas del panel de configuración del asistente. Fuente única: la usan el esquema del
// servidor (configuracion-esquema.ts) y el formulario de la UI. Sin dependencias: se puede importar
// desde componentes cliente.
export const PROVEEDORES_CONFIGURABLES = ['openrouter'] as const

export const TEMPERATURAS = [0, 0.2, 0.5, 0.7, 1] as const
export const MAX_TOKENS_RESPUESTA = [512, 1024, 2048, 4096] as const
export const PASOS_MAXIMOS_OPCIONES = [4, 8, 12] as const
export const TOPE_DIARIO_USUARIO_USD = [1, 5, 10, 25, 50] as const
export const TOPE_DIARIO_GLOBAL_USD = [10, 50, 100, 250, 500] as const
export const ALERTA_FRACCION = [0.5, 0.8, 0.9] as const

/** Longitud mínima y máxima de la clave del proveedor y de su etiqueta (servidor y UI). */
export const CLAVE_MIN_CARACTERES = 20
export const ETIQUETA_MAX_CARACTERES = 40
