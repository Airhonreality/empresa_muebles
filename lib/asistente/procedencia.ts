// lib/asistente/procedencia.ts
// Procedencia persistente (t-200 §5.1, decisión del director). Un id de entidad solo puede usarse en
// una escritura si una búsqueda del MISMO usuario lo devolvió en los últimos 60 minutos. La memoria
// del turno (Procedencia en herramientas.ts) no basta para MCP: cada petición es independiente.
//
// Se guarda en la tabla existente llamadas_herramienta_asistente, sin columnas nuevas:
//   usuario_id = usuario de la sesión · tipo = 'herramienta' · herramienta = nombre de la operación ·
//   entrada_resumen = 'procedencia' · resultado_resumen = el id (uuid sin etiquetas) · creada_en = ahora.
// Una fila por id devuelto. Una búsqueda sin resultados no escribe nada.
import type { TipoId } from './herramientas'

export const VENTANA_PROCEDENCIA_MS = 60 * 60 * 1000
export const ENTRADA_PROCEDENCIA = 'procedencia'

/**
 * Tipos de id que una operación deja como procedencia (lo que devuelve o lo que descubre al ejecutarse).
 * Una operación que no aparece aquí no deja procedencia persistente al leerla.
 */
export const TIPOS_DE_OPERACION: Readonly<Record<string, readonly TipoId[]>> = {
  'clientes.buscar': ['cliente'],
  'clientes.crear': ['cliente'],
  'catalogo.productos_buscar': ['producto'],
  'cotizacion.buscar': ['cotizacion'],
  'cotizacion.consultar': ['cotizacion', 'cliente', 'producto'],
  'finanzas.cuentas': ['cuenta'],
}

export interface FilaProcedencia {
  herramienta: string
  id: string
}

/** Almacén de procedencia persistente. La implementación Drizzle está en repositorio.ts. */
export interface RepositorioProcedencia {
  /** Guarda una fila por id. Lista vacía: no escribe nada. */
  registrar(usuarioId: string, filas: readonly FilaProcedencia[], creadaEn: Date): Promise<void>
  /** Filas de procedencia del usuario creadas desde `desde` (inclusive). Nunca mira otros usuarios. */
  vigentes(usuarioId: string, desde: Date): Promise<readonly FilaProcedencia[]>
}

/** Tipos de id que una fila guardada habilita, según la operación que la creó. */
export function tiposDeFila(herramienta: string): readonly TipoId[] {
  return TIPOS_DE_OPERACION[herramienta] ?? []
}

/** Ids descubiertos por una operación, sin repetir, listos para guardar. */
export function filasDeDescubrimiento(herramienta: string, descubiertos: readonly { id: string }[]): FilaProcedencia[] {
  const vistos = new Set<string>()
  const filas: FilaProcedencia[] = []
  for (const d of descubiertos) {
    if (vistos.has(d.id)) continue
    vistos.add(d.id)
    filas.push({ herramienta, id: d.id })
  }
  return filas
}
