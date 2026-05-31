// ============================================================
// AUTO-GENERATED — do not edit manually.
// Source: .\storage\empresa-2\db\schema_definitions.json
// Run:    npm run agnostic:compile
// Generated: 2026-05-30T23:27:57.817Z
// ============================================================

// DataItem is the universal record wrapper used by the engine.
// id: crypto.randomUUID() — never Math.random() or Date.now()
// context: matches schema.name and the data file name (without .json)
export interface AgnosticDataItem<T = Record<string, unknown>> {
  id: string
  context: string
  data: T
  created_at?: string
  updated_at?: string
}

// ─── Schema: "espacio_variantes" — primary field: "nombre_variante" 
export interface EspacioVariantes {
  cotizacion_id: string  // Cotizacion Perteneciente
  nombre_espacio: string  // Nombre del Espacio (e.g. Cocina)
  nombre_variante: string  // Nombre de la Variante / Alternativa
  activa?: boolean  // Variante Seleccionada para Cotizacion
  jornadas_desarrollo_tecnico?: number  // Jornadas de Desarrollo Tecnico (Dias)
  jornadas_ensamblaje_taller?: number  // Jornadas de Ensamblaje en Taller (Dias)
  jornadas_instalacion_obra?: number  // Jornadas de Instalacion en Obra (Dias)
  notas_markdown?: string  // Notas en Markdown
}

export type EspacioVariantesRecord = AgnosticDataItem<EspacioVariantes>

// ─── Schema: "items_variante" 
export interface ItemsVariante {
  variante_id: string  // Variante Perteneciente
  catalogo_id: string  // Seleccionar del Catalogo de Insumos
  unidad_medida?: string  // Unidad de Medida
  cantidad: number  // Cantidad / Medida
  precio_unitario: number  // Precio Unitario ($)
  total_linea?: number  // Total Material ($)
  origen_prefabricado_id?: string  // Origen Prefabricado
  imagen_url?: string  // URL de Imagen del Ítem
}

export type ItemsVarianteRecord = AgnosticDataItem<ItemsVariante>

// ─── Schema: "productos_catalogo" — primary field: "descripcion" 
export interface ProductosCatalogo {
  sku?: string  // SKU
  tipo?: string  // Tipo
  descripcion: string  // DescripciÃ³n
  unidad_medida?: string  // Unidad de Medida (Um)
  ancho?: string  // Ancho
  alto?: string  // Alto
  profundo?: string  // Profundo
  stock_actual?: number  // Stock Actual
  precio_directo?: number  // Precio Directo
  precio_publico?: number  // Precio PÃºblico
  imagen_url?: string  // Imagen (URL)
  modelo_3d?: string  // Modelo 3D (.glb / .obj)
  url_referencia?: string  // URL de Referencia / Ficha
  proveedor?: string  // Proveedor
}

export type ProductosCatalogoRecord = AgnosticDataItem<ProductosCatalogo>

// ─── Schema: "imagenes_espacio" 
export interface ImagenesEspacio {
  espacio_variante_id: string  // Espacio Perteneciente
  imagen_url: string  // Imagen de DiseÃ±o / Referente (URL)
  descripcion?: string  // DescripciÃ³n
  orden?: number  // Orden
}

export type ImagenesEspacioRecord = AgnosticDataItem<ImagenesEspacio>

// ─── Schema: "cotizaciones_snapshot" 
export interface CotizacionesSnapshot {
  cotizacion_id: string  // CotizaciÃ³n
  fecha_exportacion: string  // Fecha de ExportaciÃ³n
  variant_name?: string  // Variante Seleccionada
  total_neto?: number  // Total Neto
  detalle_json: string  // Detalle (JSON)
  html_pdf?: string  // HTML PDF
}

export type CotizacionesSnapshotRecord = AgnosticDataItem<CotizacionesSnapshot>

// ─── Schema: "clientes" 
export interface Clientes {
  nombre: string  // Nombre
  documento?: string  // Documento
  telefono?: string  // TelÃ©fono
  email?: string  // Email
}

export type ClientesRecord = AgnosticDataItem<Clientes>

// ─── Schema: "cotizaciones" 
export interface Cotizaciones {
  cliente_id?: string  // Cliente
  nombre_proyecto: string  // Nombre del Proyecto
  direccion_obra?: string  // DirecciÃ³n de la Obra
  dias_entrega_estimados?: number  // DÃ­as de Entrega Estimados
  garantia_anios?: number  // GarantÃ­a (aÃ±os)
  costos_operativos?: number  // Costos Operativos
  imprevistos_instalacion?: number  // Imprevistos de InstalaciÃ³n
  descuento_comercial?: number  // Descuento Comercial
  ajuste_arbitrario?: number  // Ajuste TÃ©cnico
}

export type CotizacionesRecord = AgnosticDataItem<Cotizaciones>

// ─── Schema: "prefabricados" 
export interface Prefabricados {
  nombre: string  // Nombre del Prefabricado
  descripcion?: string  // Descripción
  catalogo_id: string  // Producto Maestro del Catálogo
  imagen_url?: string  // URL de Imagen
}

export type PrefabricadosRecord = AgnosticDataItem<Prefabricados>

// ─── Schema: "prefabricados_items" 
export interface PrefabricadosItems {
  prefabricado_id: string  // Prefabricado Asociado
  catalogo_id: string  // Producto del Catálogo
  cantidad: number  // Cantidad
  unidad_medida?: string  // Unidad de Medida
}

export type PrefabricadosItemsRecord = AgnosticDataItem<PrefabricadosItems>

// ─── Schema: "ordenes_trabajo" — primary field: "codigo_orden" 
export interface OrdenesTrabajo {
  cotizacion_id: string  // Cotización Origen
  codigo_orden: string  // Código de Orden
  estado: string  // Estado
  fecha_entrega?: string  // Fecha de Entrega
  notas?: string  // Notas
}

export type OrdenesTrabajoRecord = AgnosticDataItem<OrdenesTrabajo>

// ─── Schema: "tareas_produccion" — primary field: "nombre_tarea" 
export interface TareasProduccion {
  orden_trabajo_id: string  // Orden de Trabajo
  nombre_tarea: string  // Nombre de la Tarea
  estado: string  // Estado
  operario_id?: string  // Operario Asignado
  notas?: string  // Notas
}

export type TareasProduccionRecord = AgnosticDataItem<TareasProduccion>

// ─── Schema: "nav_links" 
export interface NavLinks {
  label?: string  // Etiqueta
  path?: string  // Path
  icon?: string  // Icono
  orden?: number  // Orden
  grupo?: string  // Grupo
}

export type NavLinksRecord = AgnosticDataItem<NavLinks>

// ============================================================
// AgnosticSchemas — complete project schema map
//
// When generating custom components, import from here:
//   import type { Cliente, ClienteRecord } from '@/generated/agnostic-schemas'
//
// When setting block.context in page_routes.json, use SchemaName values.
// ============================================================
export interface AgnosticSchemas {
  espacio_variantes: EspacioVariantes
  items_variante: ItemsVariante
  productos_catalogo: ProductosCatalogo
  imagenes_espacio: ImagenesEspacio
  cotizaciones_snapshot: CotizacionesSnapshot
  clientes: Clientes
  cotizaciones: Cotizaciones
  prefabricados: Prefabricados
  prefabricados_items: PrefabricadosItems
  ordenes_trabajo: OrdenesTrabajo
  tareas_produccion: TareasProduccion
  nav_links: NavLinks
}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 'espacio_variantes' | 'items_variante' | 'productos_catalogo' | 'imagenes_espacio' | 'cotizaciones_snapshot' | 'clientes' | 'cotizaciones' | 'prefabricados' | 'prefabricados_items' | 'ordenes_trabajo' | 'tareas_produccion' | 'nav_links'
