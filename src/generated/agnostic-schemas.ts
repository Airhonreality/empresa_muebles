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

// ─── Schema: "espacio_variantes" — primary field: "nombre_variante" 
export interface EspacioVariantes {
  proyecto_id: string  // Proyecto Perteneciente
  nombre_espacio: string  // Nombre del Espacio (e.g. Cocina)
  nombre_variante: string  // Nombre de la Variante / Alternativa
  activa?: boolean  // Variante Seleccionada para Proyecto
  jornadas_desarrollo_tecnico?: number  // Jornadas de Desarrollo Tecnico (Dias)
  jornadas_ensamblaje_taller?: number  // Jornadas de Ensamblaje en Taller (Dias)
  jornadas_instalacion_obra?: number  // Jornadas de Instalacion en Obra (Dias)
  notas_markdown?: string  // Notas en Markdown
  imagenes?: string  // Diseños / Planos del Proyecto
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
  notas_compra?: string  // Notas de Compra (Taller)
  anulado?: boolean  // Anulado por Taller
  compra_generada?: boolean  // Compra Generada
}

export type ItemsVarianteRecord = AgnosticDataItem<ItemsVariante>

// ─── Schema: "productos_catalogo" — primary field: "descripcion" 
export interface ProductosCatalogo {
  sku?: string  // SKU
  tipo?: string  // Tipo
  descripcion: string  // Descripción
  unidad_medida?: string  // Unidad de Medida (Um)
  ancho?: string  // Ancho
  alto?: string  // Alto
  profundo?: string  // Profundo
  stock_actual?: number  // Stock Actual
  precio_directo?: number  // Precio Directo
  precio_publico?: number  // Precio Público
  imagen_url?: string  // Imagen (URL)
  modelo_3d?: string  // Modelo 3D (.glb / .obj)
  url_referencia?: string  // URL de Referencia / Ficha
  proveedor?: string  // Proveedor
  categoria_comercial?: string  // Categoría Comercial Web
  proveedor_id?: string  // Proveedor (Relación)
  publicado_web?: boolean  // Publicado en Web
}

export type ProductosCatalogoRecord = AgnosticDataItem<ProductosCatalogo>

// ─── Schema: "imagenes_espacio" 
export interface ImagenesEspacio {
  espacio_variante_id: string  // Espacio Perteneciente
  imagen_url: string  // Imagen de Diseño / Referente (URL)
  descripcion?: string  // Descripción
  orden?: number  // Orden
}

export type ImagenesEspacioRecord = AgnosticDataItem<ImagenesEspacio>

// ─── Schema: "clientes" 
export interface Clientes {
  nombre: string  // Nombre
  documento?: string  // Documento
  telefono?: string  // Teléfono
  email?: string  // Email
  domicilio?: string  // Domicilio / Dirección
  descripcion_semantica?: string  // Descripcion Semantica
}

export type ClientesRecord = AgnosticDataItem<Clientes>

// ─── Schema: "proyectos" 
export interface Proyectos {
  cliente_id?: string  // Cliente
  nombre_proyecto: string  // Nombre del Proyecto
  direccion_obra?: string  // Dirección de la Obra
  dias_entrega_estimados?: number  // Días de Entrega Estimados
  garantia_anios?: number  // Garantía (años)
  costos_operativos?: number  // Costos Operativos
  imprevistos_instalacion?: number  // Imprevistos de Instalación
  descuento_comercial?: number  // Descuento Comercial
  ajuste_arbitrario?: number  // Ajuste Técnico
  estado: string  // Estado del Proyecto
  descripcion_semantica?: string  // Descripcion Semantica
  barrio?: string  // Barrio
  aplica_iva?: boolean  // Aplica IVA
  porcentaje_iva?: number  // Porcentaje de IVA
}

export type ProyectosRecord = AgnosticDataItem<Proyectos>

// ─── Schema: "prefabricados" 
export interface Prefabricados {
  nombre: string  // Nombre del Prefabricado
  descripcion?: string  // Descripción
  catalogo_id: string  // Producto Maestro del Catálogo
  imagen_url?: string  // URL de Imagen
  descripcion_comercial?: string  // Descripción Comercial
  categoria_comercial?: string  // Categoría Comercial
  precio_publico?: number  // Precio Público
  precio_costo_calculado?: number  // Precio Costo Calculado
  publicado_web?: boolean  // Publicado en Web
  reutilizable_catalogo?: boolean  // Reutilizable en Catálogo
  slug?: string  // Slug
}

export type PrefabricadosRecord = AgnosticDataItem<Prefabricados>

// ─── Schema: "prefabricados_items" 
export interface PrefabricadosItems {
  prefabricado_id: string  // Prefabricado Asociado
  catalogo_id: string  // Producto del Catálogo
  cantidad: number  // Cantidad
  unidad_medida?: string  // Unidad de Medida
  precio_unitario_snapshot?: number  // Precio Unitario Snapshot
}

export type PrefabricadosItemsRecord = AgnosticDataItem<PrefabricadosItems>

// ─── Schema: "ordenes_trabajo" — primary field: "codigo_orden" 
export interface OrdenesTrabajo {
  proyecto_id: string  // Proyecto Origen
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
  proyecto_id: string  // Proyecto Origen
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
  descripcion_semantica?: string  // Descripcion Semantica
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
  tipo_recurso: string  // Tipo
  imagen_url?: string  // Imagen
  fecha_visita?: string  // Fecha_de_Visita
  notas?: string  // Notas
  lista_requisitos?: string  // Lista_de_Requisitos
  proyecto_id: string  // Proyecto
}

export type ApoyoTecnicoRecord = AgnosticDataItem<ApoyoTecnico>

// ─── Schema: "proveedores" 
export interface Proveedores {
  nombre?: string  // Nombre
  nit?: string  // Nit
  telefono?: string  // Telefono
  direccion?: string  // Direccion
  categoria?: string  // Categoria
  descripcion_semantica?: string  // Descripcion Semantica
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
  estado?: string  // Estado
  origen_proyecto?: string  // Proyecto de Origen
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
  gclid?: string  // "Google
  estado_proyecto?: string  // "Estado
  score_conversion?: number  // "Score
  utm_source?: string  // "UTM
  utm_medium?: string  // "UTM
  utm_campaign?: string  // "UTM
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

// ─── Schema: "registros_tecnicos" 
export interface RegistrosTecnicos {
  variante_id: string  // Espacio/Variante
  etiqueta_evento: string  // Etiqueta de Levantamiento
  responsable: string  // Registrado por
  archivos_multimedia?: string  // Fotos y Diagramas
  notas?: string  // Notas Adicionales
}

export type RegistrosTecnicosRecord = AgnosticDataItem<RegistrosTecnicos>

// ─── Schema: "project_tasks" 
export interface ProjectTasks {
  variante_id: string  // Espacio/Variante
  descripcion: string  // Ítem / Tarea
  estado: string  // Estado
  creado_por?: string  // Añadido por
}

export type ProjectTasksRecord = AgnosticDataItem<ProjectTasks>

// ─── Schema: "usuarios_equipo" — primary field: "nombre" 
export interface UsuariosEquipo {
  nombre: string  // Nombre Completo
  email: string  // Correo Electrónico
  rol: unknown  // Rol del Sistema
  estado: unknown  // Estado
  descripcion_semantica?: string  // Descripcion Semantica
  costo_hora?: number  // Costo Hora
  horas_estimadas_mes?: number  // Horas Estimadas Mes
  telefono?: string  // Teléfono / Celular
  firma_url?: string  // Firma Digital (URL Imagen)
}

export type UsuariosEquipoRecord = AgnosticDataItem<UsuariosEquipo>

// ─── Schema: "tareas_operativas" — primary field: "titulo" 
export interface TareasOperativas {
  proyecto_id: string  // Proyecto
  titulo: string  // Título de la Tarea
  departamento: unknown  // Departamento
  estado: unknown  // Estado
  fase_kanban?: string  // Fase Kanban Asociada
  fecha_limite?: string  // Fecha Límite
  asignado_a?: string  // Asignado a
}

export type TareasOperativasRecord = AgnosticDataItem<TareasOperativas>

// ─── Schema: "plantillas_tareas" — primary field: "titulo_tarea" 
export interface PlantillasTareas {
  fase_kanban_trigger: string  // Fase Disparadora
  titulo_tarea: string  // Título de Tarea a Generar
  departamento: unknown  // Departamento Responsable
  dias_offset?: number  // Días para vencer
}

export type PlantillasTareasRecord = AgnosticDataItem<PlantillasTareas>

// ─── Schema: "cuentas_financieras" — primary field: "nombre" 
export interface CuentasFinancieras {
  nombre: string  // Nombre de Cuenta
  tipo: string  // Tipo
  saldo_inicial: number  // Saldo Inicial
  saldo_actual?: number  // Saldo Actual
  estado?: string  // Estado
  descripcion_semantica?: string  // Descripción Semántica
}

export type CuentasFinancierasRecord = AgnosticDataItem<CuentasFinancieras>

// ─── Schema: "categorias_financieras" — primary field: "nombre" 
export interface CategoriasFinancieras {
  nombre: string  // Nombre Categoría
  tipo_flujo: string  // Tipo de Flujo
  subtipo: string  // Subtipo
  descripcion_semantica?: string  // Propósito Semántico
}

export type CategoriasFinancierasRecord = AgnosticDataItem<CategoriasFinancieras>

// ─── Schema: "comprobantes_financieros" — primary field: "numero_referencia" 
export interface ComprobantesFinancieros {
  numero_referencia: string  // Ref / Factura
  tipo?: string  // Tipo Comprobante
  archivo_soporte?: string  // Archivo Soporte URL
  descripcion_semantica?: string  // Notas
}

export type ComprobantesFinancierosRecord = AgnosticDataItem<ComprobantesFinancieros>

// ─── Schema: "obligaciones_pendientes" — primary field: "descripcion" 
export interface ObligacionesPendientes {
  descripcion: string  // Obligación / Concepto
  tipo: string  // Naturaleza
  monto_total: number  // Monto Total Estimado
  monto_pagado?: number  // Monto Pagado Real
  fecha_vencimiento?: string  // Fecha Vencimiento
  estado: string  // Estado
  proveedor_id?: string  // Proveedor
  cliente_id?: string  // Cliente
  usuario_id?: string  // Miembro Equipo
  descripcion_semantica?: string  // Soporte Semántico
  proyecto_id?: string  // Proyecto
  contrato_id?: string  // Contrato
}

export type ObligacionesPendientesRecord = AgnosticDataItem<ObligacionesPendientes>

// ─── Schema: "movimientos_financieros" — primary field: "descripcion" 
export interface MovimientosFinancieros {
  fecha: string  // Fecha Asentado
  descripcion: string  // Descripción del Movimiento
  tipo: string  // Tipo
  monto: number  // Monto Real ($)
  estado: string  // Estado Ledger
  cuenta_origen_id?: string  // Cuenta Origen
  cuenta_destino_id?: string  // Cuenta Destino (Solo Traslado)
  categoria_id?: string  // Categoría
  obligacion_id?: string  // Obligación Saldada
  comprobante_ref?: string  // Enlace Comprobante
  descripcion_semantica?: string  // Auditoría
}

export type MovimientosFinancierosRecord = AgnosticDataItem<MovimientosFinancieros>

// ─── Schema: "registro_horas" 
export interface RegistroHoras {
  fecha?: string  // Fecha
  usuario_id?: string  // Usuario Id
  proyecto_id?: string  // Proyecto Id
  horas_ordinarias?: number  // Horas Ordinarias
  horas_extras?: number  // Horas Extras
  descripcion_semantica?: string  // Descripcion Semantica
  estado_pago?: string  // Estado Pago
}

export type RegistroHorasRecord = AgnosticDataItem<RegistroHoras>

// ─── Schema: "system_groups" 
export interface SystemGroups {
  name: string  // Nombre Interno
  label?: string  // Etiqueta Visible
  kind?: string  // Tipo
  description?: string  // Descripción
}

export type SystemGroupsRecord = AgnosticDataItem<SystemGroups>

// ─── Schema: "testimonios" 
export interface Testimonios {
  nombre_cliente?: string  // "Nombre
  barrio?: string  // "Barrio
  texto_resena?: string  // "Texto
  calificacion?: number  // "Calificación
  proyecto_relacionado?: string  // "Proyecto
  destacado?: boolean  // "Destacado
  fecha_resena?: string  // "Fecha
}

export type TestimoniosRecord = AgnosticDataItem<Testimonios>

// ─── Schema: "seed_registros" 
export interface SeedRegistros {
  namespace?: string  // Namespace
  record_id?: string  // Record Id
  lote?: string  // Lote
  nota?: string  // Nota
}

export type SeedRegistrosRecord = AgnosticDataItem<SeedRegistros>

// ─── Schema: "imagenes_prefabricado" 
export interface ImagenesPrefabricado {
  prefabricado_id?: string  // Prefabricado
  imagen_url?: string  // URL de Imagen
  descripcion?: string  // Descripción
  orden?: number  // Orden
}

export type ImagenesPrefabricadoRecord = AgnosticDataItem<ImagenesPrefabricado>

// ─── Schema: "portfolio_publico" 
export interface PortfolioPublico {
  proyecto_id?: string  // Proyecto
  titulo: string  // Título
  slug: string  // Slug
  descripcion_comercial?: string  // Descripción_Comercial
  cliente_iniciales?: string  // Iniciales_Cliente
  barrio?: string  // Barrio
  categoria_espacio?: string  // Categoría_Espacio
  materiales_destacados?: string  // Materiales_Destacados
  publicado?: boolean  // Publicado
  destacado?: boolean  // Destacado
  orden?: number  // Orden
  fecha_publicacion?: string  // Fecha_Publicación
}

export type PortfolioPublicoRecord = AgnosticDataItem<PortfolioPublico>

// ─── Schema: "imagenes_portfolio" 
export interface ImagenesPortfolio {
  portfolio_id?: string  // Portfolio
  imagen_url: string  // Imagen
  descripcion?: string  // Descripción
  orden?: number  // Orden
}

export type ImagenesPortfolioRecord = AgnosticDataItem<ImagenesPortfolio>

// ─── Schema: "items_obra_civil" 
export interface ItemsObraCivil {
  variante_id: string  // Espacio/Variante Perteneciente
  categoria: string  // Categoría
  catalogo_id?: string  // Seleccionar del Catálogo (opcional)
  descripcion_manual?: string  // Descripción Manual (si no hay ítem de catálogo)
  unidad_medida?: string  // Unidad de Medida
  cantidad: number  // Cantidad
  precio_unitario: number  // Precio Unitario ($)
  total_linea?: number  // Total Línea ($)
  notas?: string  // Notas
}

export type ItemsObraCivilRecord = AgnosticDataItem<ItemsObraCivil>

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
  proyectos: Proyectos
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
  registros_tecnicos: RegistrosTecnicos
  project_tasks: ProjectTasks
  usuarios_equipo: UsuariosEquipo
  tareas_operativas: TareasOperativas
  plantillas_tareas: PlantillasTareas
  cuentas_financieras: CuentasFinancieras
  categorias_financieras: CategoriasFinancieras
  comprobantes_financieros: ComprobantesFinancieros
  obligaciones_pendientes: ObligacionesPendientes
  movimientos_financieros: MovimientosFinancieros
  registro_horas: RegistroHoras
  system_groups: SystemGroups
  testimonios: Testimonios
  seed_registros: SeedRegistros
  imagenes_prefabricado: ImagenesPrefabricado
  portfolio_publico: PortfolioPublico
  imagenes_portfolio: ImagenesPortfolio
  items_obra_civil: ItemsObraCivil
}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 'espacio_variantes' | 'items_variante' | 'productos_catalogo' | 'imagenes_espacio' | 'clientes' | 'proyectos' | 'prefabricados' | 'prefabricados_items' | 'ordenes_trabajo' | 'tareas_produccion' | 'contratos' | 'abonos_contrato' | 'nav_links' | 'apoyo_tecnico' | 'proveedores' | 'registro_logistica' | 'compras_materiales' | 'leads' | 'configuracion_comercial' | 'registros_tecnicos' | 'project_tasks' | 'usuarios_equipo' | 'tareas_operativas' | 'plantillas_tareas' | 'cuentas_financieras' | 'categorias_financieras' | 'comprobantes_financieros' | 'obligaciones_pendientes' | 'movimientos_financieros' | 'registro_horas' | 'system_groups' | 'testimonios' | 'seed_registros' | 'imagenes_prefabricado' | 'portfolio_publico' | 'imagenes_portfolio' | 'items_obra_civil'
