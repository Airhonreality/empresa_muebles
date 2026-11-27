// Estado y validación del formulario de configuración del asistente (sin React: se prueba aparte).
// Los mensajes coinciden con los del servidor (configuracion-esquema.ts) para que el administrador
// vea lo mismo antes y después de guardar.
import {
  ALERTA_FRACCION,
  MAX_TOKENS_RESPUESTA,
  PASOS_MAXIMOS_OPCIONES,
  TEMPERATURAS,
  TOPE_DIARIO_GLOBAL_USD,
  TOPE_DIARIO_USUARIO_USD,
} from '@/lib/asistente/opciones-configuracion'

export const CLASE_CONTROL =
  'min-h-[44px] w-full rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus'

export interface FormularioConfiguracion {
  proveedor: string
  modelo: string
  temperatura: string
  maxTokensRespuesta: string
  pasosMaximos: string
  topeDiarioUsuarioUsd: string
  topeDiarioGlobalUsd: string
  alertaFraccion: string
  herramientasHabilitadas: string[]
}

export const FORMULARIO_VACIO: FormularioConfiguracion = {
  proveedor: 'openrouter',
  modelo: '',
  temperatura: '',
  maxTokensRespuesta: '',
  pasosMaximos: '',
  topeDiarioUsuarioUsd: '',
  topeDiarioGlobalUsd: '',
  alertaFraccion: '',
  herramientasHabilitadas: [],
}

/** Modelo tal como lo devuelve GET /api/asistente/proveedores/[proveedor]/modelos. */
export interface ModeloLista {
  id: string
  nombre: string
  gratis: boolean
  precioPor1MEntradaUsd: number
  precioPor1MSalidaUsd: number
  contexto: number
}

type CampoOpcion = Exclude<keyof FormularioConfiguracion, 'proveedor' | 'modelo' | 'herramientasHabilitadas'>

/** Opciones permitidas por campo de selección (mismas listas que el servidor). */
export const OPCIONES: Record<CampoOpcion, readonly number[]> = {
  temperatura: TEMPERATURAS,
  maxTokensRespuesta: MAX_TOKENS_RESPUESTA,
  pasosMaximos: PASOS_MAXIMOS_OPCIONES,
  topeDiarioUsuarioUsd: TOPE_DIARIO_USUARIO_USD,
  topeDiarioGlobalUsd: TOPE_DIARIO_GLOBAL_USD,
  alertaFraccion: ALERTA_FRACCION,
}

const NOMBRE_CAMPO: Record<CampoOpcion, string> = {
  temperatura: 'la temperatura',
  maxTokensRespuesta: 'el máximo de la respuesta',
  pasosMaximos: 'los pasos máximos',
  topeDiarioUsuarioUsd: 'el tope diario por usuario',
  topeDiarioGlobalUsd: 'el tope diario global',
  alertaFraccion: 'la alerta',
}

/** Errores de validación en el orden en que aparecen en el formulario. Vacío = se puede guardar. */
export function erroresFormulario(f: FormularioConfiguracion, modelos: ModeloLista[] | null): string[] {
  const errores: string[] = []
  if (!f.modelo) errores.push('Elige un modelo de la lista')
  else if (!modelos?.some((m) => m.id === f.modelo)) errores.push('Modelo no disponible para este proveedor')
  for (const campo of Object.keys(OPCIONES) as CampoOpcion[]) {
    if (!OPCIONES[campo].some((o) => String(o) === f[campo])) errores.push(`Elige ${NOMBRE_CAMPO[campo]}`)
  }
  if (f.topeDiarioUsuarioUsd && f.topeDiarioGlobalUsd && Number(f.topeDiarioGlobalUsd) < Number(f.topeDiarioUsuarioUsd)) {
    errores.push('El tope global no puede ser menor que el tope por usuario')
  }
  return errores
}

/** Cuerpo de PUT /api/asistente/configuracion. Solo campos del esquema cerrado, con números reales. */
export function aCuerpo(f: FormularioConfiguracion) {
  return {
    proveedor: f.proveedor,
    modelo: f.modelo,
    temperatura: Number(f.temperatura),
    maxTokensRespuesta: Number(f.maxTokensRespuesta),
    pasosMaximos: Number(f.pasosMaximos),
    topeDiarioUsuarioUsd: Number(f.topeDiarioUsuarioUsd),
    topeDiarioGlobalUsd: Number(f.topeDiarioGlobalUsd),
    alertaFraccion: Number(f.alertaFraccion),
    herramientasHabilitadas: f.herramientasHabilitadas,
  }
}

/** Filtro de búsqueda del selector de modelos: nombre o identificador, sin distinguir mayúsculas ni tildes. */
export function coincide(modelo: ModeloLista, busqueda: string): boolean {
  const termino = normalizar(busqueda)
  if (!termino) return true
  return normalizar(modelo.nombre).includes(termino) || normalizar(modelo.id).includes(termino)
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es')
}

/** Texto de precio para la lista: "Gratis" o "$0.5 entrada · $1.5 salida por 1M tokens". */
export function textoPrecio(m: ModeloLista): string {
  if (m.gratis) return 'Gratis'
  return `$${m.precioPor1MEntradaUsd} entrada · $${m.precioPor1MSalidaUsd} salida por 1M tokens`
}
