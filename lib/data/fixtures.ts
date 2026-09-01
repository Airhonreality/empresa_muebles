// Fixtures con datos reales del negocio.
// Fuente: destilación cotizador/contrato, inventario legacy, parámetros v1, REGISTRO.
import type {
  Cliente, ProductoCatalogo, Proyecto, EspacioVariante, ItemVariante, EspacioArtefacto, Parametro, Contrato, HitoPago, UsuarioMock, Cronograma, CronogramaEtapa, DesfaseCronograma, CheckProduccion, NovedadCritica, ComunicacionProgreso, SchemaProyecto, BomMaterial, Verificacion, Retoma, CambioContrato, Persona, PersonaRol, Modulo, Estimacion,
  OrdenTrabajo, PedidoWeb, CitacionCalidad, Reproceso, Instalacion, ActaEntrega, CasoGarantia, CitaGarantia,
  CuentaFinanciera, MovimientoFinanciero, ObligacionPendiente, Proveedor, OrdenCompra, RegistroGateCaja, CuentaCobroProveedor,
  Categoria, ProductoTienda, ProductoTiendaComponente, CatalogoAcabado, CatalogoProductoAcabado, AcabadoMuestra,
  Portafolio, ModuloArtefacto, CatalogoEspacioArquitectonico,
  ItemOrdenCompra, RecepcionMaterial, Herramienta, DocumentoProyecto,
  BitacoraArticulo, Testimonio,
} from './contracts'
import { SHOP_CATEGORIAS } from './contracts'

const UUID = (suffix: string) => `mock-${suffix}`

export const CLIENTES: Cliente[] = [
  { id: UUID('c01'), nombre: 'Casa Río', documento: 'CC-52345678', telefono: '3101112233', email: 'casa.rio@correo.com', domicilio: 'Carrera 15 #98-40, Bogotá', createdAt: '2026-05-10T10:00:00Z' },
  { id: UUID('c02'), nombre: 'Oficina Llanos', documento: 'NIT-900123456', telefono: '3145556677', email: 'admin@oficinalanos.com', domicilio: 'Calle 72 #10-34, Of. 502', createdAt: '2026-06-20T10:00:00Z' },
  { id: UUID('c03'), nombre: 'Cocina Márquez', documento: 'CC-79865432', telefono: '3189990011', email: 'marquez.cocina@correo.com', domicilio: 'Calle 134 #7B-21, Apto 401', createdAt: '2026-07-01T10:00:00Z' },
]

const CATALOGO_TS = '2026-06-01T08:00:00Z'

export const CATALOGO: ProductoCatalogo[] = [
  { id: UUID('p01'), sku: 'TAB-ROB-18', descripcion: 'Tablero Roble 18mm', tipo: 'insumo', unidadMedida: 'm²', precioDirecto: '85000', precioPublico: '110000', stockActual: 40, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Maderas', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p02'), sku: 'TAB-NOG-18', descripcion: 'Tablero Nogal 18mm', tipo: 'insumo', unidadMedida: 'm²', precioDirecto: '78000', precioPublico: '102000', stockActual: 25, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Maderas', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p03'), sku: 'BIS-BLM-STD', descripcion: 'Bisagra Blum estándar', tipo: 'herraje', unidadMedida: 'ud', precioDirecto: '4200', precioPublico: '6500', stockActual: 200, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Herrajes', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p04'), sku: 'COR-FULL-45', descripcion: 'Corredera Full Extension 45cm', tipo: 'herraje', unidadMedida: 'ud', precioDirecto: '18500', precioPublico: '28000', stockActual: 60, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Herrajes', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p05'), sku: 'TIR-ACR-128', descripcion: 'Tirador Acero 128mm', tipo: 'herraje', unidadMedida: 'ud', precioDirecto: '9500', precioPublico: '14500', stockActual: 80, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Herrajes', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p06'), sku: 'SERV-DEV', descripcion: 'Servicio Diseño y Desarrollo Técnico', tipo: 'servicio', unidadMedida: 'jornada', precioDirecto: null, precioPublico: null, stockActual: 0, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Mano de Obra', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p07'), sku: 'SERV-ASM', descripcion: 'Servicio Ensamblaje en Taller', tipo: 'servicio', unidadMedida: 'jornada', precioDirecto: null, precioPublico: null, stockActual: 0, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Mano de Obra', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  { id: UUID('p08'), sku: 'SERV-INS', descripcion: 'Servicio Instalación en Obra', tipo: 'servicio', unidadMedida: 'jornada', precioDirecto: null, precioPublico: null, stockActual: 0, proveedorId: null, imagenUrl: null, galeriaImagenesUrl: [], modelo3dUrl: null, categoriaComercial: 'Mano de Obra', publicadoWeb: false, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
  // Producto publicado en web (F-02/P-27): satisface R5 (publicadoWeb requiere precioPublico + imagenUrl).
  { id: UUID('p09'), sku: 'MES-TV-NOG', descripcion: 'Mueble TV flotante Nogal 1.80m', tipo: 'producto_fijo', unidadMedida: 'ud', precioDirecto: '650000', precioPublico: '890000', stockActual: 5, proveedorId: null, imagenUrl: 'https://r2.mock/catalogo/mueble-tv-nogal.jpg', galeriaImagenesUrl: ['https://r2.mock/catalogo/mueble-tv-nogal-2.jpg', 'https://r2.mock/catalogo/mueble-tv-nogal-3.jpg'], modelo3dUrl: null, categoriaComercial: 'Muebles', publicadoWeb: true, proyectoOrigenId: null, anulado: false, createdAt: CATALOGO_TS, updatedAt: CATALOGO_TS },
]

export const PARAMETROS: Parametro[] = [
  { id: UUID('par01'), clave: 'neto_diseno_3d_pct', grupo: 'compensacion', tipo: 'numerico', valorNumeric: '97.50', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'Neto diseñador por diseño 3D (100 − retención 2.5% servicios CO)' },
  { id: UUID('par02'), clave: 'iva_diseno_3d_pct', grupo: 'compensacion', tipo: 'numerico', valorNumeric: '19', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'IVA del diseño 3D facturado' },
  { id: UUID('par03'), clave: 'recargo_hora_extra_pct', grupo: 'nominas', tipo: 'numerico', valorNumeric: '25', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'Recargo por hora extra diurna (CO estándar 25%)' },
  { id: UUID('par04'), clave: 'umbral_todo_bien_pct', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '0.95', valorTexto: null, valorBooleano: null, unidad: 'ratio', descripcion: 'check_produccion: clasifica todo_bien si MIN(ratios) ≥ 0.95' },
  { id: UUID('par05'), clave: 'umbral_extremo_pct', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '0.70', valorTexto: null, valorBooleano: null, unidad: 'ratio', descripcion: 'check_produccion: clasifica extremo si MIN(ratios) < 0.70' },
  { id: UUID('par06'), clave: 'reduccion_comision_novedad_pct', grupo: 'compensacion', tipo: 'numerico', valorNumeric: '0.50', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'Reducción comisión en novedad (50%)' },
  { id: UUID('par07'), clave: 'reduccion_comision_extremo_pct', grupo: 'compensacion', tipo: 'numerico', valorNumeric: '1.00', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'Reducción comisión en extremo (100%)' },
  { id: UUID('par08'), clave: 'transiciones_proyecto', grupo: 'comercial', tipo: 'texto', valorNumeric: null, valorTexto: JSON.stringify({
    activa: ['enviada', 'perdida', 'cancelada'],
    enviada: ['activa', 'negociacion', 'en_contrato', 'perdida', 'cancelada'],
    negociacion: ['en_contrato', 'enviada', 'perdida', 'cancelada'],
    en_contrato: ['pre_produccion', 'retoma', 'negociacion', 'perdida', 'cancelada'],
    retoma: ['en_contrato', 'pre_produccion', 'perdida', 'cancelada'],
    pre_produccion: ['produccion', 'retoma', 'cancelada'],
    produccion: ['entregado', 'retoma', 'pre_produccion', 'cancelada'],
    entregado: ['produccion', 'perdida', 'cancelada'],
    perdida: [],
    cancelada: [],
  }), valorBooleano: null, unidad: null, descripcion: 'Matriz de transiciones válidas del kanban comercial (C3) - Alineado con ACCIONES_POR_ESTADO (bidireccional 2026-08-19)' },
  { id: UUID('par09'), clave: 'arriendo_mensual_taller', grupo: 'taller', tipo: 'numerico', valorNumeric: '3000000', valorTexto: null, valorBooleano: null, unidad: 'COP/mes', descripcion: 'Arriendo mensual del taller de producción (C1)' },
  { id: UUID('par10'), clave: 'horas_mes_taller', grupo: 'taller', tipo: 'numerico', valorNumeric: '160', valorTexto: null, valorBooleano: null, unidad: 'horas', descripcion: 'Capacidad mensual del taller en horas productivas (C1, R5: debe ser > 0)' },
  { id: UUID('par11'), clave: 'pct_mantenimiento_maquinas', grupo: 'taller', tipo: 'numerico', valorNumeric: '10', valorTexto: null, valorBooleano: null, unidad: '%', descripcion: 'Porcentaje de mantenimiento mensual de máquinas sobre arriendo (C1)' },
  { id: UUID('par12'), clave: 'factor_logistica_instalacion', grupo: 'taller', tipo: 'numerico', valorNumeric: '1.5', valorTexto: null, valorBooleano: null, unidad: 'factor', descripcion: 'Factor de costo logístico para instalación en obra (C1)' },
{ id: UUID('par13'), clave: 'costo_hora_operario_base', grupo: 'taller', tipo: 'numerico', valorNumeric: '25000', valorTexto: null, valorBooleano: null, unidad: 'COP/hora', descripcion: 'Costo hora base del operario de taller (C1, desde parametros F0)' },
  { id: UUID('par14'), clave: 'tipo_costo_default', grupo: 'finanzas', tipo: 'texto', valorNumeric: null, valorTexto: 'por_tiempo', valorBooleano: null, unidad: null, descripcion: 'Tipo de costeo por defecto: por_tiempo | por_modulos (costeo decidido por el Supervisor: tarifa horaria + jornadas por espacio)' },
  { id: UUID('par15'), clave: 'valor_hora_desarrollador', grupo: 'finanzas', tipo: 'numerico', valorNumeric: null, valorTexto: '35000', valorBooleano: null, unidad: 'COP/hora', descripcion: 'Tarifa horaria del rol Desarrollador (capa por_tiempo del cotizador)' },
  { id: UUID('par16'), clave: 'valor_hora_carpintero', grupo: 'finanzas', tipo: 'numerico', valorNumeric: null, valorTexto: '30000', valorBooleano: null, unidad: 'COP/hora', descripcion: 'Tarifa horaria del rol Carpintero (capa por_tiempo del cotizador)' },
  { id: UUID('par17'), clave: 'valor_hora_auxiliar', grupo: 'finanzas', tipo: 'numerico', valorNumeric: null, valorTexto: '25000', valorBooleano: null, unidad: 'COP/hora', descripcion: 'Tarifa horaria del rol Auxiliar (capa por_tiempo del cotizador)' },
  { id: UUID('par18'), clave: 'arriendo_taller_por_dia', grupo: 'finanzas', tipo: 'numerico', valorNumeric: null, valorTexto: '0', valorBooleano: null, unidad: 'COP/día', descripcion: 'Arriendo de taller prorrateado por día (capa por_tiempo del cotizador)' },
  { id: UUID('par19'), clave: 'dias_habiles_por_mes', grupo: 'finanzas', tipo: 'numerico', valorNumeric: '25', valorTexto: null, valorBooleano: null, unidad: 'días', descripcion: 'Días hábiles por mes para prorratear arriendo de taller' },
  { id: UUID('par20'), clave: 'base_semanas_cronograma', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '4', valorTexto: null, valorBooleano: null, unidad: 'semanas', descripcion: 'Base promedio del cronograma contractual: 1 desarrollo + 1 compras + 1 ensamblaje + 1 instalación' },
  { id: UUID('par21'), clave: 'holgura_maxima_dias', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '12', valorTexto: null, valorBooleano: null, unidad: 'días', descripcion: 'Cláusula real de holgura operativa post-entrega (detalles menores, no condicionan el pago)' },
  { id: UUID('par22'), clave: 'promesa_semanas', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '7', valorTexto: null, valorBooleano: null, unidad: 'semanas', descripcion: 'Promesa actual al cliente: 7 semanas (ideal 4; hoy se tarda 6.5)' },
  { id: UUID('par23'), clave: 'sla_novedad_critica_min_horas', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '5', valorTexto: null, valorBooleano: null, unidad: 'horas', descripcion: 'Ventana mínima SLA de novedad crítica' },
  { id: UUID('par24'), clave: 'sla_novedad_critica_max_horas', grupo: 'cronograma', tipo: 'numerico', valorNumeric: '24', valorTexto: null, valorBooleano: null, unidad: 'horas', descripcion: 'Ventana máxima SLA de novedad crítica' },
  { id: UUID('par25'), clave: 'precio_asesoria_3d', grupo: 'comercial', tipo: 'numerico', valorNumeric: '130000', valorTexto: null, valorBooleano: null, unidad: 'COP', descripcion: 'Precio base de la asesoría con diseño 3D' },
]

const estaciones: Proyecto[] = [
  { id: UUID('proj01'), nombreProyecto: 'Cocina Márquez — Integral', estado: 'activa', tipoProyecto: 'personalizado', direccionObra: 'Calle 134 #7B-21, Apto 401', costosOperativos: '120000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 42, descripcionSemantica: 'Cocina integral en roble con isla central y mesón en granito', clienteId: UUID('c03'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-07-20T14:30:00Z' },
  { id: UUID('proj02'), nombreProyecto: 'Closet Vestier — Río', estado: 'enviada', tipoProyecto: 'personalizado', direccionObra: 'Carrera 15 #98-40', costosOperativos: '80000', imprevistosInstalacion: '0', descuentoComercial: '50000', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 28, descripcionSemantica: 'Closet vestier en nogal con puertas corredizas', clienteId: UUID('c01'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-22T09:00:00Z' },
  { id: UUID('proj03'), nombreProyecto: 'Escritorios — Llanos', estado: 'en_contrato', tipoProyecto: 'producto_fijo', direccionObra: 'Calle 72 #10-34, Of. 502', costosOperativos: '50000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 1, diasEntregaEstimados: 21, descripcionSemantica: '3 escritorios ejecutivos en cedro', clienteId: UUID('c02'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-07-10T11:00:00Z', updatedAt: '2026-08-01T16:00:00Z' },
  { id: UUID('proj04'), nombreProyecto: 'Barra Bar — Río', estado: 'pre_produccion', tipoProyecto: 'personalizado', direccionObra: 'Carrera 15 #98-40', costosOperativos: '200000', imprevistosInstalacion: '0', descuentoComercial: '100000', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 35, descripcionSemantica: 'Barra de bar en roble con iluminación LED', clienteId: UUID('c01'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-07-30T10:00:00Z' },
  { id: UUID('proj05'), nombreProyecto: 'Mueble TV — Gómez', estado: 'produccion', tipoProyecto: 'producto_fijo', direccionObra: 'Calle 80 #15-22, Apto 302', costosOperativos: '30000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 1, diasEntregaEstimados: 14, descripcionSemantica: 'Mueble TV flotante en nogal', clienteId: UUID('c02'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-07-25T12:00:00Z' },
  { id: UUID('proj06'), nombreProyecto: 'Cocina Pequeña — Díaz', estado: 'entregado', tipoProyecto: 'personalizado', direccionObra: 'Calle 63 #5-12, Apto 101', costosOperativos: '90000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 35, descripcionSemantica: 'Cocina compacta en cedro con electrodomésticos integrados', clienteId: UUID('c03'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-06-01T18:00:00Z' },
  { id: UUID('proj07'), nombreProyecto: 'Estantería — Rojas', estado: 'perdida', tipoProyecto: 'personalizado', direccionObra: 'Calle 100 #12-45', costosOperativos: '0', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 28, descripcionSemantica: 'Estantería modular de piso a techo en pino', clienteId: UUID('c01'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-15T14:00:00Z' },
  { id: UUID('proj08'), nombreProyecto: 'Mesón — Cancelado', estado: 'cancelada', tipoProyecto: 'personalizado', direccionObra: 'Calle 45 #8-90', costosOperativos: '0', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 1, diasEntregaEstimados: 7, descripcionSemantica: 'Solo mesón en granito (cancelado por el cliente)', clienteId: UUID('c02'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-01-15T09:00:00Z', updatedAt: '2026-02-01T11:00:00Z' },
  { id: UUID('proj09'), nombreProyecto: 'Biblioteca — Vargas', estado: 'negociacion', tipoProyecto: 'personalizado', direccionObra: 'Calle 85 #15-33, Apto 601', costosOperativos: '110000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 30, descripcionSemantica: 'Biblioteca de piso a techo en cedro con iluminación integrada', clienteId: UUID('c01'), comercialId: UUID('u01'), verificadorId: null, fechaEntradaDesarrollo: null, comercialVendedorId: null, createdAt: '2026-07-20T09:00:00Z', updatedAt: '2026-08-05T11:00:00Z' },
  // Proyectos canónicos F3 (disenio_f3) — corredor desarrollo → instalación (glosario_h07.md §B.0).
  { id: UUID('proj10'), nombreProyecto: 'Cocina La Pradera — Integral', estado: 'desarrollo', tipoProyecto: 'personalizado', direccionObra: 'Calle 23 #45-12, Apto 402', costosOperativos: '150000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 35, descripcionSemantica: 'Cocina integral en nogal con isla y electrodomésticos empotrados', clienteId: UUID('c01'), comercialId: UUID('u01'), verificadorId: UUID('p02'), fechaEntradaDesarrollo: '2026-08-01T08:00:00Z', comercialVendedorId: UUID('p02'), createdAt: '2026-07-25T09:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: UUID('proj11'), nombreProyecto: 'Closet Suite — Monte', estado: 'aprobado_compras', tipoProyecto: 'personalizado', direccionObra: 'Carrera 7 #115-30', costosOperativos: '90000', imprevistosInstalacion: '0', descuentoComercial: '30000', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 28, descripcionSemantica: 'Closet de suite principal con puertas corredizas en roble', clienteId: UUID('c02'), comercialId: UUID('u01'), verificadorId: UUID('p02'), fechaEntradaDesarrollo: '2026-07-10T09:00:00Z', comercialVendedorId: UUID('p02'), createdAt: '2026-07-08T09:00:00Z', updatedAt: '2026-08-03T16:00:00Z' },
  { id: UUID('proj12'), nombreProyecto: 'Cocina Gourmet — Bosque', estado: 'armado', tipoProyecto: 'personalizado', direccionObra: 'Calle 90 #45-70, Apto 501', costosOperativos: '180000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: true, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: 42, descripcionSemantica: 'Cocina gourmet en nogal con isla doble y acabados premium', clienteId: UUID('c03'), comercialId: UUID('u01'), verificadorId: UUID('p02'), fechaEntradaDesarrollo: '2026-06-20T08:00:00Z', comercialVendedorId: UUID('p02'), createdAt: '2026-06-15T09:00:00Z', updatedAt: '2026-08-05T10:00:00Z' },
  { id: UUID('proj13'), nombreProyecto: 'Escritorios Ejecutivos — Norte', estado: 'en_instalacion', tipoProyecto: 'producto_fijo', direccionObra: 'Calle 100 #19-50, Of. 301', costosOperativos: '60000', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 1, diasEntregaEstimados: 21, descripcionSemantica: '3 escritorios ejecutivos con set de cajones en cedro', clienteId: UUID('c02'), comercialId: UUID('u01'), verificadorId: UUID('p02'), fechaEntradaDesarrollo: '2026-06-01T08:00:00Z', comercialVendedorId: UUID('p02'), createdAt: '2026-05-30T09:00:00Z', updatedAt: '2026-08-06T14:00:00Z' },
]
export const PROYECTOS = estaciones

export const ESPACIOS: EspacioVariante[] = [
  { id: UUID('esp01'), proyectoId: UUID('proj01'), nombreEspacio: 'Cocina principal', nombreVariante: 'Inicial', tipoEspacio: 'cocina', descripcion: 'Muebles bajos + altos + isla central', activa: true, visibleEnPropuestaPublica: true, orden: 0, jornadasDesarrolloTecnico: '3.00', jornadasEnsamblajeTaller: '5.00', jornadasInstalacionObra: '4.00', colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [] },
  { id: UUID('esp02'), proyectoId: UUID('proj01'), nombreEspacio: 'Isla central', nombreVariante: 'Inicial', tipoEspacio: 'cocina', descripcion: 'Isla con cubierta en granito', activa: false, visibleEnPropuestaPublica: true, orden: 1, jornadasDesarrolloTecnico: '2.00', jornadasEnsamblajeTaller: '3.00', jornadasInstalacionObra: '2.00', colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [] },
  { id: UUID('esp03'), proyectoId: UUID('proj01'), nombreEspacio: 'Despensa', nombreVariante: 'Inicial', tipoEspacio: 'cocina', descripcion: 'Estantería de despensa en roble', activa: true, visibleEnPropuestaPublica: true, orden: 2, jornadasDesarrolloTecnico: '1.00', jornadasEnsamblajeTaller: '2.00', jornadasInstalacionObra: '1.00', colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [] },
  { id: UUID('esp04'), proyectoId: UUID('proj02'), nombreEspacio: 'Closet principal', nombreVariante: 'Inicial', tipoEspacio: 'closet', descripcion: 'Closet vestier completo', activa: true, visibleEnPropuestaPublica: true, orden: 0, jornadasDesarrolloTecnico: '2.00', jornadasEnsamblajeTaller: '4.00', jornadasInstalacionObra: '3.00', colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [] },
  { id: UUID('esp05'), proyectoId: UUID('proj03'), nombreEspacio: 'Escritorio 1', nombreVariante: 'Inicial', tipoEspacio: 'estudio_home_office', descripcion: 'Escritorio ejecutivo 1.60m', activa: true, visibleEnPropuestaPublica: true, orden: 0, jornadasDesarrolloTecnico: '1.00', jornadasEnsamblajeTaller: '2.00', jornadasInstalacionObra: '1.00', colores: [], fotosEspacio: [], fotosDisenio: [], fotosReferencia: [] },
]

export const ITEMS: ItemVariante[] = [
  { id: UUID('it01'), varianteId: UUID('esp01'), catalogoId: UUID('p01'), nombrePersonalizado: null, cantidad: '4.50', precioUnitario: '110000', totalLinea: '495000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it02'), varianteId: UUID('esp01'), catalogoId: UUID('p03'), nombrePersonalizado: null, cantidad: '12', precioUnitario: '6500', totalLinea: '78000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it03'), varianteId: UUID('esp01'), catalogoId: UUID('p04'), nombrePersonalizado: null, cantidad: '3', precioUnitario: '28000', totalLinea: '84000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it04'), varianteId: UUID('esp01'), catalogoId: UUID('p05'), nombrePersonalizado: null, cantidad: '6', precioUnitario: '14500', totalLinea: '87000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it05'), varianteId: UUID('esp02'), catalogoId: UUID('p01'), nombrePersonalizado: null, cantidad: '2.00', precioUnitario: '110000', totalLinea: '220000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it06'), varianteId: UUID('esp02'), catalogoId: UUID('p03'), nombrePersonalizado: null, cantidad: '6', precioUnitario: '6500', totalLinea: '39000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it07'), varianteId: UUID('esp03'), catalogoId: UUID('p01'), nombrePersonalizado: null, cantidad: '3.00', precioUnitario: '110000', totalLinea: '330000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it08'), varianteId: UUID('esp04'), catalogoId: UUID('p02'), nombrePersonalizado: null, cantidad: '5.00', precioUnitario: '102000', totalLinea: '510000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it09'), varianteId: UUID('esp04'), catalogoId: UUID('p04'), nombrePersonalizado: null, cantidad: '4', precioUnitario: '28000', totalLinea: '112000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  { id: UUID('it10'), varianteId: UUID('esp05'), catalogoId: UUID('p02'), nombrePersonalizado: null, cantidad: '2.00', precioUnitario: '102000', totalLinea: '204000', anulado: false, esReferencial: false, fuenteReferencial: null, grupoReferencial: null, createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
  // Demo de "Presupuesto Adicional (Referenciales)" — obra civil estimada para el cliente, NO objeto de contrato (disenio_p04_cotizador.md Collapse 11).
  { id: UUID('it11'), varianteId: UUID('esp01'), catalogoId: null, nombrePersonalizado: 'Ventanas PVC 3m', cantidad: '3', precioUnitario: '450000', totalLinea: '1350000', anulado: false, esReferencial: true, fuenteReferencial: 'obra_civil', grupoReferencial: 'Obra Civil / Ventanas', createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z' },
]

export const ARTEFACTOS: EspacioArtefacto[] = [
  { id: UUID('art01'), espacioVarianteId: UUID('esp01'), categoria: 'determinante', dimensionesMm: '400×400×300', tipoSpecifique: 'Impresora 4×4', ubicacion: 'Isla central', fotoUrl: null, requiereVerificacion: true, validadoPor: null, validadoEn: null, createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-06-20T08:00:00Z' },
  { id: UUID('art02'), espacioVarianteId: UUID('esp01'), categoria: 'bloqueante', dimensionesMm: null, tipoSpecifique: 'Cortina enrollable', ubicacion: 'Ventana norte', fotoUrl: null, requiereVerificacion: true, validadoPor: null, validadoEn: null, createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-06-20T08:00:00Z' },
  { id: UUID('art03'), espacioVarianteId: UUID('esp01'), categoria: 'electrodomestico', dimensionesMm: '600×600×850', tipoSpecifique: 'Lavavajillas existente', ubicacion: 'Bajo mesón', fotoUrl: null, requiereVerificacion: false, validadoPor: UUID('u01'), validadoEn: '2026-07-15', createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-07-15T10:00:00Z' },
]

export const CONTRATO_CANONICO: Contrato = {
  id: UUID('ctr01'),
  proyectoId: UUID('proj01'),
  codigoContrato: 'CTR-2026-0042',
  fechaContrato: '2026-07-01',
  valorTotal: '1800000',
  estado: 'borrador',
  garantiaAnios: 2,
  plazoEjecucionTexto: '6 a 7',
  holguraDias: 8,
  objetoItems: 'Cocina integral en roble con isla central y mesón en granito. Incluye: muebles bajos, muebles altos, isla central, despensa.',
  especificacionesEstructura: 'Estructura en roble macizo 18mm. Uniones con espiga y caja. Refuerzos metálicos en esquinas.',
  especificacionesHerrajes: 'Bisagras Blum de cierre suave. Correderas Full Extension 45cm. Tiradores acero 128mm.',
  especificacionesMesones: 'Mesón en granito negro absoluto pulido. Espesor 3cm. Bordes redondeados.',
  especificacionesDesmonte: null,
  contratanteDomicilio: null,
  emailAsunto: null,
  emailCuerpo: null,
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T10:00:00Z',
}

export const HITOS: HitoPago[] = [
  { id: UUID('h01'), contratoId: UUID('ctr01'), orden: 1, tipo: 'percentage', montoOPorcentaje: '40', razon: 'Anticipo al firmar contrato' },
  { id: UUID('h02'), contratoId: UUID('ctr01'), orden: 2, tipo: 'percentage', montoOPorcentaje: '40', razon: 'Al iniciar instalación' },
  { id: UUID('h03'), contratoId: UUID('ctr01'), orden: 3, tipo: 'percentage', montoOPorcentaje: '20', razon: 'Contra entrega y acta de satisfacción' },
]

export const USUARIOS: UsuarioMock[] = [
  { id: UUID('u01'), email: 'admin@dev.local', nombre: 'Javier García', rol: 'admin' },
  { id: UUID('u02'), email: 'comercial@dev.local', nombre: 'Laura Comercial', rol: 'comercial' },
  { id: UUID('u03'), email: 'taller@dev.local', nombre: 'Hernán García', rol: 'taller' },
]

// --- F3: Equipo (REGISTRO §1) ---

const SIN_DATOS_LEGALES = {
  direccion: null,
  referencia1Nombre: null,
  referencia1Relacion: null,
  referencia1Telefono: null,
  referencia2Nombre: null,
  referencia2Relacion: null,
  referencia2Telefono: null,
  activo: true,
} as const

export const PERSONAS: Persona[] = [
  { id: UUID('p01'), nombre: 'Javier García', documento: 'CC-77901000', telefono: '3001112233', fotoUrl: null, email: 'javier@vetadeoro.co', ...SIN_DATOS_LEGALES },
  { id: UUID('p02'), nombre: 'Laura Comercial', documento: 'CC-102044550', telefono: '3012345678', fotoUrl: null, email: 'laura@vetadeoro.co', ...SIN_DATOS_LEGALES },
  { id: UUID('p03'), nombre: 'Hernán García', documento: 'CC-79990011', telefono: '3023456789', fotoUrl: null, email: 'hernan@vetadeoro.co', ...SIN_DATOS_LEGALES },
  { id: UUID('p04'), nombre: 'Camila Desarrolladora', documento: 'CC-103055661', telefono: '3034567890', fotoUrl: null, email: 'camila@vetadeoro.co', ...SIN_DATOS_LEGALES },
  { id: UUID('p05'), nombre: 'Andrés Compras', documento: 'CC-104066772', telefono: '3045678901', fotoUrl: null, email: 'andres@vetadeoro.co', ...SIN_DATOS_LEGALES },
  { id: UUID('p06'), nombre: 'Sofía Taller', documento: 'CC-105077883', telefono: '3056789012', fotoUrl: null, email: 'sofia@vetadeoro.co', ...SIN_DATOS_LEGALES },
]

export const PERSONAS_ROLES: PersonaRol[] = [
  { id: UUID('pr01'), personaId: UUID('p01'), rolId: 'admin', activo: true, desde: '2026-01-01T00:00:00Z' },
  { id: UUID('pr02'), personaId: UUID('p02'), rolId: 'comercial', activo: true, desde: '2026-01-01T00:00:00Z' },
  { id: UUID('pr03'), personaId: UUID('p03'), rolId: 'desarrollador', activo: true, desde: '2026-01-01T00:00:00Z' },
  { id: UUID('pr04'), personaId: UUID('p04'), rolId: 'desarrollador', activo: true, desde: '2026-02-01T00:00:00Z' },
  { id: UUID('pr05'), personaId: UUID('p05'), rolId: 'compras', activo: true, desde: '2026-01-01T00:00:00Z' },
  { id: UUID('pr06'), personaId: UUID('p06'), rolId: 'taller', activo: true, desde: '2026-01-01T00:00:00Z' },
]

// --- F3: Cronograma y control (REGISTRO §5) ---

export const CRONOGRAMAS: Cronograma[] = [
  { id: UUID('crog01'), proyectoId: UUID('proj10'), baseSemanas: 4, holguraMaximaDias: 12, promesaSemanas: 7, fechaFijacion: '2026-07-30', createdAt: '2026-07-30T08:00:00Z', updatedAt: '2026-07-30T08:00:00Z' },
  { id: UUID('crog02'), proyectoId: UUID('proj11'), baseSemanas: 4, holguraMaximaDias: 12, promesaSemanas: 7, fechaFijacion: '2026-07-11', createdAt: '2026-07-11T08:00:00Z', updatedAt: '2026-07-11T08:00:00Z' },
  { id: UUID('crog03'), proyectoId: UUID('proj12'), baseSemanas: 4, holguraMaximaDias: 12, promesaSemanas: 7, fechaFijacion: '2026-06-21', createdAt: '2026-06-21T08:00:00Z', updatedAt: '2026-06-21T08:00:00Z' },
]

export const CRONOGRAMA_ETAPAS: CronogramaEtapa[] = [
  // proj10 (desarrollo): la línea contractual fija el plan; la interna arranca igual (sin desfase).
  { id: UUID('cet01'), cronogramaId: UUID('crog01'), linea: 'contractual', etapa: 'aprobacion', fechaIdeal: '2026-08-08', fechaReal: '2026-08-08', estado: 'pendiente' },
  { id: UUID('cet02'), cronogramaId: UUID('crog01'), linea: 'contractual', etapa: 'compras', fechaIdeal: '2026-08-15', fechaReal: '2026-08-15', estado: 'pendiente' },
  { id: UUID('cet03'), cronogramaId: UUID('crog01'), linea: 'contractual', etapa: 'ensamblaje', fechaIdeal: '2026-08-22', fechaReal: '2026-08-22', estado: 'pendiente' },
  { id: UUID('cet04'), cronogramaId: UUID('crog01'), linea: 'contractual', etapa: 'instalacion', fechaIdeal: '2026-08-29', fechaReal: '2026-08-29', estado: 'pendiente' },
  { id: UUID('cet05'), cronogramaId: UUID('crog01'), linea: 'interna', etapa: 'aprobacion', fechaIdeal: '2026-08-08', fechaReal: '2026-08-08', estado: 'en_curso' },
  { id: UUID('cet06'), cronogramaId: UUID('crog01'), linea: 'interna', etapa: 'compras', fechaIdeal: '2026-08-15', fechaReal: '2026-08-15', estado: 'pendiente' },
  { id: UUID('cet07'), cronogramaId: UUID('crog01'), linea: 'interna', etapa: 'ensamblaje', fechaIdeal: '2026-08-22', fechaReal: '2026-08-22', estado: 'pendiente' },
  { id: UUID('cet08'), cronogramaId: UUID('crog01'), linea: 'interna', etapa: 'instalacion', fechaIdeal: '2026-08-29', fechaReal: '2026-08-29', estado: 'pendiente' },
  // proj11 (aprobado_compras): desfase ya aplicado — la línea interna fue recalculada (+3 días, I-034).
  { id: UUID('cet09'), cronogramaId: UUID('crog02'), linea: 'contractual', etapa: 'aprobacion', fechaIdeal: '2026-07-18', fechaReal: '2026-07-18', estado: 'aprobado' },
  { id: UUID('cet10'), cronogramaId: UUID('crog02'), linea: 'contractual', etapa: 'compras', fechaIdeal: '2026-07-25', fechaReal: '2026-07-25', estado: 'pendiente' },
  { id: UUID('cet11'), cronogramaId: UUID('crog02'), linea: 'interna', etapa: 'aprobacion', fechaIdeal: '2026-07-18', fechaReal: '2026-07-18', estado: 'aprobado' },
  { id: UUID('cet12'), cronogramaId: UUID('crog02'), linea: 'interna', etapa: 'compras', fechaIdeal: '2026-07-25', fechaReal: '2026-07-28', estado: 'en_curso' },
  { id: UUID('cet13'), cronogramaId: UUID('crog02'), linea: 'interna', etapa: 'ensamblaje', fechaIdeal: '2026-08-01', fechaReal: '2026-08-04', estado: 'pendiente' },
  { id: UUID('cet14'), cronogramaId: UUID('crog02'), linea: 'interna', etapa: 'instalacion', fechaIdeal: '2026-08-08', fechaReal: '2026-08-11', estado: 'pendiente' },
  // proj12 (armado): sin desfases.
  { id: UUID('cet15'), cronogramaId: UUID('crog03'), linea: 'contractual', etapa: 'aprobacion', fechaIdeal: '2026-06-27', fechaReal: '2026-06-27', estado: 'aprobado' },
  { id: UUID('cet16'), cronogramaId: UUID('crog03'), linea: 'interna', etapa: 'aprobacion', fechaIdeal: '2026-06-27', fechaReal: '2026-06-27', estado: 'aprobado' },
  { id: UUID('cet17'), cronogramaId: UUID('crog03'), linea: 'interna', etapa: 'ensamblaje', fechaIdeal: '2026-07-11', fechaReal: '2026-07-18', estado: 'en_curso' },
]

export const DESFASES: DesfaseCronograma[] = [
  {
    id: UUID('des01'),
    proyectoId: UUID('proj11'),
    diasDesfase: 3,
    causa: 'externa',
    composicionCausal: [{ origen: 'Proveedor de melamina', aporteDias: 2 }, { origen: 'Flete terrestre', aporteDias: 1 }],
    motivo: 'Retraso del proveedor en despacho de melamina y demora del flete asignado',
    aplicado: true,
    decisionManual: null,
    autorizadoPor: null,
    resultadoRecalculo: 'Línea interna desplazada +3 días; contractual inmutable (I-034)',
    createdAt: '2026-07-22T10:00:00Z',
  },
]

export const CHECKS: CheckProduccion[] = [
  { id: UUID('chk01'), proyectoId: UUID('proj12'), fechaCheck: '2026-07-01', ratioInsumos: 0.82, ratioPagos: 0.90, ratioProduccion: 0.97, desenlaceSugerido: 'novedad', desenlaceFinal: 'novedad', overrideJustificacion: null, comisionesReducidasPct: 0.50, verificadorId: UUID('p02'), createdAt: '2026-07-01T08:00:00Z' },
  { id: UUID('chk02'), proyectoId: UUID('proj12'), fechaCheck: '2026-07-16', ratioInsumos: 0.98, ratioPagos: 0.99, ratioProduccion: 0.97, desenlaceSugerido: 'todo_bien', desenlaceFinal: 'todo_bien', overrideJustificacion: null, comisionesReducidasPct: 0, verificadorId: UUID('p02'), createdAt: '2026-07-16T08:00:00Z' },
]

export const NOVEDADES: NovedadCritica[] = [
  { id: UUID('nov01'), proyectoId: UUID('proj10'), descripcion: 'El proveedor de herrajes despachó bisagras sin tratamiento anticorrosivo', fase: 'compras', ventanaSlaHoras: 24, estado: 'abierta', escaladoA: null, createdAt: '2026-08-04T09:00:00Z', updatedAt: '2026-08-04T09:00:00Z' },
  { id: UUID('nov02'), proyectoId: UUID('proj11'), descripcion: 'Cambio de mesón solicitado post-firma: se requiere corte adicional', fase: 'desarrollo', ventanaSlaHoras: 12, estado: 'escalada', escaladoA: UUID('p01'), createdAt: '2026-07-30T10:00:00Z', updatedAt: '2026-07-30T12:00:00Z' },
]

export const COMUNICACIONES: ComunicacionProgreso[] = [
  { id: UUID('com01'), proyectoId: UUID('proj12'), tipo: 'adelanto', contenido: 'Tu proyecto avanza bien: el ensamblaje va según lo previsto, posible instalación en los próximos 15 días.', visibleAlCliente: true, createdAt: '2026-07-16T09:00:00Z' },
]

// --- F3: Desarrollo y schema (REGISTRO §6) ---

export const SCHEMAS: SchemaProyecto[] = [
  { id: UUID('sch01'), proyectoId: UUID('proj10'), version: 1, estado: 'para_revision', createdAt: '2026-08-02T08:00:00Z', aprobadoEn: null },
  { id: UUID('sch02'), proyectoId: UUID('proj11'), version: 3, estado: 'aprobado_compras', createdAt: '2026-07-16T08:00:00Z', aprobadoEn: '2026-07-20T10:00:00Z' },
]

export const BOM: BomMaterial[] = [
  { id: UUID('bom01'), schemaId: UUID('sch01'), productoId: UUID('p02'), cantidad: '12', unidad: 'm²', origen: 'desarrollo', homologable: false, itemVarianteId: null },
  { id: UUID('bom02'), schemaId: UUID('sch01'), productoId: UUID('p03'), cantidad: '24', unidad: 'ud', origen: 'desarrollo', homologable: true, itemVarianteId: null },
  { id: UUID('bom03'), schemaId: UUID('sch01'), productoId: UUID('p04'), cantidad: '8', unidad: 'ud', origen: 'cotizacion', homologable: false, itemVarianteId: UUID('it09') },
]

export const VERIFICACIONES: Verificacion[] = [
  { id: UUID('ver01'), proyectoId: UUID('proj11'), tipoGate: 'schema', veredicto: 'aprobado', verificadorId: UUID('p02'), creadoEn: '2026-07-20T10:00:00Z' },
  { id: UUID('ver02'), proyectoId: UUID('proj12'), tipoGate: 'calidad', veredicto: 'reproceso_parcial', verificadorId: UUID('p02'), creadoEn: '2026-07-12T10:00:00Z' },
]

export const RETOMAS: Retoma[] = [
  {
    id: UUID('ret01'),
    proyectoId: UUID('proj10'),
    medidas: {
      'mod-101': { altoMm: 2100, anchoMm: 2400, profundidadMm: 600, electrodomestico: 'Horno empotrado 600mm' },
      'mod-102': { altoMm: 2100, anchoMm: 1200, profundidadMm: 350, electrodomestico: null },
    },
    fotos: [],
    anomaliaDetectada: false,
    createdAt: '2026-08-03T09:00:00Z',
    updatedAt: '2026-08-03T09:00:00Z',
  },
]

export const CAMBIOS_CONTRATO: CambioContrato[] = [
  { id: UUID('cam01'), proyectoId: UUID('proj11'), tipoCambio: 'cambio', descripcion: 'Mesón ampliado 15cm por reubicación de isla', disparaDesfase: true, createdAt: '2026-07-24T11:00:00Z' },
]

// --- F3: Producción (mínimo para gates) ---

export const MODULOS: Modulo[] = [
  { id: UUID('mod101'), proyectoId: UUID('proj12'), espacioVarianteId: null, nombre: 'Módulo bajo horno', estado: 'armado', padreId: null, padreLinaje: [], tipoModulo: 'mueble_bajo', cantidad: 1, horasEstimadas: '6', createdAt: '2026-06-25T08:00:00Z' },
  { id: UUID('mod102'), proyectoId: UUID('proj12'), espacioVarianteId: null, nombre: 'Módulo lavaplatos', estado: 'armado', padreId: null, padreLinaje: [], tipoModulo: 'mueble_bajo', cantidad: 1, horasEstimadas: '5', createdAt: '2026-06-25T08:00:00Z' },
  { id: UUID('mod103'), proyectoId: UUID('proj12'), espacioVarianteId: null, nombre: 'Mueble alto', estado: 'armado', padreId: null, padreLinaje: [], tipoModulo: 'mueble_alto', cantidad: 2, horasEstimadas: '8', createdAt: '2026-06-25T08:00:00Z' },
  { id: UUID('mod104'), proyectoId: UUID('proj12'), espacioVarianteId: null, nombre: 'Isla central', estado: 'compras', padreId: null, padreLinaje: [], tipoModulo: 'isla', cantidad: 1, horasEstimadas: '10', createdAt: '2026-06-25T08:00:00Z' },
  // Módulos canónicos de la fila del taller (P-16/P-17/P-18): proj13 en estados de flujo B3-0.
  { id: UUID('mod201'), proyectoId: UUID('proj13'), espacioVarianteId: null, nombre: 'Escritorio ejecutivo 1', estado: 'por_armar', padreId: null, padreLinaje: [], tipoModulo: 'escritorio', cantidad: 1, horasEstimadas: '4', createdAt: '2026-08-01T08:00:00Z' },
  { id: UUID('mod202'), proyectoId: UUID('proj13'), espacioVarianteId: null, nombre: 'Escritorio ejecutivo 2', estado: 'en_armado', padreId: null, padreLinaje: [], tipoModulo: 'escritorio', cantidad: 1, horasEstimadas: '4', createdAt: '2026-08-01T08:00:00Z' },
  { id: UUID('mod203'), proyectoId: UUID('proj13'), espacioVarianteId: null, nombre: 'Set de cajones', estado: 'en_calidad', padreId: UUID('mod202'), padreLinaje: [UUID('mod202')], tipoModulo: 'cajonera', cantidad: 3, horasEstimadas: '2', createdAt: '2026-08-01T08:00:00Z' },
]

export const ESTIMACIONES: Estimacion[] = [
  { id: UUID('est01'), proyectoId: UUID('proj10'), valor: '18500000', cantidadModulos: 4, duracionEstimada: '6 semanas', factorCrecimiento: 1.15, createdAt: '2026-07-30T08:00:00Z' },
]

// --- F5: Taller, calidad, instalación, entrega, garantía (REGISTRO §8) ---

export const ORDENES_TRABAJO: OrdenTrabajo[] = [
  { id: UUID('ot01'), proyectoId: UUID('proj13'), pedidoWebId: null, tipo: 'produccion', estado: 'abierta', createdAt: '2026-08-01T08:00:00Z' },
]

export const PEDIDOS_WEB: PedidoWeb[] = [
  { id: UUID('pw01'), clienteId: UUID('c02'), proyectoId: null, estado: 'nuevo', totalPedido: '950000', createdAt: '2026-08-05T09:00:00Z' },
]

// Citación de calidad ya activa para proj12 (estado 'armado' — precondición de P24/P-18).
export const CITACIONES_CALIDAD: CitacionCalidad[] = [
  { id: UUID('citc01'), proyectoId: UUID('proj12'), modulosIds: [UUID('mod101'), UUID('mod102'), UUID('mod103')], estado: 'citada', fecha: '2026-08-06T09:00:00Z', createdAt: '2026-08-06T09:00:00Z' },
]

export const REPROCESOS: Reproceso[] = [
  { id: UUID('rep01'), proyectoId: UUID('proj12'), origen: 'calidad', moduloId: UUID('mod104'), culpable: 'taller', granularidad: 'modulo', descripcion: 'Isla central con desalineación de bisagras', estado: 'abierto', createdAt: '2026-07-12T10:00:00Z' },
]

// proj13 ya está en_instalacion (fixtures PROYECTOS): instalación en curso consistente con ese estado.
export const INSTALACIONES: Instalacion[] = [
  { id: UUID('ins01'), proyectoId: UUID('proj13'), rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-12', estado: 'en_curso', adelantadaPor: null, createdAt: '2026-08-06T08:00:00Z', updatedAt: '2026-08-06T08:00:00Z' },
]

// proj06 ya está entregado (fixtures PROYECTOS): acta firmada consistente con ese estado.
export const ACTAS_ENTREGA: ActaEntrega[] = [
  { id: UUID('acta01'), proyectoId: UUID('proj06'), pdfUrl: 'https://r2.mock/actas/mock-proj06.pdf', estado: 'firmada', holguraOperativaDias: 12, fotos: [], observaciones: null, createdAt: '2026-06-01T18:00:00Z', updatedAt: '2026-06-01T18:00:00Z' },
]

export const CASOS_GARANTIA: CasoGarantia[] = [
  { id: UUID('gar01'), proyectoId: UUID('proj06'), moduloId: null, clienteId: UUID('c03'), descripcion: 'Puerta de despensa no cierra bien', fotos: [], estado: 'diagnosticado', dentroGarantiaContractual: true, fechaReporte: '2026-08-01T09:00:00Z', diagnostico: 'Bisagra desajustada, requiere reemplazo', solucionAplicada: null, createdAt: '2026-08-01T09:00:00Z', updatedAt: '2026-08-02T10:00:00Z' },
]

export const CITAS_GARANTIA: CitaGarantia[] = [
  { id: UUID('citg01'), casoId: UUID('gar01'), proyectoId: UUID('proj06'), fecha: '2026-08-02T14:00:00Z', diagnosticadoPor: UUID('p03'), resultado: 'Bisagra desajustada', createdAt: '2026-08-01T10:00:00Z' },
]

// --- F6: Finanzas (REGISTRO §9) ---

export const CUENTAS_FINANCIERAS: CuentaFinanciera[] = [
  { id: UUID('cta01'), nombre: 'Caja principal', tipo: 'caja', saldoActual: '8000000', createdAt: '2026-01-01T00:00:00Z' },
  { id: UUID('cta02'), nombre: 'Bancolombia Ahorros', tipo: 'banco', saldoActual: '15000000', createdAt: '2026-01-01T00:00:00Z' },
]

export const MOVIMIENTOS_FINANCIEROS: MovimientoFinanciero[] = [
  { id: UUID('mov01'), fecha: '2026-07-01', descripcion: 'Anticipo contrato Cocina Márquez — Integral', tipo: 'credito', monto: '720000', cuentaOrigenId: null, cuentaDestinoId: UUID('cta02'), obligacionId: UUID('obl01'), ordenCompraId: null, proyectoId: UUID('proj01'), contratoId: UUID('ctr01'), socioId: null, medioPago: 'transferencia', comprobanteUrl: null, prioridadPago: null, createdAt: '2026-07-01T10:00:00Z' },
]

// --- F7 (Compras): proveedores y órdenes de compra — contexto de F5/F6 (REGISTRO §7) ---

export const PROVEEDORES: Proveedor[] = [
  { id: UUID('prov01'), nombre: 'Maderas del Llano S.A.S', nit: '900111222-1', telefonoComercial: '3101234567', direccionDespacho: 'Zona Industrial Km 5', ciudad: 'Villavicencio', medioPago: 'transferencia', diasEntregaDefault: 7, transportadora: 'Envía', tarifaFlete: '150000', createdAt: '2026-01-01T00:00:00Z' },
  { id: UUID('prov02'), nombre: 'Herrajes Blum Colombia', nit: '900333444-2', telefonoComercial: '3209876543', direccionDespacho: 'Cra 68 #25-40', ciudad: 'Bogotá', medioPago: 'transferencia', diasEntregaDefault: 3, transportadora: 'Coordinadora', tarifaFlete: '80000', createdAt: '2026-01-01T00:00:00Z' },
]

export const ORDENES_COMPRA: OrdenCompra[] = [
  { id: UUID('oc01'), codigoOrden: 'OC-2026-0011', proyectoId: UUID('proj10'), proveedorId: UUID('prov01'), montoTotal: '3200000', anticipoMonto: '1600000', estado: 'en_pago', mecanicaPago: 'anticipo_saldo', fechaRecepcionEsperada: '2026-08-15', tiempoEntregaDias: 7, createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
  { id: UUID('oc02'), codigoOrden: 'OC-2026-0012', proyectoId: UUID('proj11'), proveedorId: UUID('prov02'), montoTotal: '1200000', anticipoMonto: null, estado: 'aprobada', mecanicaPago: 'unico', fechaRecepcionEsperada: '2026-08-11', tiempoEntregaDias: 3, createdAt: '2026-08-04T09:00:00Z', updatedAt: '2026-08-04T09:00:00Z' },
]

export const REGISTROS_GATE_CAJA: RegistroGateCaja[] = []

export const OBLIGACIONES_PENDIENTES: ObligacionPendiente[] = [
  { id: UUID('obl01'), descripcion: 'Anticipo contrato Cocina Márquez — Integral', origen: 'contrato_hito', montoTotal: '720000', montoPagado: '720000', fechaVencimiento: '2026-07-05', estado: 'pagado', personaId: null, clienteId: UUID('c03'), proveedorId: null, proyectoId: UUID('proj01'), contratoId: UUID('ctr01'), hitoId: UUID('h01'), ordenCompraId: null, baseCalculo: null, porcentaje: null, tipoComision: null, cantidadModulos: null, desfaseId: null, periodicidad: null, deduccionDiseno3d: false, createdAt: '2026-07-01T10:00:00Z' },
  { id: UUID('obl02'), descripcion: 'Comisión Laura Comercial — Closet Suite Monte', origen: 'comision', montoTotal: '450000', montoPagado: '0', fechaVencimiento: '2026-08-20', estado: 'pendiente', personaId: UUID('p02'), clienteId: null, proveedorId: null, proyectoId: UUID('proj11'), contratoId: null, hitoId: null, ordenCompraId: null, baseCalculo: '9000000', porcentaje: '5', tipoComision: 'venta', cantidadModulos: null, desfaseId: null, periodicidad: null, deduccionDiseno3d: false, createdAt: '2026-08-03T09:00:00Z' },
  // C-01 (auditoría 2026-08-10): obligaciones que faltaban para las OC ya existentes en fixture
  // (oc01/oc02 se crearon directo acá, no vía store.ordenesCompra.crear(), que ahora sí las genera).
  // P-21 Fix: agregar ordenCompraId para vincular cada obligación a su OC de origen.
  { id: UUID('obl03'), descripcion: 'Orden de compra: OC-2026-0011', origen: 'proveedor', montoTotal: '3200000', montoPagado: '0', fechaVencimiento: '2026-08-15', estado: 'pendiente', personaId: null, clienteId: null, proveedorId: UUID('prov01'), proyectoId: UUID('proj10'), contratoId: null, hitoId: null, ordenCompraId: UUID('oc01'), baseCalculo: null, porcentaje: null, tipoComision: null, cantidadModulos: null, desfaseId: null, periodicidad: null, deduccionDiseno3d: false, createdAt: '2026-08-05T09:00:00Z' },
  { id: UUID('obl04'), descripcion: 'Orden de compra: OC-2026-0012', origen: 'proveedor', montoTotal: '1200000', montoPagado: '0', fechaVencimiento: '2026-08-11', estado: 'pendiente', personaId: null, clienteId: null, proveedorId: UUID('prov02'), proyectoId: UUID('proj11'), contratoId: null, hitoId: null, ordenCompraId: UUID('oc02'), baseCalculo: null, porcentaje: null, tipoComision: null, cantidadModulos: null, desfaseId: null, periodicidad: null, deduccionDiseno3d: false, createdAt: '2026-08-04T09:00:00Z' },
]

export const CUENTAS_COBRO_PROVEEDOR: CuentaCobroProveedor[] = [
  // P-23 Fix: agregar obligacionId para vincular cada cuenta a su obligación específica.
  { id: UUID('ccp01'), proveedorId: UUID('prov01'), ordenCompraId: UUID('oc01'), obligacionId: null, concepto: 'Tableros roble y nogal — pedido agosto', valor: '3200000', estado: 'vinculada', firmaDigital: 'firma-prov01-2026-08-05', urlDocumento: null, fechaEmision: '2026-08-05', fechaVencimiento: '2026-08-20', createdAt: '2026-08-05T09:30:00Z' },
]

// --- F-02: Tienda web (REGISTRO §2/§10) ---

export const CATEGORIAS: Categoria[] = [
  { id: UUID('catg01'), nombre: 'Muebles', tipo: 'tienda', padreId: null, activo: true },
  { id: UUID('catg02'), nombre: 'Mesas de centro', tipo: 'tienda', padreId: UUID('catg01'), activo: true },
  { id: UUID('catg03'), nombre: 'Cocinas', tipo: 'tienda', padreId: null, activo: true },
]

export const PRODUCTOS_TIENDA: ProductoTienda[] = [
  { id: UUID('pt01'), catalogoId: UUID('p09'), descripcionDiseno: 'Mueble TV flotante en nogal macizo con luz LED integrada', imagenPrincipalUrl: 'https://r2.mock/tienda/mueble-tv-nogal.jpg', categoria: SHOP_CATEGORIAS.COCINAS, visibleEnTienda: true, valorTienda: '950000', inventarioDisponible: 3, calificacionPromedio: 4.8, createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z' },
]

// Composición real del diseño consolidado pt01 (disenio_p27 §6.2, 2026-08-11):
// un producto de tienda es N componentes del catálogo, no un solo ítem.
export const PRODUCTOS_TIENDA_COMPONENTES: ProductoTiendaComponente[] = [
  { id: UUID('ptc01'), productoTiendaId: UUID('pt01'), catalogoId: UUID('p02'), cantidad: '1.8', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z' },
  { id: UUID('ptc02'), productoTiendaId: UUID('pt01'), catalogoId: UUID('p05'), cantidad: '4', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z' },
  { id: UUID('ptc03'), productoTiendaId: UUID('pt01'), catalogoId: UUID('p03'), cantidad: '2', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z' },
]

export const CATALOGO_ACABADOS: CatalogoAcabado[] = [
  { id: UUID('aca01'), nombre: 'Nogal natural', familia: 'maderas', color: 'marrón oscuro', colorHex: '#5C4033', textura: 'veta recta', precioDiferencial: '0', imagenTexturaUrl: 'https://r2.mock/acabados/nogal-natural.jpg' },
  { id: UUID('aca02'), nombre: 'Roble blanqueado', familia: 'maderas', color: 'beige claro', colorHex: '#E8DFCA', textura: 'veta abierta', precioDiferencial: '25000', imagenTexturaUrl: 'https://r2.mock/acabados/roble-blanqueado.jpg' },
]

export const CATALOGO_PRODUCTO_ACABADOS: CatalogoProductoAcabado[] = [
  { id: UUID('cpa01'), productoCatalogoId: UUID('p09'), acabadoId: UUID('aca01'), esDefault: true },
  { id: UUID('cpa02'), productoCatalogoId: UUID('p09'), acabadoId: UUID('aca02'), esDefault: false },
]

export const ACABADOS_MUESTRAS: AcabadoMuestra[] = [
  { id: UUID('am01'), acabadoId: UUID('aca01'), imagenMuestraUrl: 'https://r2.mock/muestras/nogal-natural.jpg', disponibleWeb: true },
  { id: UUID('am02'), acabadoId: UUID('aca02'), imagenMuestraUrl: 'https://r2.mock/muestras/roble-blanqueado.jpg', disponibleWeb: true },
]

// --- t-147: Taxonomía orgánica de espacios (catalogo_espacios_arquitectonicos) ---
// Independiente de las 7 landings: tipa y modula espacios (unidad base, rangos, módulos típicos).
// Códigos con prefijo ESP-* (espacio de nombres distinto al de la landing: 'cocina', 'closet'...).
// Semilla con los ejemplos del diseño (OLA_6_SCHEMAS_APROBADOS.md §5).
export const CATALOGO_ESPACIOS_ARQUITECTONICOS: CatalogoEspacioArquitectonico[] = [
  { id: UUID('espcat01'), codigo: 'ESP-001', nombre: 'Cocina integral', descripcion: 'Cocina lineal o en U con distribución estándar de gabinetes, encimera y electrodomésticos.', unidadBase: 'metro_lineal', rangoMinimo: '2.5', rangoMaximo: '4', ejemploTamanio: '2.5 m.l.', modulosTipicosJson: [{ nombre: 'gabinetes', componente_id: null }, { nombre: 'encimera', componente_id: null }, { nombre: 'electrodomésticos', componente_id: null }], createdAt: '2026-08-31T08:00:00Z' },
  { id: UUID('espcat02'), codigo: 'ESP-002', nombre: 'Closet', descripcion: 'Vestidor o armario empotrado con distribución de colgadores, cajoneras y repisas.', unidadBase: 'metro_lineal', rangoMinimo: '1.5', rangoMaximo: '3', ejemploTamanio: '2.5 m.l. × 2.5 m²', modulosTipicosJson: [{ nombre: 'colgadores', componente_id: null }, { nombre: 'cajoneras', componente_id: null }], createdAt: '2026-08-31T08:00:00Z' },
  { id: UUID('espcat03'), codigo: 'ESP-003', nombre: 'Forma especial', descripcion: 'Cava hexagonal, mesa redonda u otras geometrías no estándar que escapan a la métrica lineal.', unidadBase: 'metro_cuadrado', rangoMinimo: '1', rangoMaximo: '10', ejemploTamanio: 'Cava hexagonal, mesa round', modulosTipicosJson: null, createdAt: '2026-08-31T08:00:00Z' },
]

// --- F-03: Portafolio de proyectos (REGISTRO §10) ---
// Decisión T-03 (2026-08-12): campos `barrio` y `tipoProyecto` agregados para ubicación real (I-049).

export const PORTAFOLIO: Portafolio[] = [
  { id: UUID('port01'), proyectoId: UUID('proj06'), titulo: 'Cocina Compacta D. — Chicó', descripcionComercial: 'Cocina pequeña con electrodomésticos integrados y aprovechamiento total del espacio.', categoriaEspacio: 'cocina', espacioVarianteId: null, materialesDestacados: ['Cedro', 'Granito'], precioReferencial: 'desde $8.000.000 COP', imagenPortafolioUrl: '/images/home/cocinas-integrales-diseno-fabricacion-bogota-1.webp', galeriaPortafolioUrl: [], barrio: 'Chicó', tipoProyecto: 'Residencial', publicado: true, destacado: true, orden: 0, slug: 'cocina-compacta-diaz', createdAt: '2026-06-05T09:00:00Z', updatedAt: '2026-06-05T09:00:00Z' },
  { id: UUID('port02'), proyectoId: UUID('proj12'), titulo: 'Cocina Gourmet B. — Rosales', descripcionComercial: 'Isla doble y acabados premium para cocina gourmet.', categoriaEspacio: 'cocina', espacioVarianteId: null, materialesDestacados: ['Nogal', 'Acero inoxidable'], precioReferencial: '$15.000.000 - $20.000.000 COP', imagenPortafolioUrl: '/images/home/cocina-integral-madera-bogota-1.webp', galeriaPortafolioUrl: [], barrio: 'Rosales', tipoProyecto: 'Residencial', publicado: true, destacado: false, orden: 1, slug: 'cocina-gourmet-bosque', createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
]

// --- Testimonios (REGISTRO §10, DC-1 ACTIVA 2026-08-09) ---
// Campos: contenido, nombreAutor (2026-08-19), rating, curado, aprobado, publicado, fuente, barrio, tipoProyecto, urlFuente, fechaPublicacion, clienteId, proyectoId.
// Reseñas reales curadas de Google Business Profile (I-019/I-050); nombreAutor = nombre de la persona.
export const TESTIMONIOS: Testimonio[] = [
  { id: UUID('test01'), contenido: 'Cumplieron muy buen trabajo.', nombreAutor: 'Glenda Danuro', rating: 5, curado: true, aprobado: true, publicado: true, fuente: 'GBP', barrio: 'Chicó', tipoProyecto: 'Residencial', urlFuente: 'https://www.google.com/maps/place/Veta+Dorada', fechaPublicacion: '2026-07-01T00:00:00Z', clienteId: UUID('c01'), proyectoId: UUID('proj06'), createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-01T10:00:00Z' },
  { id: UUID('test02'), contenido: 'Muy cumplidos y dedicados. El modelo de mi cocina quedó tal cual como lo pedí. La calidad de su trabajo es excelente.', nombreAutor: 'Daniela Barón Esparza', rating: 5, curado: true, aprobado: true, publicado: true, fuente: 'GBP', barrio: 'Rosales', tipoProyecto: 'Residencial', urlFuente: 'https://www.google.com/maps/place/Veta+Dorada', fechaPublicacion: '2026-07-15T00:00:00Z', clienteId: UUID('c02'), proyectoId: UUID('proj12'), createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-07-15T10:00:00Z' },
  { id: UUID('test03'), contenido: 'Excelente trabajo muy recomendados', nombreAutor: 'Juan Spiro', rating: 5, curado: true, aprobado: true, publicado: true, fuente: 'GBP', barrio: 'Chapinero', tipoProyecto: 'Residencial', urlFuente: 'https://www.google.com/maps/place/Veta+Dorada', fechaPublicacion: '2026-08-01T00:00:00Z', clienteId: UUID('c03'), proyectoId: UUID('proj01'), createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z' },
  { id: UUID('test04'), contenido: 'Agradecida con los trabajos obtenidos. Muy buen servicio pre y post venta. Super recomendado.', nombreAutor: 'Madeline Attara', rating: 5, curado: true, aprobado: true, publicado: true, fuente: 'GBP', barrio: 'Usaquén', tipoProyecto: 'Residencial', urlFuente: 'https://www.google.com/maps/place/Veta+Dorada', fechaPublicacion: '2026-08-10T00:00:00Z', clienteId: UUID('c01'), proyectoId: UUID('proj03'), createdAt: '2026-08-10T10:00:00Z', updatedAt: '2026-08-10T10:00:00Z' },
]

// --- F-09: Landings SEO (categorías de espacios) ---

export const MODULOS_ARTEFACTOS: ModuloArtefacto[] = [
  { id: UUID('ma01'), moduloId: UUID('mod101'), tipo: 'imagen', fuente: 'dedicado_proyecto', url: 'https://r2.mock/modulos/mod101-foto1.jpg', createdAt: '2026-07-01T10:00:00Z' },
  { id: UUID('ma02'), moduloId: UUID('mod101'), tipo: 'plano_armado', fuente: 'dedicado_proyecto', url: 'https://r2.mock/modulos/mod101-plano.pdf', createdAt: '2026-07-01T10:00:00Z' },
]

// --- F-15: Bitácora de Diseño ---

export const BITACORA_ARTICULOS: BitacoraArticulo[] = [
  {
    id: UUID('bit01'),
    slug: 'tipos-de-materiales',
    titulo: 'Tipos de materiales para muebles a la medida en Bogotá',
    extracto: 'Roble, cedro, melamina RH, barnices al agua, lacas, herrajes Blum: la guía técnica para elegir materiales que duren en el clima de Bogotá. Con respuesta atómica indexable.',
    contenidoLargo: `## ¿Qué madera es mejor para un mueble a la medida en Bogotá?

Depende del uso: roble y cedro para piezas de alto tráfico y acabados nobles, melamina RH para cocinas y closets por su durabilidad a la humedad. El acabado (barniz al agua o laca) protege la madera y define el resultado final. En la asesoría te guiamos según tu espacio.

---

### Maderas macizas: roble y cedro

El roble europeo y el roble americano son la referencia para muebles que reciben uso diario intenso: mesones, islas de cocina, escritorios de trabajo. Su dureza (Janka ~6000 N) resiste golpes, rayones y el desgaste de años. El cedro, más blando (Janka ~3500 N), brilla en frentes, puertas y piezas decorativas donde la veta y el aroma natural aportan carácter. Ambas maderas envejecen bien: el roble se dora, el cedro oscurece con elegancia.

**Clave en Bogotá**: la humedad relativa promedio (65–80 %) hace que la madera maciza "trabaje" — se expande y contrae. En taller secamos a 8–10 % de humedad antes de mecanizar, y diseñamos uniones que absorben el movimiento (espiga y caja, lengüeta y ranura, herrajes con holgura calculada). Un mueble mal secado se abre o agrieta en la primera estación de lluvias.

### Melamina RH (resistente a la humedad): el estándar de cocinas y closets

No es madera maciza, pero para cajas de cocina, interiores de closets y estanterías es la opción técnica correcta. El tablero de partículas con resina melamínica RH soporta ciclos de humedad sin hincharse como la melamina estándar. Sus caras vienen preacabadas (blanco, gris, texturas madera), así que no requieren barnizado posterior — ahorra jornadas de taller y reduce polvo en obra.

**Cuándo usarla**: estructuras internas, frentes de closet (con canto ABS 1 mm), módulos de cocina bajos y altos. **Cuándo no**: mesones, superficies de trabajo, piezas expuestas a golpes directos o calor (arriba de hornos, parrillas).

### Acabados: barniz al agua vs. laca

| Acabado | Protección | Estética | Mantenimiento | Uso recomendado |
|---------|------------|----------|---------------|-----------------|
| Barniz al agua (2K) | Alta (película 80–100 µm) | Natural, veta visible | Reaplicar cada 3–5 años en alto tráfico | Roble, cedro, piezas de uso diario |
| Laca poliuretano (2K) | Muy alta (película 100–150 µm) | Uniforme, "piano" | Difícil de retocar localizado | Frentes de cocina, piezas de alto brillo |
| Aceite-cera | Media (penetra, no forma película) | Muy natural, tacto madera | Reaplicar cada 6–12 meses | Piezas decorativas, bajo tráfico |

El barniz al agua 2K (dos componentes) es nuestro default para muebles a la medida: cero COV, secado en 2 h, resistencia química y mecánica probada. La laca la reservamos para cocinas donde el cliente pide "efecto laca" y acepta que un rayón profundo requiere repintar el frente completo.

### Herrajes: la mecánica que no se ve pero se siente

Bisagras Blum con amortiguación (BLUMOTION) — estándar en todos nuestros muebles. Correderas TANDEMBOX o MOVENTO para cajones: apertura total, 30–40 kg de carga, regulación tridimensional. Sistemas de apertura push-to-open para frentes sin tirador. Herrajes de calidad no son "lujo": evitan reposiciones en garantía y el cliente los usa 20 veces al día durante 15 años.

### Resumen de decisión rápida

| Espacio | Estructura | Frentes/Superficies | Acabado |
|---------|------------|---------------------|---------|
| Cocina integral | Melamina RH | Roble / Cedro / Laca | Barniz 2K o laca |
| Closet / Vestier | Melamina RH | Roble / Cedro / Melamina RH | Barniz 2K |
| Centro de entretenimiento | Roble / Cedro | Roble / Cedro | Barniz 2K |
| Escritorio / Home office | Roble | Roble / Cedro | Barniz 2K |
| Barra / Cava | Roble / Cedro | Roble / Cedro | Barniz 2K + cera alimentaria en zonas de contacto |

¿Tienes dudas sobre qué material va en tu proyecto? **Agenda la visita**: medimos tu espacio, te mostramos muestras físicas en taller y cotizamos sin compromiso.`,

    categoria: 'materiales_tecnica',
    imagenPortada: 'https://r2.mock/bitacora/tipos-materiales-portada.jpg',
    fechaPublicacion: '2026-08-10T08:00:00Z',
    autorId: null,
    proyectoRelacionadoId: null,
    publicado: true,
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-10T08:00:00Z',
  },
]

// --- F4: Compras (P-13/P-14/P-15, disenio_P13/P14/P15) ---

export const ITEMS_ORDEN_COMPRA: ItemOrdenCompra[] = [
  { id: UUID('ioc01'), ordenCompraId: UUID('oc01'), productoCatalogoId: UUID('p01'), especificacion: null, cantidadEsperada: 20, recibidoCantidad: 0, sinDefectos: false },
]

export const RECEPCIONES_MATERIAL: RecepcionMaterial[] = []

export const HERRAMIENTAS: Herramienta[] = [
  { id: UUID('herr01'), nombre: 'Sierra circular Makita 7 1/4"', estadoOperativo: 'operativa', valor: '850000', fotoUrl: null, proveedorId: UUID('prov02'), ordenCompraReposicionId: null, createdAt: '2026-01-15T09:00:00Z' },
  { id: UUID('herr02'), nombre: 'Router de banco Bosch', estadoOperativo: 'reparacion', valor: '1200000', fotoUrl: null, proveedorId: UUID('prov02'), ordenCompraReposicionId: null, createdAt: '2026-01-15T09:00:00Z' },
]

// --- F7: Documentación del proyecto (P-26) ---

export const DOCUMENTOS_PROYECTO: DocumentoProyecto[] = [
  { id: UUID('doc01'), proyectoId: UUID('proj10'), etapa: 'produccion', alojador: 'r2', url: 'https://r2.mock/proyectos/proj10-avance1.jpg', nombre: 'Avance de armado — cocina', createdAt: '2026-08-06T09:00:00Z' },
  { id: UUID('doc02'), proyectoId: UUID('proj10'), etapa: 'cotizacion', alojador: 'drive_veta_erp', url: 'https://drive.google.com/mock/proj10-diseno-skp', nombre: 'Modelo SketchUp — versión 2', createdAt: '2026-08-02T09:00:00Z' },
]

