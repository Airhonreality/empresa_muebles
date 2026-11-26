// lib/asistente/modelo.ts
// Único archivo del asistente que importa proveedores de modelo (@ai-sdk/*).
// Ningún otro archivo importa un proveedor directamente (verificar con grep).
//
// ASISTENTE_MODELO_DEFECTO = "<proveedor>/<id-del-modelo>", ej. "openrouter/qwen/qwen3-235b".
// Sin valor por defecto oculto: si falta o es inválido, error explícito.
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export type ProveedorAsistente = 'openrouter' | 'anthropic' | 'google'
const PROVEEDORES: readonly ProveedorAsistente[] = ['openrouter', 'anthropic', 'google']

/** Base verificada en https://openrouter.ai/docs (API compatible con OpenAI). */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export interface ModeloConfigurado {
  proveedor: ProveedorAsistente
  modelo: string
}

/** Lee ASISTENTE_MODELO_DEFECTO. Lanza si falta o no tiene la forma proveedor/modelo. */
export function modeloPorDefecto(): ModeloConfigurado {
  const valor = process.env.ASISTENTE_MODELO_DEFECTO
  if (!valor) {
    throw new Error('ASISTENTE_MODELO_DEFECTO no definida: indica proveedor/modelo (ej. openrouter/<id>).')
  }
  const corte = valor.indexOf('/')
  const proveedor = valor.slice(0, corte) as ProveedorAsistente
  const modelo = valor.slice(corte + 1)
  if (corte <= 0 || !PROVEEDORES.includes(proveedor) || modelo.trim() === '') {
    throw new Error('ASISTENTE_MODELO_DEFECTO inválida: se espera proveedor/modelo con proveedor openrouter|anthropic|google.')
  }
  return { proveedor, modelo }
}

/**
 * Devuelve el LanguageModel del SDK para una clave concreta. La clave llega ya descifrada
 * y nunca se registra ni se devuelve.
 */
export function obtenerModelo(clave: string, proveedor: ProveedorAsistente, modelo: string): LanguageModel {
  if (!clave) throw new Error('Falta la clave del proveedor.')
  if (!PROVEEDORES.includes(proveedor)) throw new Error('Proveedor de modelo desconocido.')
  if (!modelo.trim()) throw new Error('Falta el identificador del modelo.')
  switch (proveedor) {
    case 'openrouter':
      // .chat() fuerza el endpoint de chat completions (formato OpenAI).
      return createOpenAI({ apiKey: clave, baseURL: OPENROUTER_BASE_URL }).chat(modelo)
    case 'anthropic':
      return createAnthropic({ apiKey: clave })(modelo)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: clave })(modelo)
  }
}
