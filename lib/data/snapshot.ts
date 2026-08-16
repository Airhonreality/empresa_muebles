// Forma del snapshot completo que hidrata el store del cliente (§3.1d del plan F10).
// Sin imports de React ni de Drizzle — solo tipos, para poder importarse tanto desde
// el layout raíz (Server Component) como desde el store del navegador.
import type {
  Proyecto, Cliente, EspacioVariante, ItemVariante, EspacioArtefacto, ProductoCatalogo, Parametro,
  Contrato, HitoPago, UsuarioMock, ProyectosEstadosHistorial,
  Cronograma, CronogramaEtapa, DesfaseCronograma, CheckProduccion, NovedadCritica, ComunicacionProgreso,
  SchemaProyecto, BomMaterial, Verificacion, Retoma, CambioContrato, Persona, PersonaRol, Modulo, Estimacion,
  OrdenTrabajo, PedidoWeb, CitacionCalidad, Reproceso, Instalacion, ActaEntrega, CasoGarantia, CitaGarantia,
  CuentaFinanciera, MovimientoFinanciero, ObligacionPendiente, Proveedor, OrdenCompra, RegistroGateCaja, CuentaCobroProveedor,
  Categoria, ProductoTienda, ProductoTiendaComponente, CatalogoAcabado, CatalogoProductoAcabado, AcabadoMuestra,
  Portafolio, ModuloArtefacto, BitacoraArticulo, Testimonio,
  ItemOrdenCompra, RecepcionMaterial, Herramienta, DocumentoProyecto,
} from './contracts'

export interface StoreSnapshot {
  version: string
  proyectos: Proyecto[]
  clientes: Cliente[]
  espacios: EspacioVariante[]
  items: ItemVariante[]
  artefactos: EspacioArtefacto[]
  catalogo: ProductoCatalogo[]
  parametros: Parametro[]
  contratos: Contrato[]
  hitos: HitoPago[]
  usuario: UsuarioMock
  proyectosEstadosHistorial: ProyectosEstadosHistorial[]
  cronogramas: Cronograma[]
  cronogramaEtapas: CronogramaEtapa[]
  desfases: DesfaseCronograma[]
  checks: CheckProduccion[]
  novedades: NovedadCritica[]
  comunicaciones: ComunicacionProgreso[]
  schemas: SchemaProyecto[]
  bom: BomMaterial[]
  verificaciones: Verificacion[]
  retomas: Retoma[]
  cambiosContrato: CambioContrato[]
  personas: Persona[]
  personasRoles: PersonaRol[]
  modulos: Modulo[]
  estimaciones: Estimacion[]
  ordenesTrabajo: OrdenTrabajo[]
  pedidosWeb: PedidoWeb[]
  citacionesCalidad: CitacionCalidad[]
  reprocesos: Reproceso[]
  instalaciones: Instalacion[]
  actasEntrega: ActaEntrega[]
  casosGarantia: CasoGarantia[]
  citasGarantia: CitaGarantia[]
  cuentasFinancieras: CuentaFinanciera[]
  movimientosFinancieros: MovimientoFinanciero[]
  obligacionesPendientes: ObligacionPendiente[]
  proveedores: Proveedor[]
  ordenesCompra: OrdenCompra[]
  registrosGateCaja: RegistroGateCaja[]
  cuentasCobroProveedor: CuentaCobroProveedor[]
  categorias: Categoria[]
  productosTienda: ProductoTienda[]
  productosTiendaComponentes: ProductoTiendaComponente[]
  catalogoAcabados: CatalogoAcabado[]
  catalogoProductoAcabados: CatalogoProductoAcabado[]
  acabadosMuestras: AcabadoMuestra[]
  portafolio: Portafolio[]
  modulosArtefactos: ModuloArtefacto[]
  bitacoraArticulos: BitacoraArticulo[]
  testimonios: Testimonio[]
  itemsOrdenCompra: ItemOrdenCompra[]
  recepcionesMaterial: RecepcionMaterial[]
  herramientas: Herramienta[]
  documentosProyecto: DocumentoProyecto[]
}

export function emptySnapshot(): StoreSnapshot {
  return {
    version: '0',
    proyectos: [], clientes: [], espacios: [], items: [], artefactos: [], catalogo: [], parametros: [],
    contratos: [], hitos: [],
    usuario: { id: 'sin-sesion', email: '', nombre: 'Sin sesión', rol: 'admin' },
    proyectosEstadosHistorial: [],
    cronogramas: [], cronogramaEtapas: [], desfases: [], checks: [], novedades: [], comunicaciones: [],
    schemas: [], bom: [], verificaciones: [], retomas: [], cambiosContrato: [],
    personas: [], personasRoles: [], modulos: [], estimaciones: [],
    ordenesTrabajo: [], pedidosWeb: [], citacionesCalidad: [], reprocesos: [], instalaciones: [],
    actasEntrega: [], casosGarantia: [], citasGarantia: [],
    cuentasFinancieras: [], movimientosFinancieros: [], obligacionesPendientes: [],
    proveedores: [], ordenesCompra: [], registrosGateCaja: [], cuentasCobroProveedor: [],
    categorias: [], productosTienda: [], productosTiendaComponentes: [],
    catalogoAcabados: [], catalogoProductoAcabados: [], acabadosMuestras: [],
    portafolio: [], modulosArtefactos: [], bitacoraArticulos: [], testimonios: [],
    itemsOrdenCompra: [], recepcionesMaterial: [], herramientas: [], documentosProyecto: [],
  }
}
