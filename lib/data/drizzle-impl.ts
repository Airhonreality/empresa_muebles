// Stub del adaptador Drizzle real.
// Se implementa durante la migración final (F10-E del plan_f10.md).
// Mientras tanto, cualquier llamada lanza un error descriptivo.
import type { DataStore } from './contracts'

export function createDrizzleStore(): DataStore {
  const notImplemented = () => {
    throw new Error('DATA_IMPL=drizzle no está implementado aún. Usá DATA_IMPL=mock durante el prototipo.')
  }

  return {
    proyectos: {
      listar: notImplemented,
      obtenerPorId: notImplemented,
      actualizarEstado: notImplemented,
      crear: notImplemented,
      historialEstado: notImplemented,
    },
    clientes: {
      listar: notImplemented,
      obtenerPorId: notImplemented,
      crear: notImplemented,
    },
    espacios: {
      porProyecto: notImplemented,
      crear: notImplemented,
      actualizarJornadas: notImplemented,
      actualizar: notImplemented,
      duplicar: notImplemented,
      marcarActiva: notImplemented,
    },
    items: {
      porVariante: notImplemented,
      crear: notImplemented,
      actualizar: notImplemented,
      eliminar: notImplemented,
    },
    artefactos: {
      porEspacio: notImplemented,
      crear: notImplemented,
      actualizar: notImplemented,
    },
    catalogo: {
      listar: notImplemented,
      buscar: notImplemented,
      obtenerPorId: notImplemented,
      crear: notImplemented,
      actualizar: notImplemented,
      eliminar: notImplemented,
    },
    parametros: {
      listar: notImplemented,
      obtenerPorClave: notImplemented,
      transicionesProyecto: notImplemented,
      actualizar: notImplemented,
    },
    contratos: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    hitos: {
      porContrato: notImplemented,
    },
    cronogramas: {
      porProyecto: notImplemented,
      obtenerPorId: notImplemented,
      crear: notImplemented,
    },
    cronogramaEtapas: {
      porCronograma: notImplemented,
      crear: notImplemented,
    },
    desfases: {
      porProyecto: notImplemented,
      aplicar: notImplemented,
      decisionManual: notImplemented,
    },
    checks: {
      porProyecto: notImplemented,
      crear: notImplemented,
      confirmar: notImplemented,
    },
    novedades: {
      porProyecto: notImplemented,
      crear: notImplemented,
      actualizarEstado: notImplemented,
    },
    comunicaciones: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    schemas: {
      porProyecto: notImplemented,
      crear: notImplemented,
      actualizarEstado: notImplemented,
    },
    bom: {
      porSchema: notImplemented,
      crear: notImplemented,
    },
    verificaciones: {
      porProyecto: notImplemented,
      emitirVeredicto: notImplemented,
    },
    retomas: {
      porProyecto: notImplemented,
      guardar: notImplemented,
    },
    cambiosContrato: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    personas: {
      listar: notImplemented,
      crear: notImplemented,
    },
    personasRoles: {
      activos: notImplemented,
      asignar: notImplemented,
    },
    modulos: {
      porProyecto: notImplemented,
      actualizarEstado: notImplemented,
    },
    estimaciones: {
      porProyecto: notImplemented,
    },
    ordenesTrabajo: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    pedidosWeb: {
      porCliente: notImplemented,
      crear: notImplemented,
    },
    citacionesCalidad: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    reprocesos: {
      porProyecto: notImplemented,
      crear: notImplemented,
    },
    instalaciones: {
      porProyecto: notImplemented,
      programar: notImplemented,
      iniciar: notImplemented,
      marcarInstalada: notImplemented,
      marcarFallida: notImplemented,
    },
    actasEntrega: {
      porProyecto: notImplemented,
      generar: notImplemented,
      enviar: notImplemented,
      firmar: notImplemented,
    },
    casosGarantia: {
      porProyecto: notImplemented,
      porCliente: notImplemented,
      reportar: notImplemented,
      diagnosticar: notImplemented,
      crearOrdenReparacion: notImplemented,
      dispararReproceso: notImplemented,
      resolver: notImplemented,
      cerrar: notImplemented,
    },
    citasGarantia: {
      porCaso: notImplemented,
      agendar: notImplemented,
    },
    cuentasFinancieras: {
      listar: notImplemented,
      crear: notImplemented,
      disponible: notImplemented,
    },
    movimientosFinancieros: {
      listar: notImplemented,
      porCuenta: notImplemented,
    },
    obligacionesPendientes: {
      listar: notImplemented,
      porProyecto: notImplemented,
      crear: notImplemented,
      registrarPago: notImplemented,
    },
    ordenesCompra: {
      listar: notImplemented,
      porProveedor: notImplemented,
      crear: notImplemented,
      actualizarEstado: notImplemented,
    },
    registrosGateCaja: {
      listar: notImplemented,
      porOrdenCompra: notImplemented,
    },
    caja: {
      autorizarPago: notImplemented,
    },
    proveedores: {
      listar: notImplemented,
      crear: notImplemented,
    },
    cuentasCobroProveedor: {
      listar: notImplemented,
      porProveedor: notImplemented,
      crear: notImplemented,
      vincularOC: notImplemented,
      adjuntarFactura: notImplemented,
      marcarPagada: notImplemented,
      anular: notImplemented,
    },
    categorias: {
      listar: notImplemented,
      porTipo: notImplemented,
      crear: notImplemented,
    },
    productosTienda: {
      listar: notImplemented,
      visibles: notImplemented,
      obtenerPorId: notImplemented,
      crear: notImplemented,
      actualizar: notImplemented,
    },
    catalogoAcabados: {
      listar: notImplemented,
      crear: notImplemented,
    },
    catalogoProductoAcabados: {
      porProducto: notImplemented,
      crear: notImplemented,
    },
    acabadosMuestras: {
      porAcabado: notImplemented,
      crear: notImplemented,
    },
    portafolio: {
      listar: notImplemented,
      publicados: notImplemented,
      porSlug: notImplemented,
      crear: notImplemented,
      actualizar: notImplemented,
      publicar: notImplemented,
      despublicar: notImplemented,
    },
    modulosArtefactos: {
      porModulo: notImplemented,
      crear: notImplemented,
    },
    auth: {
      usuarioActual: notImplemented,
    },
    // subscribe/getVersion no lanzan: un componente puede montarse (y suscribirse)
    // antes de que se llame a ningún método de datos real.
    subscribe: () => () => {},
    getVersion: () => 0,
  }
}
