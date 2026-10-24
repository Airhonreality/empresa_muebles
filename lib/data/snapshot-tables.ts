import type { StoreSnapshot } from './snapshot'

type SnapshotArrayKey = {
  [K in keyof StoreSnapshot]: StoreSnapshot[K] extends readonly unknown[] ? K : never
}[keyof StoreSnapshot]

export const CAMPOS_SNAPSHOT = {
  proyectos: 'proyectos',
  clientes: 'clientes',
  espacio_variantes: 'espacios',
  items_variante: 'items',
  espacios_artefactos: 'artefactos',
  productos_catalogo: 'catalogo',
  parametros: 'parametros',
  contratos: 'contratos',
  hitos_pago: 'hitos',
  proyectos_estados_historial: 'proyectosEstadosHistorial',
  cronogramas: 'cronogramas',
  cronograma_etapas: 'cronogramaEtapas',
  desfases_cronograma: 'desfases',
  checks_produccion: 'checks',
  novedades_criticas: 'novedades',
  comunicaciones_progreso: 'comunicaciones',
  schemas_proyecto: 'schemas',
  bom_material: 'bom',
  verificaciones: 'verificaciones',
  retomas: 'retomas',
  cambios_contrato: 'cambiosContrato',
  personas: 'personas',
  personas_roles: 'personasRoles',
  modulos: 'modulos',
  estimaciones: 'estimaciones',
  ordenes_trabajo: 'ordenesTrabajo',
  pedidos_web: 'pedidosWeb',
  citaciones_calidad: 'citacionesCalidad',
  reprocesos: 'reprocesos',
  instalaciones: 'instalaciones',
  actas_entrega: 'actasEntrega',
  casos_garantia: 'casosGarantia',
  citas_garantia: 'citasGarantia',
  cuentas_financieras: 'cuentasFinancieras',
  movimientos_financieros: 'movimientosFinancieros',
  obligaciones_pendientes: 'obligacionesPendientes',
  proveedores: 'proveedores',
  bancos: 'bancos',
  proveedor_cuentas_bancarias: 'proveedoresCuentasBancarias',
  ordenes_compra: 'ordenesCompra',
  registros_gate_caja: 'registrosGateCaja',
  cuentas_cobro_proveedor: 'cuentasCobroProveedor',
  categorias: 'categorias',
  productos_tienda: 'productosTienda',
  productos_tienda_componentes: 'productosTiendaComponentes',
  catalogo_acabados: 'catalogoAcabados',
  catalogo_producto_acabados: 'catalogoProductoAcabados',
  acabados_muestras: 'acabadosMuestras',
  portafolio: 'portafolio',
  renders_conceptuales: 'rendersConceptuales',
  atributos_tecnicos: 'atributosTecnicos',
  catalogo_espacios_arquitectonicos: 'catalogosEspaciosArquitectonicos',
  modulos_artefactos: 'modulosArtefactos',
  bitacora_articulos: 'bitacoraArticulos',
  testimonios: 'testimonios',
  items_orden_compra: 'itemsOrdenCompra',
  recepciones_material: 'recepcionesMaterial',
  herramientas: 'herramientas',
  documentos_proyecto: 'documentosProyecto',
  grupos_item: 'gruposItem',
  espacio_variante_acabados: 'espacioVarianteAcabados',
} as const satisfies Record<string, SnapshotArrayKey>

export type SnapshotTable = keyof typeof CAMPOS_SNAPSHOT
export type SnapshotListKey = SnapshotArrayKey

export const TABLAS_IGNORADAS = [
  'roles',
  'leads',
  'portfolio_publico',
  'imagenes_portfolio',
  'tareas_produccion',
  'usuarios',
  'parametros_historial',
  'eventos',
  'procedencia',
  'audit_logs',
  'notas_reunion',
  'propuestas_versiones',
  'eventos_conversion_offline',
] as const

const CAMPOS_LISTA = new Set<string>(Object.values(CAMPOS_SNAPSHOT))

export const TABLAS_CONOCIDAS: ReadonlySet<string> = new Set<string>([
  ...Object.keys(CAMPOS_SNAPSHOT),
  ...TABLAS_IGNORADAS,
])

export function esCampoSnapshotLista(campo: string): campo is SnapshotListKey {
  return CAMPOS_LISTA.has(campo)
}

export function campoDeTabla(tabla: string): SnapshotListKey | undefined {
  return CAMPOS_SNAPSHOT[tabla as SnapshotTable]
}

export interface SnapshotTableUpdate {
  tabla: string
  campo: SnapshotListKey
  filas: unknown[]
}

export interface SnapshotTableResult {
  tabla: string
  ok: boolean
  motivo?: 'unmapped' | 'ignorada' | 'error'
  campo?: SnapshotListKey
  filas?: unknown[]
  error?: string
}

export interface SnapshotTablesResponse {
  version: string
  tablas: SnapshotTableResult[]
}

export function updatesDesdeResultados(
  resultados: readonly SnapshotTableResult[],
): { updates: SnapshotTableUpdate[]; requiereCompleto: boolean } {
  const updates: SnapshotTableUpdate[] = []
  for (const resultado of resultados) {
    if (!resultado.ok) return { updates: [], requiereCompleto: true }
    if (resultado.motivo === 'ignorada') continue
    if (resultado.campo && resultado.filas) {
      updates.push({ tabla: resultado.tabla, campo: resultado.campo, filas: resultado.filas })
    }
  }
  return { updates, requiereCompleto: false }
}

export function aplicarTablasSnapshot(
  snapshot: StoreSnapshot,
  updates: readonly SnapshotTableUpdate[],
  version?: string,
): StoreSnapshot {
  const siguiente = { ...snapshot }
  const registro = siguiente as unknown as Record<string, unknown>
  for (const update of updates) {
    if (!esCampoSnapshotLista(update.campo)) continue
    registro[update.campo] = update.filas
  }
  if (version) siguiente.version = version
  return siguiente
}
