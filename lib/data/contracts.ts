// Tipos de datos que las pantallas consumen.
// Derivados del REGISTRO_DE_ENTIDADES.md — una copia plana, sin dependencia de Drizzle.
// Las pantallas NUNCA importan lib/db/ directamente; siempre pasan por este contrato.

// Estados canónicos del proyecto según REGISTRO_DE_ENTIDADES.md:70 y
// glosario_h07.md §B.0. El corredor canónico convive con los legacy del kanban v1.
export type EstadoProyecto =
  | 'borrador' | 'en_revision' | 'cotizado' | 'negociacion' | 'en_contrato'
  | 'desarrollo' | 'aprobado_compras' | 'armado' | 'verificado' | 'en_instalacion' | 'instalado'
  | 'entregado' | 'perdida' | 'cancelada'
  | 'activa' | 'enviada' | 'pre_produccion' | 'produccion' | 'retoma'

export interface Proyecto {
  id: string
  nombreProyecto: string
  estado: EstadoProyecto
  tipoProyecto: string
  direccionObra: string | null
  costosOperativos: string
  imprevistosInstalacion: string
  descuentoComercial: string
  ajusteArbitrario: string
  aplicaIva: boolean
  porcentajeIva: string
  garantiaAnios: number
  diasEntregaEstimados: number | null
  descripcionSemantica: string | null
  clienteId: string | null
  comercialId: string | null
  /** F3 (D3/I-035): verificador único del proyecto = comercial vendedor. Guard de los botones Aprobar (E-18). */
  verificadorId: string | null
  /** F3: fecha de ingreso a desarrollo técnico; T0 para el gate E-18. */
  fechaEntradaDesarrollo: string | null
  /** F3 (D3/I-035): comercial vendedor — dueño del gate de schema/calidad. */
  comercialVendedorId: string | null
  createdAt: string
  updatedAt: string
}

export interface Cliente {
  id: string
  nombre: string
  documento: string | null
  telefono: string | null
  email: string | null
  domicilio: string | null
}

export interface EspacioVariante {
  id: string
  proyectoId: string
  nombreEspacio: string
  nombreVariante: string
  descripcion: string | null
  /** Variante activa (la que se cotiza y factura). Se controla desde el header/tab del espacio, no desde formulario. */
  activa: boolean
  /** Visible en la propuesta pública (PDF + pantalla de propuesta al cliente). */
  visibleEnPropuestaPublica: boolean
  orden: number
  jornadasDesarrolloTecnico: string
  jornadasEnsamblajeTaller: string
  jornadasInstalacionObra: string
  colores: unknown[]
  fotosEspacio: string[]
  fotosDisenio: string[]
  fotosReferencia: string[]
}

export interface ItemVariante {
  id: string
  varianteId: string
  catalogoId: string | null
  nombrePersonalizado: string | null
  cantidad: string
  precioUnitario: string
  totalLinea: string | null
  anulado: boolean
  /** C2: item de "Presupuesto Adicional (Referenciales)" — visibilidad de inversión estimada con terceros. No suma a Grand Totals ni al objeto de contrato. */
  esReferencial: boolean
  fuenteReferencial: 'electrodomestico' | 'obra_civil' | 'servicio_tercero' | 'otro' | null
  grupoReferencial: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductoCatalogo {
  id: string
  sku: string
  descripcion: string
  tipo: string | null
  unidadMedida: string
  precioDirecto: string | null
  precioPublico: string | null
  stockActual: number
  proveedorId: string | null
  imagenUrl: string | null
  /** P-27: modelo 3D del producto (diseño-desarrollo, POC-09). */
  modelo3dUrl: string | null
  categoriaComercial: string | null
  publicadoWeb: boolean
  /** P-27: proyecto del cual se "anexó" este producto al catálogo (si nació de un ítem referencial de cotización). */
  proyectoOrigenId: string | null
  /** P-27 R8/#8: soft-delete — no rompe totales históricos de items_variante que ya referencian este producto. */
  anulado: boolean
  createdAt: string
  updatedAt: string
}

export interface Parametro {
  id: string
  clave: string
  grupo: string | null
  tipo: 'numerico' | 'texto' | 'booleano'
  valorNumeric: string | null
  valorTexto: string | null
  valorBooleano: boolean | null
  unidad: string | null
  descripcion: string | null
}

export interface ProyectosEstadosHistorial {
  id: string
  proyectoId: string
  estadoAnterior: string
  estadoNuevo: string
  cambiadoPor: string | null
  razon: string | null
  createdAt: string
}

export interface Contrato {
  id: string
  proyectoId: string
  codigoContrato: string
  fechaContrato: string | null
  valorTotal: string
  estado: string
  garantiaAnios: number
  plazoEjecucionTexto: string
  holguraDias: number
  objetoItems: string | null
  especificacionesEstructura: string | null
  especificacionesHerrajes: string | null
  especificacionesMesones: string | null
  especificacionesDesmonte: string | null
  contratanteDomicilio: string | null
  emailAsunto: string | null
  emailCuerpo: string | null
  createdAt: string
  updatedAt: string
}

export interface HitoPago {
  id: string
  contratoId: string
  orden: number
  tipo: 'percentage' | 'fixed'
  montoOPorcentaje: string
  razon: string | null
}

export type TransicionesProyecto = Record<string, string[]>

// --- F3: Cronograma y control (REGISTRO_DE_ENTIDADES.md §5) ---

export interface Cronograma {
  id: string
  proyectoId: string
  /** Configurable vía parametros.base_semanas_cronograma. */
  baseSemanas: number
  /** Configurable vía parametros.holgura_maxima_dias (cláusula real del contrato). */
  holguraMaximaDias: number
  promesaSemanas: number
  fechaFijacion: string
  createdAt: string
  updatedAt: string
}

export type LineaCronograma = 'contractual' | 'interna'
export type EtapaCronograma = 'aprobacion' | 'compras' | 'ensamblaje' | 'instalacion'

export interface CronogramaEtapa {
  id: string
  cronogramaId: string
  linea: LineaCronograma
  etapa: EtapaCronograma
  /** Fecha ideal (plan). La línea contractual NUNCA varía (I-034). */
  fechaIdeal: string
  /** Fecha real (ejecución). Solo la línea interna se recalcula al aplicar E-33. */
  fechaReal: string
  estado: string
}

export type CausaDesfase = 'interna' | 'externa' | 'cambio_contrato'

export interface DesfaseCronograma {
  id: string
  proyectoId: string
  diasDesfase: number
  causa: CausaDesfase
  /** Composición causal (jsonb): qué aportó cada origen. */
  composicionCausal: { origen: string; aporteDias: number }[]
  motivo: string
  aplicado: boolean
  /** E-33/D4: decisión manual del gerente. */
  decisionManual: string | null
  autorizadoPor: string | null
  resultadoRecalculo: string | null
  createdAt: string
}

export type DesenlaceCheck = 'todo_bien' | 'novedad' | 'extremo'

export interface CheckProduccion {
  id: string
  proyectoId: string
  fechaCheck: string
  ratioInsumos: number
  ratioPagos: number
  ratioProduccion: number
  /** Se DERIVA de MIN(ratios) contra umbrales — nunca se asienta a mano (R9). */
  desenlaceSugerido: DesenlaceCheck
  desenlaceFinal: DesenlaceCheck | null
  overrideJustificacion: string | null
  /** Derivado del desenlace final vía parametros (novedad 50%, extremo 100%). */
  comisionesReducidasPct: number | null
  verificadorId: string | null
  createdAt: string
}

export type EstadoNovedadCritica = 'abierta' | 'en_atencion' | 'resuelta' | 'escalada'

export interface NovedadCritica {
  id: string
  proyectoId: string
  descripcion: string
  fase: string
  /** SLA 5–24h configurable vía parametros.sla_novedad_critica_*. */
  ventanaSlaHoras: number
  estado: EstadoNovedadCritica
  escaladoA: string | null
  createdAt: string
  updatedAt: string
}

export interface ComunicacionProgreso {
  id: string
  proyectoId: string
  /** Solo adelantos positivos (R4: desenlace todo_bien → E-60), nunca atrasos. */
  tipo: 'adelanto'
  contenido: string
  createdAt: string
}

// --- F3: Desarrollo y schema (REGISTRO §6) ---

export type EstadoSchema = 'borrador' | 'en_desarrollo' | 'para_revision' | 'aprobado_compras' | 'rechazado' | 'en_reproceso'

export interface SchemaProyecto {
  id: string
  proyectoId: string
  version: number
  estado: EstadoSchema
  createdAt: string
  aprobadoEn: string | null
}

export type OrigenBom = 'cotizacion' | 'desarrollo'

export interface BomMaterial {
  id: string
  schemaId: string
  productoId: string | null
  cantidad: string
  unidad: string
  origen: OrigenBom
  homologable: boolean
  itemVarianteId: string | null
}

export type TipoGate = 'schema' | 'recepcion' | 'calidad'
export type VeredictoGate = 'aprobado' | 'rechazado' | 'rechazado_total' | 'reproceso_parcial'

export interface Verificacion {
  id: string
  proyectoId: string
  tipoGate: TipoGate
  veredicto: VeredictoGate
  verificadorId: string
  creadoEn: string
}

export interface Retoma {
  id: string
  proyectoId: string
  /** Medidas, electrodomésticos, anomalías detectadas (jsonb por módulo). */
  medidas: Record<string, unknown> | null
  fotos: string[]
  anomaliaDetectada: boolean
  createdAt: string
  updatedAt: string
}

export interface CambioContrato {
  id: string
  proyectoId: string
  tipoCambio: 'adicional' | 'cambio' | 'reproceso'
  descripcion: string
  disparaDesfase: boolean
  createdAt: string
}

// --- F3: Equipo (REGISTRO §1 Cimientos F0) ---

export type RolCanonico = 'admin' | 'comercial' | 'desarrollador' | 'compras' | 'taller' | 'finanzas' | 'supervisora_qa'

export interface Persona {
  id: string
  nombre: string
  documento: string | null
  telefono: string | null
}

export interface PersonaRol {
  id: string
  personaId: string
  rolId: RolCanonico
  activo: boolean
  desde: string
}

// --- F3: Producción (REGISTRO §8, mínimo para gates) ---

export interface Modulo {
  id: string
  proyectoId: string
  espacioVarianteId: string | null
  nombre: string
  /** Ciclo de vida: diseño → compras → armado → verificación → despacho → instalación. */
  estado: string
  /** REGISTRO §8: árbol recursivo (self-FK). null = nodo raíz. */
  padreId: string | null
  tipoModulo: string | null
  cantidad: number
  /** P-16: string por consistencia con el resto de jornadas/horas del contrato (no float). */
  horasEstimadas: string
  createdAt: string
}

export interface Estimacion {
  id: string
  proyectoId: string
  valor: string
  cantidadModulos: number
  duracionEstimada: string
  factorCrecimiento: number
  createdAt: string
}

export interface EspacioArtefacto {
  id: string
  espacioVarianteId: string
  categoria: 'determinante' | 'electrodomestico' | 'bloqueante' | 'obra_civil' | 'servicio_tercero'
  dimensionesMm: string | null
  tipoSpecifique: string | null
  ubicacion: string | null
  fotoUrl: string | null
  requiereVerificacion: boolean
  validadoPor: string | null
  validadoEn: string | null
  createdAt: string
  updatedAt: string
}

// --- F5: Taller, calidad, instalación, entrega, garantía (REGISTRO §8 Producción) ---

export type TipoOrdenTrabajo = 'produccion' | 'garantia'

export interface OrdenTrabajo {
  id: string
  proyectoId: string
  /** REGISTRO §8/§10: enganche de un pedido web (E-44). Nullable — la mayoría de OT nacen de proyectos, no de pedidos. */
  pedidoWebId: string | null
  tipo: TipoOrdenTrabajo
  estado: string
  createdAt: string
}

export interface PedidoWeb {
  id: string
  clienteId: string
  estado: string
  totalPedido: string
  createdAt: string
}

export interface CitacionCalidad {
  id: string
  proyectoId: string
  /** REGISTRO §8: jsonb — subconjunto de nodos citados (despacho parcial). */
  modulosIds: string[]
  /** 'citada' | 'atendida' (P-17 R2: sin citación con estado 'citada' el veredicto queda deshabilitado). */
  estado: string
  fecha: string
  createdAt: string
}

/** REGISTRO §6 dice schema/calidad/instalacion; P-20 (garantía) también dispara reprocesos —
 * 'garantia' agregado por consistencia entre pantallas (decisión a revisar por Supervisor). */
export type OrigenReproceso = 'schema' | 'calidad' | 'instalacion' | 'garantia'

export interface Reproceso {
  id: string
  proyectoId: string
  origen: OrigenReproceso
  moduloId: string | null
  culpable: string | null
  granularidad: 'modulo' | 'componente' | null
  descripcion: string | null
  estado: string
  createdAt: string
}

export type EstadoInstalacion = 'programada' | 'en_curso' | 'instalada' | 'fallida'

export interface Instalacion {
  id: string
  proyectoId: string
  rangoFechaInicio: string
  rangoFechaFin: string
  estado: EstadoInstalacion
  /** P-18 R4: FK al check_produccion que adelantó la instalación (nullable). */
  adelantadaPor: string | null
  createdAt: string
  updatedAt: string
}

export type EstadoActaEntrega = 'generada' | 'enviada' | 'firmada'

export interface ActaEntrega {
  id: string
  proyectoId: string
  pdfUrl: string | null
  estado: EstadoActaEntrega
  /** P-19 R2: default 12, editable. */
  holguraOperativaDias: number
  fotos: string[]
  observaciones: string | null
  createdAt: string
  updatedAt: string
}

export type EstadoCasoGarantia = 'reportado' | 'diagnosticado' | 'en_reparacion' | 'resuelto' | 'cerrado'

export interface CasoGarantia {
  id: string
  proyectoId: string
  moduloId: string | null
  /** No está en las "columnas usadas" de P-20 pero sí en sus relaciones REGISTRO §8; agregado para
   * soportar R5 (el cliente solo ve sus propios casos) sin depender de un join a proyectos. */
  clienteId: string | null
  descripcion: string
  fotos: string[]
  estado: EstadoCasoGarantia
  /** P-20 R2: fecha_reporte ≤ fecha de entrega + proyectos.garantiaAnios. */
  dentroGarantiaContractual: boolean
  fechaReporte: string
  diagnostico: string | null
  solucionAplicada: string | null
  createdAt: string
  updatedAt: string
}

export interface CitaGarantia {
  id: string
  casoId: string
  proyectoId: string
  fecha: string
  diagnosticadoPor: string | null
  resultado: string | null
  createdAt: string
}

// --- F6: Finanzas (REGISTRO §9) ---

export interface CuentaFinanciera {
  id: string
  nombre: string
  /** 'caja' | 'banco' | 'proveedor' ... */
  tipo: string
  saldoActual: string
  createdAt: string
}

export type TipoMovimientoFinanciero = 'debito' | 'credito'

export interface MovimientoFinanciero {
  id: string
  fecha: string
  descripcion: string
  tipo: TipoMovimientoFinanciero
  monto: string
  cuentaOrigenId: string | null
  cuentaDestinoId: string | null
  obligacionId: string | null
  ordenCompraId: string | null
  proyectoId: string | null
  contratoId: string | null
  /** A quién se pagó (P-21 columnas). */
  socioId: string | null
  medioPago: string | null
  comprobanteUrl: string | null
  prioridadPago: number | null
  createdAt: string
}

export type OrigenObligacion = 'contrato_hito' | 'proveedor' | 'diseno_3d' | 'nomina' | 'comision' | 'arriendo'
export type EstadoObligacion = 'pendiente' | 'parcial' | 'pagado' | 'atrasada'

export interface ObligacionPendiente {
  id: string
  descripcion: string
  origen: OrigenObligacion
  montoTotal: string
  montoPagado: string
  fechaVencimiento: string
  estado: EstadoObligacion
  personaId: string | null
  clienteId: string | null
  proveedorId: string | null
  proyectoId: string | null
  contratoId: string | null
  hitoId: string | null
  /** P-22 R1: solo requeridas cuando origen='comision'. */
  baseCalculo: string | null
  porcentaje: string | null
  tipoComision: string | null
  cantidadModulos: number | null
  desfaseId: string | null
  /** Solo para origen='arriendo'. */
  periodicidad: string | null
  /** E-30: se descuenta del primer hito (anticipo) si el diseño 3D ya fue pagado. */
  deduccionDiseno3d: boolean
  createdAt: string
}

// --- F7 (Compras): proveedores y órdenes de compra (REGISTRO §7) — necesarias como contexto de F5/F6 ---

export interface Proveedor {
  id: string
  nombre: string
  nit: string | null
  telefonoComercial: string | null
  direccionDespacho: string | null
  ciudad: string | null
  medioPago: string | null
  diasEntregaDefault: number | null
  transportadora: string | null
  tarifaFlete: string | null
  createdAt: string
}

export type EstadoOrdenCompra = 'solicitada' | 'aprobada' | 'en_pago' | 'pagada' | 'recibida_verificada' | 'rechazada' | 'cancelada'
export type MecanicaPagoOC = 'anticipo_saldo' | 'unico' | 'subcontratacion'

export interface OrdenCompra {
  id: string
  codigoOrden: string
  /** REGISTRO §7: nullable — E-45 operativa (ej. reposición de herramientas) no cuelga de un proyecto. */
  proyectoId: string | null
  proveedorId: string
  montoTotal: string
  anticipoMonto: string | null
  estado: EstadoOrdenCompra
  mecanicaPago: MecanicaPagoOC
  fechaRecepcionEsperada: string | null
  tiempoEntregaDias: number | null
  createdAt: string
  updatedAt: string
}

export interface RegistroGateCaja {
  id: string
  ordenCompraId: string
  fecha: string
  montoSolicitado: string
  saldoDisponible: string
  bloqueado: boolean
  decision: string | null
  resolucion: string | null
  createdAt: string
}

export type EstadoCuentaCobro = 'emitida' | 'vinculada' | 'pagada' | 'anulada'

export interface CuentaCobroProveedor {
  id: string
  proveedorId: string
  ordenCompraId: string | null
  concepto: string
  valor: string
  estado: EstadoCuentaCobro
  firmaDigital: string
  urlDocumento: string | null
  fechaEmision: string
  fechaVencimiento: string | null
  createdAt: string
}

// --- F-02: Tienda web (REGISTRO §2/§10) ---

/** REGISTRO §2 (FLAG4): pendiente de decisión final de taxonomía única — se crea acá con el alcance
 * mínimo que pide F-02 (árbol de categorías de tienda). NO se conecta a productos_catalogo.categoriaComercial
 * (ese campo sigue siendo texto libre, sin FK, por decisión explícita de la pasada P-27). */
export interface Categoria {
  id: string
  nombre: string
  /** 'tienda' | 'portafolio' | ... */
  tipo: string
  padreId: string | null
  activo: boolean
}

export interface ProductoTienda {
  id: string
  catalogoId: string
  descripcionDiseno: string | null
  imagenPrincipalUrl: string | null
  categoriaId: string | null
  /** Distinto de `productos_catalogo.publicadoWeb`: ese es el flag de publicación en la CLASE (P-27,
   * área diseño-desarrollo); este es el flag de visibilidad de la fila de EXTENSIÓN de tienda (F-02,
   * área comercial/sitio público) — mismo producto puede tener una fila de tienda sin estar aún visible. */
  visibleEnTienda: boolean
  /** F-02 R2: precio web fijo, independiente de productos_catalogo.precioPublico. */
  valorTienda: string
  inventarioDisponible: number
  calificacionPromedio: number | null
  createdAt: string
  updatedAt: string
}

export interface CatalogoAcabado {
  id: string
  nombre: string
  familia: string | null
  color: string | null
  colorHex: string | null
  textura: string | null
  precioDiferencial: string | null
  imagenTexturaUrl: string | null
}

/** Puente CLASE (REGISTRO §2): qué acabados aplican a un producto de catálogo. */
export interface CatalogoProductoAcabado {
  id: string
  productoCatalogoId: string
  acabadoId: string
  esDefault: boolean
}

export interface AcabadoMuestra {
  id: string
  acabadoId: string
  imagenMuestraUrl: string | null
  disponibleWeb: boolean
}

// --- F-03: Portafolio de proyectos (REGISTRO §10) ---

export interface Portafolio {
  id: string
  proyectoId: string
  titulo: string
  descripcionComercial: string | null
  categoriaEspacio: string
  materialesDestacados: string[]
  /** F-03 R2: rango estimado ("desde $8M COP"), nunca cifra exacta — validado en UI, no en el store. */
  precioReferencial: string | null
  publicado: boolean
  destacado: boolean
  orden: number
  slug: string
  createdAt: string
  updatedAt: string
}

export type TipoModuloArtefacto = 'imagen' | 'plano_armado' | 'modelo_3d'
export type FuenteModuloArtefacto = 'heredado_catalogo' | 'dedicado_proyecto'

/** REGISTRO §8: assets de producción por NODO de módulo (imagen/plano/3D). No confundir con
 * `EspacioArtefacto` (instancia de objeto físico del espacio, ej. electrodoméstico) — dominio distinto. */
export interface ModuloArtefacto {
  id: string
  moduloId: string
  tipo: TipoModuloArtefacto
  fuente: FuenteModuloArtefacto
  url: string
  createdAt: string
}

export interface UsuarioMock {
  id: string
  email: string
  nombre: string
  rol: string
}

export interface DataStore {
  proyectos: {
    listar(): Proyecto[]
    obtenerPorId(id: string): Proyecto | undefined
    actualizarEstado(id: string, estado: string): Proyecto | null
    crear(data: Partial<Proyecto> & { nombreProyecto: string }): Proyecto
    historialEstado(proyectoId: string): ProyectosEstadosHistorial[]
  }
  clientes: {
    listar(): Cliente[]
    obtenerPorId(id: string): Cliente | undefined
    crear(data: Partial<Cliente> & { nombre: string }): Cliente
  }
  espacios: {
    porProyecto(proyectoId: string): EspacioVariante[]
    crear(data: Partial<EspacioVariante> & { proyectoId: string; nombreEspacio: string }): EspacioVariante
    actualizarJornadas(id: string, jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string }): EspacioVariante | null
    actualizar(id: string, partial: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>>): EspacioVariante | null
    /**
     * Duplica una variante existente. Sin `nuevoNombreEspacio`: agrega una variante nueva
     * al mismo espacio (mismo `nombreEspacio`, `activa: false`). Con `nuevoNombreEspacio`:
     * duplica el espacio completo como grupo nuevo. `vacio: true` copia solo proyectoId/nombreEspacio;
     * `vacio: false` clona todos los campos y también los items/artefactos asociados.
     */
    duplicar(id: string, opciones: { vacio: boolean; nuevoNombreEspacio?: string }): EspacioVariante | null
    /** Marca esta variante como la activa de su grupo (mismo nombreEspacio) y desactiva a las demás. Solo una variante activa por grupo cuenta para totales/contrato. */
    marcarActiva(id: string): EspacioVariante | null
  }
  items: {
    porVariante(varianteId: string): ItemVariante[]
    crear(data: Partial<ItemVariante> & { varianteId: string; catalogoId: string | null; cantidad: string }): ItemVariante
    actualizar(id: string, partial: Partial<Pick<ItemVariante, 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>>): ItemVariante | null
    eliminar(id: string): boolean
  }
  artefactos: {
    porEspacio(espacioVarianteId: string): EspacioArtefacto[]
    crear(data: Partial<EspacioArtefacto> & { espacioVarianteId: string; categoria: EspacioArtefacto['categoria'] }): EspacioArtefacto
    actualizar(id: string, partial: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>>): EspacioArtefacto | null
  }
  catalogo: {
    listar(): ProductoCatalogo[]
    buscar(query: string): ProductoCatalogo[]
    obtenerPorId(id: string): ProductoCatalogo | undefined
    /** P-27 R1-R6: valida sku único, descripción requerida, precios coherentes (≥0, directo≤público), stock≥0. Retorna null si alguna regla falla. */
    crear(data: Partial<ProductoCatalogo> & { sku: string; descripcion: string; unidadMedida: string }): ProductoCatalogo | null
    /** P-27 R1-R6 reaplicadas sobre el estado final; R5: publicadoWeb=true exige precioPublico e imagenUrl. */
    actualizar(id: string, partial: Partial<Omit<ProductoCatalogo, 'id' | 'createdAt'>>): ProductoCatalogo | null
    /** P-27 #8/R8: soft-delete (anulado=true) — no rompe totales históricos de items_variante existentes. */
    eliminar(id: string): boolean
  }
   parametros: {
     listar(): Parametro[]
     obtenerPorClave(clave: string): Parametro | undefined
     transicionesProyecto(): TransicionesProyecto
     actualizar(clave: string, datos: Partial<Parametro>): void
   }
  contratos: {
    porProyecto(proyectoId: string): Contrato | undefined
    crear(data: { proyectoId: string; codigoContrato: string; valorTotal: string; hitos: { tipo: 'percentage' | 'fixed'; monto: string; razon: string }[] }): Contrato
  }
  hitos: {
    porContrato(contratoId: string): HitoPago[]
  }
  auth: {
    usuarioActual(): UsuarioMock
  }
  // --- F3: Cronograma y control ---
  cronogramas: {
    porProyecto(proyectoId: string): Cronograma | undefined
    obtenerPorId(id: string): Cronograma | undefined
    crear(data: { proyectoId: string }): Cronograma
  }
  cronogramaEtapas: {
    porCronograma(cronogramaId: string): CronogramaEtapa[]
    crear(data: {
      cronogramaId: string
      linea: LineaCronograma
      etapa: EtapaCronograma
      fechaIdeal: string
      fechaReal: string
      estado: string
    }): CronogramaEtapa
  }
  desfases: {
    porProyecto(proyectoId: string): DesfaseCronograma[]
    /** Aplica E-33: crea el desfase, valida P33, y recalcula SOLO la línea interna del cronograma (I-034). */
    aplicar(proyectoId: string, data: { causa: CausaDesfase; composicionCausal: { origen: string; aporteDias: number }[]; motivo: string; diasDesfase: number }): DesfaseCronograma | null
    /** E-33/D4: decisión manual, solo gerente, justificación obligatoria. */
    decisionManual(desfaseId: string, data: { decisionManual: string; autorizadoPor: string }): DesfaseCronograma | null
  }
  checks: {
    porProyecto(proyectoId: string): CheckProduccion[]
    crear(proyectoId: string, data: { ratioInsumos: number; ratioPagos: number; ratioProduccion: number }): CheckProduccion
    /** R10: anular la sugerencia exige override_justificacion antes de habilitar Confirmar. */
    confirmar(checkId: string, data: { desenlaceFinal: DesenlaceCheck; overrideJustificacion?: string }): CheckProduccion | null
  }
  novedades: {
    porProyecto(proyectoId: string): NovedadCritica[]
    crear(proyectoId: string, data: { descripcion: string; fase: string; ventanaSlaHoras: number }): NovedadCritica
    actualizarEstado(id: string, estado: EstadoNovedadCritica, escaladoA?: string): NovedadCritica | null
  }
  comunicaciones: {
    porProyecto(proyectoId: string): ComunicacionProgreso[]
    /** R4: solo adelantos positivos (E-59→E-60); nunca atrasos. */
    crear(proyectoId: string, data: { contenido: string }): ComunicacionProgreso | null
  }
  // --- F3: Desarrollo y schema ---
  schemas: {
    porProyecto(proyectoId: string): SchemaProyecto[]
    crear(proyectoId: string): SchemaProyecto
    actualizarEstado(id: string, estado: EstadoSchema): SchemaProyecto | null
  }
  bom: {
    porSchema(schemaId: string): BomMaterial[]
    crear(data: { schemaId: string; productoId: string | null; cantidad: string; unidad: string; origen: OrigenBom; homologable: boolean; itemVarianteId?: string | null }): BomMaterial
  }
  verificaciones: {
    porProyecto(proyectoId: string): Verificacion[]
    /**
     * tipoGate='schema' (E-18): guard verificador único (D3/I-035). Mueve el estado del proyecto.
     * tipoGate='calidad' (E-24, P-17): R1 verificador = proyectos.verificadorId; R2 exige citación
     * 'citada' pendiente (si no hay, retorna null); R3 rechazo dispara reprocesos(origen='calidad');
     * R4 el proyecto NO cambia de estado al aprobar (determinismo anti-reapertura).
     */
    emitirVeredicto(data: { proyectoId: string; tipoGate: TipoGate; veredicto: VeredictoGate; verificadorId: string }): Verificacion | null
  }
  retomas: {
    porProyecto(proyectoId: string): Retoma | undefined
    guardar(proyectoId: string, data: { medidas?: Record<string, unknown>; fotos?: string[]; anomaliaDetectada?: boolean }): Retoma
  }
  cambiosContrato: {
    porProyecto(proyectoId: string): CambioContrato[]
    crear(data: { proyectoId: string; tipoCambio: CambioContrato['tipoCambio']; descripcion: string; disparaDesfase: boolean }): CambioContrato
  }
  // --- F3: Equipo ---
  personas: {
    listar(): Persona[]
    crear(data: { nombre: string; documento?: string | null; telefono?: string | null }): Persona
  }
  personasRoles: {
    activos(): PersonaRol[]
    asignar(personaId: string, rolId: RolCanonico): PersonaRol
  }
  // --- F3: Producción (mínimo para gates) ---
  modulos: {
    porProyecto(proyectoId: string): Modulo[]
    /** P-16 R2/CA-3: solo avanza si `estado` es la siguiente en la secuencia por_armar→en_armado→armado→en_calidad. */
    actualizarEstado(id: string, estado: string): Modulo | null
  }
  estimaciones: {
    porProyecto(proyectoId: string): Estimacion | undefined
  }

  // --- F5: Taller, calidad, instalación, entrega, garantía ---
  ordenesTrabajo: {
    porProyecto(proyectoId: string): OrdenTrabajo[]
    crear(data: { proyectoId: string; tipo: TipoOrdenTrabajo; pedidoWebId?: string | null }): OrdenTrabajo
  }
  pedidosWeb: {
    porCliente(clienteId: string): PedidoWeb[]
    crear(data: { clienteId: string; totalPedido: string }): PedidoWeb
  }
  citacionesCalidad: {
    porProyecto(proyectoId: string): CitacionCalidad[]
    crear(data: { proyectoId: string; modulosIds: string[]; fecha: string }): CitacionCalidad
  }
  reprocesos: {
    porProyecto(proyectoId: string): Reproceso[]
    crear(data: { proyectoId: string; origen: OrigenReproceso; moduloId?: string | null; culpable?: string | null; granularidad?: 'modulo' | 'componente' | null; descripcion?: string | null }): Reproceso
  }
  instalaciones: {
    porProyecto(proyectoId: string): Instalacion[]
    /** P-18 R1/CA-2: rango ≤5 días. Retorna null si no cumple. */
    programar(data: { proyectoId: string; rangoFechaInicio: string; rangoFechaFin: string }): Instalacion | null
    /** Guard P24 (E-24 aprobado, R2). Mueve proyectos.estado → en_instalacion. */
    iniciar(id: string): Instalacion | null
    /** Mueve proyectos.estado → instalado (R3). */
    marcarInstalada(id: string): Instalacion | null
    /** Crea reprocesos(origen='instalacion') (E-54, R18 modal en UI). */
    marcarFallida(id: string, motivo: string): Instalacion | null
  }
  actasEntrega: {
    porProyecto(proyectoId: string): ActaEntrega | undefined
    /** R1: solo si instalaciones.estado='instalada'. Retorna null si no cumple. */
    generar(proyectoId: string, data?: { holguraOperativaDias?: number; fotos?: string[]; observaciones?: string | null }): ActaEntrega | null
    /** R: exige pdfUrl no vacío. */
    enviar(id: string): ActaEntrega | null
    /** R3: mueve proyectos.estado → entregado (E-26), atómico. */
    firmar(id: string): ActaEntrega | null
  }
  casosGarantia: {
    porProyecto(proyectoId: string): CasoGarantia[]
    porCliente(clienteId: string): CasoGarantia[]
    /** R1 (proyecto entregado), R2 (calcula dentroGarantiaContractual desde el historial de estados), R4 (máx 5 fotos). Retorna null si alguna falla. */
    reportar(data: { proyectoId: string; moduloId?: string | null; clienteId?: string | null; descripcion: string; fotos?: string[] }): CasoGarantia | null
    diagnosticar(id: string, diagnostico: string): CasoGarantia | null
    /** R6: crea ordenes_trabajo(tipo='garantia'), mueve caso → en_reparacion. */
    crearOrdenReparacion(id: string): CasoGarantia | null
    /** Dispara reprocesos(origen='garantia') (E-54); exige dentroGarantiaContractual=true. */
    dispararReproceso(id: string): CasoGarantia | null
    resolver(id: string, solucionAplicada: string): CasoGarantia | null
    cerrar(id: string): CasoGarantia | null
  }
  citasGarantia: {
    porCaso(casoId: string): CitaGarantia[]
    agendar(data: { casoId: string; proyectoId: string; fecha: string }): CitaGarantia
  }

  // --- F6: Finanzas ---
  cuentasFinancieras: {
    listar(): CuentaFinanciera[]
    crear(data: { nombre: string; tipo: string; saldoActual?: string }): CuentaFinanciera
    /** P-21 R4/E-20: SUM real recalculado en cada consulta, nunca cacheado. */
    disponible(): number
  }
  movimientosFinancieros: {
    listar(): MovimientoFinanciero[]
    porCuenta(cuentaId: string): MovimientoFinanciero[]
  }
  obligacionesPendientes: {
    listar(): ObligacionPendiente[]
    porProyecto(proyectoId: string): ObligacionPendiente[]
    crear(data: Partial<ObligacionPendiente> & { descripcion: string; origen: OrigenObligacion; montoTotal: string; fechaVencimiento: string }): ObligacionPendiente
    /** P-22 R3: movimiento + monto_pagado en la misma "transacción" (mock, sin tx real). */
    registrarPago(id: string, data: { monto: string; cuentaId: string; medioPago?: string }): ObligacionPendiente | null
  }
  ordenesCompra: {
    listar(): OrdenCompra[]
    porProveedor(proveedorId: string): OrdenCompra[]
    crear(data: Partial<OrdenCompra> & { proveedorId: string; montoTotal: string }): OrdenCompra
    actualizarEstado(id: string, estado: EstadoOrdenCompra): OrdenCompra | null
  }
  registrosGateCaja: {
    listar(): RegistroGateCaja[]
    porOrdenCompra(ordenCompraId: string): RegistroGateCaja[]
  }
  caja: {
    /** P-21 R1/R2/E-20: paga si hay caja disponible; si no, bloquea y registra en registros_gate_caja (retorna null). */
    autorizarPago(data: { ordenCompraId: string; cuentaId: string; medioPago?: string }): MovimientoFinanciero | null
  }
  proveedores: {
    listar(): Proveedor[]
    crear(data: Partial<Proveedor> & { nombre: string }): Proveedor
  }
  cuentasCobroProveedor: {
    listar(): CuentaCobroProveedor[]
    porProveedor(proveedorId: string): CuentaCobroProveedor[]
    /** P-23 R2/R4: crea obligaciones_pendientes(origen='proveedor') automáticamente; exige firma digital. */
    crear(data: { proveedorId: string; concepto: string; valor: string; firmaDigital: string; fechaEmision: string; fechaVencimiento?: string | null }): CuentaCobroProveedor | null
    /** P-23 R3: el proveedor de la cuenta debe coincidir con el de la OC. */
    vincularOC(id: string, ordenCompraId: string): CuentaCobroProveedor | null
    adjuntarFactura(id: string, urlDocumento: string): CuentaCobroProveedor | null
    marcarPagada(id: string): CuentaCobroProveedor | null
    anular(id: string): CuentaCobroProveedor | null
  }

  // --- F-02: Tienda web ---
  categorias: {
    listar(): Categoria[]
    porTipo(tipo: string): Categoria[]
    crear(data: { nombre: string; tipo: string; padreId?: string | null }): Categoria
  }
  productosTienda: {
    listar(): ProductoTienda[]
    /** F-02 R1: solo visibleEnTienda=true. */
    visibles(): ProductoTienda[]
    obtenerPorId(id: string): ProductoTienda | undefined
    crear(data: Partial<ProductoTienda> & { catalogoId: string; valorTienda: string }): ProductoTienda
    actualizar(id: string, partial: Partial<Pick<ProductoTienda, 'descripcionDiseno' | 'imagenPrincipalUrl' | 'categoriaId' | 'visibleEnTienda' | 'valorTienda' | 'inventarioDisponible'>>): ProductoTienda | null
  }
  catalogoAcabados: {
    listar(): CatalogoAcabado[]
    crear(data: Partial<CatalogoAcabado> & { nombre: string }): CatalogoAcabado
  }
  catalogoProductoAcabados: {
    porProducto(productoCatalogoId: string): CatalogoProductoAcabado[]
    crear(data: { productoCatalogoId: string; acabadoId: string; esDefault?: boolean }): CatalogoProductoAcabado
  }
  acabadosMuestras: {
    porAcabado(acabadoId: string): AcabadoMuestra[]
    crear(data: { acabadoId: string; imagenMuestraUrl?: string | null; disponibleWeb?: boolean }): AcabadoMuestra
  }

  // --- F-03: Portafolio de proyectos ---
  portafolio: {
    listar(): Portafolio[]
    /** F-03 R1/R4: solo publicado=true, ordenado destacado DESC luego orden ASC. */
    publicados(): Portafolio[]
    porSlug(slug: string): Portafolio | undefined
    crear(data: Partial<Portafolio> & { proyectoId: string; titulo: string; categoriaEspacio: string; slug: string }): Portafolio
    actualizar(id: string, partial: Partial<Pick<Portafolio, 'titulo' | 'descripcionComercial' | 'categoriaEspacio' | 'materialesDestacados' | 'precioReferencial' | 'destacado' | 'orden'>>): Portafolio | null
    publicar(id: string): Portafolio | null
    despublicar(id: string): Portafolio | null
  }
  modulosArtefactos: {
    porModulo(moduloId: string): ModuloArtefacto[]
    crear(data: { moduloId: string; tipo: TipoModuloArtefacto; fuente: FuenteModuloArtefacto; url: string }): ModuloArtefacto
  }

  /** Contrato de reactividad (M-07). Se suscribe a cualquier mutación del store. Devuelve la función de desuscripción. */
  subscribe(listener: () => void): () => void
  /** Contador que cambia en cada mutación. Usar como dependencia de useMemo/useSyncExternalStore en vez de un `trigger` manual. */
  getVersion(): number
}
