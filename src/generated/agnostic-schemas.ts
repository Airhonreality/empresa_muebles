// ============================================================
// AUTO-GENERATED — do not edit manually.
// Source: .\storage\db\schema_definitions.json
// Run:    npm run agnostic:compile
// Generated: 2026-06-22T02:12:18.650Z
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
  imagenes?: string  // Im?genes
  colores?: string  // Colores
  descripcion?: string  // Descripción del Espacio
  descripcion_alternativa?: string  // Descripción de Alternativa
  visible_pdf?: boolean  // Visible en el PDF de Cotización
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
  categoria_comercial?: string  // Categoría Comercial Web
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

// ─── Schema: "clientes" 
export interface Clientes {
  nombre: string  // Nombre
  documento?: string  // Documento
  telefono?: string  // TelÃ©fono
  email?: string  // Email
  domicilio?: string  // Domicilio / Dirección
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
  ajuste_arbitrario?: number  // Ajuste Técnico
  estado?: string  // Estado Comercial
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
  espacio_variante_id?: string  // Espacio Asociado
}

export type TareasProduccionRecord = AgnosticDataItem<TareasProduccion>

// ─── Schema: "contratos" — primary field: "codigo_contrato" 
export interface Contratos {
  cotizacion_id: string  // Cotización Origen
  codigo_contrato: string  // Código de Contrato
  fecha_contrato: string  // Fecha del Contrato
  contratante_domicilio?: string  // Domicilio del Contratante
  plazo_ejecucion_texto: string  // Plazo de Ejecución (descripción)
  holgura_dias?: number  // Holgura Operativa (días hábiles)
  garantia_anios?: number  // Garantía (años)
  objeto_items?: string  // Objeto del Contrato (lista de muebles)
  especificaciones_estructura?: string  // Estructura (materiales principales)
  especificaciones_herrajes?: string  // Herrajes y Accesorios
  especificaciones_mesones?: string  // Mesones (si aplica)
  condiciones_desmonte?: string  // Desmonte y Disposición
  valor_total: number  // Valor Total del Contrato ($)
  estado: string  // Estado del Contrato
  email_asunto?: string  // Asunto del Correo
  email_cuerpo?: string  // Cuerpo del Correo
}

export type ContratosRecord = AgnosticDataItem<Contratos>

// ─── Schema: "abonos_contrato" — primary field: "numero_abono" 
export interface AbonosContrato {
  contrato_id: string  // Contrato
  numero_abono: string  // Número de Abono
  valor_abono: number  // Valor Recibido ($)
  fecha_recibido?: string  // Fecha de Recepción
  observaciones?: string  // Observaciones
  verificado?: boolean  // Verificado
}

export type AbonosContratoRecord = AgnosticDataItem<AbonosContrato>

// ─── Schema: "nav_links" 
export interface NavLinks {
  label?: string  // Etiqueta
  path?: string  // Path
  icon?: string  // Icono
  orden?: number  // Orden
  grupo?: string  // Grupo
}

export type NavLinksRecord = AgnosticDataItem<NavLinks>

// ─── Schema: "apoyo_tecnico" 
export interface ApoyoTecnico {
  cotizacion_id: string  // Cotizacion
  tipo_recurso: string  // Tipo
  imagen_url?: string  // Imagen
  fecha_visita?: string  // Fecha_de_Visita
  notas?: string  // Notas
  lista_requisitos?: string  // Lista_de_Requisitos
}

export type ApoyoTecnicoRecord = AgnosticDataItem<ApoyoTecnico>

// ─── Schema: "proveedores" 
export interface Proveedores {
  nombre?: string  // Nombre
  nit?: string  // Nit
  telefono?: string  // Telefono
  direccion?: string  // Direccion
  categoria?: string  // Categoria
}

export type ProveedoresRecord = AgnosticDataItem<Proveedores>

// ─── Schema: "registro_logistica" 
export interface RegistroLogistica {
  nombre_flete?: string  // Nombre Flete
  direccion_destino?: string  // Direccion Destino
  estado_flete?: string  // Estado Flete
  viaje_programado?: boolean  // Viaje Programado
  fecha_viaje?: string  // Fecha Viaje
  notas?: string  // Notas
}

export type RegistroLogisticaRecord = AgnosticDataItem<RegistroLogistica>

// ─── Schema: "compras_materiales" 
export interface ComprasMateriales {
  descripcion?: string  // Descripcion
  material_id?: string  // Material Id
  cantidad?: number  // Cantidad
  unidad_medida?: string  // Unidad Medida
  costo_real_compra?: number  // Costo Real Compra
  proveedor_id?: string  // Proveedor Id
  fecha_compra?: string  // Fecha Compra
  notas?: string  // Notas
}

export type ComprasMaterialesRecord = AgnosticDataItem<ComprasMateriales>

// ─── Schema: "leads" 
export interface Leads {
  nombre_completo?: string  // Nombre Completo
  telefono_whatsapp?: string  // Telefono Whatsapp
  email?: string  // Email
  barrio_zona?: string  // Barrio Zona
  tipo_espacio?: string  // Tipo de Espacio
  mensaje?: string  // Mensaje
}

export type LeadsRecord = AgnosticDataItem<Leads>

// ─── Schema: "configuracion_comercial" 
export interface ConfiguracionComercial {
  llave: string  // Clave única
  valor: string  // Valor
  grupo: string  // Grupo de Ajustes
  etiqueta: string  // Etiqueta Descriptiva
}

export type ConfiguracionComercialRecord = AgnosticDataItem<ConfiguracionComercial>

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
  clientes: Clientes
  cotizaciones: Cotizaciones
  prefabricados: Prefabricados
  prefabricados_items: PrefabricadosItems
  ordenes_trabajo: OrdenesTrabajo
  tareas_produccion: TareasProduccion
  contratos: Contratos
  abonos_contrato: AbonosContrato
  nav_links: NavLinks
  apoyo_tecnico: ApoyoTecnico
  proveedores: Proveedores
  registro_logistica: RegistroLogistica
  compras_materiales: ComprasMateriales
  leads: Leads
  configuracion_comercial: ConfiguracionComercial
}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 'espacio_variantes' | 'items_variante' | 'productos_catalogo' | 'imagenes_espacio' | 'clientes' | 'cotizaciones' | 'prefabricados' | 'prefabricados_items' | 'ordenes_trabajo' | 'tareas_produccion' | 'contratos' | 'abonos_contrato' | 'nav_links' | 'apoyo_tecnico' | 'proveedores' | 'registro_logistica' | 'compras_materiales' | 'leads' | 'configuracion_comercial'
