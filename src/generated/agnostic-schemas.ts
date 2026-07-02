// ============================================================
// AUTO-GENERATED — do not edit manually.
// Source: .\storage\db\schema_definitions.json
// Run:    npm run agnostic:compile
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

// ─── Schema: "ejes" 
export interface Ejes {
  key?: string  // Key
  titulo?: string  // Titulo
  descripcion?: string  // Descripcion
  orden?: number  // Orden
  color_acento?: string  // Color Acento
  icono?: string  // Icono
}

export type EjesRecord = AgnosticDataItem<Ejes>

// ─── Schema: "proyectos" 
export interface Proyectos {
  eje_id?: string  // Eje Id
  nombre?: string  // Nombre
  subtitulo?: string  // Subtitulo
  descripcion_markdown?: string  // Descripcion Markdown
  rol?: string  // Rol
  ano?: number  // Ano
  url_link?: string  // Url Link
  destacado?: boolean  // Destacado
  imagen_destacada?: string  // Imagen Destacada
  galeria?: string  // Galeria
  metadata_especifica?: string  // Metadata Especifica
  slug?: string  // Slug
}

export type ProyectosRecord = AgnosticDataItem<Proyectos>

// ─── Schema: "bitacoras" 
export interface Bitacoras {
  proyecto_id?: string  // Proyecto Id
  titulo?: string  // Titulo
  fecha?: string  // Fecha
  contenido?: string  // Contenido
  imagen?: string  // Imagen
  categoria?: string  // Categoria
  metadata_seo?: string  // Metadata Seo
  slug?: string  // Slug
}

export type BitacorasRecord = AgnosticDataItem<Bitacoras>

// ─── Schema: "aliados" 
export interface Aliados {
  nombre?: string  // Nombre
  rol_alianza?: string  // Rol Alianza
  logo?: string  // Logo
  url?: string  // Url
}

export type AliadosRecord = AgnosticDataItem<Aliados>

// ─── Schema: "proyectos_aliados" 
export interface ProyectosAliados {
  proyecto_id?: string  // Proyecto Id
  aliado_id?: string  // Aliado Id
}

export type ProyectosAliadosRecord = AgnosticDataItem<ProyectosAliados>

// ─── Schema: "servicios" 
export interface Servicios {
  eje_id?: string  // Eje Id
  key?: string  // Key
  titulo?: string  // Titulo
  descripcion?: string  // Descripcion
  precio_base?: number  // Precio Base
  unidad?: string  // Unidad
  precio_recurrente?: number  // Precio Recurrente
  unidad_recurrente?: string  // Unidad Recurrente
  entregables?: string  // Entregables
}

export type ServiciosRecord = AgnosticDataItem<Servicios>

// ─── Schema: "contactos" 
export interface Contactos {
  nombre?: string  // Nombre
  email?: string  // Email
  servicio?: string  // Servicio
  mensaje?: string  // Mensaje
  leido?: boolean  // Leido
}

export type ContactosRecord = AgnosticDataItem<Contactos>

// ============================================================
// AgnosticSchemas — complete project schema map
//
// When generating custom components, import from here:
//   import type { Cliente, ClienteRecord } from '@/generated/agnostic-schemas'
//
// When setting block.context in page_routes.json, use SchemaName values.
// ============================================================
export interface AgnosticSchemas {
  ejes: Ejes
  proyectos: Proyectos
  bitacoras: Bitacoras
  aliados: Aliados
  proyectos_aliados: ProyectosAliados
  servicios: Servicios
  contactos: Contactos
}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 'ejes' | 'proyectos' | 'bitacoras' | 'aliados' | 'proyectos_aliados' | 'servicios' | 'contactos'
